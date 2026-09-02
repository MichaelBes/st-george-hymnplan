/**
 * Service planning page logic.
 * The current plan is kept in memory only (state resets on reload).
 * Replace savePlan() with a call to your Google Apps Script Web App
 * once the hymn library moves to a Google Sheet — see README.
 */

let allHymns = [];
let currentPlan = []; // array of hymn objects, in the order chosen

function renderPlan() {
  const list = document.getElementById("plan-list");
  list.innerHTML = "";

  if (currentPlan.length === 0) {
    list.innerHTML = `<li class="empty-state">No hymns added yet.</li>`;
    return;
  }

  currentPlan.forEach((hymn, index) => {
    const li = document.createElement("li");
    li.className = "hymn-row";
    li.innerHTML = `
      <div>
        <div class="hymn-row-title">${hymn.title}</div>
        <div class="hymn-row-meta">${hymn.category} · ${hymn.language}</div>
      </div>
      <button class="remove" data-index="${index}">Remove</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll("button.remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPlan.splice(Number(btn.dataset.index), 1);
      renderPlan();
    });
  });
}

function renderLibrary(filterText = "") {
  const container = document.getElementById("library-list");
  container.innerHTML = "";

  const filtered = allHymns.filter((h) => {
    const haystack = `${h.title} ${h.category} ${h.tags.join(" ")}`.toLowerCase();
    return haystack.includes(filterText.toLowerCase());
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-state">No hymns match. Add more to data/hymns.json.</p>`;
    return;
  }

  filtered.forEach((hymn) => {
    const row = document.createElement("div");
    row.className = "hymn-row";
    row.innerHTML = `
      <div>
        <div class="hymn-row-title">${hymn.title}</div>
        <div class="hymn-row-meta">${hymn.category} · ${hymn.language}${hymn.tags.length ? " · " + hymn.tags.join(", ") : ""}</div>
      </div>
      <button class="add" data-id="${hymn.id}">Add</button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("button.add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const hymn = allHymns.find((h) => h.id === btn.dataset.id);
      currentPlan.push(hymn);
      renderPlan();
    });
  });
}

async function init() {
  allHymns = await loadHymns();
  renderLibrary();
  renderPlan();

  document.getElementById("search-box").addEventListener("input", (e) => {
    renderLibrary(e.target.value);
  });
}

init();
