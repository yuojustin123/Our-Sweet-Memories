const STORAGE_KEY = 'sweetMemories';
const CLOUD_BASE_URL = 'https://jsonblob.com/api/jsonBlob';
const PUBLIC_FEED_ID =
  document.body?.dataset.publicFeedId?.trim() || '';

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

async function saveMemoriesToCloud(feedId, memories) {
  if (!feedId) {
    return false;
  }
  try {
    const response = await fetch(`${CLOUD_BASE_URL}/${feedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memories)
    });
    if (!response.ok) {
      throw new Error('Cloud save failed.');
    }
    return true;
  } catch (error) {
    console.warn('Unable to sync memories.', error);
    updateFeedStatus('Unable to reach the public feed right now.', 'warning');
    return false;
  }
}

async function loadMemoriesFromCloud(feedId) {
  if (!feedId) {
    return null;
  }
  try {
    const response = await fetch(`${CLOUD_BASE_URL}/${feedId}`);
    if (!response.ok) {
      throw new Error('Cloud load failed.');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch (error) {
    console.warn('Unable to load feed data.', error);
    updateFeedStatus('Unable to load the public feed right now.', 'warning');
    return null;
  }
}

function updateFeedStatus(message, variant = 'info') {
  const status = document.getElementById('feedStatus');
  if (!status) {
    return;
  }
  status.textContent = message;
  status.dataset.variant = variant;
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

async function loadPublicFeed() {
  if (!PUBLIC_FEED_ID) {
    updateFeedStatus('Public feed is not configured yet.', 'warning');
    return;
  }
  updateFeedStatus('Loading the shared memories…');
  const cloudMemories = await loadMemoriesFromCloud(PUBLIC_FEED_ID);
  if (cloudMemories) {
    saveMemories(cloudMemories);
    renderMemories(cloudMemories);
    updateFeedStatus('Public feed ready! New posts appear for everyone.', 'success');
    return;
  }
  const localMemories = loadMemories();
  renderMemories(localMemories);
  if (localMemories.length) {
    await saveMemoriesToCloud(PUBLIC_FEED_ID, localMemories);
    updateFeedStatus('Public feed restored from this device.', 'success');
  }
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

  const persistAndRender = async (memory) => {
    memories.push(memory);
    saveMemories(memories);
    renderMemory(memory);
    updateFeedStatus('Saving your memory to the public feed…');
    const success = await saveMemoriesToCloud(PUBLIC_FEED_ID, memories);
    if (success) {
      updateFeedStatus('Memory added to the public feed!', 'success');
    }
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const memory = {
        title: title.trim(),
        text: text.trim(),
        mediaSrc: e.target.result,
        mediaType: file.type
      };
      persistAndRender(memory);
    };
    reader.readAsDataURL(file);
  } else {
    const memory = {
      title: title.trim(),
      text: text.trim(),
      mediaSrc: null,
      mediaType: null
    };
    persistAndRender(memory);
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
  loadPublicFeed();
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
