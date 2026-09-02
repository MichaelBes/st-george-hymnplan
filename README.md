# St. George Hymn Planner — Scaffold

A lightweight, mobile-first tool for:
1. Seeing today's Synaxarium saint(s) at a glance, with a flag for whether
   Coptic Reader shows a dedicated hymn.
2. Planning which hymns to say for an upcoming service.
3. Presenting the chosen communion hymns full-screen, slide by slide.

Built to deploy exactly like your other projects: **GitHub Pages** for the
frontend, with a **Google Apps Script + Sheets backend** to add next for
real persistence (see "Next steps" below).

## Structure

```
index.html         Home page — today's saint(s), pulled from data/saints.json
plan.html           Build a hymn plan for a service
communion.html       Pick + present communion hymns in slide mode
manifest.json         PWA manifest — lets people "Add to Home Screen"
css/style.css          Shared styling
js/coptic-calendar.js    Gregorian → Coptic date conversion (verified against
                          Mesore 25, 1742 A.M. = Aug 31, 2026)
js/app.js               Shared data-loading helpers
js/plan.js               Logic for plan.html
js/communion.js            Logic for communion.html
data/saints.json          Your saint/commemoration library (you fill this in)
data/hymns.json            Your hymn library (you fill this in)
```

## How the data model works

**`data/saints.json`** is keyed by Coptic `month-day` (e.g. `"12-25"` for
Mesore 25), independent of the Coptic year, so one entry covers that saint's
commemoration every year going forward. Each entry has:

```json
{
  "name": "Saint Name",
  "summary": "3-4 sentences.",
  "hasHymn": true,
  "hymnIds": ["hymn-id-from-hymns.json"]
}
```

You fill this in the way you already work: whenever you check Coptic
Reader to plan a service, add that day's entry. Within a season or two
you'll have a real, church-verified dataset — no scraping, no copyright
concerns, and it only contains what your church actually uses.

**`data/hymns.json`** is your hymn library — title, category
(`Doxology` / `Intercession` / `Communion` / `Praise` / `General`),
language, and tags (saint names, seasons, feasts) for filtering.

## Running it locally

Any static file server works, e.g.:

```
cd hymnplan
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying

Push this folder to a GitHub Pages repo (same pattern as your festival
site). Once live, open it on a phone and use the browser's "Add to Home
Screen" — it'll open full-screen like a native app.

## Next steps

1. **Fill in `data/saints.json` and `data/hymns.json`** with your church's
   real entries — start with just the next few Sundays.
2. **Add real icons** to `manifest.json` (currently empty) for a proper
   home-screen icon.
3. **Wire up persistence.** The service plan on `plan.html` currently lives
   in memory only and resets on reload — intentional for this first pass,
   since browser storage isn't reliable across all contexts. Point
   `savePlan()` (to be added in `js/plan.js`) at a Google Apps Script Web
   App endpoint backed by a Sheet, same pattern as your RSVP/festival
   systems, so plans persist and multiple servants can see/edit the same
   plan.
4. **Optional:** once `data/hymns.json` grows, consider moving it into a
   Google Sheet too and having `loadHymns()` fetch from a published Apps
   Script endpoint instead of the local JSON file, so non-technical
   servants can add hymns without touching code.
