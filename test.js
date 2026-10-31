/* Node tests for the pure SYNCHRON engine. Run: node test.js */
const E = require('./engine.js');
const assert = require('assert');
const ctx = (() => { const d = E.demoData(); return { settings: d.settings, faculty: d.faculty, rooms: d.rooms, sections: d.sections, subjects: d.subjects, sessions: d.sessions }; })();
function hasType(list, t) { return list.some(c => c.type === t); }
// Faculty clash in demo (Dr Rao double-booked Mon P1)
let cl = E.checkSession({ subjectId: 's-cs502', facultyId: 'f-rao', roomId: 'r-lab1', sectionId: 'sec-ecea', day: 'Mon', period: 1 }, ctx.sessions, ctx);
assert(hasType(cl, 'faculty'), 'faculty clash expected');
// Section clash
cl = E.checkSession({ subjectId: 's-cs502', facultyId: 'f-shah', roomId: 'r-lab1', sectionId: 'sec-csea', day: 'Mon', period: 1 }, ctx.sessions, ctx);
assert(hasType(cl, 'section'), 'section clash expected');
// Room clash
cl = E.checkSession({ subjectId: 's-cs502', facultyId: 'f-shah', roomId: 'r-cr204', sectionId: 'sec-cseb', day: 'Mon', period: 1 }, ctx.sessions, ctx);
assert(hasType(cl, 'room'), 'room clash expected');
// Capacity: section 55 in Lab-1 (30)
cl = E.checkSession({ subjectId: 's-cs501', facultyId: 'f-shah', roomId: 'r-lab1', sectionId: 'sec-csea', day: 'Wed', period: 2 }, ctx.sessions, ctx);
assert(hasType(cl, 'capacity'), 'capacity clash expected');
// Break: lunch period 4
cl = E.checkSession({ subjectId: 's-cs501', facultyId: 'f-shah', roomId: 'r-cr205', sectionId: 'sec-csea', day: 'Wed', period: 4 }, ctx.sessions, ctx);
assert(hasType(cl, 'break'), 'break clash expected');
// Availability: Dr Rao unavailable Fri
cl = E.checkSession({ subjectId: 's-cs501', facultyId: 'f-rao', roomId: 'r-cr205', sectionId: 'sec-csea', day: 'Fri', period: 2 }, ctx.sessions, ctx);
assert(hasType(cl, 'availability'), 'availability clash expected');
// Free period passes with no hard clash
cl = E.checkSession({ subjectId: 's-cs502', facultyId: 'f-shah', roomId: 'r-cr205', sectionId: 'sec-csea', day: 'Wed', period: 2 }, ctx.sessions, ctx);
assert(E.hardClashes(cl).length === 0, 'free period should pass, got ' + JSON.stringify(cl));
// Suggestion finds a free slot
const sug = E.findSuggestion({ subjectId: 's-cs501', facultyId: 'f-rao', roomId: 'r-cr204', sectionId: 'sec-csea', day: 'Mon', period: 1 }, ctx.sessions, ctx);
assert(sug && sug.day && sug.period, 'suggestion expected');
// Auto-scheduler: deterministic, no hard clashes, no randomness (run twice, same result)
function runAuto() {
  return E.autoSchedule({ jobs: [{ subjectId: 's-cs502', facultyId: 'f-shah', roomId: 'r-cr205', sectionId: 'sec-cseb', hoursPerWeek: 2 }] }, { ...ctx, sessions: [] });
}
const a1 = runAuto(), a2 = runAuto();
assert(a1.placed.length === 2 && JSON.stringify(a1.placed.map(s => s.day + s.period)) === JSON.stringify(a2.placed.map(s => s.day + s.period)), 'auto-scheduler must be deterministic');
a1.placed.forEach(s => { assert(E.hardClashes(E.checkSession(s, a1.placed.filter(x => x.id !== s.id), ctx)).length === 0, 'auto-placed session must not clash'); });
// Free periods
const free = E.freePeriods('sec-csea', ctx.sessions, ctx);
assert(free.length > 0 && !free.some(f => f.day === 'Mon' && f.period === 1), 'free periods must exclude occupied Mon P1 for CSE-A');
console.log('All engine tests passed. Signature:', E.SYNCHRON_SIGNATURE);
