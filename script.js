const STORAGE_KEY = 'sweetMemories';
const SYNC_KEY = 'sweetMemoriesSyncId';
const SYNC_LINK_KEY = 'sweetMemoriesSyncLink';
const CLOUD_BASE_URL = 'https://jsonblob.com/api/jsonBlob';

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

async function saveMemoriesToCloud(syncId, memories) {␊
  if (!syncId) {␊
    return;␊
  }
  try {
    const response = await fetch(`${CLOUD_BASE_URL}/${syncId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memories)
    });
    if (!response.ok) {
      throw new Error('Cloud save failed.');
    }
  } catch (error) {
    console.warn('Unable to sync memories.', error);
    alert('Unable to sync memories right now.');
  }
}

function getSyncIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const syncId = params.get('sync');
  return syncId ? syncId.trim() : '';
}

function buildSyncLink(syncId) {
  const url = new URL(window.location.href);
  url.searchParams.set('sync', syncId);
  return url.toString();
}

function updateSyncStatus(message, variant = 'info') {
  const status = document.getElementById('syncStatus');
  if (!status) {
    return;
  }
  status.textContent = message;
  status.dataset.variant = variant;
}

function setSyncLink(syncId) {
  const linkInput = document.getElementById('syncLink');
  if (!linkInput || !syncId) {
    return;
  }
  const link = buildSyncLink(syncId);
  linkInput.value = link;
  localStorage.setItem(SYNC_LINK_KEY, link);
}

async function createCloudSync(memories) {
  try {
    const response = await fetch(CLOUD_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memories)
    });
    if (!response.ok) {
      throw new Error('Cloud create failed.');
    }
    const location = response.headers.get('Location');
    if (!location) {
      throw new Error('No sync location provided.');
    }
    return location.split('/').pop();
  } catch (error) {
    console.warn('Unable to create sync.', error);
    alert('Unable to create a sync code right now.');
    return null;
  }
}

async function loadMemoriesFromCloud(syncId) {␊
  if (!syncId) {␊
    return null;␊
  }
  try {
    const response = await fetch(`${CLOUD_BASE_URL}/${syncId}`);
    if (!response.ok) {
      throw new Error('Cloud load failed.');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch (error) {
    console.warn('Unable to load sync data.', error);
    alert('Unable to load memories from that code.');
    return null;
  }
}␊
␊
function renderMemory(memory) {␊
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

async function ensureCloudSync(memories) {
  let syncId = localStorage.getItem(SYNC_KEY);
  const urlSyncId = getSyncIdFromUrl();
  if (urlSyncId && urlSyncId !== syncId) {
    syncId = urlSyncId;
    localStorage.setItem(SYNC_KEY, syncId);
    updateSyncStatus('Loading your memories from the shared link…');
    const cloudMemories = await loadMemoriesFromCloud(syncId);
    if (cloudMemories) {
      saveMemories(cloudMemories);
      renderMemories(cloudMemories);
      updateSyncStatus('Memories loaded! They will stay synced across devices.', 'success');
    } else {
      updateSyncStatus('We could not load memories from that link yet.', 'warning');
    }
  }

  if (!syncId) {
    updateSyncStatus('Creating your permanent memory link…');
    syncId = await createCloudSync(memories);
    if (!syncId) {
      updateSyncStatus('Unable to create a cloud link right now.', 'warning');
      return;
    }
    localStorage.setItem(SYNC_KEY, syncId);
    updateSyncStatus('Your permanent link is ready. Share it to access memories anywhere.', 'success');
    await saveMemoriesToCloud(syncId, memories);
  } else {
    updateSyncStatus('Your memories are connected to the permanent link.', 'success');
  }

  setSyncLink(syncId);
}

function copySyncLink() {
  const linkInput = document.getElementById('syncLink');
  if (!linkInput) {
    return;
  }
  linkInput.select();
  linkInput.setSelectionRange(0, linkInput.value.length);
  navigator.clipboard?.writeText(linkInput.value).then(() => {
    updateSyncStatus('Link copied! Open it on any device to see your memories.', 'success');
  }).catch(() => {
    updateSyncStatus('Copy failed. Please select the link and copy manually.', 'warning');
  });
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

  const persistAndRender = (memory) => {
    memories.push(memory);
    saveMemories(memories);
    renderMemory(memory);
  };

 if (file) {␊
    const reader = new FileReader();␊
    reader.onload = function(e) {␊
      const memory = {␊
        title: title.trim(),␊
        text: text.trim(),
        mediaSrc: e.target.result,
        mediaType: file.type
      };
      persistAndRender(memory);
      const syncId = localStorage.getItem(SYNC_KEY);
      saveMemoriesToCloud(syncId, memories);
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
    const syncId = localStorage.getItem(SYNC_KEY);
    saveMemoriesToCloud(syncId, memories);
  }

  // Reset form
  document.getElementById('memoryTitle').value = '';
  document.getElementById('memoryText').value = '';
  photoInput.value = '';
}␊

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

  ensureCloudSync(memories);

  const copyLinkButton = document.getElementById('copySyncLink');
  if (copyLinkButton) {
    copyLinkButton.addEventListener('click', copySyncLink);
  }

  const exportButton = document.getElementById('exportMemories');
  const importInput = document.getElementById('importMemories');
  const generateButton = document.getElementById('generateSync');
  const syncNowButton = document.getElementById('syncNow');
  const syncCodeInput = document.getElementById('syncCode');

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

  generateButton.addEventListener('click', async () => {
    const memoriesToSync = loadMemories();
    updateSyncStatus('Generating a new shareable link…');
    const syncId = await createCloudSync(memoriesToSync);
    if (!syncId) {
      updateSyncStatus('Unable to generate a new link right now.', 'warning');
      return;
    }
    localStorage.setItem(SYNC_KEY, syncId);
    setSyncLink(syncId);
    updateSyncStatus('New link ready! Share it to access memories anywhere.', 'success');
  });

  syncNowButton.addEventListener('click', async () => {
    const entered = syncCodeInput.value.trim();
    if (!entered) {
      updateSyncStatus('Enter a sync code to connect devices.', 'warning');
      return;
    }
    localStorage.setItem(SYNC_KEY, entered);
    setSyncLink(entered);
    updateSyncStatus('Syncing memories from the code…');
    const cloudMemories = await loadMemoriesFromCloud(entered);
    if (cloudMemories) {
      saveMemories(cloudMemories);
      renderMemories(cloudMemories);
      updateSyncStatus('Memories synced! They will stay available across devices.', 'success');
    } else {
      updateSyncStatus('Unable to load memories from that code.', 'warning');
    }
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
