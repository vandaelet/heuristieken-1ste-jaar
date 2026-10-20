const P = require('../src/problemen.js');
let fouten = 0, n = 0; const err = (id, s, m) => { fouten++; if (fouten < 40) console.log('FOUT', id, s, m); };
const telling = {};
for (const g of P.GEN) for (const st of ['A', 'B']) {
  if (!g.punten[st]) continue;
  telling[st + ' ' + g.hoofd + ' ' + g.punten[st]] = (telling[st + ' ' + g.hoofd + ' ' + g.punten[st]] || 0) + 1;
  for (let s = 1; s <= 300; s++) {
    let q; try { q = P.make(g.id, s * 7919, st); } catch (e) { err(g.id, s, e.message); continue; }
    n++;
    const txt = JSON.stringify(q);
    if (/NaN|undefined|Infinity|null,null/.test(txt)) err(g.id, s, 'NaN/undefined ' + txt.slice(0, 200));
    if (q.opties.length !== 5) err(g.id, s, 'niet 5 opties ' + q.opties);
    if (new Set(q.opties).size !== 5) err(g.id, s, 'dubbele opties ' + q.opties);
    if (q.ans < 0) err(g.id, s, 'juist antwoord niet bij de opties ' + q.opties);
    ['begrijpen', 'plannen', 'uitvoeren', 'terugkijken'].forEach(k => { if (!q.stappen[k] || q.stappen[k].length < 10) err(g.id, s, 'stap ontbreekt ' + k); });
    if (!q.tip) err(g.id, s, 'geen tip');
    if (q.opties.some(o => /−/.test(o) && g.hoofd !== 'x')) err(g.id, s, 'negatief getal in opties ' + q.opties);
    const pub = JSON.stringify(P.publicVersion(q, false));
    if (/"ans":|"stappen":|"signaal":|"tip":|"hoofd":|"heur":/.test(pub)) err(g.id, s, 'lek in publieke versie');
    if (!P.grade(q, q.ans).ok || P.grade(q, (q.ans + 1) % 5).ok) err(g.id, s, 'verbetering klopt niet');
    if (!P.gradeFilter(q, [q.hoofd]).ok || P.gradeFilter(q, ['schets', 'vereenvoudigen', 'uitproberen', 'patroon']).ok !== (q.heur.length === 4)) err(g.id, s, 'filter klopt niet');
    if (JSON.stringify(P.make(g.id, s * 7919, st)) !== txt) err(g.id, s, 'niet deterministisch');
  }
}
P.LEUGEN.forEach((sc, i) => { if (P.leugenOplossing(sc).length !== 1) { fouten++; console.log('leugenscenario', i, 'heeft', P.leugenOplossing(sc)); } });
for (const st of ['A', 'B']) { const r = P.pickReeks(st, 4); const pt = {}; r.forEach(x => pt[x.pt] = (pt[x.pt] || 0) + 1); console.log('reeks', st, r.length, JSON.stringify(pt)); if (r.length !== 12) { fouten++; } }
const b = P.begrijpItems()[0]; console.log('begrijp', P.gradeBegrijp('b1', [1, 3], 4).ok, P.gradeBegrijp('b1', [1], 4).ok);
console.log(telling);
console.log('generatoren', P.GEN.length, 'vragen getest', n, 'fouten', fouten);
process.exit(fouten ? 1 : 0);
