/* ===== Add Memory ===== */
function addMemory() {
  const title = document.getElementById('memoryTitle').value;
  const text = document.getElementById('memoryText').value;
  const photoInput = document.getElementById('memoryPhoto');
  const file = photoInput.files[0];

  if (!title.trim() && !text.trim() && !file) {
    alert("Please add a title, text, or a photo/video!");
    return;
  }

  const memoryList = document.getElementById('memoryList');
  const memoryItem = document.createElement('div');
  memoryItem.className = 'memory-item';

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      let media;
      if (file.type.startsWith("image")) {
        media = `<img src="${e.target.result}" alt="Memory">`;
      } else if (file.type.startsWith("video")) {
        media = `<video src="${e.target.result}" muted loop></video>`;
      }
      memoryItem.innerHTML = media;
      memoryList.appendChild(memoryItem);

      memoryItem.addEventListener('click', () =>
        openLightbox(e.target.result, file.type, title, text)
      );
    };
    reader.readAsDataURL(file);
  } else {
    memoryItem.innerHTML = `<p>${title}</p>`;
    memoryList.appendChild(memoryItem);
    memoryItem.addEventListener('click', () =>
      openLightbox(null, null, title, text)
    );
  }

  document.getElementById('memoryTitle').value = '';
  document.getElementById('memoryText').value = '';
  photoInput.value = '';
}

/* ===== Floating Hearts ===== */
function createHeart() {
  const heart = document.createElement('div');
  heart.className = 'heart';
  heart.innerText = '💖';
  heart.style.left = Math.random() * 95 + 'vw';
  heart.style.fontSize = (Math.random() * 2 + 1.5) + 'rem';
  heart.style.color = ['#ff69b4','#ff1493','#ffb6c1','#ff8da1'][Math.floor(Math.random()*4)];
  document.querySelector('.hearts').appendChild(heart);
  heart.style.transition = 'transform 6s linear, opacity 6s linear';
  setTimeout(() => {
    heart.style.transform = 'translateY(-100vh)';
    heart.style.opacity = '0';
  }, 100);
  setTimeout(() => heart.remove(), 6000);
}
setInterval(createHeart, 400);

/* ===== Lightbox ===== */
function openLightbox(src, type, title, text) {
  const lightbox = document.getElementById('lightbox');
  const mediaContainer = document.getElementById('lightboxMedia');
  const titleContainer = document.getElementById('lightboxTitle');
  const textContainer = document.getElementById('lightboxText');

  lightbox.style.display = 'flex';

  if (!src) {
    mediaContainer.innerHTML = '';
  } else if (type.startsWith("image")) {
    mediaContainer.innerHTML = `<img src="${src}">`;
  } else if (type.startsWith("video")) {
    mediaContainer.innerHTML = `<video src="${src}" controls autoplay></video>`;
  }

  titleContainer.innerText = title;
  textContainer.innerText = text;
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.getElementById('lightboxMedia').innerHTML = '';
  document.getElementById('lightboxTitle').innerText = '';
  document.getElementById('lightboxText').innerText = '';
}
