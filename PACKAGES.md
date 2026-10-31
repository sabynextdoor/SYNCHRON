# Packages

## Standalone app (this repo)
- **No npm dependencies, no build step.** `package.json` (name `synchron-standalone`, version 1.0.0, private true, author Saby) lists:
  - Frontend: HTML, CSS, JavaScript
  - Storage: browser localStorage
  - Export: CSV, JSON
  - Scripts: `start` (python3 -m http.server 8000), `test` (node test.js)
- This is intentional: anyone can download the release zip and run it with only a browser (and Node, optionally, for tests). No package install is required.

## Hosted SYNCHRON app (separate, not in this repo)
- The hosted Muse artifact version of SYNCHRON has its own runtime + development packages, listed live on its Project & Packages page (for example recharts, typescript, tailwindcss). Those packages are **not** dependencies of this standalone repo, and are not claimed here. Do not install them to run this standalone app.
