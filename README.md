# SYNCHRON — Academic Timetable & Clash Management System (Standalone)

A production-grade, single-page platform for running an academic institution's timetabling — departments, faculty, subjects, rooms, sections, batches, clash detection and resolution, automatic generation, personal timetables and clash checking, in one clean workspace. No build step. No server. No separate database to install.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![HTML CSS JavaScript](https://img.shields.io/badge/HTML%20CSS%20JavaScript-no%20build-blue.svg)
![localStorage](https://img.shields.io/badge/Storage-localStorage-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)
![Made by Saby](https://img.shields.io/badge/Made%20by-Saby-blue.svg)

## SYNCHRON dashboard

> Screenshots are captured from the running standalone app and placed in `docs/screenshots/`. See `docs/screenshots/README.md` for how to capture them. No screenshot from another project is used in their place.

### Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Default roles](#default-roles)
- [Environment Variables](#environment-variables)
- [API / App Actions Reference](#api--app-actions-reference)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author](#author)
- [Changelog](#changelog)
- [License](#license)

## Overview

SYNCHRON Standalone is a complete academic timetable platform built for real day-to-day institutional operations, packaged so anyone can download it and run it without Muse, a build step, or a database server. It ships role-based workspaces from one codebase:

- **Admin workspace** — the full back-office: institution setup, departments, faculty, subjects, rooms and labs, sections, timetable builder, clash manager, auto scheduler, CSV import/export, and analytics.
- **Faculty workspace** — read-only view of institutional data in this standalone version, with own sessions visible through the timetable filters.
- **Student workspace** — own section timetable as a read-only base, a private Personal Timetable Creator (blank or section-based, named timetables, drag-and-drop, free periods, CSV export), and a dedicated Clash Checker (quick and bulk checks, plain-language results with suggested alternatives).
- **Guest read-only view** — view-only access, no editing.

The scheduling engine is deterministic, not random: every create, move, and edit is validated against faculty, section, room/lab, subject allocation, availability, capacity, working hours, and breaks, with a suggested free slot that is itself revalidated before it can be applied.

Crafted and signed by Saby — the project embeds hidden authorship watermarks (a runtime signature constant, a faint on-screen mark, and a comment/header in the code) so attribution survives forks and clones. See [Author](#author).

## Screenshots

### Login & dashboards

| Overview | Timetable |
| --- | --- |
| ![Overview](docs/screenshots/overview.png) | ![Timetable](docs/screenshots/timetable.png) |

### Timetable builder & clash management

| Timetable Builder | Clash Manager |
| --- | --- |
| ![Timetable Builder](docs/screenshots/timetable-builder.png) | ![Clash Manager](docs/screenshots/clash-manager.png) |

| Auto Scheduler | Personal Timetable |
| --- | --- |
| ![Auto Scheduler](docs/screenshots/auto-scheduler.png) | ![Personal Timetable](docs/screenshots/personal-timetable.png) |

| Clash Checker | Analytics |
| --- | --- |
| ![Clash Checker](docs/screenshots/clash-checker.png) | ![Analytics](docs/screenshots/analytics.png) |

| Faculty & Rooms | Settings |
| --- | --- |
| ![Faculty and Rooms](docs/screenshots/faculty-rooms.png) | ![Settings](docs/screenshots/settings.png) |

> Screenshot files in `docs/screenshots/` are captured from the running standalone app. If a file is missing in a given commit, it is a capture still to be added from the running app — no screenshot from another project is used in its place.

## Features

### Institution & People

- Institution setup: name, academic year, working days, periods per day, period length, start time, lunch period
- Faculty management: names, department codes, workload limits (availability and unavailable days are supported by the engine; the standalone form keeps the common fields)
- Subject management: code, name, credits, hours per week, assigned faculty where set
- Rooms / labs: name, building, capacity, type, room timetable, occupancy and utilisation
- Sections: name, department, semester, strength, with capacity validation against rooms

### Timetable & Clash Engine

- Drag-and-drop weekly timetable builder with validation on every move, section / faculty / room filters, session detail editing, and duplicate-safe moves
- Deterministic clash engine: faculty, section / student-group, room/lab, subject allocation, availability, capacity, working-hour, break, and workload clashes — each with severity, affected sessions, clear explanation, and suggested resolution
- Clash Manager: every computed clash listed once, with Apply Suggested Slot (revalidated) and Delete Session actions
- Constraint-based automatic generator: ranked-slot solver (never random assignment), morning-first then fewer-gaps then balanced-days ranking, unplaced sessions always with a reason
- Lab batch note: rooms carry a type (Classroom/Lab) and capacity, so lab sessions are capacity-checked like any other session

### Student Tools, Versions & Analytics

- Personal Timetable Creator: named private timetables, start from your own section timetable as a read-only BASE (never editable here) or from blank, drag-and-drop for your own sessions, free-period list, CSV export. Student-only to edit; Admin/Faculty/Guest cannot edit personal sessions.
- Clash Checker: quick check for one proposed session, and bulk check for a whole section or the whole timetable, using the same engine — PASS only when no hard clash is found.
- CSV import (validated, per-line errors reported) for faculty, subjects, rooms, and sections; CSV export for the timetable and personal timetables; full-data JSON export
- Analytics from actual records only: counts, room utilisation, and per-faculty session load
- Demo institution, clearly labelled “Demo Campus”, loadable in one click, with one deliberate faculty clash to showcase detection. Start empty for your own institution.

### Experience

- Glass UI: floating bottom-centre Dock with 9 destinations (Overview, Timetable, Clash Manager, Auto Scheduler, Faculty, Rooms, Personal, Clash Checker, Settings), icons magnifying by transform only — the Dock shell never resizes
- Dark theme by default plus a polished light theme, with a theme toggle
- Living background: Canvas starfield with twinkling, drifting stars plus ambient light fields, behind all content, pointer-events none. It respects the operating system's reduced-motion preference and the in-app Living Background / Starfield / Reduced Motion toggles.
- Readable dropdowns everywhere: custom transparent glass listboxes (GlassSelect), never the white OS popup, with keyboard support (Arrow keys, Enter, Escape) and a check mark on the current value
- Accessibility: semantic HTML, keyboard navigation, visible focus, screen-reader labels on Dock buttons, and clash status never by colour alone (severity + text)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Plain HTML, CSS, and JavaScript — single-page app, no framework, no build step |
| Engine | `engine.js` — pure, deterministic clash / scheduling logic, testable in Node (`node test.js`) |
| UI | `app.js` — rendering, drag-and-drop, GlassSelect dropdowns, Canvas background |
| Storage | Browser `localStorage` under key `synchron-standalone-v1` — no server, no separate database |
| Export | CSV (timetable, personal timetables) and JSON (full data export) |
| Design system | Dark #0B0D12 / #101114, light #F5F5F4 / #FFFFFF, restrained blue/graphite accent |

What this standalone package does **not** claim: real email/Google auth, push/email delivery, payments, PDF/Excel export, a server database, multi-user sync, or payment-brand artwork. Roles are views with logic-level permissions in this browser only.

## Architecture

- **Validation in app logic, not just hidden buttons.** Admin-only guards block institutional creates/edits/deletes for other roles, and student-only guards block personal-timetable edits for other roles — the buttons are hidden/disabled *and* the handlers refuse.
- **Deterministic engine.** The same `checkSession` engine powers the builder, the personal creator, and the clash checker, so a pass or a clash is never invented.
- **Suggestions are revalidated.** A suggested free slot is checked again before it is applied; if it no longer passes, it is not applied.
- **Records own the numbers.** Analytics, workload, room utilisation, and clash counts are computed from actual stored records, not placeholders.

## Project Structure

```
.
├── index.html                  # Single-page app shell (all 9 views, Dock, header)
├── styles.css                  # Glass UI, dark/light themes, Dock, glass dropdowns
├── engine.js                   # Pure clash + scheduling engine (browser + Node)
├── app.js                      # UI, storage, drag-and-drop, GlassSelect, background
├── test.js                     # Node tests for engine.js (node test.js)
├── README.md                   # this file
├── LICENSE                     # MIT, Saby
├── package.json                # metadata only — no dependencies, no build step
├── .gitignore
└── docs/
    └── screenshots/            # Live standalone-app screenshots (see its README)
```

## Getting Started

No installation, no build, no database server.

**Option A — just open it (fastest):**

```bash
# Download / clone, then open the file in any modern browser:
open index.html
# (or double-click index.html)
```

Note: opening via `file://` works for this app because it uses only local scripts, styles, and `localStorage`. If your browser blocks `localStorage` on `file://`, use Option B.

**Option B — serve the folder statically (recommended):**

```bash
# Python (already installed on most machines)
python3 -m http.server 8000
# then open http://localhost:8000

# or, with Node's static server if you have it
npx serve .
```

**Then:**

1. Start empty for your own institution, or click **Load demo institution** for the clearly labelled Demo Campus.
2. Add departments, faculty, subjects, rooms, and sections (Faculty view), or import them by CSV.
3. Set institution details in Settings (periods, start time, lunch period).
4. Build timetables in the Timetable Builder, check them in Clash Manager, or generate candidates in Auto Scheduler and apply only after preview.
5. As a Student, use Personal Timetable and Clash Checker — no admin gate.

**Run the tests (optional, needs Node only):**

```bash
node test.js
# All engine tests passed.
```

## Default roles

| Role | Access in this standalone version |
| --- | --- |
| Admin | Full institutional editing and publishing (apply auto-schedule, delete, settings) |
| Faculty | Read-only view of institutional data; timetable filters show own sessions |
| Student | Own section timetable (read-only base) + private personal timetables + clash checker; the only role that can edit personal sessions |
| Guest | Read-only view |

⚠️ Role views are not real authentication in this build. Do not use them as a security boundary for sensitive institutional data without adding real auth first. Data is stored in the current browser only — it does not sync to other devices.

## Environment Variables

None. This standalone app has no `.env` file, no MySQL setup, and no payment keys. There is nothing secret to configure, and nothing secret is committed.

## API / App Actions Reference

There is no server API in this package. The app's internal actions, all in-browser, are:

- Timetable entries: create, move (drag-and-drop, revalidated), edit, delete, validate-move (`checkSession`)
- People and places: add/delete department, faculty, subject, room, section
- Scheduling: auto-generate for a section (`autoSchedule`), get ranked resolutions (`findSuggestion`), apply a suggestion
- Personal: create timetable, copy section base (read-only), add/delete own sessions, export personal CSV, list free periods (`freePeriods`)
- Checker: quick check, bulk check by section, bulk check whole timetable
- State: full app state saved to `localStorage` (`synchron-standalone-v1`), exported as JSON; demo seed (`demoData`)
- Engine (Node-testable): `checkSession`, `hardClashes`, `findSuggestion`, `computeAllClashes`, `freePeriods`, `autoSchedule`, `demoData`

## Deployment

- **Static hosting (recommended):** upload this folder to any static host (GitHub Pages, Netlify, Vercel static, Nginx, or any file server). No server code runs, so no database or backend deploy is needed.
- **GitHub Pages:** push this folder to a repository, enable Pages from the main branch / root, and the app is live at your Pages URL.
- **Checklist before any wider launch:** confirm the Dock works on the target device, confirm student personal-timetable and clash-checker flows, confirm every Dock destination, and confirm analytics numbers match actual records. Report anything unsettled honestly instead of launching a partial or decorative version.

## Security

- Role permissions enforced in app logic, not just by hiding buttons.
- Personal timetables are private to that timetable in this browser; institutional sessions cannot be edited from the personal view.
- Input validation and revalidation on every timetable change; no change bypasses the clash engine.
- No secrets, passwords, API keys, or personal financial details are included in this package or in the app's branding. There is no payment-brand artwork and no personal card details anywhere in the app.
- Data stays in the user's browser. Clearing browser storage clears the app's data — export CSV/JSON first if you need a backup.

Found a vulnerability? Please open a private security advisory on GitHub rather than a public issue.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Background looks still / animations frozen | Check the in-app Reduced Motion toggle and the Living Background / Starfield toggles in Settings, then the OS reduced-motion setting. |
| Cards flash transparent on Dock tab switch | The standalone views are opaque panels by design. If a specific view flashes, report that view and browser. |
| Dropdown names unreadable / white menu | All dropdowns use the custom glass listbox. If a specific chooser still shows a white OS menu, report that chooser by name — no native `<select>` should remain. |
| Dock grows/shrinks on hover | The Dock shell is fixed-size; only icons scale by transform. If the shell itself moves, report the viewport width and browser. |
| Data disappeared | It lives in this browser's `localStorage` only. A different browser, profile, or cleared storage starts empty — use Export all data (JSON) for backups. |
| Analytics numbers look wrong | Check them against actual records first — analytics are computed from records, never invented. |

## Roadmap

- Real authentication and multi-user sync (currently role views + single-browser storage)
- Server database and shared institutional data (currently localStorage only)
- PDF/Excel export (currently CSV + JSON)
- Email/push delivery (currently none)
- Day/Week/Month/Semester tab strip in the builder (currently a weekly grid)
- Compare slider in clash resolution and generator candidates
- Substitutions workflow, change requests, versioning, and academic calendar as full modules (currently covered by the core builder / checker / auto-scheduler flows)

## Contributing

Contributions are welcome — maintained by @sabynextdoor.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Commit with a clear message: `git commit -m "feat: add my feature"`.
4. Push and open a Pull Request.
5. Please keep PRs focused, match the existing style, and never commit secrets (`.env` files are git-ignored, and this app needs none).

Maintainer: @sabynextdoor · Contributors: add yourself by opening a pull request.

## Author

Saby — design, engineering and architecture.

- GitHub: @sabynextdoor
- Project: SYNCHRON (Standalone)

This project is watermarked for authorship. Runtime and build layers carry a hidden creator signature (`SYNCHRON-STANDALONE|Crafted-by-Saby|sabynextdoor|2026`), the app carries a faint on-screen mark (“Crafted by Saby · SYNCHRON”), and the code carries a header comment. Please keep the watermark and attribution intact if you fork it.

## Changelog

- **1.0.0 — Standalone release:** working timetable builder, deterministic clash engine, personal timetable creator, clash checker, ranked-slot auto-scheduler, role views, demo institution, glass UI with fixed-shell Dock, living background, readable glass dropdowns, CSV/JSON export, and Node engine tests.

## License

Released under the MIT License — see LICENSE for details.

Built with care by Saby · © 2026 SYNCHRON

## Deploy on Vercel

This is a static site — no build step, no server code.

- Import the GitHub repo `sabynextdoor/SYNCHRON` into Vercel.
- Framework Preset: Other. Build Command: (none). Output Directory: (root, `.`).
- Or deploy the folder directly: `vercel` from this folder (static).
- The live site serves `index.html` at the root, with `styles.css`, `app.js`, and `engine.js` alongside it. Data stays in the visitor's browser localStorage.
