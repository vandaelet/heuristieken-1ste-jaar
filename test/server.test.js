const fs = require('fs'), vm = require('vm'), path = require('path');
const R = path.join(__dirname, '..');
const ctx = vm.createContext({ console, JSON, Math, Date, setTimeout });
['src/problemen.js', 'src/gas-fake.js', 'src/server.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8').replace(/if \(typeof module[^\n]*\n/, ''), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const throws = (code, re, m) => { try { run(code); ok(false, m + ' (geen fout)'); } catch (e) { ok(re.test(e.message), m + ' → ' + e.message); } };
const juist = key => run(`(function(){const m='${key}'.split('|');return HEUR.make(m[0],+m[1],m[2]);})()`);

run("Session.setOwner('juf@svsl.be'); Session.setUser('juf@svsl.be'); setup();");
ok(run("SpreadsheetApp.getActiveSpreadsheet().getSheets().map(s=>s.getName()).join(',')") === 'Instellingen,Beheerders,Leerlingen,Voortgang,Oefenresultaten,Reeksen,Testresultaten,Testdetail,Testsessies', 'tabbladen aangemaakt');
ok(run('settings_().klassen_b').join() === '1B', 'standaard: 1B is B-stroom');
throws("Session.setUser('x@gmail.com'); apiInit()", /enkel voor accounts/, 'externe accounts geweigerd');
run("Session.setUser('peeters.lien@svsl.be')");
ok(run("apiInit().voorstel.naam") === 'Peeters', 'naamvoorstel uit e-mail');
throws("apiNewPractice('zelfstandig','schets','basis',3)", /klas en niveaugroep/, 'oefenen vraagt eerst profiel');
ok(run("apiSaveProfile({voornaam:'Lien',naam:'Peeters',klas:'1C',ng:'1NG2a'}).profiel.stroom") === 'A', 'profiel 1C → A-stroom');
const i0 = run('apiInit()');
ok(i0.open.stappen && !i0.open.schets && !i0.open.reeks, 'enkel onderdeel 0 open bij de start');
throws("apiNewPractice('zelfstandig','schets','basis',3)", /nog niet open/, 'heuristiek 1 nog dicht');
for (let i = 0; i < 3; i++) run("apiCheckBegrijp('b1',[1,3],4)");
const b = run("apiCheckBegrijp('b2',[0],5)");
ok(!b.ok && b.voortgang.stappen.juist === 3 && b.voortgang.stappen.pogingen === 4 && b.open.schets, 'begrijpen geteld en schets open');
const vb = run("apiVoorbeeld('schets')");
ok(vb.stappen && vb.stappen.plannen && vb.hoofd === 'schets', 'uitgewerkt voorbeeld met 4 stappen');
const bg = run("apiNewPractice('begeleid','schets','',3)");
ok(bg.length === 3 && bg.every(x => x.q.tip) && !/"ans"|"stappen"|"hoofd"/.test(JSON.stringify(bg)), 'begeleid: tip mee, geen oplossing');
const zs = run("apiNewPractice('zelfstandig','schets','basis',5)");
ok(zs.every(x => !x.q.tip && x.q.punten < 5) && !/"ans"|"stappen"|"tip"/.test(JSON.stringify(zs)), 'zelfstandig basis: geen tip, geen 5-puntvragen');
zs.slice(0, 3).forEach(x => { const q = juist(x.key); run(`apiCheckPractice('${x.key}','zelfstandig',${q.ans})`); });
const fo = run(`apiCheckPractice('${zs[3].key}','zelfstandig',${(juist(zs[3].key).ans + 1) % 5})`);
ok(!fo.ok && fo.stappen && fo.voortgang.schets.juist === 3 && fo.voortgang.schets.pogingen === 4 && fo.open.vereenvoudigen, 'zelfstandig geteld; vereenvoudigen open');
const q0 = juist(bg[0].key);
const be = run(`apiCheckPractice('${bg[0].key}','begeleid',${q0.ans},['${q0.hoofd}'])`);
ok(be.ok && be.filter.ok, 'begeleid: heuristiek en antwoord juist');
throws("apiNewPractice('filter','','',3)", /nog niet open/, 'filtertraining nog dicht');
throws("apiStartReeks()", /nog niet open/, 'reeks nog dicht');

/* stapsgewijs uit → alles open */
run("Session.setUser('juf@svsl.be'); apiAdminSaveSettings({stapsgewijs:false}); Session.setUser('peeters.lien@svsl.be')");
ok(Object.values(run('apiInit()').open).every(x => x), 'stapsgewijs uit: alles open');
const fl = run("apiNewPractice('filter','','',4)");
const qf = juist(fl[0].key);
const fr = run(`apiCheckPractice('${fl[0].key}','filter',null,['${qf.hoofd}'])`);
ok(fr.filter.ok && fr.telt && fr.voortgang.filter.juist === 1, 'filtertraining: juiste heuristiek telt, ook zonder antwoord');
const fr2 = run(`apiCheckPractice('${fl[1].key}','filter',null,[])`);
ok(!fr2.filter.ok && fr2.voortgang.filter.pogingen === 2, 'filtertraining: niets aangeduid = fout');

/* reeks */
const rk = run('apiStartReeks()');
ok(rk.vragen.length === 12 && rk.einde && !/"ans"|"stappen"|"hoofd"/.test(JSON.stringify(rk)), 'reeks: 12 vragen met klok, geen oplossing');
ok(JSON.stringify(rk.vragen.map(v => v.punten)) === JSON.stringify([3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5]), 'reeks: 4×3, 4×4, 4×5 punten');
const items = JSON.parse(run("CacheService.getScriptCache().get('reeks_peeters.lien@svsl.be')")).items;
const ant = items.map((it, i) => { const q = run(`HEUR.make('${it.id}',${it.seed},'${it.st}')`); return i < 6 ? { k: q.ans, h: [q.hoofd] } : i < 9 ? { k: (q.ans + 1) % 5 } : { k: null }; });
ctx.ant = ant;
const rr = run('apiSubmitReeks(ant)');
ok(rr.punten === 3 * 4 + 4 * 2 && rr.max === 48 && rr.juist === 6 && rr.fout === 3 && rr.leeg === 3, 'reeks score zonder aftrek: ' + rr.punten + '/' + rr.max);
ok(rr.filter === 100 && rr.vragen[0].stappen && rr.voortgang.reeks.gemaakt === 1, 'reeks: filter % en feedback met stappen');
throws('apiSubmitReeks(ant)', /verlopen/, 'reeks niet twee keer indienen');
run("Session.setUser('juf@svsl.be'); apiAdminSaveSettings({aftrek_fout:true}); Session.setUser('peeters.lien@svsl.be')");
run('apiStartReeks()');
const items2 = JSON.parse(run("CacheService.getScriptCache().get('reeks_peeters.lien@svsl.be')")).items;
ctx.ant2 = items2.map((it, i) => { const q = run(`HEUR.make('${it.id}',${it.seed},'${it.st}')`); return i < 4 ? { k: q.ans } : { k: (q.ans + 1) % 5 }; });
const rr2 = run('apiSubmitReeks(ant2)');
ok(rr2.punten === 12 - (4 * 4 + 4 * 5) / 4, 'aftrek: fout kost ¼ van de punten → ' + rr2.punten);

/* B-stroom */
run("Session.setUser('de.smet.kobe@svsl.be')");
ok(run("apiSaveProfile({voornaam:'Kobe',naam:'De Smet',klas:'1B',ng:''}).profiel.stroom") === 'B' && run("profiel_('de.smet.kobe@svsl.be').ng") === 'geen', 'klas 1B → B-stroom, geen niveaugroep');
run("Session.setUser('juf@svsl.be'); apiAdminSaveSettings({stapsgewijs:true})");
throws("Session.setUser('de.smet.kobe@svsl.be'); apiStartReeks()", /nog niet open/, 'stapsgewijs weer aan');

/* test */
run("Session.setUser('juf@svsl.be'); apiAdminSaveSettings({aftrek_fout:false, test_code:'heur', test_klassen:['1C'], test_tijd_min:50}); apiAdminSetTestOpen(true)");
run("Session.setUser('peeters.lien@svsl.be')");
const ti = run('apiInit()');
ok(ti.test.voorMij && ti.oefenenGeblokkeerd, 'test open voor 1C, oefenen geblokkeerd');
throws("apiNewPractice('zelfstandig','schets','basis',3)", /test staat open/, 'oefenen tijdens test geweigerd');
throws("Session.setUser('de.smet.kobe@svsl.be'); apiStartTest('HEUR')", /niet open voor jouw klas/, 'test niet open voor 1B');
run("Session.setUser('peeters.lien@svsl.be')");
throws("apiStartTest('fout')", /code/, 'foute code');
const t = run("apiStartTest('HEUR')");
ok(t.vragen.length === 12 && t.filter && !/"ans"|"stappen"|"hoofd"|"tip"/.test(JSON.stringify(t)), 'test gestart, geen oplossingen');
const sess = JSON.parse(run("rows_(SH.sess)[0]['Vragen']"));
ctx.ta = sess.map((it, i) => { const q = run(`HEUR.make('${it.id}',${it.seed},'${it.st}')`); return i % 2 ? { k: q.ans, h: [q.hoofd] } : { k: null, h: [] }; });
run('apiSaveTest(ta.slice(0,5), 1)');
ok(run("apiStartTest('HEUR')").antwoorden.length === 5, 'test hervat met bewaarde antwoorden');
const tr = run('apiSubmitTest(ta, 2)');
ok(tr.ingediend && tr.pct > 0 && tr.per.length === 4 && !tr.vragen, 'test ingediend; geen vraagdetails naar de leerling (' + tr.pct + ' %)');
ok(run('apiInit().test.gedaan') && !run('apiInit().oefenenGeblokkeerd'), 'na de test mag er weer geoefend worden');
throws("apiStartTest('HEUR')", /al gemaakt/, 'tweede poging geweigerd');

/* beheer */
throws("apiAdminData()", /beheerders/, 'leerling heeft geen beheer');
run("Session.setUser('juf@svsl.be')");
const ad = run('apiAdminData()');
ok(ad.test.length === 1 && ad.test[0]['Venster verlaten'] === 2 && ad.test[0]['Stroom'] === 'A', 'testresultaat in beheer');
ok(ad.voortgang.length === 1 && ad.voortgang[0].schets[0] === 4 && ad.leerlingen[0].naam === 'De Smet', 'voortgang op familienaam gesorteerd');
ok(run("apiAdminTestDetail('peeters.lien@svsl.be','Ronde 1')").length === 12, 'testdetail 12 rijen');
ok(run("apiAdminPracticeDetail('peeters.lien@svsl.be')").reeksen.length === 2, 'reeksen per leerling');
run("apiAdminUpdateStudent('peeters.lien@svsl.be',{klas:'1D',ng:'1NG3',stroom:'B'})");
ok(run("profiel_('peeters.lien@svsl.be').stroom") === 'B' && run("rows_(SH.ovz).find(r=>r['E-mail']==='peeters.lien@svsl.be')['Klas']") === '1D', 'beheerder past klas en stroom aan');
run("apiAdminSaveSettings({klassen_b:['1D'], stroom_toepassen:true})");
ok(run("profiel_('de.smet.kobe@svsl.be').stroom") === 'A', 'stroom toepassen op klassen');
run("apiAdminResetAttempt('peeters.lien@svsl.be','Ronde 1')");
ok(!run("Session.setUser('peeters.lien@svsl.be'); apiInit().test.gedaan"), 'nieuwe kans na reset');
const pt = run("Session.setUser('juf@svsl.be'); apiStartTest('', 'B')");
ok(pt.proef && pt.vragen.length === 12, 'beheerder: proeftest B-stroom');
ok(run('apiSubmitTest([],0,true)').vragen.length === 12, 'proeftest met feedback');
console.log(fails ? fails + ' FOUT(EN)' : 'ALLES OK'); process.exit(fails ? 1 : 0);
