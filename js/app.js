/**
 * Shared helpers: loading saints.json / hymns.json and formatting dates.
 * Data currently loads from local JSON files. Swap loadSaints()/loadHymns()
 * to fetch from a Google Apps Script Web App endpoint once you move the
 * library into a Google Sheet (see README).
 */

async function loadSaints() {
  const res = await fetch("data/saints.json");
  return res.json();
}

async function loadHymns() {
  const res = await fetch("data/hymns.json");
  const data = await res.json();
  return data.hymns.filter((h) => h.id !== "example-hymn-id");
}

function formatGregorian(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInput(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatCoptic(copticDate) {
  return `${copticDate.monthName} ${ordinal(copticDate.day)}, ${copticDate.year} A.M.`;
}

/**
 * Date persistence across pages, without using browser storage: the
 * selected (non-live) date travels as a ?date=YYYY-MM-DD query param.
 * Absence of the param means "live" (today, per the 7 PM rollover).
 */

function getSelectedDateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const val = params.get("date");
  return val ? parseDateInput(val) : null;
}

function getActiveDate() {
  return getSelectedDateFromQuery() || getLiturgicalToday();
}

function isViewingLive() {
  return getSelectedDateFromQuery() === null;
}

/**
 * Keeps the same selected date attached when navigating between pages
 * (home icon, bottom nav) so switching pages doesn't reset back to live.
 */
function propagateDateToNavLinks(date, live) {
  const suffix = live ? "" : `?date=${formatDateInput(date)}`;
  document.querySelectorAll(".home-link, .bottom-nav a").forEach((a) => {
    const base = a.getAttribute("href").split("?")[0];
    a.setAttribute("href", base + suffix);
  });
}
