// ===== FIVES - app.js - RUS VERSION - BEZ FEYK OBYAVLENIY =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, doc, getDoc, setDoc, deleteDoc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyAFOSxQwiZ9W2axyaalIP_rqZ8jr_OMLWI",
  authDomain: "fives96.firebaseapp.com",
  projectId: "fives96",
  storageBucket: "fives96.firebasestorage.app",
  messagingSenderId: "366458465846",
  appId: "1:366458465846:web:5b89ce51655c638e5c3297",
  measurementId: "G-4ZTMJ0GZ4Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== STATE =====
let ADS = [];
let curCat = 'all';
let pickedImages = [];
let currentUser = null;

// ===== ZAGRUZKA - TOLKO REALNYE OBYAVLENIYA IZ FIRESTORE =====
async function loadAds() {
  try {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    ADS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.log("Firestore xato:", e);
    ADS = [];
  }
  render();
}

// ===== FILTR + RENDER =====
function filterCat(c, btn) {
  curCat = c;
  document.querySelectorAll('.cat').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  render();
}

function selectVip(el) {
  document.querySelectorAll('.vip-grid div').forEach(d => d.classList.remove('sel'));
  el.classList.add('sel');
}

function render() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const city = document.getElementById('cityFilter')?.value || 'all';
  const cond = document.getElementById('condFilter')?.value || 'all';
  const price = document.getElementById('priceFilter')?.value || 'all';

  let list = ADS.filter(a => {
    if (curCat !== 'all' && curCat !== 'phone' && curCat !== 'tech' && a.brand !== curCat) return false;
    if (curCat === 'phone' && a.cat !== 'phone') return false;
    if (curCat === 'tech' && a.cat !== 'tech') return false;
    if (q && !(a.title || '').toLowerCase().includes(q)) return false;
    if (city !== 'all' && a.city !== city) return false;
    if (cond !== 'all' && a.cond !== cond) return false;
    if (price !== 'all') {
      const [mn, mx] = price.split('-').map(Number);
      if (a.price < mn || a.price > mx) return false;
    }
    return true;
  });

  list.sort((a, b) => (b.vip ? 1 : 0) - (a.vip ? 1 : 0));

  const countLabel = document.getElementById('countLabel');
  if (countLabel) countLabel.innerText = list.length + " объявлений";
  const emptyMsg = document.getElementById('emptyMsg');
  if (emptyMsg) emptyMsg.style.display = list.length ? 'none' : 'block';

  grid.innerHTML = list.map(a => `
  <div class="card ${a.vip ? 'vip' : ''}" onclick="openAd('${a.id}')">
    ${a.vip ? '<span class="badge">⭐ VIP</span>' : a.cond === 'new' ? '<span class="badge new">НОВЫЙ</span>' : '<span class="badge used">Б/У</span>'}
    <button class="fav" onclick="event.stopPropagation();this.innerText=this.innerText==='❤️'?'🤍':'❤️'">🤍</button>
    <img src="${a.img}" loading="lazy" alt="">
    <div class="card-body">
      <div class="price">${Number(a.price).toLocaleString()} с <small>/ ${a.date || ''}</small></div>
      <h3>${a.title}</h3>
      <p>📍 ${a.city} • ${a.cond === 'new' ? 'Новый' : 'Б/У'}</p>
      <div class="meta"><span>${a.cat === 'phone' ? '📱 Телефон' : '🏠 Техника'}</span><span>${a.brand}</span></div>
    </div>
  </div>`).join('');
}

// ===== OTKRYT OBYAVLENIE =====
function openAd(id) {
  const a = ADS.find(x => String(x.id) === String(id));
  if (!a) return;
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  if (!modal || !content) return;
  const imgs = (a.images && a.images.length) ? a.images : [a.img];
  modal.classList.add('show');
  content.innerHTML = `
  <span style="background:#fef3c7;padding:6px 12px;border-radius:999px;font-weight:800;font-size:12px">${a.vip ? '⭐ VIP ОБЪЯВЛЕНИЕ' : 'ОБЪЯВЛЕНИЕ'} • ${a.date || ''}</span>
  <h2 style="margin:10px 0">${a.title}</h2>
  <img class="big-img" src="${imgs[0]}" alt="">
  ${imgs.length > 1 ? `<div style="display:flex;gap:8px;margin-top:8px;overflow-x:auto">${imgs.map(s => `<img src="${s}" onclick="document.querySelector('.big-img').src=this.src" style="width:70px;height:70px;object-fit:cover;border-radius:10px;cursor:pointer">`).join('')}</div>` : ''}
  <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0"><span style="font-size:26px;font-weight:900">${Number(a.price).toLocaleString()} с</span><span style="background:#dcfce7;padding:6px 12px;border-radius:999px;font-weight:800;font-size:12px">📍 ${a.city}</span></div>
  <p style="line-height:1.6;color:#475569">${a.desc || ''}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0"><div style="background:#f1f5f9;padding:12px;border-radius:12px;text-align:center"><b>${a.cond === 'new' ? 'Новый' : 'Б/У'}</b><br><span style="font-size:12px;color:#64748b">Состояние</span></div><div style="background:#f1f5f9;padding:12px;border-radius:12px;text-align:center"><b>${a.cat === 'phone' ? '📱 Телефон' : '🏠 Техника'}</b><br><span style="font-size:12px;color:#64748b">Категория</span></div></div>
  <a href="tel:${String(a.phone || '').replace(/\s/g, '')}" style="text-decoration:none"><button class="call" style="background:#16a34a">📞 ${a.phone} - Позвонить</button></a>
  <a href="https://t.me/${String(a.phone || '').replace(/[^0-9]/g, '')}" target="_blank" style="text-decoration:none"><button class="call" style="background:#0088cc;margin-top:8px">✈️ Написать в Telegram</button></a>
  <button class="call" style="background:#fff;color:#0f172a;border:1px solid #e2e8f0" onclick="alert('Объявление сохранено!')">🤍 Сохранить</button>
  `;
}

