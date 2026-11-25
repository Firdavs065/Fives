let uploadedImg = "";

window.previewImg = (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedImg = ev.target.result;
    const p = document.getElementById('imgPreview');
    if(p){ p.src = uploadedImg; p.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
};

window.addListing = async () => {
  const title = document.getElementById('f-title').value.trim();
  const price = document.getElementById('f-price').value.trim();
  const city = document.getElementById('f-city').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const img = uploadedImg;

  if(!title || !price || !img || !city || !phone){
    alert('Hamma maydonni to\'ldir va rasm tanla!');
    return;
  }

  await addDoc(collection(db, 'listings'), {
    title, price, city, phone, img,
    owner: currentUser ? currentUser.uid : 'guest',
    likes: 0,
    createdAt: new Date()
  });

  alert('Elon qo\'shildi! ✅');
  closeModal('sellModal');
  uploadedImg = "";
};
