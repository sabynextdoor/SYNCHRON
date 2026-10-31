/* SYNCHRON — Standalone Timetable Engine
 * Crafted by Saby · https://github.com/sabynextdoor
 * Hidden authorship watermark: see SYNCHRON_SIGNATURE below. Do not remove.
 * Pure logic, no DOM. Works in a browser (window.SynchronEngine) and in Node (module.exports).
 * No payment-brand artwork, no personal card details, no real auth, no email, no payments.
 */
(function (global) {
  'use strict';
  var SYNCHRON_SIGNATURE = 'SYNCHRON-STANDALONE|Crafted-by-Saby|sabynextdoor|2026';
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  function timeForPeriod(settings, period) {
    var start = settings.startTime || '09:00';
    var dur = settings.periodMinutes || 60;
    var parts = start.split(':').map(Number);
    var mins = parts[0] * 60 + parts[1] + (period - 1) * dur;
    var h = String(Math.floor(mins / 60) % 24).padStart(2, '0');
    var m = String(mins % 60).padStart(2, '0');
    return h + ':' + m;
  }
  function periodLabel(settings, period) {
    return 'P' + period + ' · ' + timeForPeriod(settings, period);
  }
  function byId(list, id) { return (list || []).find(function (x) { return x.id === id; }) || null; }

  // Deterministic clash check. candidate: {subjectId,facultyId,roomId,sectionId,day,period}
  // sessions: existing institutional sessions. Returns [{type,severity,message,suggestion}]
  function checkSession(candidate, sessions, ctx) {
    var out = [];
    var settings = ctx.settings || {};
    var faculty = byId(ctx.faculty, candidate.facultyId);
    var room = byId(ctx.rooms, candidate.roomId);
    var section = byId(ctx.sections, candidate.sectionId);
    var subject = byId(ctx.subjects, candidate.subjectId);
    var periodsPerDay = settings.periodsPerDay || 6;
    if (!candidate.day || !DAYS.includes(candidate.day)) {
      out.push({ type: 'working-hours', severity: 'Critical', message: 'No valid day selected.', suggestion: 'Choose Mon–Fri.' });
    }
    if (!candidate.period || candidate.period < 1 || candidate.period > periodsPerDay) {
      out.push({ type: 'working-hours', severity: 'Critical', message: 'Period is outside working hours (1–' + periodsPerDay + ').', suggestion: 'Choose a period between 1 and ' + periodsPerDay + '.' });
    }
    if (settings.lunchPeriod && candidate.period === settings.lunchPeriod) {
      out.push({ type: 'break', severity: 'High', message: 'Period ' + candidate.period + ' is the lunch break.', suggestion: 'Move to a period other than ' + settings.lunchPeriod + '.' });
    }
    if (faculty && (faculty.unavailableDays || []).includes(candidate.day)) {
      out.push({ type: 'availability', severity: 'High', message: (faculty.name || 'Faculty') + ' is unavailable on ' + candidate.day + '.', suggestion: 'Choose another day, or another faculty member.' });
    }
    if (section && room && section.strength && room.capacity && section.strength > room.capacity) {
      out.push({ type: 'capacity', severity: 'High', message: 'Section strength (' + section.strength + ') exceeds room capacity (' + room.capacity + ').', suggestion: 'Use a larger room or split the section into batches.' });
    }
    if (subject && subject.facultyId && candidate.facultyId && subject.facultyId !== candidate.facultyId) {
      out.push({ type: 'subject-allocation', severity: 'Medium', message: 'Subject ' + (subject.code || subject.name) + ' is assigned to a different faculty member.', suggestion: 'Use the assigned faculty member, or reassign the subject first.' });
    }
    (sessions || []).forEach(function (s) {
      if (candidate.id && s.id === candidate.id) return;
      if (s.day !== candidate.day || s.period !== candidate.period) return;
      if (candidate.facultyId && s.facultyId === candidate.facultyId) {
        out.push({ type: 'faculty', severity: 'Critical', message: 'Faculty clash: ' + (faculty ? faculty.name : 'faculty') + ' is already teaching ' + (byId(ctx.subjects, s.subjectId) || {}).name + ' at ' + candidate.day + ' ' + periodLabel(settings, candidate.period) + '.', suggestion: 'Move this session or the existing session to a free slot.' });
      }
      if (candidate.sectionId && s.sectionId === candidate.sectionId) {
        out.push({ type: 'section', severity: 'Critical', message: 'Section clash: ' + (section ? section.name : 'section') + ' already has a session at ' + candidate.day + ' ' + periodLabel(settings, candidate.period) + '.', suggestion: 'Move this session to a free period for this section.' });
      }
      if (candidate.roomId && s.roomId === candidate.roomId) {
        out.push({ type: 'room', severity: 'Critical', message: 'Room clash: ' + (room ? room.name : 'room') + ' is already booked at ' + candidate.day + ' ' + periodLabel(settings, candidate.period) + '.', suggestion: 'Use another room or move to a free slot.' });
      }
    });
    if (faculty && faculty.maxLoad) {
      var load = (sessions || []).filter(function (s) { return s.facultyId === candidate.facultyId && !(candidate.id && s.id === candidate.id); }).length;
      if (load + 1 > faculty.maxLoad) {
        out.push({ type: 'workload', severity: 'Warning', message: 'Workload: ' + faculty.name + ' would exceed the weekly limit (' + faculty.maxLoad + ' sessions).', suggestion: 'Assign another faculty member or raise the workload limit in Faculty settings.' });
      }
    }
    // Deduplicate by type+message, keep order deterministic.
    var seen = {}, deduped = [];
    out.forEach(function (c) { var k = c.type + '|' + c.message; if (!seen[k]) { seen[k] = true; deduped.push(c); } });
    return deduped;
  }

  function hardClashes(clashes) {
    return clashes.filter(function (c) { return c.severity === 'Critical' || c.severity === 'High'; });
  }

  // First free slot (day, then period) with no hard clash. Deterministic, never random.
  function findSuggestion(candidate, sessions, ctx) {
    var settings = ctx.settings || {};
    var periods = settings.periodsPerDay || 6;
    for (var d = 0; d < DAYS.length; d++) {
      for (var p = 1; p <= periods; p++) {
        if (settings.lunchPeriod && p === settings.lunchPeriod) continue;
        var trial = Object.assign({}, candidate, { day: DAYS[d], period: p });
        if (hardClashes(checkSession(trial, sessions, ctx)).length === 0) {
          return { day: DAYS[d], period: p };
        }
      }
    }
    return null;
  }

  function computeAllClashes(sessions, ctx) {
    var found = [];
    (sessions || []).forEach(function (s, i) {
      var others = sessions.filter(function (_, j) { return j !== i; });
      checkSession(s, others, ctx).forEach(function (c) {
        // Only report pairwise clashes once per pair/type in the manager view.
        if (c.type === 'faculty' || c.type === 'section' || c.type === 'room') {
          found.push({ sessionId: s.id, type: c.type, severity: c.severity, message: c.message, suggestion: c.suggestion, day: s.day, period: s.period });
        }
      });
    });
    // De-duplicate symmetric pairs: same type/day/period/message reversed is the same clash.
    var seen = {}, out = [];
    found.forEach(function (f) {
      var k = f.type + '|' + f.day + '|' + f.period;
      if (!seen[k]) { seen[k] = true; out.push(f); }
    });
    return out;
  }

  function freePeriods(sectionId, sessions, ctx) {
    var settings = ctx.settings || {};
    var periods = settings.periodsPerDay || 6;
    var out = [];
    DAYS.forEach(function (day) {
      for (var p = 1; p <= periods; p++) {
        if (settings.lunchPeriod && p === settings.lunchPeriod) continue;
        var busy = (sessions || []).some(function (s) { return s.sectionId === sectionId && s.day === day && s.period === p; });
        if (!busy) out.push({ day: day, period: p });
      }
    });
    return out;
  }

  // Constraint-based ranked-slot auto-scheduler. Deterministic: subjects in input
  // order, days Mon->Fri, periods in ranked order (morning first, then fewer gaps,
  // then balanced days). Never random. Returns {placed, unplaced}.
  function autoSchedule(request, ctx) {
    var sessions = (ctx.sessions || []).slice();
    var placed = [], unplaced = [];
    var settings = ctx.settings || {};
    var periods = settings.periodsPerDay || 6;
    // Score a slot: lower is better. Morning first, then days with fewer sessions for that section, then fewer gaps.
    function score(day, period, sectionId) {
      var dayCount = sessions.filter(function (s) { return s.sectionId === sectionId && s.day === day; }).length;
      return period * 10 + dayCount * 5;
    }
    (request.jobs || []).forEach(function (job) {
      var needed = job.hoursPerWeek || 1;
      var done = 0;
      for (var n = 0; n < needed; n++) {
        var slots = [];
        DAYS.forEach(function (day) {
          for (var p = 1; p <= periods; p++) {
            if (settings.lunchPeriod && p === settings.lunchPeriod) continue;
            slots.push({ day: day, period: p, score: score(day, p, job.sectionId) });
          }
        });
        slots.sort(function (a, b) { return a.score - b.score || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period; });
        var chosen = null;
        for (var i = 0; i < slots.length; i++) {
          var cand = { subjectId: job.subjectId, facultyId: job.facultyId, roomId: job.roomId, sectionId: job.sectionId, day: slots[i].day, period: slots[i].period };
          if (hardClashes(checkSession(cand, sessions, ctx)).length === 0) { chosen = slots[i]; break; }
        }
        if (chosen) {
          var s = { id: 'auto-' + job.sectionId + '-' + job.subjectId + '-' + done + '-' + Date.now(), subjectId: job.subjectId, facultyId: job.facultyId, roomId: job.roomId, sectionId: job.sectionId, day: chosen.day, period: chosen.period, type: 'Theory', auto: true };
          sessions.push(s); placed.push(s); done++;
        }
      }
      if (done < needed) {
        unplaced.push({ subjectId: job.subjectId, sectionId: job.sectionId, needed: needed, placed: done, reason: 'No free slot remained that satisfies faculty, section, room, capacity and break rules for the remaining ' + (needed - done) + ' session(s). Try a larger room, another faculty member, or more periods per day.' });
      }
    });
    return { placed: placed, unplaced: unplaced, allSessions: sessions };
  }

  function demoData() {
    return {
      settings: { name: 'Demo Campus', year: '2026–27', periodsPerDay: 6, periodMinutes: 60, startTime: '09:00', lunchPeriod: 4 },
      departments: [
        { id: 'd-cse', name: 'Computer Science', code: 'CSE' },
        { id: 'd-ece', name: 'Electronics', code: 'ECE' }
      ],
      faculty: [
        { id: 'f-rao', name: 'Dr. Ananya Rao', deptId: 'd-cse', maxLoad: 12, unavailableDays: ['Fri'] },
        { id: 'f-shah', name: 'Dr. Kavita Shah', deptId: 'd-cse', maxLoad: 12, unavailableDays: [] },
        { id: 'f-nair', name: 'Dr. Meera Nair', deptId: 'd-ece', maxLoad: 10, unavailableDays: ['Mon'] }
      ],
      subjects: [
        { id: 's-cs501', code: 'CS501', name: 'Data Structures', credits: 4, hoursPerWeek: 4, deptId: 'd-cse', facultyId: 'f-rao' },
        { id: 's-cs502', code: 'CS502', name: 'Operating Systems', credits: 4, hoursPerWeek: 3, deptId: 'd-cse', facultyId: 'f-shah' },
        { id: 's-ec501', code: 'EC501', name: 'Digital Circuits', credits: 3, hoursPerWeek: 3, deptId: 'd-ece', facultyId: 'f-nair' }
      ],
      rooms: [
        { id: 'r-cr204', name: 'CR-204', building: 'Main', capacity: 60, type: 'Classroom' },
        { id: 'r-cr205', name: 'CR-205', building: 'Main', capacity: 60, type: 'Classroom' },
        { id: 'r-lab1', name: 'Lab-1', building: 'Annex', capacity: 30, type: 'Lab' }
      ],
      sections: [
        { id: 'sec-csea', name: 'CSE-A', deptId: 'd-cse', semester: 5, strength: 55 },
        { id: 'sec-cseb', name: 'CSE-B', deptId: 'd-cse', semester: 5, strength: 52 },
        { id: 'sec-ecea', name: 'ECE-A', deptId: 'd-ece', semester: 5, strength: 48 }
      ],
      sessions: [
        { id: 'e1', subjectId: 's-cs501', facultyId: 'f-rao', roomId: 'r-cr204', sectionId: 'sec-csea', day: 'Mon', period: 1, type: 'Theory' },
        { id: 'e2', subjectId: 's-cs502', facultyId: 'f-shah', roomId: 'r-cr205', sectionId: 'sec-csea', day: 'Mon', period: 2, type: 'Theory' },
        { id: 'e3', subjectId: 's-ec501', facultyId: 'f-nair', roomId: 'r-cr204', sectionId: 'sec-ecea', day: 'Tue', period: 1, type: 'Theory' },
        // Deliberate demo clash: Dr. Rao is double-booked Mon P1 — shown in Clash Manager.
        { id: 'e4', subjectId: 's-cs501', facultyId: 'f-rao', roomId: 'r-cr205', sectionId: 'sec-cseb', day: 'Mon', period: 1, type: 'Theory' }
      ]
    };
  }

  var api = { SYNCHRON_SIGNATURE: SYNCHRON_SIGNATURE, DAYS: DAYS, timeForPeriod: timeForPeriod, periodLabel: periodLabel, byId: byId, checkSession: checkSession, hardClashes: hardClashes, findSuggestion: findSuggestion, computeAllClashes: computeAllClashes, freePeriods: freePeriods, autoSchedule: autoSchedule, demoData: demoData };
  global.SynchronEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
