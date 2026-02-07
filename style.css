function addMemory() {
  let title = document.getElementById("memoryTitle").value;
  let text = document.getElementById("memoryText").value;

  if (title.trim() === "" && text.trim() === "") {
    alert("Write something first 💖");
    return;
  }

  let memoryList = document.getElementById("memoryList");

  let div = document.createElement("div");
  div.className = "memory-item";
  div.innerHTML = `<h3>${title}</h3><p>${text}</p>`;

  memoryList.appendChild(div);

  document.getElementById("memoryTitle").value = "";
  document.getElementById("memoryText").value = "";
}
