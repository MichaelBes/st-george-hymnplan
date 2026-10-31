/**
 * Communion hymns page: pick from the "Communion" category, then step
 * through selections full-screen (like a lightweight slide deck) —
 * arrow keys, tap/click the nav buttons, or swipe on mobile.
 */

let communionHymns = [];
let selected = [];
let slideIndex = 0;
let frames = [];

function renderSelected() {
  const list = document.getElementById("selected-list");
  list.innerHTML = "";

  if (selected.length === 0) {
    list.innerHTML = `<li class="empty-state">None selected yet.</li>`;
    return;
  }

  selected.forEach((hymn, index) => {
    const li = document.createElement("li");
    li.className = "hymn-row";
    li.innerHTML = `
      <div class="hymn-row-title">${index + 1}. ${hymn.title}</div>
      <button class="remove" data-index="${index}">Remove</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll("button.remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      selected.splice(Number(btn.dataset.index), 1);
      renderSelected();
    });
  });
}

function renderLibrary() {
  const container = document.getElementById("communion-library");
  container.innerHTML = "";

  if (communionHymns.length === 0) {
    container.innerHTML = `<p class="empty-state">No hymns tagged "Communion" in data/hymns.json yet.</p>`;
    return;
  }

  communionHymns.forEach((hymn) => {
    const row = document.createElement("div");
    row.className = "hymn-row";
    row.innerHTML = `
      <div class="hymn-row-title">${hymn.title}</div>
      <button class="add" data-id="${hymn.id}">Add</button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("button.add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const hymn = communionHymns.find((h) => h.id === btn.dataset.id);
      selected.push(hymn);
      renderSelected();
    });
  });
}

function buildFrames() {
  frames = [];
  selected.forEach((hymn) => {
    if (hymn.slides && hymn.slides.length) {
      hymn.slides.forEach((src) => frames.push({ hymn, src }));
    } else {
      frames.push({ hymn });
    }
  });
}

function showSlide() {
  const f = frames[slideIndex];
  const view = document.getElementById("slide-view");
  const img = document.getElementById("slide-image");
  view.classList.toggle("image-mode", !!f.src);
  if (f.src) {
    img.src = f.src;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }
  document.getElementById("slide-title").textContent = f.src ? "" : f.hymn.title;
  document.getElementById("slide-meta").textContent = f.src ? "" : f.hymn.language || "";
  document.getElementById("slide-counter").textContent =
    `${slideIndex + 1} / ${frames.length}`;
  // preload next
  const n = frames[slideIndex + 1];
  if (n && n.src) new Image().src = n.src;
}

function nextSlide() {
  if (slideIndex < frames.length - 1) { slideIndex++; showSlide(); }
}
function prevSlide() {
  if (slideIndex > 0) { slideIndex--; showSlide(); }
}

function startSlides() {
  if (selected.length === 0) return;
  buildFrames();
  slideIndex = 0;
  document.getElementById("picker-view").style.display = "none";
  document.getElementById("bottom-nav").style.display = "none";
  document.getElementById("slide-view").style.display = "flex";
  showSlide();
}

function exitSlides() {
  document.getElementById("slide-view").style.display = "none";
  document.getElementById("picker-view").style.display = "block";
  document.getElementById("bottom-nav").style.display = "flex";
}

async function init() {
  propagateDateToNavLinks(getActiveView(), isViewingLive());
  const all = await loadHymns();
  communionHymns = all.filter((h) => h.category === "Communion");

  renderLibrary();
  renderSelected();

  document.getElementById("start-slides").addEventListener("click", startSlides);
  document.getElementById("exit-slides").addEventListener("click", exitSlides);
  document.getElementById("exit-slides-x").addEventListener("click", exitSlides);
  document.getElementById("next-slide").addEventListener("click", nextSlide);
  document.getElementById("prev-slide").addEventListener("click", prevSlide);
  document.getElementById("tap-next").addEventListener("click", nextSlide);
  document.getElementById("tap-prev").addEventListener("click", prevSlide);

  let touchX = null;
  const sv = document.getElementById("slide-view");
  sv.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  sv.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) { dx < 0 ? nextSlide() : prevSlide(); e.preventDefault(); }
  });

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("slide-view").style.display === "none") return;
    if (e.key === "ArrowRight" || e.key === " ") nextSlide();
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "Escape") exitSlides();
  });
}

init();
