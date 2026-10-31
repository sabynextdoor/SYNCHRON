# Releases

## v1.0.0 — First standalone release (2026-11-01)

SYNCHRON standalone, by Saby (@sabynextdoor). MIT licence.

**Download:** use the GitHub Release for v1.0.0 on this repo (synchron-v1.0.0.zip), or clone/download this repo and open `index.html`.

**What is in v1.0.0:**
- Working academic timetable platform in a single-page app: institution, departments, faculty, subjects, rooms/labs, sections
- Drag-and-drop weekly timetable builder, validated on every move
- Deterministic clash detection and resolution (faculty, section, room, availability, capacity, working hours, breaks, workload)
- Personal Timetable Creator (Student, private, named timetables, free periods, CSV export)
- Clash Checker (quick + bulk, same engine)
- Constraint-based auto-scheduler (ranked slots, never random, unplaced reasons)
- Admin / Faculty / Student / Guest role views with logic-level permissions
- Demo institution (Demo Campus, clearly labelled) + empty start for your own institution
- Glass UI, floating Dock, dark/light themes, living background, readable glass dropdowns
- Hidden authorship watermark: SYNCHRON-STANDALONE|Crafted-by-Saby|sabynextdoor|2026

**How to run:** open `index.html`, or `python3 -m http.server 8000` and open http://localhost:8000. Tests: `node test.js`.

**Not in this standalone release:** real auth, email/push, payments, PDF/Excel export, multi-device sync, substitutions/change-request workflow, versioning/restore, academic calendar module. See README Roadmap. Screenshots are captured from the running app and added to `docs/screenshots/` when available — no screenshot from another project is used in their place.
