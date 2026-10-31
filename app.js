/* SYNCHRON Standalone UI — Crafted by Saby · https://github.com/sabynextdoor
 * Hidden authorship watermark: SYNCHRON-STANDALONE|Crafted-by-Saby|sabynextdoor|2026
 * Do not remove the signature constant or the faint on-screen mark in index.html.
 */
(function () {
  'use strict';
  var E = window.SynchronEngine;
  var SYNCHRON_SIGNATURE = E.SYNCHRON_SIGNATURE;
  window.__SYNCHRON_CRAFTED_BY__ = SYNCHRON_SIGNATURE;
  var KEY = 'synchron-standalone-v1';
  var uid = function (p) { return p + '-' + Math.random().toString(36).slice(2, 9); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var emptyState = function () {
    return { settings: { name: '', year: '2026–27', periodsPerDay: 6, periodMinutes: 60, startTime: '09:00', lunchPeriod: 4 }, departments: [], faculty: [], subjects: [], rooms: [], sections: [], sessions: [], personal: [], prefs: { livingBg: true, stars: true, reducedMotion: false, theme: 'dark' } };
  };
  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || emptyState(); } catch (e) { state = emptyState(); }
  if (!state.prefs) state.prefs = emptyState().prefs;
  if (!state.personal) state.personal = [];
  var role = 'Admin';
  var currentView = 'overview';
  var editingSessionId = null;
  var autoPreview = null;
  var currentPersonalId = null;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function ctx() { return { settings: state.settings, faculty: state.faculty, rooms: state.rooms, sections: state.sections, subjects: state.subjects, sessions: state.sessions }; }
  function toast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    var d = document.createElement('div'); d.textContent = msg; t.appendChild(d);
    setTimeout(function () { d.remove(); }, 4500);
  }
  function canEditInstitutional() { return role === 'Admin'; }
  function guardInstitutional() { if (!canEditInstitutional()) { toast('Only Admin can edit institutional data in this role view.'); return false; } return true; }
  function guardPersonal() { if (role !== 'Student') { toast('Personal timetables are student-only to edit. Switch role to Student.'); return false; } return true; }
  function nameOf(list, id) { var x = E.byId(list, id); return x ? (x.name || x.code || '') : ''; }
  function clashHtml(list) {
    if (!list.length) return '<span class="badge pass">✓ Pass — no clashes found</span>';
    return list.map(function (c) { return '<div style="margin:6px 0"><span class="badge ' + (c.severity === 'Critical' ? 'critical' : c.severity === 'High' ? 'high' : '') + '">' + esc(c.severity) + ' · ' + esc(c.type) + '</span> ' + esc(c.message) + ' <span class="muted">Suggestion: ' + esc(c.suggestion || '') + '</span></div>'; }).join('');
  }
  function download(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }
  function toCSV(rows) { return rows.map(function (r) { return r.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); }

  /* ---- Glass dropdown: custom in-page panel, never the white OS popup ---- */
  function glassSelect(container, options, value, ariaLabel) {
    container.innerHTML = '';
    var wrap = document.createElement('div'); wrap.className = 'gselect'; wrap.tabIndex = -1;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'gselect-btn'; btn.setAttribute('aria-label', ariaLabel || 'Choose');
    var panel = document.createElement('div'); panel.className = 'gselect-panel'; panel.setAttribute('role', 'listbox');
    var current = value;
    function render() {
      var sel = options.find(function (o) { return o.value === current; });
      btn.innerHTML = '<span>' + esc(sel ? sel.label : 'Choose…') + '</span><span aria-hidden="true">▾</span>';
      panel.innerHTML = '';
      options.forEach(function (o) {
        var d = document.createElement('div'); d.className = 'gselect-opt' + (o.value === current ? ' selected' : ''); d.setAttribute('role', 'option'); d.textContent = o.label;
        d.onclick = function (ev) { ev.stopPropagation(); current = o.value; wrap.classList.remove('open'); render(); wrap.dispatchEvent(new CustomEvent('change', { detail: current })); };
        panel.appendChild(d);
      });
    }
    btn.onclick = function (ev) { ev.stopPropagation(); document.querySelectorAll('.gselect.open').forEach(function (x) { if (x !== wrap) x.classList.remove('open'); }); wrap.classList.toggle('open'); };
    btn.onkeydown = function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); wrap.classList.add('open'); var first = panel.querySelector('.gselect-opt'); if (first) first.focus(); }
      if (ev.key === 'Escape') wrap.classList.remove('open');
    };
    document.addEventListener('click', function () { wrap.classList.remove('open'); });
    wrap.appendChild(btn); wrap.appendChild(panel); container.appendChild(wrap); render();
    return { get value() { return current; }, set value(v) { current = v; render(); }, element: wrap, onChange: function (fn) { wrap.addEventListener('change', function (e) { fn(e.detail); }); } };
  }
  function opts(list, labelFn, emptyLabel) {
    var out = [{ value: '', label: emptyLabel || 'Choose…' }];
    (list || []).forEach(function (x) { out.push({ value: x.id, label: labelFn(x) }); });
    return out;
  }
  function dayOpts() { return [{ value: '', label: 'Choose day…' }].concat(E.DAYS.map(function (d) { return { value: d, label: d }; })); }
  function periodOpts() { var n = state.settings.periodsPerDay || 6, out = [{ value: '', label: 'Choose period…' }]; for (var i = 1; i <= n; i++) out.push({ value: String(i), label: 'Period ' + i + ' · ' + E.timeForPeriod(state.settings, i) }); return out; }
  function typeOpts() { return [{ value: 'Theory', label: 'Theory' }, { value: 'Lab', label: 'Lab' }, { value: 'Tutorial', label: 'Tutorial' }, { value: 'Study', label: 'Study' }, { value: 'Personal', label: 'Personal' }, { value: 'Meeting', label: 'Meeting' }, { value: 'Exam', label: 'Exam' }]; }

  var selects = {};
  function mountSelects() {
    selects.role = glassSelect(document.getElementById('roleSelect'), [{ value: 'Admin', label: 'Admin' }, { value: 'Faculty', label: 'Faculty' }, { value: 'Student', label: 'Student' }, { value: 'Guest', label: 'Guest' }], role, 'Role');
    selects.role.onChange(function (v) { role = v; renderAll(); });
    selects.ttSection = glassSelect(document.getElementById('ttSection'), opts(state.sections, function (s) { return s.name; }, 'All sections'), selects.ttSection ? selects.ttSection.value : '');
    selects.ttFaculty = glassSelect(document.getElementById('ttFaculty'), opts(state.faculty, function (f) { return f.name; }, 'All faculty'), '');
    selects.ttRoom = glassSelect(document.getElementById('ttRoom'), opts(state.rooms, function (r) { return r.name; }, 'All rooms'), '');
    [selects.ttSection, selects.ttFaculty, selects.ttRoom].forEach(function (s) { if (s) s.onChange(renderTimetable); });
    selects.fSubject = glassSelect(document.getElementById('fSubject'), opts(state.subjects, function (s) { return s.code + ' — ' + s.name; }, 'Choose subject…'), '');
    selects.fFaculty = glassSelect(document.getElementById('fFaculty'), opts(state.faculty, function (f) { return f.name; }, 'Choose faculty…'), '');
    selects.fRoom = glassSelect(document.getElementById('fRoom'), opts(state.rooms, function (r) { return r.name; }, 'Choose room…'), '');
    selects.fSection = glassSelect(document.getElementById('fSection'), opts(state.sections, function (s) { return s.name; }, 'Choose section…'), '');
    selects.fDay = glassSelect(document.getElementById('fDay'), dayOpts(), '');
    selects.fPeriod = glassSelect(document.getElementById('fPeriod'), periodOpts(), '');
    selects.fType = glassSelect(document.getElementById('fType'), typeOpts(), 'Theory');
    selects.autoSection = glassSelect(document.getElementById('autoSection'), opts(state.sections, function (s) { return s.name; }, 'Choose section…'), '');
    selects.autoRoom = glassSelect(document.getElementById('autoRoom'), opts(state.rooms, function (r) { return r.name; }, 'Choose room…'), '');
    selects.importType = glassSelect(document.getElementById('importType'), [{ value: 'faculty', label: 'Faculty' }, { value: 'subject', label: 'Subject' }, { value: 'room', label: 'Room' }, { value: 'section', label: 'Section' }], 'faculty', 'Import type');
    selects.cSubject = glassSelect(document.getElementById('cSubject'), opts(state.subjects, function (s) { return s.code + ' — ' + s.name; }, 'Choose subject…'), '');
    selects.cFaculty = glassSelect(document.getElementById('cFaculty'), opts(state.faculty, function (f) { return f.name; }, 'Choose faculty…'), '');
    selects.cRoom = glassSelect(document.getElementById('cRoom'), opts(state.rooms, function (r) { return r.name; }, 'Choose room…'), '');
    selects.cSection = glassSelect(document.getElementById('cSection'), opts(state.sections, function (s) { return s.name; }, 'Choose section…'), '');
    selects.cDay = glassSelect(document.getElementById('cDay'), dayOpts(), '');
    selects.cPeriod = glassSelect(document.getElementById('cPeriod'), periodOpts(), '');
    selects.bulkSection = glassSelect(document.getElementById('bulkSection'), opts(state.sections, function (s) { return s.name; }, 'Choose section…'), '');
    selects.personalSelect = glassSelect(document.getElementById('personalSelect'), state.personal.map(function (p) { return { value: p.id, label: p.name }; }), currentPersonalId || (state.personal[0] ? state.personal[0].id : ''), 'Personal timetable');
    selects.personalSelect.onChange(function (v) { currentPersonalId = v; renderPersonal(); });
    selects.personalBase = glassSelect(document.getElementById('personalBase'), opts(state.sections, function (s) { return s.name; }, 'Choose section…'), '');
    selects.pDay = glassSelect(document.getElementById('pDay'), dayOpts(), '');
    selects.pPeriod = glassSelect(document.getElementById('pPeriod'), periodOpts(), '');
    selects.pType = glassSelect(document.getElementById('pType'), typeOpts(), 'Study');
  }

  /* ---- Living background: canvas stars + ambient lights, respects reduced motion ---- */
  function initBackground() {
    var canvas = document.getElementById('bgCanvas'); if (!canvas) return;
    var c = canvas.getContext('2d'); var stars = []; var running = true;
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    function seed() { stars = []; var n = Math.min(220, Math.floor(innerWidth / 7)); for (var i = 0; i < n; i++) stars.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 1.6 + .4, s: .2 + Math.random() * .8, tw: Math.random() * Math.PI * 2 }); }
    resize(); seed(); addEventListener('resize', function () { resize(); seed(); });
    var reduced = function () { return state.prefs.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches; };
    (function loop(t) {
      if (!running) return; requestAnimationFrame(loop);
      if (!state.prefs.livingBg || !state.prefs.stars) { c.clearRect(0, 0, canvas.width, canvas.height); return; }
      c.clearRect(0, 0, canvas.width, canvas.height);
      var now = (t || 0) / 1000;
      stars.forEach(function (st) {
        if (!reduced()) { st.y += st.s * .4; if (st.y > canvas.height) st.y = 0; }
        var a = .35 + .35 * Math.sin(now * 1.5 + st.tw);
        c.beginPath(); c.arc(st.x, st.y, st.r, 0, Math.PI * 2); c.fillStyle = 'rgba(220,230,245,' + a.toFixed(2) + ')'; c.fill();
      });
    })(0);
  }

  /* ---- Rendering ---- */
  function sessionCard(s, isBase, isPersonal) {
    var subj = E.byId(state.subjects, s.subjectId);
    var title = s.name || (subj ? subj.code + ' — ' + subj.name : 'Session');
    var draggable = !isBase && (canEditInstitutional() || (isPersonal && role === 'Student'));
    return '<div class="session' + (isBase ? ' base' : '') + '" draggable="' + (draggable ? 'true' : 'false') + '" data-id="' + esc(s.id) + '">' +
      '<div class="t">' + esc(title) + (isBase ? ' <span class="badge base">BASE · READ-ONLY</span>' : '') + '</div>' +
      '<div class="muted">' + esc(s.facultyName || nameOf(state.faculty, s.facultyId) || s.host || '') + ' · ' + esc(s.roomName || nameOf(state.rooms, s.roomId) || s.room || '') + ' · ' + esc(s.type || '') + '</div>' +
      '<div class="muted">' + (isBase ? 'Section base' : 'Click to edit') + '</div></div>';
  }
  function gridHtml(sessions, opts2) {
    var periods = state.settings.periodsPerDay || 6;
    var html = '<table><thead><tr><th>Day / Period</th>';
    for (var p = 1; p <= periods; p++) html += '<th>' + E.periodLabel(state.settings, p) + (state.settings.lunchPeriod === p ? ' (Lunch)' : '') + '</th>';
    html += '</tr></thead><tbody>';
    E.DAYS.forEach(function (day) {
      html += '<tr><th>' + day + '</th>';
      for (var pp = 1; pp <= periods; pp++) {
        var cell = sessions.filter(function (s) { return s.day === day && s.period === pp; });
        html += '<td><div class="cell" data-day="' + day + '" data-period="' + pp + '">' + cell.map(function (s) { return sessionCard(s, opts2 && opts2.baseIds && opts2.baseIds.has(s.id), opts2 && opts2.isPersonal); }).join('') + '</div></td>';
      }
      html += '</tr>';
    });
    return html + '</tbody></table>';
  }
  function renderOverview() {
    var clashes = E.computeAllClashes(state.sessions, ctx());
    document.getElementById('instLabel').textContent = (state.settings.name || 'No institution yet') + ' · Standalone · localStorage · no server';
    document.getElementById('stats').innerHTML = [
      ['Faculty', state.faculty.length], ['Subjects', state.subjects.length], ['Rooms', state.rooms.length], ['Sections', state.sections.length], ['Sessions', state.sessions.length], ['Clashes', clashes.length]
    ].map(function (x) { return '<div class="card stat"><span class="muted">' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('');
    document.getElementById('overviewDetail').innerHTML = state.sessions.length ? state.sessions.slice(0, 6).map(function (s) {
      var subj = E.byId(state.subjects, s.subjectId);
      return '<div>' + esc(s.day) + ' ' + E.periodLabel(state.settings, s.period) + ' — ' + esc(subj ? subj.name : 'Session') + ' · ' + esc(nameOf(state.sections, s.sectionId)) + '</div>';
    }).join('') + '<p class="muted">' + clashes.length + ' clash(es) currently in the timetable. Open Clash Manager for explanations and suggested fixes.</p>' : '<p class="muted">No sessions yet. Load the demo institution, or add faculty, subjects, rooms and sections, then build a timetable.</p>';
    var totalSlots = E.DAYS.length * (state.settings.periodsPerDay || 6) * Math.max(1, state.rooms.length);
    var util = totalSlots ? Math.round(state.sessions.length / totalSlots * 100) : 0;
    document.getElementById('analytics').innerHTML = '<p>Room utilisation (sessions ÷ available day-period-room slots): <b>' + util + '%</b></p>' +
      state.faculty.map(function (f) { var n = state.sessions.filter(function (s) { return s.facultyId === f.id; }).length; return '<div>' + esc(f.name) + ': ' + n + ' session(s)' + (f.maxLoad ? ' / limit ' + f.maxLoad : '') + '</div>'; }).join('') || '<p class="muted">Add faculty and sessions to see analytics.</p>';
  }
  function renderTimetable() {
    var list = state.sessions.slice();
    if (selects.ttSection && selects.ttSection.value) list = list.filter(function (s) { return s.sectionId === selects.ttSection.value; });
    if (selects.ttFaculty && selects.ttFaculty.value) list = list.filter(function (s) { return s.facultyId === selects.ttFaculty.value; });
    if (selects.ttRoom && selects.ttRoom.value) list = list.filter(function (s) { return s.roomId === selects.ttRoom.value; });
    document.getElementById('ttGrid').innerHTML = gridHtml(list, {});
    document.getElementById('sessionFormNote').textContent = canEditInstitutional() ? 'Admin editing is on for this role.' : 'Read-only for this role — switch to Admin to edit institutional sessions.';
    bindGrid(document.getElementById('ttGrid'), false);
  }
  function bindGrid(container, isPersonal) {
    container.querySelectorAll('.session').forEach(function (el) {
      el.addEventListener('dragstart', function (ev) { ev.dataTransfer.setData('text/plain', el.dataset.id); });
      el.addEventListener('click', function () {
        if (isPersonal) return;
        var s = E.byId(state.sessions, el.dataset.id); if (!s || !canEditInstitutional()) return;
        editingSessionId = s.id;
        selects.fSubject.value = s.subjectId; selects.fFaculty.value = s.facultyId; selects.fRoom.value = s.roomId; selects.fSection.value = s.sectionId; selects.fDay.value = s.day; selects.fPeriod.value = String(s.period); selects.fType.value = s.type || 'Theory';
        document.getElementById('sessionResult').innerHTML = '<span class="muted">Editing session ' + esc(s.id) + '. Change day/period and save — it will be revalidated.</span>';
        document.getElementById('sessionForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    container.querySelectorAll('.cell').forEach(function (cell) {
      cell.addEventListener('dragover', function (ev) { ev.preventDefault(); cell.classList.add('drop'); });
      cell.addEventListener('dragleave', function () { cell.classList.remove('drop'); });
      cell.addEventListener('drop', function (ev) {
        ev.preventDefault(); cell.classList.remove('drop');
        var id = ev.dataTransfer.getData('text/plain');
        if (isPersonal) { movePersonal(id, cell.dataset.day, Number(cell.dataset.period)); return; }
        if (!guardInstitutional()) return;
        var s = E.byId(state.sessions, id); if (!s) return;
        var cand = Object.assign({}, s, { day: cell.dataset.day, period: Number(cell.dataset.period) });
        var cl = E.hardClashes(E.checkSession(cand, state.sessions, ctx()));
        if (cl.length) { toast('Move rejected: ' + cl[0].message); document.getElementById('sessionResult').innerHTML = clashHtml(cl); return; }
        Object.assign(s, { day: cell.dataset.day, period: Number(cell.dataset.period) }); save(); renderAll(); toast('Session moved and revalidated.');
      });
    });
  }
  function renderClash() {
    var list = E.computeAllClashes(state.sessions, ctx());
    var el = document.getElementById('clashList');
    if (!list.length) { el.innerHTML = '<div class="card"><span class="badge pass">✓ Pass — no faculty, section or room clashes in the timetable.</span></div>'; return; }
    el.innerHTML = list.map(function (c, i) {
      var s = E.byId(state.sessions, c.sessionId);
      var sug = s ? E.findSuggestion(s, state.sessions, ctx()) : null;
      return '<div class="card"><span class="badge critical">' + esc(c.severity) + ' · ' + esc(c.type) + '</span> ' + esc(c.message) +
        '<div class="muted">Suggestion: ' + esc(c.suggestion || '') + (sug ? ' — first free slot: ' + sug.day + ' Period ' + sug.period : ' — no free slot found') + '</div>' +
        '<div class="row" style="margin-top:8px">' +
        (sug && canEditInstitutional() ? '<button type="button" data-apply="' + i + '">Apply suggested slot</button>' : '') +
        (canEditInstitutional() ? '<button type="button" class="danger" data-del="' + c.sessionId + '">Delete session</button>' : '') + '</div></div>';
    }).join('');
    el.querySelectorAll('[data-apply]').forEach(function (b) { b.onclick = function () {
      var c = list[Number(b.dataset.apply)]; var s = E.byId(state.sessions, c.sessionId); var sug = E.findSuggestion(s, state.sessions, ctx());
      if (!sug) return; var cand = Object.assign({}, s, sug);
      if (E.hardClashes(E.checkSession(cand, state.sessions, ctx())).length) { toast('Suggested slot no longer passes validation.'); return; }
      Object.assign(s, sug); save(); renderAll(); toast('Suggested slot applied and revalidated.');
    }; });
    el.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!guardInstitutional()) return; state.sessions = state.sessions.filter(function (s) { return s.id !== b.dataset.del; }); save(); renderAll(); toast('Session deleted.'); }; });
  }
  function renderEntities() {
    function table(list, cols, delFn) {
      if (!list.length) return '<p class="muted">None yet.</p>';
      return '<table><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
        list.map(function (x) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(x[c] == null ? '' : x[c]) + '</td>'; }).join('') + '<td>' + (canEditInstitutional() ? '<button type="button" data-del="' + x.id + '">Delete</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
    }
    function bind(elId, list, delFn) {
      var el = document.getElementById(elId); el.innerHTML = table(list, Object.keys(list[0] || {}).filter(function (k) { return k !== 'id' && k !== 'unavailableDays' && k !== 'deptId' && k !== 'facultyId'; }), delFn);
      el.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!guardInstitutional()) return; delFn(b.dataset.del); save(); renderAll(); }; });
    }
    // Simpler readable lists (avoid exposing internal ids as columns)
    document.getElementById('facultyList').innerHTML = state.faculty.map(function (f) { return '<div class="row"><span>' + esc(f.name) + ' · ' + esc(f.dept || '') + ' · limit ' + esc(f.maxLoad) + '</span>' + (canEditInstitutional() ? '<button type="button" data-del="' + f.id + '">Delete</button>' : '') + '</div>'; }).join('') || '<p class="muted">None yet.</p>';
    document.getElementById('subjectList').innerHTML = state.subjects.map(function (s) { return '<div class="row"><span>' + esc(s.code) + ' — ' + esc(s.name) + ' · ' + esc(s.hoursPerWeek) + ' hrs/week</span>' + (canEditInstitutional() ? '<button type="button" data-del="' + s.id + '">Delete</button>' : '') + '</div>'; }).join('') || '<p class="muted">None yet.</p>';
    document.getElementById('roomList').innerHTML = state.rooms.map(function (r) { return '<div class="row"><span>' + esc(r.name) + ' · capacity ' + esc(r.capacity) + '</span>' + (canEditInstitutional() ? '<button type="button" data-del="' + r.id + '">Delete</button>' : '') + '</div>'; }).join('') || '<p class="muted">None yet.</p>';
    document.getElementById('sectionList').innerHTML = state.sections.map(function (s) { return '<div class="row"><span>' + esc(s.name) + ' · strength ' + esc(s.strength) + '</span>' + (canEditInstitutional() ? '<button type="button" data-del="' + s.id + '">Delete</button>' : '') + '</div>'; }).join('') || '<p class="muted">None yet.</p>';
    document.getElementById('deptList').innerHTML = state.departments.map(function (d) { return '<div class="row"><span>' + esc(d.name) + ' (' + esc(d.code) + ')</span>' + (canEditInstitutional() ? '<button type="button" data-del="' + d.id + '">Delete</button>' : '') + '</div>'; }).join('') || '<p class="muted">None yet.</p>';
    [['facultyList', 'faculty'], ['subjectList', 'subjects'], ['roomList', 'rooms'], ['sectionList', 'sections'], ['deptList', 'departments']].forEach(function (pair) {
      document.getElementById(pair[0]).querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!guardInstitutional()) return; state[pair[1]] = state[pair[1]].filter(function (x) { return x.id !== b.dataset.del; }); save(); renderAll(); }; });
    });
    document.getElementById('roomUtil').innerHTML = state.rooms.map(function (r) {
      var n = state.sessions.filter(function (s) { return s.roomId === r.id; }).length;
      var total = E.DAYS.length * (state.settings.periodsPerDay || 6);
      return '<div class="card"><b>' + esc(r.name) + '</b> — ' + n + ' / ' + total + ' slots used (' + Math.round(n / total * 100) + '%) · capacity ' + esc(r.capacity) + '</div>';
    }).join('') || '<p class="muted">No rooms yet.</p>';
  }
  function renderPersonal() {
    var p = state.personal.find(function (x) { return x.id === currentPersonalId; }) || state.personal[0] || null;
    if (!p) { document.getElementById('personalGrid').innerHTML = '<p class="muted">No personal timetable yet. Create one above, then copy a section base or add your own sessions.</p>'; document.getElementById('personalFree').innerHTML = '<p class="muted">—</p>'; return; }
    currentPersonalId = p.id;
    var base = state.sessions.filter(function (s) { return s.sectionId === p.sectionId; });
    var baseIds = new Set(base.map(function (s) { return s.id; }));
    var all = base.map(function (s) { return Object.assign({}, s, { _base: true }); }).concat((p.sessions || []).map(function (s) { return Object.assign({}, s, { _own: true }); }));
    document.getElementById('personalGrid').innerHTML = gridHtml(all, { baseIds: baseIds, isPersonal: true });
    // Own sessions need delete buttons — render them below the grid for reliable editing.
    document.getElementById('personalGrid').insertAdjacentHTML('beforeend', (p.sessions || []).map(function (s) {
      return '<div class="row"><span>' + esc(s.name) + ' · ' + esc(s.day) + ' Period ' + esc(s.period) + '</span>' + (role === 'Student' ? '<button type="button" data-pdel="' + s.id + '">Delete my session</button>' : '') + '</div>';
    }).join(''));
    document.getElementById('personalGrid').querySelectorAll('[data-pdel]').forEach(function (b) { b.onclick = function () { if (!guardPersonal()) return; p.sessions = p.sessions.filter(function (s) { return s.id !== b.dataset.pdel; }); save(); renderPersonal(); }; });
    bindGrid(document.getElementById('personalGrid'), true);
    var free = E.freePeriods(p.sectionId, all.map(function (s) { return { sectionId: p.sectionId, day: s.day, period: s.period }; }), ctx());
    // Free periods must consider own sessions too: recompute from all sessions for this personal view.
    var busy = new Set(all.map(function (s) { return s.day + '-' + s.period; }));
    var free2 = [];
    E.DAYS.forEach(function (day) { for (var pp = 1; pp <= (state.settings.periodsPerDay || 6); pp++) { if (state.settings.lunchPeriod === pp) continue; if (!busy.has(day + '-' + pp)) free2.push(day + ' P' + pp); } });
    document.getElementById('personalFree').innerHTML = '<p>' + free2.length + ' free period(s): ' + esc(free2.slice(0, 30).join(', ')) + (free2.length > 30 ? '…' : '') + '</p><p class="muted">Base free-period count from engine: ' + free.length + ' (section base only).</p>';
  }
  function movePersonal(id, day, period) {
    var p = state.personal.find(function (x) { return x.id === currentPersonalId; }); if (!p) return;
    var s = (p.sessions || []).find(function (x) { return x.id === id; }); if (!s) { toast('Base sessions are read-only and cannot be moved.'); return; }
    if (!guardPersonal()) return;
    var base = state.sessions.filter(function (x) { return x.sectionId === p.sectionId; });
    var combined = base.map(function (x) { return { sectionId: p.sectionId, day: x.day, period: x.period, facultyId: x.facultyId, roomId: x.roomId, subjectId: x.subjectId }; })
      .concat(p.sessions.filter(function (x) { return x.id !== id; }).map(function (x) { return { sectionId: p.sectionId, day: x.day, period: x.period }; }));
    var clash = combined.some(function (x) { return x.day === day && x.period === period; });
    if (clash) { toast('Move rejected: that period is already occupied in your personal timetable.'); return; }
    s.day = day; s.period = period; save(); renderPersonal(); toast('Personal session moved.');
  }

  function renderAll() {
    document.documentElement.setAttribute('data-theme', state.prefs.theme || 'dark');
    document.getElementById('permNote').innerHTML = '<b>Role: ' + esc(role) + '</b> — ' + (role === 'Admin' ? 'Admin can edit institutional data.' : role === 'Student' ? 'Student can edit only their own personal timetables, never institutional or other students’ timetables.' : role === 'Faculty' ? 'Faculty view is read-only for institutional data in this standalone version.' : 'Guest view is read-only.') + ' Institution: <b>' + esc(state.settings.name || '(not set)') + '</b>';
    document.getElementById('toggleBg').checked = !!state.prefs.livingBg;
    document.getElementById('toggleStars').checked = !!state.prefs.stars;
    document.getElementById('toggleMotion').checked = !!state.prefs.reducedMotion;
    document.getElementById('setName').value = state.settings.name || '';
    document.getElementById('setYear').value = state.settings.year || '';
    document.getElementById('setPeriods').value = state.settings.periodsPerDay || 6;
    document.getElementById('setMinutes').value = state.settings.periodMinutes || 60;
    document.getElementById('setStart').value = state.settings.startTime || '09:00';
    document.getElementById('setLunch').value = state.settings.lunchPeriod || 4;
    renderOverview(); renderTimetable(); renderClash(); renderEntities(); renderPersonal();
  }
  function goto(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + view); });
    document.querySelectorAll('#dock button').forEach(function (b) { b.classList.toggle('active', b.dataset.view === view); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function initDock() {
    var views = [['overview', '⌂', 'Overview'], ['timetable', '▦', 'Timetable'], ['clash', '⚠', 'Clash Manager'], ['auto', '✦', 'Auto Scheduler'], ['faculty', '👥', 'Faculty'], ['rooms', '▢', 'Rooms'], ['personal', '◐', 'Personal'], ['checker', '✓', 'Clash Checker'], ['settings', '⚙', 'Settings']];
    var dock = document.getElementById('dock');
    views.forEach(function (v) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.view = v[0]; b.title = v[2]; b.setAttribute('aria-label', v[2]);
      b.innerHTML = '<span class="ic">' + v[1] + '</span><span>' + v[2].split(' ')[0] + '</span>';
      b.onclick = function () { goto(v[0]); };
      dock.appendChild(b);
    });
  }

  /* ---- Events ---- */
  document.addEventListener('DOMContentLoaded', function () {
    initDock(); mountSelects(); initBackground();
    document.querySelectorAll('[data-goto]').forEach(function (b) { b.onclick = function () { goto(b.dataset.goto); }; });
    document.getElementById('themeBtn').onclick = function () { state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark'; save(); renderAll(); };
    document.getElementById('demoBtn').onclick = function () {
      if (state.sessions.length || state.faculty.length) { if (!confirm('Load the demo institution? This replaces current data. Export first if you need it.')) return; }
      var d = E.demoData(); Object.assign(state, d, { personal: [], prefs: state.prefs }); save(); mountSelects(); renderAll(); toast('Demo institution loaded — clearly labelled Demo Campus, with one deliberate clash to showcase detection.');
    };
    document.getElementById('clearBtn').onclick = function () { if (!confirm('Clear all local data?')) return; state = emptyState(); state.prefs = { livingBg: true, stars: true, reducedMotion: false, theme: 'dark' }; save(); mountSelects(); renderAll(); };
    document.getElementById('ttClearFilters').onclick = function () { selects.ttSection.value = ''; selects.ttFaculty.value = ''; selects.ttRoom.value = ''; renderTimetable(); };
    document.getElementById('sessionForm').addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!guardInstitutional()) return;
      var cand = { id: editingSessionId || undefined, subjectId: selects.fSubject.value, facultyId: selects.fFaculty.value, roomId: selects.fRoom.value, sectionId: selects.fSection.value, day: selects.fDay.value, period: Number(selects.fPeriod.value), type: selects.fType.value };
      if (!cand.subjectId || !cand.facultyId || !cand.roomId || !cand.sectionId || !cand.day || !cand.period) { document.getElementById('sessionResult').innerHTML = '<span class="muted">Choose subject, faculty, room, section, day and period.</span>'; return; }
      var cl = E.checkSession(cand, state.sessions, ctx());
      document.getElementById('sessionResult').innerHTML = clashHtml(cl);
      if (E.hardClashes(cl).length) { var sug = E.findSuggestion(cand, state.sessions, ctx()); if (sug) document.getElementById('sessionResult').innerHTML += '<div class="muted">First free slot: ' + sug.day + ' Period ' + sug.period + '</div>'; toast('Session not saved — hard clash found.'); return; }
      if (editingSessionId) { var s = E.byId(state.sessions, editingSessionId); Object.assign(s, cand); } else { cand.id = uid('s'); state.sessions.push(cand); }
      editingSessionId = null; save(); renderAll(); toast('Session saved and validated.');
    });
    document.getElementById('sessionReset').onclick = function () { editingSessionId = null; document.getElementById('sessionForm').reset(); mountSelects(); };
    function simpleAdd(formId, make) {
      document.getElementById(formId).addEventListener('submit', function (ev) {
        ev.preventDefault(); if (!guardInstitutional()) return;
        var fd = new FormData(ev.target); var obj = make(fd); if (!obj) return;
        ev.target.reset(); save(); mountSelects(); renderAll(); toast('Added.');
      });
    }
    simpleAdd('facultyForm', function (fd) { var o = { id: uid('f'), name: fd.get('name'), dept: fd.get('dept') || '', maxLoad: Number(fd.get('maxLoad')) || 12, unavailableDays: [] }; state.faculty.push(o); return o; });
    simpleAdd('subjectForm', function (fd) { var o = { id: uid('sub'), code: fd.get('code'), name: fd.get('name'), credits: 3, hoursPerWeek: Number(fd.get('hours')) || 3, deptId: '', facultyId: '' }; state.subjects.push(o); return o; });
    simpleAdd('roomForm', function (fd) { var o = { id: uid('r'), name: fd.get('name'), building: '', capacity: Number(fd.get('capacity')) || 60, type: 'Classroom' }; state.rooms.push(o); return o; });
    simpleAdd('sectionForm', function (fd) { var o = { id: uid('sec'), name: fd.get('name'), deptId: '', semester: 1, strength: Number(fd.get('strength')) || 50 }; state.sections.push(o); return o; });
    simpleAdd('deptForm', function (fd) { var o = { id: uid('d'), name: fd.get('name'), code: fd.get('code') }; state.departments.push(o); return o; });

    document.getElementById('exportTimetable').onclick = function () {
      var rows = [['Day', 'Period', 'Time', 'Subject', 'Faculty', 'Room', 'Section', 'Type']];
      state.sessions.forEach(function (s) { rows.push([s.day, s.period, E.timeForPeriod(state.settings, s.period), nameOf(state.subjects, s.subjectId), nameOf(state.faculty, s.facultyId), nameOf(state.rooms, s.roomId), nameOf(state.sections, s.sectionId), s.type || '']); });
      download('synchron-timetable.csv', toCSV(rows), 'text/csv');
    };
    document.getElementById('exportAll').onclick = function () { download('synchron-data.json', JSON.stringify(state, null, 2), 'application/json'); };
    document.getElementById('csvImport').onclick = function () {
      if (!guardInstitutional()) return;
      var type = selects.importType.value; var lines = document.getElementById('csvInput').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var added = 0, errors = [];
      lines.forEach(function (line, i) {
        var parts = line.split(',').map(function (x) { return x.trim(); });
        try {
          if (type === 'faculty' && parts.length >= 1) state.faculty.push({ id: uid('f'), name: parts[0], dept: parts[1] || '', maxLoad: Number(parts[2]) || 12, unavailableDays: [] });
          else if (type === 'subject' && parts.length >= 2) state.subjects.push({ id: uid('sub'), code: parts[0], name: parts[1], credits: 3, hoursPerWeek: Number(parts[2]) || 3, deptId: '', facultyId: '' });
          else if (type === 'room' && parts.length >= 1) state.rooms.push({ id: uid('r'), name: parts[0], building: '', capacity: Number(parts[1]) || 60, type: 'Classroom' });
          else if (type === 'section' && parts.length >= 1) state.sections.push({ id: uid('sec'), name: parts[0], deptId: '', semester: 1, strength: Number(parts[1]) || 50 });
          else throw new Error('bad row');
          added++;
        } catch (e) { errors.push('Line ' + (i + 1) + ': invalid row'); }
      });
      document.getElementById('csvResult').textContent = 'Imported ' + added + ' row(s).' + (errors.length ? ' Errors: ' + errors.join('; ') : '');
      save(); mountSelects(); renderAll();
    };

    document.getElementById('autoRun').onclick = function () {
      var sectionId = selects.autoSection.value; var roomId = selects.autoRoom.value;
      if (!sectionId) { toast('Choose a section first.'); return; }
      var jobs = state.subjects.map(function (s) { return { subjectId: s.id, facultyId: s.facultyId || (state.faculty[0] ? state.faculty[0].id : ''), roomId: roomId || (state.rooms[0] ? state.rooms[0].id : ''), sectionId: sectionId, hoursPerWeek: s.hoursPerWeek || 1 }; }).filter(function (j) { return j.facultyId && j.roomId; });
      var res = E.autoSchedule({ jobs: jobs }, ctx());
      autoPreview = res;
      document.getElementById('autoResult').innerHTML = '<p><b>' + res.placed.length + ' session(s) placed.</b></p>' +
        res.placed.map(function (s) { return '<div>' + esc(nameOf(state.subjects, s.subjectId)) + ' — ' + esc(s.day) + ' Period ' + s.period + '</div>'; }).join('') +
        (res.unplaced.length ? '<p><b>Unplaced:</b></p>' + res.unplaced.map(function (u) { return '<div>' + esc(nameOf(state.subjects, u.subjectId)) + ': ' + u.placed + '/' + u.needed + ' placed. ' + esc(u.reason) + '</div>'; }).join('') : '<p class="muted">All requested sessions placed with no hard clashes.</p>');
      document.getElementById('autoApply').disabled = !res.placed.length;
    };
    document.getElementById('autoApply').onclick = function () { if (!guardInstitutional() || !autoPreview) return; state.sessions = autoPreview.allSessions; autoPreview = null; save(); renderAll(); toast('Auto-schedule applied.'); };
    document.getElementById('autoDiscard').onclick = function () { autoPreview = null; document.getElementById('autoResult').innerHTML = '<p class="muted">Preview discarded.</p>'; document.getElementById('autoApply').disabled = true; };

    document.getElementById('personalCreate').onclick = function () {
      if (!guardPersonal()) return;
      var name = document.getElementById('personalName').value.trim(); if (!name) { toast('Name your personal timetable first.'); return; }
      var p = { id: uid('pt'), name: name, sectionId: '', sessions: [] }; state.personal.push(p); currentPersonalId = p.id; save(); mountSelects(); renderPersonal(); toast('Personal timetable created.');
    };
    document.getElementById('personalCopyBase').onclick = function () {
      var p = state.personal.find(function (x) { return x.id === currentPersonalId; }); if (!p) { toast('Create a personal timetable first.'); return; }
      if (!guardPersonal()) return;
      p.sectionId = selects.personalBase.value; save(); renderPersonal(); toast('Section base linked (read-only).');
    };
    document.getElementById('personalExport').onclick = function () {
      var p = state.personal.find(function (x) { return x.id === currentPersonalId; }); if (!p) return;
      var rows = [['Day', 'Period', 'Activity', 'Host', 'Location', 'Type', 'Source']];
      state.sessions.filter(function (s) { return s.sectionId === p.sectionId; }).forEach(function (s) { rows.push([s.day, s.period, nameOf(state.subjects, s.subjectId), nameOf(state.faculty, s.facultyId), nameOf(state.rooms, s.roomId), s.type || '', 'BASE']); });
      (p.sessions || []).forEach(function (s) { rows.push([s.day, s.period, s.name, s.host || '', s.room || '', s.type || '', 'PERSONAL']); });
      download('synchron-personal-timetable.csv', toCSV(rows), 'text/csv');
    };
    document.getElementById('personalForm').addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!guardPersonal()) return;
      var p = state.personal.find(function (x) { return x.id === currentPersonalId; }); if (!p) { toast('Create a personal timetable first.'); return; }
      var fd = new FormData(ev.target);
      var cand = { name: fd.get('name'), host: fd.get('host') || '', room: fd.get('room') || '', day: selects.pDay.value, period: Number(selects.pPeriod.value), type: selects.pType.value };
      if (!cand.day || !cand.period) { document.getElementById('personalResult').textContent = 'Choose a day and period.'; return; }
      var base = state.sessions.filter(function (s) { return s.sectionId === p.sectionId; });
      var occupied = base.some(function (s) { return s.day === cand.day && s.period === cand.period; }) || (p.sessions || []).some(function (s) { return s.day === cand.day && s.period === cand.period; });
      if (occupied) {
        var baseSession = base.find(function (s) { return s.day === cand.day && s.period === cand.period; });
        document.getElementById('personalResult').innerHTML = '<span class="badge critical">Clash</span> That period is already occupied' + (baseSession ? ' by ' + esc(nameOf(state.subjects, baseSession.subjectId)) + ' (' + esc(nameOf(state.faculty, baseSession.facultyId)) + ', ' + esc(nameOf(state.rooms, baseSession.roomId)) + ')' : '') + '. Choose a free period instead.';
        toast('Personal session not saved — period clash.'); return;
      }
      if (state.settings.lunchPeriod === cand.period) { document.getElementById('personalResult').textContent = 'That period is the lunch break.'; return; }
      cand.id = uid('ps'); p.sessions.push(cand); save(); renderPersonal(); document.getElementById('personalResult').innerHTML = '<span class="badge pass">✓ Pass — saved to your personal timetable.</span>'; ev.target.reset();
    });

    document.getElementById('checkForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var cand = { subjectId: selects.cSubject.value, facultyId: selects.cFaculty.value, roomId: selects.cRoom.value, sectionId: selects.cSection.value, day: selects.cDay.value, period: Number(selects.cPeriod.value) };
      if (!cand.day || !cand.period) { document.getElementById('checkResult').textContent = 'Choose a day and period.'; return; }
      var cl = E.checkSession(cand, state.sessions, ctx());
      var sug = E.findSuggestion(cand, state.sessions, ctx());
      document.getElementById('checkResult').innerHTML = clashHtml(cl) + (sug ? '<div class="muted">Suggested free slot: ' + sug.day + ' Period ' + sug.period + '</div>' : '');
    });
    function bulk(list) {
      var rows = list.map(function (s) {
        var others = state.sessions.filter(function (x) { return x.id !== s.id; });
        var cl = E.hardClashes(E.checkSession(s, others, ctx()));
        return '<div>' + esc(s.day) + ' P' + s.period + ' — ' + esc(nameOf(state.subjects, s.subjectId)) + ': ' + (cl.length ? '<span class="badge critical">Clash — ' + esc(cl[0].message) + '</span>' : '<span class="badge pass">✓ Pass</span>') + '</div>';
      });
      document.getElementById('bulkResult').innerHTML = rows.join('') || '<p class="muted">No sessions to check.</p>';
    }
    document.getElementById('bulkRun').onclick = function () { var sid = selects.bulkSection.value; if (!sid) { toast('Choose a section first.'); return; } bulk(state.sessions.filter(function (s) { return s.sectionId === sid; })); };
    document.getElementById('bulkAll').onclick = function () { bulk(state.sessions); };

    document.getElementById('settingsForm').addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!guardInstitutional()) return;
      state.settings.name = document.getElementById('setName').value.trim();
      state.settings.year = document.getElementById('setYear').value.trim();
      state.settings.periodsPerDay = Number(document.getElementById('setPeriods').value) || 6;
      state.settings.periodMinutes = Number(document.getElementById('setMinutes').value) || 60;
      state.settings.startTime = document.getElementById('setStart').value || '09:00';
      state.settings.lunchPeriod = Number(document.getElementById('setLunch').value) || 4;
      save(); mountSelects(); renderAll(); toast('Settings saved.');
    });
    document.getElementById('toggleBg').onchange = function (e) { state.prefs.livingBg = e.target.checked; save(); };
    document.getElementById('toggleStars').onchange = function (e) { state.prefs.stars = e.target.checked; save(); };
    document.getElementById('toggleMotion').onchange = function (e) { state.prefs.reducedMotion = e.target.checked; save(); };

    renderAll(); goto('overview');
  });
})();
