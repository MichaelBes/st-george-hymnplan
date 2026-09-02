/**
 * Communion hymns page: pick from the "Communion" category, then step
 * through selections full-screen (like a lightweight slide deck) —
 * arrow keys, tap/click the nav buttons, or swipe on mobile.
 */

let communionHymns = [];
let selected = [];
let slideIndex = 0;

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

function showSlide() {
  const hymn = selected[slideIndex];
  document.getElementById("slide-title").textContent = hymn.title;
  document.getElementById("slide-meta").textContent = hymn.language || "";
  document.getElementById("slide-counter").textContent =
    `${slideIndex + 1} / ${selected.length}`;
}

function startSlides() {
  if (selected.length === 0) return;
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
  const all = await loadHymns();
  communionHymns = all.filter((h) => h.category === "Communion");

  renderLibrary();
  renderSelected();

  document.getElementById("start-slides").addEventListener("click", startSlides);
  document.getElementById("exit-slides").addEventListener("click", exitSlides);
  document.getElementById("next-slide").addEventListener("click", () => {
    if (slideIndex < selected.length - 1) {
      slideIndex++;
      showSlide();
    }
  });
  document.getElementById("prev-slide").addEventListener("click", () => {
    if (slideIndex > 0) {
      slideIndex--;
      showSlide();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("slide-view").style.display === "none") return;
    if (e.key === "ArrowRight") document.getElementById("next-slide").click();
    if (e.key === "ArrowLeft") document.getElementById("prev-slide").click();
    if (e.key === "Escape") exitSlides();
  });
}

init();