// ===== DOBAVIT OBYAVLENIE =====
function openAdd() {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  if (!modal || !content) return;
  pickedImages = [];
  modal.classList.add('show');
  content.innerHTML = `
  <h2>+ Новое объявление</h2>
  <p style="color:#64748b;font-size:13px;margin:6px 0">Только Телефоны и Бытовая Техника - другие объявления не принимаются!</p>
  <label>КАТЕГОРИЯ</label>
  <select id="newCat"><option value="phone">📱 Телефон</option><option value="tech">🏠 Бытовая Техника</option></select>
  <label>БРЕНД / ТИП</label>
  <select id="newBrand"><option value="iphone">🍎 iPhone</option><option value="samsung">Samsung</option><option value="fridge">❄️ Холодильник</option><option value="tv">📺 Телевизор</option><option value="washer">👕 Стиральная машина</option><option value="other">Другое</option></select>
  <label>НАЗВАНИЕ</label>
  <input id="newTitle" placeholder="Например: iPhone 13 128GB - Идеальный">
  <label>ЦЕНА (сомони)</label>
  <input id="newPrice" type="number" placeholder="2500">
  <label>ГОРОД</label>
  <select id="newCity"><option>Худжанд</option><option>Душанбе</option><option>Исфара</option><option>Канибадам</option><option>Бустон</option></select>
  <label>СОСТОЯНИЕ</label>
  <select id="newCond"><option value="new">Новый</option><option value="used">Б/У</option></select>
  <label>ТЕЛЕФОН</label>
  <input id="newPhone" placeholder="+992 92 123 45 67">
  <label>ОПИСАНИЕ</label>
  <textarea id="newDesc" rows="3" placeholder="Опишите состояние..."></textarea>
  <label>ФОТО - ВЫБРАТЬ С ТЕЛЕФОНА</label>
  <input id="newImgFile" type="file" accept="image/*" capture="environment" multiple>
  <div id="imgPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"></div>
  <p style="font-size:12px;color:#64748b">📸 Нажмите - откроется Камера / Галерея. Можно до 4 фото.</p>
  <button class="call" onclick="submitAd()">✅ ОПУБЛИКОВАТЬ - БЕСПЛАТНО</button>
  <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:8px">VIP: 1 день - 10 с • 7 дней - 35 с • 30 дней - 100 с</p>
  `;
  const fileInput = document.getElementById('newImgFile');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      pickedImages = [];
      const preview = document.getElementById('imgPreview');
      if (preview) preview.innerHTML = '';
      for (const file of [...e.target.files].slice(0, 4)) {
        try {
          const compressed = await compressImage(file);
          pickedImages.push(compressed);
          if (preview) preview.innerHTML += '<img src="' + compressed + '" style="width:80px;height:80px;object-fit:cover;border-radius:10px">';
        } catch (err) { console.log("Rasm xato:", err); }
      }
    });
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 1000;
        let w = img.width, h = img.height;
        if (w > max) { h = h * max / w; w = max; }
        if (h > max) { w = w * max / h; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function submitAd() {
  const title = document.getElementById('newTitle')?.value.trim() || '';
  const price = parseInt(document.getElementById('newPrice')?.value || '0', 10);
  if (!title || !price) { alert('Заполните название и цену!'); return; }
  if (pickedImages.length === 0) { alert('Добавьте хотя бы 1 фото с телефона!'); return; }

  const newAd = {
    cat: document.getElementById('newCat')?.value || 'phone',
    brand: document.getElementById('newBrand')?.value || 'other',
    title: title,
    price: price,
    city: document.getElementById('newCity')?.value || 'Худжанд',
    cond: document.getElementById('newCond')?.value || 'used',
    vip: false,
    phone: document.getElementById('newPhone')?.value || '+992 90 000 00 00',
    desc: document.getElementById('newDesc')?.value || 'Описания нет',
    img: pickedImages[0],
    images: pickedImages,
    date: "Сейчас",
    createdAt: Date.now(),
    userId: currentUser ? currentUser.uid : "guest"
  };

  try {
    const ref = await addDoc(collection(db, "ads"), newAd);
    newAd.id = ref.id;
  } catch (e) {
    alert('Ошибка сохранения: ' + e.message);
    return;
  }

  ADS.unshift(newAd);
  closeModal();
  render();
  alert('✅ Ваше объявление опубликовано!');
}

function closeModal() {
  document.getElementById('modal')?.classList.remove('show');
}

function setLang(l, btn) {
  document.querySelectorAll('.langs button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ===== AUTH =====
onAuthStateChanged(auth, (user) => { currentUser = user; });

async function loginUser(email, password) {
  try { await signInWithEmailAndPassword(auth, email, password); alert('Добро пожаловать!'); }
  catch (e) { alert('Ошибка входа: ' + e.message); }
}

async function registerUser(email, password) {
  try { await createUserWithEmailAndPassword(auth, email, password); alert('Аккаунт создан!'); }
  catch (e) { alert('Ошибка регистрации: ' + e.message); }
}

async function logoutUser() {
  await signOut(auth);
  alert('Вы вышли');
}

// ===== DLYA HTML onclick =====
window.filterCat = filterCat;
window.selectVip = selectVip;
window.render = render;
window.openAd = openAd;
window.openAdd = openAdd;
window.submitAd = submitAd;
window.closeModal = closeModal;
window.setLang = setLang;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;

// ===== START =====
loadAds();
