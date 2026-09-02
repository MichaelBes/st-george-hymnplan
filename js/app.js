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

function formatCoptic(copticDate) {
  return `${copticDate.monthName} ${ordinal(copticDate.day)}, ${copticDate.year} A.M.`;
}
