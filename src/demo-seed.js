/* Demo: vult de nagebootste Sheet met fictieve leerlingen en resultaten
   en koppelt de webpagina aan de echte servercode (Code.gs). */
var DEMO = (function () {
  const VOORNAMEN = ['Lena', 'Noah', 'Mila', 'Lucas', 'Emma', 'Arthur', 'Olivia', 'Louis', 'Nora', 'Jules', 'Elena', 'Finn', 'Lina', 'Vic', 'Ella', 'Mats', 'Hanne', 'Wout', 'Lotte', 'Seppe', 'Yara', 'Bram', 'Ines', 'Rayan', 'Fien', 'Kobe', 'Amira', 'Lars', 'Marie', 'Senne'];
  const NAMEN = ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Mertens', 'Willems', 'Claes', 'Goossens', 'Wouters', 'De Smet', 'Dubois', 'Hermans', 'Aerts', 'Pauwels', 'Verhoeven', 'De Clercq', 'Van Damme', 'Lambert', 'Martens', 'Michiels'];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const mk = key => { const m = key.split('|'); return HEUR.make(m[0], +m[1], m[2]); };
  const antw = (q, kans) => rnd() < kans ? q.ans : (q.ans + 1 + Math.floor(rnd() * 4)) % 5;

  /* leerling oefent: begrijpen, dan heuristiek per heuristiek, filter en reeksen */
  function oefen(niveau, hoever) { try { oefen_(niveau, hoever); } catch (e) { /* volgend onderdeel nog op slot */ } }
  function oefen_(niveau, hoever) {
    const BJ = [[[1, 3], 4], [[0, 2, 3], 5], [[0, 2], 4], [[0, 1, 3], 4], [[0, 2, 3], 5]];
    for (let i = 0; i < 5 && hoever > 0; i++) { const j = BJ[i]; apiCheckBegrijp('b' + (i + 1), rnd() < niveau + 0.1 ? j[0] : j[0].slice(1), j[1]); }
    ['schets', 'vereenvoudigen', 'uitproberen', 'patroon'].forEach((h, n) => {
      if (hoever < n + 2) return;
      apiNewPractice('zelfstandig', h, 'basis', 5).forEach(it => { const q = mk(it.key); apiCheckPractice(it.key, 'zelfstandig', antw(q, niveau)); });
    });
    if (hoever >= 6) apiNewPractice('filter', '', '', 6).forEach(it => { const q = mk(it.key); apiCheckPractice(it.key, 'filter', null, rnd() < niveau ? [q.hoofd] : ['uitproberen']); });
    if (hoever >= 7) for (let r = 0; r < 1 + Math.floor(rnd() * 3); r++) {
      apiStartReeks();
      const o = JSON.parse(CacheService.getScriptCache().get('reeks_' + Session.getActiveUser().getEmail()));
      apiSubmitReeks(o.items.map(it => { const q = HEUR.make(it.id, it.seed, it.st); return rnd() < 0.1 ? { k: null } : { k: antw(q, niveau - (it.pt - 3) * 0.12), h: rnd() < niveau ? [q.hoofd] : [] }; }));
    }
  }

  function seedData() {
    Session.setUser(Session.getEffectiveUser().getEmail());
    setup();
    writeSetting_('klassen_b', '1J');
    writeSetting_('test_open', true);
    writeSetting_('test_ronde', 'Mei 2027');
    writeSetting_('oefenen_tijdens_test', true);
    const ll = sheet_(SH.ll);
    let n = 0;
    ['1B', '1C', '1D', '1E', '1J'].forEach(klas => {
      for (let i = 0; i < 8; i++) {
        const vn = pick(VOORNAMEN), nm = pick(NAMEN), email = (nm.replace(/\s/g, '') + '.' + vn + n++).toLowerCase() + '@svsl.be';
        const r = rnd(), ng = r < 0.3 ? '1NG1' : r < 0.85 ? '1NG2' + pick(['a', 'b', 'c', 'd', 'e']) : r < 0.95 ? '1NG3' : 'geen';
        const niveau = ng === '1NG1' ? 0.6 : ng === '1NG3' ? 0.9 : 0.78;
        GASFAKE.gids[email] = [vn, nm];
        ll.appendRow([email, vn, nm, klas, ng, klas === '1J' ? 'B' : 'A', new Date(Date.now() - rnd() * 40 * 864e5)]);
        Session.setUser(email);
        oefen(niveau, 1 + Math.floor(rnd() * 7));
        if (rnd() < 0.7) {
          const items = testItems_(klas === '1J' ? 'B' : 'A', settings_()), start = new Date(Date.now() - (20 + rnd() * 25) * 60000);
          sheet_(SH.sess).appendRow([email, 'Mei 2027', start, JSON.stringify(items), '[]', 'bezig', rnd() < 0.15 ? Math.ceil(rnd() * 3) : 0, start]);
          const ant = items.map(it => { const q = HEUR.make(it.id, it.seed, it.st); return rnd() < 0.08 ? { k: null, h: [] } : { k: antw(q, niveau - (it.pt - 3) * 0.1), h: rnd() < niveau ? [q.hoofd] : ['schets'] }; });
          if (rnd() < 0.93) apiSubmitTest(ant, 0, false); else apiSaveTest(ant.slice(0, 7), 1);
        }
      }
    });
    Session.setUser(LEERLING);
    sheet_(SH.ll).appendRow([LEERLING, 'Sara', 'Demeyer', '1C', '1NG2b', 'A', new Date()]);
    sorteerOpNaam_();
    for (let i = 0; i < 3; i++) apiCheckBegrijp('b' + (i + 1), [[1, 3], [0, 2, 3], [0, 2]][i], [4, 5, 4][i]);
    let juist = 0;
    while (juist < 3) { const it = apiNewPractice('zelfstandig', 'schets', 'basis', 1)[0]; const q = mk(it.key); if (apiCheckPractice(it.key, 'zelfstandig', q.ans).ok) juist++; }
    const it = apiNewPractice('zelfstandig', 'vereenvoudigen', 'basis', 1)[0]; apiCheckPractice(it.key, 'zelfstandig', (mk(it.key).ans + 2) % 5);
  }

  const LEERLING = 'leerling.demo@svsl.be', BEHEERDER = 'beheerder.demo@svsl.be';
  GASFAKE.gids[LEERLING] = ['Sara', 'Demeyer']; GASFAKE.gids[BEHEERDER] = ['Tom', 'Vandaele'];
  let rol = 'leerling';
  function api() {
    const names = ['apiInit', 'apiSaveProfile', 'apiVoorbeeld', 'apiNewPractice', 'apiCheckPractice', 'apiCheckBegrijp', 'apiStartReeks', 'apiSubmitReeks', 'apiStartTest', 'apiSaveTest', 'apiSubmitTest',
      'apiAdminData', 'apiAdminSetTestOpen', 'apiAdminSaveSettings', 'apiAdminUpdateStudent', 'apiAdminSyncNames', 'apiAdminResetAttempt', 'apiAdminForceSubmit', 'apiAdminTestDetail', 'apiAdminPracticeDetail'];
    const o = {};
    names.forEach(n => { o[n] = function () { Session.setUser(rol === 'leerling' ? LEERLING : BEHEERDER); const r = window[n] ? window[n].apply(null, arguments) : eval(n).apply(null, arguments); return JSON.parse(JSON.stringify(r === undefined ? null : r)); }; });
    return o;
  }
  function banner() {
    const b = document.createElement('div');
    b.id = 'demoBanner';
    b.style.cssText = 'background:var(--or-soft);color:var(--ink);font-weight:600;font-size:.88rem;padding:.5rem 16px;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;justify-content:center;border-bottom:2px solid var(--orange)';
    b.innerHTML = '<span>DEMO · fictieve gegevens, niets wordt bewaard. Bekijk als:</span>' +
      '<button class="btn small" data-rol="leerling">Leerling</button><button class="btn ghost small" data-rol="beheerder">Beheerder</button>';
    document.body.prepend(b);
    b.addEventListener('click', e => {
      const t = e.target.closest('[data-rol]'); if (!t) return;
      if (S.run && S.run.loopt) return toast('Dien eerst je antwoorden in.');
      rol = t.dataset.rol; $$('[data-rol]', b).forEach(x => x.className = 'btn small' + (x === t ? '' : ' ghost'));
      S.tab = rol === 'beheerder' ? 'beheer' : 'home'; S.admin = null; document.body.classList.remove('testmodus');
      start();
    });
  }
  return { seedData, api, banner, setRol: r => { rol = r; } };
})();
