const STORAGE_KEY = 'sweetMemories';

function loadMemories() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Unable to load memories.', error);
    return [];
  }
}

function saveMemories(memories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (error) {
    console.warn('Unable to save memories.', error);
  }
}

function renderMemory(memory) {
  const memoryList = document.getElementById('memoryList');
  const memoryItem = document.createElement('div');
  memoryItem.className = 'memory-item';

  if (memory.mediaSrc) {
    const mediaMarkup = memory.mediaType?.startsWith('image')
      ? `<img src="${memory.mediaSrc}" alt="Memory">`
      : `<video src="${memory.mediaSrc}" muted loop></video>`;
    memoryItem.innerHTML = mediaMarkup + `<p class="title">${memory.title || ''}</p>`;
  } else {
    memoryItem.innerHTML = `<p class="title">${memory.title || ''}</p>`;
  }

  memoryItem.addEventListener('click', () =>
    openLightbox(memory.mediaSrc, memory.mediaType, memory.title, memory.text)
  );
  memoryList.appendChild(memoryItem);
}

function renderMemories(memories) {
  const memoryList = document.getElementById('memoryList');
  memoryList.innerHTML = '';
  memories.forEach(renderMemory);
}

function addMemory() {
  const title = document.getElementById('memoryTitle').value;
  const text = document.getElementById('memoryText').value;
  const photoInput = document.getElementById('memoryPhoto');
  const file = photoInput.files[0];

  if (!title.trim() && !text.trim() && !file) {
    alert("Please add a title, text, or a photo/video!");
    return;
  }

  const memories = loadMemories();

  const finalizeMemory = (memory) => {
    memories.push(memory);
    saveMemories(memories);
    renderMemory(memory);
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      finalizeMemory({
        title: title.trim(),
        text: text.trim(),
        mediaSrc: e.target.result,
        mediaType: file.type
      });
    };
    reader.readAsDataURL(file);
  } else {
    finalizeMemory({
      title: title.trim(),
      text: text.trim(),
      mediaSrc: null,
      mediaType: null
    });
  }

  // Reset form
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

document.addEventListener('DOMContentLoaded', () => {
  const memories = loadMemories();
  renderMemories(memories);

  const exportButton = document.getElementById('exportMemories');
  const importInput = document.getElementById('importMemories');

  exportButton.addEventListener('click', () => {
    const data = loadMemories();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sweet-memories.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          throw new Error('Invalid file format.');
        }
        const sanitized = imported.map((memory) => ({
          title: typeof memory.title === 'string' ? memory.title : '',
          text: typeof memory.text === 'string' ? memory.text : '',
          mediaSrc: typeof memory.mediaSrc === 'string' ? memory.mediaSrc : null,
          mediaType: typeof memory.mediaType === 'string' ? memory.mediaType : null
        }));
        saveMemories(sanitized);
        renderMemories(sanitized);
      } catch (error) {
        alert('Unable to import memories. Please choose a valid file.');
      } finally {
        importInput.value = '';
      }
    };
    reader.readAsText(file);
  });
});

/* ===== Lightbox ===== */
function openLightbox(src, type, title, text) {
  const lightbox = document.getElementById('lightbox');
  const mediaContainer = document.getElementById('lightboxMedia');
  const titleContainer = document.getElementById('lightboxTitle');
  const textContainer = document.getElementById('lightboxText');

  lightbox.style.display = 'flex';

  // Left: show media
  if (!src) {
    mediaContainer.innerHTML = '';
  } else if (type.startsWith("image")) {
    mediaContainer.innerHTML = `<img src="${src}">`;
  } else if (type.startsWith("video")) {
    mediaContainer.innerHTML = `<video src="${src}" controls autoplay></video>`;
  }

  // Right: title + memory
  titleContainer.innerText = title || "No title";
  textContainer.innerText = text || "No memory text";
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.getElementById('lightboxMedia').innerHTML = '';
  document.getElementById('lightboxTitle').innerText = '';
  document.getElementById('lightboxText').innerText = '';
}

