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
      <div class="row-actions">
        <button class="move" data-dir="-1" data-index="${index}" aria-label="Move up">↑</button>
        <button class="move" data-dir="1" data-index="${index}" aria-label="Move down">↓</button>
        <button class="remove" data-index="${index}">Remove</button>
      </div>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll("button.remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      selected.splice(Number(btn.dataset.index), 1);
      renderSelected();
      persistSelected();
    });
  });
  list.querySelectorAll("button.move").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index), j = i + Number(btn.dataset.dir);
      if (j < 0 || j >= selected.length) return;
      [selected[i], selected[j]] = [selected[j], selected[i]];
      renderSelected();
      persistSelected();
    });
  });
}

let serviceDate = null;
function persistSelected() {
  savePlanField(serviceDate, "communion", selected.map((h) => h.id));
}

async function loadServicePlan(date) {
  serviceDate = date;
  const data = await fetchPlan(date);
  selected = (data.communion || [])
    .map((id) => communionHymns.find((h) => h.id === id))
    .filter(Boolean);
  renderSelected();
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
      persistSelected();
    });
  });
}

function buildFrames() {
  frames = [];
  selected.forEach((hymn) => {
    if (hymn.verses && hymn.verses.length) {
      hymn.verses.forEach((text, i) =>
        frames.push({ hymn, text, first: i === 0, last: i === hymn.verses.length - 1 })
      );
    } else if (hymn.slides && hymn.slides.length) {
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
  view.classList.toggle("verse-mode", !!f.text);
  const verse = document.getElementById("slide-verse");
  verse.textContent = f.text || "";
  document.getElementById("verse-title").textContent = f.first ? f.hymn.title : "";
  document.getElementById("verse-end").style.display = f.last ? "block" : "none";
  if (f.src) {
    img.src = f.src;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }
  document.getElementById("slide-title").textContent = f.src || f.text ? "" : f.hymn.title;
  document.getElementById("slide-meta").textContent = f.src || f.text ? "" : f.hymn.language || "";
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

async function loadVerseFiles() {
  for (const hymn of selected) {
    if (hymn.versesFile && !hymn.verses) {
      try {
        const res = await fetch(hymn.versesFile);
        const txt = await res.text();
        hymn.verses = txt.split(/\n\s*\n/).map((v) => v.trim().replace(/^\d+[.)]\s*/, "")).filter(Boolean);
      } catch (e) {
        hymn.verses = ["Could not load " + hymn.versesFile];
      }
    }
  }
}

async function startSlides() {
  if (selected.length === 0) return;
  await loadVerseFiles();
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
  const date = initServiceBar((d) => {
    if (document.getElementById("slide-view").style.display !== "none") return;
    loadServicePlan(d);
  });
  await loadServicePlan(date);

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
