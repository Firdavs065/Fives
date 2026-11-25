import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

let lang = 'ru';
let listings = [];
let activeCat = 'all';
let searchText = '';
let currentUser = null;

const T = {
  uz: { search:"Qidiruv...", all:"Hammasi", phone:"Telefon", tech:"Maishiy texnika", comp:"Kompyuter", order:"Qong'iroq qilish", comments:"Izohlar", write:"Izoh yozing...", send:"Yuborish" },
  ru: { search:"Поиск...", all:"Все", phone:"Телефоны", tech:"Бытовая техника", comp:"Компьютеры", order:"Позвонить", comments:"Комментарии", write:"Напишите комментарий...", send:"Отправить" },
  tj: { search:"Chustuchu...", all:"Hama", phone:"Telefon", tech:"Texnikai maishi", comp:"Kompyuter", order:"Zang zadan", comments:"Sharhho", write:"Sharh navised...", send:"Firistodan" }
};

window.openLogin = () => { if(currentUser){ if(confirm("Выйти?")) signOut(auth); } else document.getElementById('loginModal').style.display='block'; }
window.loginEmail = async () => {
  const e=document.getElementById('login-email').value, p=document.getElementById('login-pass').value;
  try{ await signInWithEmailAndPassword(auth,e,p); closeModal('loginModal'); }catch(err){ document.getElementById('loginMsg').innerText=err.message; }
};
window.registerEmail = async () => {
  const e=document.getElementById('login-email').value, p=document.getElementById('login-pass').value;
  try{ await createUserWithEmailAndPassword(auth,e,p); closeModal('loginModal'); }catch(err){ document.getElementById('loginMsg').innerText=err.message; }
};
window.loginGoogle = async () => { try{ await signInWithPopup(auth,provider); closeModal('loginModal'); }catch(err){ document.getElementById('loginMsg').innerText=err.message; } };

onAuthStateChanged(auth, (u)=>{
  currentUser=u;
  const b=document.getElementById('loginBtn');
  if(b) b.innerText = u ? "Выйти ("+u.email.split('@')[0]+")" : "Вход";
});

