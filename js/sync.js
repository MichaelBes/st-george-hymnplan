/**
 * Shared plan sync. Plans are stored per service date (default: the next
 * Sunday) in a Google Sheet via Apps Script, and cached on-device so the
 * church iPad still shows the last synced plan if the wifi is bad.
 */

function nextSunday(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
}

function getServiceDate() {
  const q = new URLSearchParams(window.location.search).get("service");
  let v = q;
  try { v = v || sessionStorage.getItem("serviceDate"); } catch (e) {}
  return v || formatDateInput(nextSunday());
}

function setServiceDate(v) {
  try { sessionStorage.setItem("serviceDate", v); } catch (e) {}
}

function cacheKey(date) { return "plan:" + date; }

function readCache(date) {
  try { return JSON.parse(localStorage.getItem(cacheKey(date))); } catch (e) { return null; }
}
function writeCache(date, data) {
  try { localStorage.setItem(cacheKey(date), JSON.stringify(data)); } catch (e) {}
}

function setStatus(text, bad) {
  const el = document.getElementById("sync-status");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("bad", !!bad);
}

async function fetchPlan(date) {
  const cached = readCache(date) || { date, communion: [], plan: [] };
  if (!SYNC_API_URL) { setStatus("Saved on this device only"); return cached; }
  try {
    setStatus("Loading…");
    const res = await fetch(`${SYNC_API_URL}?date=${date}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    writeCache(date, data);
    setStatus("Synced ✓");
    return data;
  } catch (e) {
    setStatus("Offline — showing last saved", true);
    return cached;
  }
}

function getPasscode(force) {
  let p = null;
  try { p = localStorage.getItem("passcode"); } catch (e) {}
  if (!p || force) {
    p = window.prompt("Enter the planner passcode (asked once per device):");
    if (p) { try { localStorage.setItem("passcode", p); } catch (e) {} }
  }
  return p;
}

// field: "communion" or "plan"; ids: array of hymn ids in order
let saveTimer = null;
function savePlanField(date, field, ids) {
  const cached = readCache(date) || { date, communion: [], plan: [] };
  cached[field] = ids;
  writeCache(date, cached);
  if (!SYNC_API_URL) { setStatus("Saved on this device only"); return; }
  setStatus("Saving…");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => pushPlan(date, field, ids, false), 500);
}

async function pushPlan(date, field, ids, retry) {
  const passcode = getPasscode(retry);
  if (!passcode) { setStatus("Not saved — passcode needed", true); return; }
  try {
    const res = await fetch(SYNC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ date, passcode, [field]: ids })
    });
    const data = await res.json();
    if (data.error === "passcode") {
      try { localStorage.removeItem("passcode"); } catch (e) {}
      if (!retry) return pushPlan(date, field, ids, true);
      setStatus("Wrong passcode — not saved", true);
      return;
    }
    if (!data.ok) throw new Error(data.error || "save failed");
    setStatus("Saved ✓");
  } catch (e) {
    setStatus("Couldn't save — will retry on next change", true);
  }
}

// Wires the date picker + refresh button; onChange(date) reloads the plan.
function initServiceBar(onChange) {
  const input = document.getElementById("service-date");
  input.value = getServiceDate();
  input.addEventListener("change", () => {
    if (!input.value) return;
    setServiceDate(input.value);
    onChange(input.value);
  });
  document.getElementById("sync-refresh").addEventListener("click", () => onChange(input.value));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) onChange(input.value);
  });
  return input.value;
}
