require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    db = admin.firestore();
    console.log('✅ Firebase Admin ulandi');
  }
} catch(e){ console.log('Firebase xato:', e.message); }

async function verifyUser(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','');
  if(!token || !db){ req.user={uid:'guest'}; return next(); }
  try{ req.user = await admin.auth().verifyIdToken(token); }
  catch{ req.user={uid:'guest'}; }
  next();
}

app.get('/api/vocabulary', async (req,res)=>{
  const { lang='en', category, limit=50 } = req.query;
  if(!db) return res.json({data:[], demo:true});
  let q = db.collection('vocabulary');
  if(category) q = q.where('category','==',category);
  const snap = await q.limit(Number(limit)).get();
  res.json({data: snap.docs.map(d=>{ const v=d.data(); return {id:d.id, word:v[lang]||v.en, en:v.en, ru:v.ru, ja:v.ja, uz:v.uz, image:v.image, category:v.category, example:v.example}; })});
});

app.get('/api/user', verifyUser, async (req,res)=>{
  if(!db || req.user.uid==='guest') return res.json({guest:true});
  const ref = db.collection('users').doc(req.user.uid);
  const doc = await ref.get();
  if(!doc.exists){
    const fresh = { name:req.user.name||'User', email:req.user.email||'', picture:req.user.picture||'', xp:0, streak:0, lessonsCompleted:0, lang:'en', uiLang:'uz', createdAt:Date.now() };
    await ref.set(fresh); return res.json(fresh);
  }
  res.json(doc.data());
});

app.post('/api/progress', verifyUser, async (req,res)=>{
  if(!db || req.user.uid==='guest') return res.json({ok:false});
  await db.collection('users').doc(req.user.uid).set({ ...req.body, updatedAt:Date.now() }, {merge:true});
  res.json({ok:true});
});

app.get('/api/leaderboard', async (req,res)=>{
  if(!db) return res.json({data:[]});
  const snap = await db.collection('users').orderBy('xp','desc').limit(20).get();
  res.json({data: snap.docs.map(d=>({id:d.id, ...d.data()}))});
});

app.get('/api/health', (req,res)=>res.json({ok:true, service:'fives-learning'}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('🚀 Fives Learning: '+PORT));
