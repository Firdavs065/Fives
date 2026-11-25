const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('fives.db');
const SECRET = 'fives-secret-2026';

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, phone TEXT UNIQUE, email TEXT UNIQUE,
    avatar TEXT, city TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, title TEXT, price INTEGER, city TEXT,
    address TEXT, description TEXT, phone TEXT, category TEXT,
    brand TEXT, condition TEXT, image TEXT,
    is_vip INTEGER DEFAULT 0, vip_until DATETIME,
    status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, ad_id INTEGER, amount INTEGER,
    method TEXT, status TEXT DEFAULT 'paid', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER, following_id INTEGER,
    UNIQUE(follower_id, following_id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER, receiver_id INTEGER, text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try { req.user = jwt.verify(token.replace('Bearer ', ''), SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token xato' }); }
}

// Nomer bilan kirish - SMS kod
app.post('/api/auth/phone/send', (req, res) => {
  const { phone } = req.body;
  const code = Math.floor(1000 + Math.random() * 9000);
  console.log('SMS kod:', phone, code);
  res.json({ ok: true, code });
});

// Nomer kodini tasdiqlash
app.post('/api/auth/phone/verify', (req, res) => {
  const { phone, name } = req.body;
  db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, user) => {
    if (!user) {
      db.run('INSERT INTO users (name, phone) VALUES (?, ?)', [name || 'Foydalanuvchi', phone], function() {
        const token = jwt.sign({ id: this.lastID, phone }, SECRET);
        res.json({ ok: true, token, user: { id: this.lastID, phone, name } });
      });
    } else {
      const token = jwt.sign({ id: user.id, phone }, SECRET);
      res.json({ ok: true, token, user });
    }
  });
});

// Google bilan kirish
app.post('/api/auth/google', (req, res) => {
  const { email, name, avatar } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (!user) {
      db.run('INSERT INTO users (name, email, avatar) VALUES (?, ?, ?)', [name, email, avatar], function() {
        const token = jwt.sign({ id: this.lastID, email }, SECRET);
        res.json({ ok: true, token, user: { id: this.lastID, email, name, avatar } });
      });
    } else {
      const token = jwt.sign({ id: user.id, email }, SECRET);
      res.json({ ok: true, token, user });
    }
  });
});

// E'lonlarni olish - VIP avval
app.get('/api/ads', (req, res) => {
  db.all(`SELECT ads.*, users.name as seller_name, users.avatar as seller_avatar
    FROM ads LEFT JOIN users ON ads.user_id = users.id
    WHERE ads.status = 'active' ORDER BY ads.is_vip DESC, ads.id DESC`, (err, rows) => {
    res.json(rows || []);
  });
});

// E'lon berish - TEKIN
app.post('/api/ads', auth, (req, res) => {
  const { title, price, city, address, description, phone, category, brand, condition, image } = req.body;
  db.run(`INSERT INTO ads (user_id, title, price, city, address, description, phone, category, brand, condition, image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [req.user.id, title, price, city, address, description, phone, category, brand, condition, image],
    function() { res.json({ ok: true, ad_id: this.lastID }); });
});

// VIP qilish - 10 somon
app.post('/api/vip', auth, (req, res) => {
  const { ad_id, method } = req.body;
  db.run('INSERT INTO payments (user_id, ad_id, amount, method, status) VALUES (?, ?, 10, ?, ?)',
    [req.user.id, ad_id, method, 'paid'], () => {
      const vipUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.run('UPDATE ads SET is_vip = 1, vip_until = ? WHERE id = ? AND user_id = ?',
        [vipUntil, ad_id, req.user.id], () => {
          res.json({ ok: true, message: 'VIP faollashdi - 7 kun tepada' });
        });
    });
});

// Obuna
app.post('/api/follow', auth, (req, res) => {
  db.run('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
    [req.user.id, req.body.following_id], () => res.json({ ok: true }));
});

// Profil e'lonlari
app.get('/api/user/:id/ads', (req, res) => {
  db.all('SELECT * FROM ads WHERE user_id = ? AND status = ? ORDER BY id DESC',
    [req.params.id, 'active'], (err, rows) => res.json(rows || []));
});

// Chat
app.post('/api/messages', auth, (req, res) => {
  db.run('INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)',
    [req.user.id, req.body.receiver_id, req.body.text], function() { res.json({ ok: true, id: this.lastID }); });
});
app.get('/api/messages/:userId', auth, (req, res) => {
  db.all(`SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY id ASC`,
    [req.user.id, req.params.userId, req.params.userId, req.user.id], (err, rows) => res.json(rows || []));
});

// Admin
app.get('/api/admin/stats', auth, (req, res) => {
  db.get('SELECT COUNT(*) as totalAds FROM ads', (e, a) => {
    db.get('SELECT COUNT(*) as totalUsers FROM users', (e2, u) => {
      db.get('SELECT SUM(amount) as revenue FROM payments', (e3, p) => {
        res.json({ totalAds: a.totalAds, totalUsers: u.totalUsers, revenue: p.revenue || 0 });
      });
    });
  });
});

app.listen(3000, () => console.log('FIVES server 3000 portda'));