let lang = 'uz';
let listings = [];
let activeCat = 'all';
let searchText = '';

const T = {
  uz: { search:"Qidiruv...", all:"Hammasi", phone:"📱 Telefon", tech:"🔌 Maishiy texnika", comp:"💻 Kompyuter", add:"Elon berish", order:"Qo'ng'iroq qilish", comments:"Izohlar", write:"Izoh yozing...", send:"Yuborish", follow:"Obuna bo'lish", followed:"Obuna bo'lindi ✓" },
  ru: { search:"Поиск...", all:"Все", phone:"📱 Телефоны", tech:"🔌 Бытовая техника", comp:"💻 Компьютеры", add:"Подать объявление", order:"Позвонить", comments:"Комментарии", write:"Напишите комментарий...", send:"Отправить", follow:"Подписаться", followed:"Вы подписаны ✓" },
  tj: { search:"Ҷустуҷӯ...", all:"Ҳама", phone:"📱 Телефон", tech:"🔌 Техникаи маишӣ", comp:"💻 Компютер", add:"Эълон додан", order:"Занг задан", comments:"Шарҳҳо", write:"Шарҳ нависед...", send:"Фиристодан", follow:"Обуна шудан", followed:"Обуна шудед ✓" }
};

fetch('data.json').then(r=>r.json()).then(d=>{ listings = d; render(); });

function setLang(l, btn){
  lang = l;
  document.querySelectorAll('.langs button').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('searchInput').placeholder = T[lang].search;
  render();
}
function doSearch(){ searchText = document.getElementById('searchInput').value.toLowerCase(); render(); }
function setCat(c){ activeCat = c; render(); }

function render(){
  // kategoriyalar
  document.getElementById('cats').innerHTML = `
    <button onclick="setCat('all')" class="${activeCat=='all'?'active':''}">${T[lang].all}</button>
    <button onclick="setCat('phone')" class="${activeCat=='phone'?'active':''}">${T[lang].phone}</button>
    <button onclick="setCat('tech')" class="${activeCat=='tech'?'active':''}">${T[lang].tech}</button>
    <button onclick="setCat('comp')" class="${activeCat=='comp'?'active':''}">${T[lang].comp}</button>`;

  let filtered = listings.filter(x =>
    (activeCat=='all' || x.cat==activeCat) &&
    (x.title[lang].toLowerCase().includes(searchText) || x.city.toLowerCase().includes(searchText))
  );

  document.getElementById('grid').innerHTML = filtered.map((item,i)=>`
    <div class="card" onclick="openView(${listings.indexOf(item)})">
      <img src="${item.img}">
      <div class="card-body">
        <h3>${item.title[lang]}</h3>
        <div class="price">${item.price}</div>
        <div class="meta">${item.city} • ${item.time} • 👁 ${item.views}</div>
        <div class="actions" onclick="event.stopPropagation()">
          <button id="like-${listings.indexOf(item)}" onclick="toggleLike(${listings.indexOf(item)})">❤️ ${item.likes}</button>
          <button onclick="openView(${listings.indexOf(item)})">💬 ${item.comments.length}</button>
        </div>
      </div>
    </div>`).join('');
}

function openView(i){
  const x = listings[i];
  document.getElementById('viewContent').innerHTML = `
    <img src="${x.img}" style="width:100%;border-radius:12px;height:280px;object-fit:cover">
    <h2 style="margin:12px 0 6px">${x.title[lang]}</h2>
    <div class="price" style="font-size:22px">${x.price}</div>
    <p style="color:#666;margin:8px 0">${x.desc[lang]}</p>
    <p>📍 ${x.city} • 👤 ${x.author} • 📞 ${x.phone}</p>
    <button onclick="toggleFollow(this)" style="padding:10px 18px;border-radius:20px;border:1px solid #0a7cff;background:#fff;color:#0a7cff;font-weight:bold;margin:8px 0">${T[lang].follow}</button>
    <a href="tel:${x.phone}" style="display:block;text-align:center;background:#25D366;color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-weight:bold">${T[lang].order}</a>
    <div class="comments"><b>${T[lang].comments}</b><div id="commentList">${x.comments.map(c=>`<div><b>${c.user}:</b> ${c.text}</div>`).join('')}</div>
    <input id="commentInput" placeholder="${T[lang].write}" style="width:100%;padding:10px;margin-top:8px;border:1px solid #ddd;border-radius:8px">
    <button onclick="addComment(${i})" style="padding:10px;background:#111;color:#fff;border:none;border-radius:8px;margin-top:6px">${T[lang].send}</button></div>`;
  document.getElementById('viewModal').style.display='block';
}

function addComment(i){
  const inp = document.getElementById('commentInput');
  if(!inp.value.trim()) return;
  listings[i].comments.push({user:"Mehmon", text: inp.value});
  openView(i); render();
}
function toggleLike(i){
  listings[i].likes += listings[i].liked ? -1 : 1;
  listings[i].liked = !listings[i].liked;
  render();
  if(document.getElementById('viewModal').style.display=='block') openView(i);
}
function toggleFollow(btn){ btn.innerText = T[lang].followed; btn.style.background='#0a7cff'; btn.style.color='#fff'; }
function openAdd(){ document.getElementById('addModal').style.display='block'; }
function closeModal(id){ document.getElementById(id).style.display='none'; }

function addListing(){
  const title = document.getElementById('f-title').value;
  const price = document.getElementById('f-price').value;
  const img = document.getElementById('f-img').value || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600';
  const city = document.getElementById('f-city').value || "Xo'jand";
  const phone = document.getElementById('f-phone').value || '+992 00 000 00 00';
  const desc = document.getElementById('f-desc').value || title;
  const cat = document.getElementById('f-cat').value;
  if(!title || !price){ alert('Nom va narxni yozing!'); return; }
  listings.unshift({ cat, img, price, city, phone, author:"Siz", time:"hozir", views:1, likes:0, comments:[], title:{uz:title,ru:title,tj:title}, desc:{uz:desc,ru:desc,tj:desc} });
  closeModal('addModal'); render();
}
