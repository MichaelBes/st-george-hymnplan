/**
 * Service planning page logic.
 * The plan is saved per service date via js/sync.js (Google Sheet + on-device cache).
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
      currentPlan.splice(Number(btn.dataset.index), 1);
      renderPlan();
      persistPlan();
    });
  });
  list.querySelectorAll("button.move").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index), j = i + Number(btn.dataset.dir);
      if (j < 0 || j >= currentPlan.length) return;
      [currentPlan[i], currentPlan[j]] = [currentPlan[j], currentPlan[i]];
      renderPlan();
      persistPlan();
    });
  });
}

let serviceDate = null;
function persistPlan() {
  savePlanField(serviceDate, "plan", currentPlan.map((h) => h.id));
}

async function loadServicePlan(date) {
  serviceDate = date;
  const data = await fetchPlan(date);
  currentPlan = (data.plan || [])
    .map((id) => allHymns.find((h) => h.id === id))
    .filter(Boolean);
  renderPlan();
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
      persistPlan();
    });
  });
}

async function init() {
  propagateDateToNavLinks(getActiveView(), isViewingLive());
  allHymns = await loadHymns();
  renderLibrary();
  const date = initServiceBar((d) => loadServicePlan(d));
  await loadServicePlan(date);

  document.getElementById("search-box").addEventListener("input", (e) => {
    renderLibrary(e.target.value);
  });
}

init();