async function loadListings(){
  try{
    const q=query(collection(db,"listings"), orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    listings=snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ listings=[]; }
  render();
}
loadListings();

window.setLang=(l,btn)=>{ lang=l; document.querySelectorAll('.langs button').forEach(b=>b.classList.remove('active')); if(btn) btn.classList.add('active'); document.getElementById('searchInput').placeholder=T[lang].search; render(); }
window.doSearch=()=>{ searchText=document.getElementById('searchInput').value.toLowerCase(); render(); }
window.setCat=(c)=>{ activeCat=c; render(); }

function render(){
  document.getElementById('cats').innerHTML = `
    <button onclick="setCat('all')" class="${activeCat=='all'?'active':''}">${T[lang].all}</button>
    <button onclick="setCat('phone')" class="${activeCat=='phone'?'active':''}">${T[lang].phone}</button>
    <button onclick="setCat('tech')" class="${activeCat=='tech'?'active':''}">${T[lang].tech}</button>
    <button onclick="setCat('comp')" class="${activeCat=='comp'?'active':''}">${T[lang].comp}</button>`;
  let filtered=listings.filter(x=>(activeCat=='all'||x.cat==activeCat)&&((x.title?.[lang]||x.title?.ru||x.title?.uz||"").toLowerCase().includes(searchText)||(x.city||"").toLowerCase().includes(searchText)));
  document.getElementById('grid').innerHTML=filtered.map((item)=>`
    <div class="card" onclick="openView(${listings.indexOf(item)})">
      <img src="${item.img}">
      <div class="card-body"><h3>${item.title?.[lang]||item.title?.ru||item.title?.uz||""}</h3><div class="price">${item.price}</div><div class="meta">${item.city} | Просмотры: ${item.views||0}</div>
      <div class="actions" onclick="event.stopPropagation()"><button onclick="toggleLike(${listings.indexOf(item)})">Нравится: ${item.likes||0}</button><button onclick="openView(${listings.indexOf(item)})">Комментарии: ${(item.comments||[]).length}</button></div></div>
    </div>`).join('');
  const empty=document.getElementById('emptyBox');
  if(filtered.length===0){
    empty.innerHTML=`<div class="empty"><h2>Пока нет объявлений</h2><p>Будьте первым, кто разместит объявление</p><button onclick="openAdd()">Подать объявление</button></div>`;
  } else empty.innerHTML='';
}

window.openView=(i)=>{
  const x=listings[i];
  document.getElementById('viewContent').innerHTML=`
    <img src="${x.img}" style="width:100%;border-radius:12px;height:280px;object-fit:cover">
    <h2 style="margin:12px 0 6px">${x.title?.[lang]||x.title?.ru||x.title?.uz}</h2><div class="price" style="font-size:22px">${x.price}</div>
    <p style="color:#666;margin:8px 0">${x.desc?.[lang]||x.desc?.ru||x.desc?.uz||""}</p>
    <p>${x.city} | ${x.author||"Пользователь"} | ${x.phone}</p>
    <a href="tel:${x.phone}" style="display:block;text-align:center;background:#25D366;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:10px">${T[lang].order}</a>
    <div class="comments"><b>${T[lang].comments}</b><div>${(x.comments||[]).map(c=>`<div><b>${c.user}:</b> ${c.text}</div>`).join('')}</div>
    <input id="commentInput" placeholder="${T[lang].write}" style="width:100%;padding:10px;margin-top:8px;border:1px solid #ddd;border-radius:8px">
    <button onclick="addComment(${i})" style="padding:10px;background:#111;color:#fff;border:none;border-radius:8px;margin-top:6px">${T[lang].send}</button></div>`;
  document.getElementById('viewModal').style.display='block';
};
window.addComment=async(i)=>{
  const inp=document.getElementById('commentInput'); if(!inp.value.trim()) return;
  if(!currentUser){ alert("Сначала войдите!"); openLogin(); return; }
  const c={user:currentUser.email.split('@')[0], text:inp.value};
  listings[i].comments=[...(listings[i].comments||[]),c];
  if(listings[i].id) await updateDoc(doc(db,"listings",listings[i].id),{comments:arrayUnion(c)});
  openView(i); render();
};
window.toggleLike=async(i)=>{
  listings[i].likes=(listings[i].likes||0)+1;
  if(listings[i].id) await updateDoc(doc(db,"listings",listings[i].id),{likes:listings[i].likes});
  render();
};
window.openAdd=()=>{ if(!currentUser){ alert("Чтобы подать объявление, сначала войдите!"); openLogin(); return; } document.getElementById('addModal').style.display='block'; }
window.closeModal=(id)=>{ document.getElementById(id).style.display='none'; }
let uploadedImg = ""; // rasmni shu yerda saqlaymiz

window.previewImg = (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedImg = ev.target.result;
    const p = document.getElementById('imgPreview');
    p.src = uploadedImg;
    p.style.display = 'block';
  };
  reader.readAsDataURL(file);
};
window.addListing=async()=>{
  const title=document.getElementById('f-title').value.trim();
  const price=document.getElementById('f-price').value.trim();
  const img = uploadedImg;
  const city=document.getElementById('f-city').value.trim();
  const phone=document.getElementById('f-phone').value.trim();
  const desc=document.getElementById('f-desc').value.trim()||title;
  const cat=document.getElementById('f-cat').value;
  if(!title||!price||!img||!city||!phone){ alert('Заполните все поля! Ссылка на фото обязательна.'); return; }
  const obj={cat,img,price,city,phone,author:currentUser?.email||"Пользователь",time:"сейчас",views:0,likes:0,comments:[],createdAt:Date.now(),title:{uz:title,ru:title,tj:title},desc:{uz:desc,ru:desc,tj:desc}};
  try{ const ref=await addDoc(collection(db,"listings"),obj); obj.id=ref.id; }catch(e){ alert("Ошибка: "+e.message); return; }
  listings.unshift(obj); closeModal('addModal'); render();
};
