const STORAGE_KEY = "sweetMemories";

/* ===== Load Memories ===== */
function loadMemories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/* ===== Save Memories ===== */
function saveMemories(memories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
}

/* ===== Render One Memory ===== */
function renderMemory(memory) {
  const memoryList = document.getElementById("memoryList");

  const memoryItem = document.createElement("div");
  memoryItem.className = "memory-item";

  if (memory.mediaSrc) {
    if (memory.mediaType.startsWith("image")) {
      memoryItem.innerHTML = `
        <img src="${memory.mediaSrc}">
        <p class="title">${memory.title}</p>
      `;
    } else {
      memoryItem.innerHTML = `
        <video src="${memory.mediaSrc}" muted loop></video>
        <p class="title">${memory.title}</p>
      `;
    }
  } else {
    memoryItem.innerHTML = `<p class="title">${memory.title}</p>`;
  }

  memoryItem.onclick = () => {
    openLightbox(memory.mediaSrc, memory.mediaType, memory.title, memory.text);
  };

  memoryList.appendChild(memoryItem);
}

/* ===== Render All Memories ===== */
function renderMemories() {
  const memories = loadMemories();
  const memoryList = document.getElementById("memoryList");
  memoryList.innerHTML = "";

  memories.forEach(renderMemory);
}

/* ===== Add Memory ===== */
function addMemory() {
  const title = document.getElementById("memoryTitle").value.trim();
  const text = document.getElementById("memoryText").value.trim();
  const file = document.getElementById("memoryPhoto").files[0];

  if (!title && !text && !file) {
    alert("Please add something first 💖");
    return;
  }

  const memories = loadMemories();

  function saveAndUpdate(memory) {
    memories.push(memory);
    saveMemories(memories);
    renderMemories();

    // Reset form
    document.getElementById("memoryTitle").value = "";
    document.getElementById("memoryText").value = "";
    document.getElementById("memoryPhoto").value = "";
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      saveAndUpdate({
        title,
        text,
        mediaSrc: e.target.result,
        mediaType: file.type
      });
    };
    reader.readAsDataURL(file);
  } else {
    saveAndUpdate({
      title,
      text,
      mediaSrc: null,
      mediaType: null
    });
  }
}

/* ===== Lightbox ===== */
function openLightbox(src, type, title, text) {
  document.getElementById("lightbox").style.display = "flex";

  const mediaBox = document.getElementById("lightboxMedia");

  if (!src) {
    mediaBox.innerHTML = "";
  } else if (type.startsWith("image")) {
    mediaBox.innerHTML = `<img src="${src}">`;
  } else {
    mediaBox.innerHTML = `<video src="${src}" controls autoplay></video>`;
  }

  document.getElementById("lightboxTitle").innerText = title;
  document.getElementById("lightboxText").innerText = text;
}

function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}

/* ===== Load Memories On Start ===== */
document.addEventListener("DOMContentLoaded", renderMemories);
