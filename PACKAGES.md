# Packages

## Standalone app (this repo) — packages used

| Area | Package / technology | Version / note |
|---|---|---|
| Frontend | HTML | No build step |
| Frontend | CSS | Glass UI, dark/light themes |
| Frontend | JavaScript | Vanilla JS, no framework |
| Storage | Browser localStorage | Key `synchron-standalone-v1` |
| Export | CSV | Timetable + personal timetable |
| Export | JSON | Full data export |
| Tests | Node.js (built-in) | `node test.js`, no test framework |

**No npm dependencies.** `package.json` (name `synchron-standalone`, version 1.0.0, private true, author Saby) lists:
- Frontend: HTML, CSS, JavaScript
- Storage: browser localStorage
- Export: CSV, JSON
- Scripts: `start` (python3 -m http.server 8000), `test` (node test.js)

This is intentional: anyone can download the release zip and run it with only a browser (and Node, optionally, for tests). No package install is required, and no package is claimed that is not actually used.

## Hosted SYNCHRON app (separate, not in this repo)

The hosted Muse artifact version of SYNCHRON has its own runtime + development packages, listed live on its Project & Packages page — 9 runtime + 6 development packages, including (as verified on that page) recharts 2.15.3, typescript 5.6.3, and tailwindcss 4.1.13. Those packages are **not** dependencies of this standalone repo, and are not claimed here. Do not install them to run this standalone app.
