/**
 * Coptic calendar conversion.
 * Converts a Gregorian date to the Coptic (Alexandrian) calendar date
 * used throughout Coptic Reader and the Synaxarium.
 *
 * Algorithm verified against known reference date:
 * August 31, 2026 (Gregorian) => Mesore 25, 1742 A.M.
 */

const COPTIC_MONTHS = [
  "Thout", "Paopi", "Hathor", "Koiak", "Tobi", "Meshir",
  "Paremhat", "Paremoude", "Bashans", "Paoni", "Epip", "Mesore",
  "Pi Kogi Enavot" // epagomenal (short) month, 5 or 6 days
];

const JDN_COPTIC_EPOCH = 1825030; // JDN of Coptic 1/1/1 (29 Aug 284 CE Julian)

// The Coptic liturgical day begins at Vespers (sunset), not midnight.
// Coptic Reader rolls the *Coptic* date over in the evening while the
// Gregorian calendar date shown stays the same all day — e.g. all of
// Sept 2 is "September 2", but the Coptic date is one day ahead once
// past this hour. Adjust here if your parish uses a different cutoff.
const LITURGICAL_DAY_START_HOUR = 18; // 6 PM

/**
 * Returns { gregDate, period } for right now: gregDate is today's actual
 * calendar date (unshifted), period is "day" or "night" depending on
 * whether it's past the rollover hour.
 */
function getLivePeriod(now = new Date()) {
  const gregDate = new Date(now);
  gregDate.setHours(0, 0, 0, 0);
  const period = now.getHours() >= LITURGICAL_DAY_START_HOUR ? "night" : "day";
  return { gregDate, period };
}

/**
 * The Coptic calendar only cares about which "basis" Gregorian day to
 * convert: during the day portion, it's the displayed date itself;
 * during the night portion, it's already the next Coptic day even
 * though the Gregorian date on screen hasn't changed.
 */
function copticBasisDate(gregDate, period) {
  const d = new Date(gregDate);
  if (period === "night") d.setDate(d.getDate() + 1);
  return d;
}

function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Returns { year, month, day, monthName } for the Coptic calendar
 * equivalent of the given Gregorian date (a JS Date object).
 */
function gregorianToCoptic(date) {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const year = Math.floor((4 * (jdn - JDN_COPTIC_EPOCH) + 1463) / 1461);
  const monthStart =
    JDN_COPTIC_EPOCH - 1 + 365 * (year - 1) + Math.floor(year / 4) + 1;
  const month = 1 + Math.floor((jdn - monthStart) / 30);
  const day = jdn - (monthStart + 30 * (month - 1)) + 1;

  return {
    year,
    month,
    day,
    monthName: COPTIC_MONTHS[month - 1]
  };
}

/**
 * Returns a stable key like "12-25" (coptic month-day) used to look up
 * today's entry in saints.json, independent of the Coptic year.
 */
function copticDateKey(copticDate) {
  return `${copticDate.month}-${copticDate.day}`;
}

if (typeof module !== "undefined") {
  module.exports = { gregorianToCoptic, copticDateKey, COPTIC_MONTHS, getLivePeriod, copticBasisDate };
}
