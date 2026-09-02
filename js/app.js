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
 * selected (non-live) view travels as ?date=YYYY-MM-DD&period=day|night
 * query params. Absence of both means "live" (right now).
 */

function getSelectedViewFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const dateVal = params.get("date");
  const periodVal = params.get("period");
  if (!dateVal || !periodVal) return null;
  return { gregDate: parseDateInput(dateVal), period: periodVal };
}

function getActiveView() {
  return getSelectedViewFromQuery() || getLivePeriod();
}

function isViewingLive() {
  return getSelectedViewFromQuery() === null;
}

/**
 * Keeps the same selected view attached when navigating between pages
 * (home icon, bottom nav) so switching pages doesn't reset back to live.
 */
function propagateDateToNavLinks(view, live) {
  const suffix = live
    ? ""
    : `?date=${formatDateInput(view.gregDate)}&period=${view.period}`;
  document.querySelectorAll(".home-link, .bottom-nav a").forEach((a) => {
    const base = a.getAttribute("href").split("?")[0];
    a.setAttribute("href", base + suffix);
  });
}
