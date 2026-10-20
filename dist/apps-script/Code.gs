/* =====================================================================
   Heuristieken 1ste jaar – Google Apps Script (Code.gs)
   Campus Lievegem · svsl.be

   Dit script hoort bij een Google Sheet (Extensies > Apps Script).
   Implementeren als web-app:
     - Uitvoeren als: Ik (de eigenaar)
     - Wie heeft toegang: Iedereen binnen svsl.be
   Leerlingen openen de Sheet nooit zelf; alles loopt via dit script.
   De juiste antwoorden en de oplossingen blijven op de server.
   ===================================================================== */

const DOMEIN = 'svsl.be';
const KLASSEN = ['1B', '1C', '1D'];
const NIVEAUGROEPEN = ['1NG1', '1NG2a', '1NG2b', '1NG2c', '1NG2d', '1NG2e', '1NG3', 'geen'];
const STROMEN = ['A', 'B'];
const HKEYS = ['schets', 'vereenvoudigen', 'uitproberen', 'patroon'];
const HLABEL = { schets: 'Schets', vereenvoudigen: 'Vereenvoudigen', uitproberen: 'Uitproberen', patroon: 'Patroon' };
/* onderdelen in volgorde: elk onderdeel gaat open als het vorige genoeg juiste oefeningen heeft */
const ONDERDELEN = ['stappen'].concat(HKEYS, ['filter', 'reeks']);

const SH = { inst: 'Instellingen', beh: 'Beheerders', ll: 'Leerlingen', ovz: 'Voortgang', oef: 'Oefenresultaten', rks: 'Reeksen', test: 'Testresultaten', det: 'Testdetail', sess: 'Testsessies' };

const HEADERS = {
  Instellingen: ['Sleutel', 'Waarde', 'Uitleg'],
  Beheerders: ['E-mail', 'Opmerking'],
  Leerlingen: ['E-mail', 'Voornaam', 'Naam', 'Klas', 'Niveaugroep', 'Stroom', 'Geregistreerd op'],
  Voortgang: ['E-mail', 'Voornaam', 'Naam', 'Klas', 'Niveaugroep', 'Stroom', 'Laatste activiteit', 'Begrijpen juist', 'Begrijpen pogingen']
    .concat([].concat.apply([], HKEYS.map(k => [HLABEL[k] + ' juist', HLABEL[k] + ' pogingen'])),
      ['Filter juist', 'Filter pogingen', 'Reeksen gemaakt', 'Beste reeks %', 'Laatste reeks %']),
  Oefenresultaten: ['Tijdstip', 'E-mail', 'Voornaam', 'Naam', 'Klas', 'Niveaugroep', 'Stroom', 'Onderdeel', 'Heuristiek', 'Vraag', 'Gekozen heuristiek', 'Heuristiek juist', 'Antwoord', 'Juist antwoord', 'Antwoord juist'],
  Reeksen: ['Tijdstip', 'E-mail', 'Voornaam', 'Naam', 'Klas', 'Niveaugroep', 'Stroom', 'Punten', 'Maximum', '%', 'Juist', 'Fout', 'Leeg']
    .concat(HKEYS.map(k => HLABEL[k] + ' %'), ['Filter %', 'Duur (min)']),
  Testresultaten: ['Tijdstip', 'Ronde', 'E-mail', 'Voornaam', 'Naam', 'Klas', 'Niveaugroep', 'Stroom', 'Punten', 'Maximum', 'Totaal %', 'Geslaagd']
    .concat(HKEYS.map(k => HLABEL[k] + ' %'), ['Filter %', 'Juist', 'Fout', 'Leeg', 'Duur (min)', 'Venster verlaten', 'Opmerking']),
  Testdetail: ['Tijdstip', 'Ronde', 'E-mail', 'Klas', 'Niveaugroep', 'Nr', 'Heuristiek', 'Vraag', 'Punten', 'Gegeven antwoord', 'Juist antwoord', 'Gekozen heuristiek', 'Heuristiek juist', 'Score'],
  Testsessies: ['E-mail', 'Ronde', 'Start', 'Vragen', 'Antwoorden', 'Status', 'Venster verlaten', 'Laatste update']
};

const DEFAULTS = [
  ['test_open', false, 'TRUE = de test staat open voor leerlingen. Kan je ook aan- en uitzetten in het beheerscherm.'],
  ['test_ronde', 'Ronde 1', 'Naam van de testronde. Een leerling kan per ronde één keer de test maken. Nieuwe ronde = nieuwe kans.'],
  ['test_code', '', 'Toegangscode die je in de klas meedeelt. Leeg = geen code nodig.'],
  ['test_klassen', '', 'Klassen voor wie de test openstaat, gescheiden door komma\'s (bv. 1C,1D). Leeg = alle klassen.'],
  ['test_per_niveau', 4, 'Aantal testvragen per puntenniveau (3, 4 en 5 punten). 4 = 12 vragen.'],
  ['test_cesuur', 50, 'Minimum % van de punten om te slagen.'],
  ['test_tijd_min', 50, 'Tijdslimiet van de test in minuten. 0 = geen tijdslimiet.'],
  ['test_filter', true, 'TRUE = leerlingen duiden bij elke testvraag ook aan welke heuristiek(en) ze gebruiken (telt niet mee voor de punten).'],
  ['test_toon_resultaat', true, 'TRUE = leerling ziet na het indienen de score en per heuristiek hoe het ging.'],
  ['oefenen_tijdens_test', false, 'FALSE = leerlingen voor wie de test openstaat, kunnen tijdens die periode niet oefenen.'],
  ['klassen_b', '1B', 'Klassen van de B-stroom, gescheiden door komma\'s (bv. 1B). Leerlingen van de B-stroom hebben geen niveaugroep. Nieuwe leerlingen van die klassen krijgen stroom B. De stroom per leerling pas je aan in het tabblad Leerlingen.'],
  ['stapsgewijs', true, 'TRUE = een onderdeel gaat pas open als het vorige onderdeel genoeg juiste oefeningen heeft.'],
  ['vrijgeven_aantal', 3, 'Aantal juiste oefeningen in een onderdeel om het volgende onderdeel te openen.'],
  ['reeks_tijd_min', 30, 'Tijd voor een Kangoeroe-reeks van 12 vragen, in minuten. 0 = geen klok.'],
  ['aftrek_fout', false, 'TRUE = zoals bij de Kangoeroe: een fout antwoord kost een kwart van de punten van die vraag (niets invullen kost niets). Geldt voor reeksen en test.'],
  ['logo_url', '', 'Webadres (https) van het schoollogo (PNG). Leeg = ingebouwd logo.']
];

/* ---------------------------------------------------------------- */
function doGet() {
  setup_();
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Heuristieken wiskunde 1ste jaar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* Eenmalig uitvoeren vanuit de editor (of automatisch bij het eerste bezoek). */
function setup() { setup_(true); return 'Klaar: tabbladen en instellingen staan klaar.'; }

function setup_(force) {
  const props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty('setup_h1')) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(n => sheet_(n));
  const inst = sheet_(SH.inst), have = inst.getDataRange().getValues().map(r => r[0]);
  DEFAULTS.forEach(d => { if (have.indexOf(d[0]) < 0) inst.appendRow(d); });
  keuzelijsten_();
  const beh = sheet_(SH.beh);
  const owner = Session.getEffectiveUser().getEmail();
  if (owner && beh.getLastRow() < 2) beh.appendRow([owner, 'eigenaar van het script']);
  const def = ss.getSheetByName('Blad1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  props.setProperty('setup_h1', '1');
}

/* keuzelijsten in het tabblad Leerlingen: klas, niveaugroep en stroom veilig wijzigen in de Sheet */
function keuzelijsten_() {
  const s = sheet_(SH.ll), n = Math.max(1000, s.getLastRow() + 200);
  const dv = (l, t) => SpreadsheetApp.newDataValidation().requireValueInList(l, true).setAllowInvalid(false).setHelpText(t).build();
  s.getRange(2, 4, n, 1).setDataValidation(dv(KLASSEN, 'Kies een klas uit de lijst.'));
  s.getRange(2, 5, n, 1).setDataValidation(dv(NIVEAUGROEPEN, 'Kies een niveaugroep uit de lijst.'));
  s.getRange(2, 6, n, 1).setDataValidation(dv(STROMEN, 'A-stroom of B-stroom.'));
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]).setFontWeight('bold').setBackground('#e8f8f8');
    s.setFrozenRows(1);
  }
  return s;
}

function rows_(name) {
  const s = sheet_(name), v = s.getDataRange().getValues(), h = v.shift();
  return v.map((r, i) => { const o = { _row: i + 2 }; h.forEach((k, j) => { o[k] = r[j]; }); return o; });
}

function iso_(d) { return d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : (d === undefined || d === null ? '' : d); }
function clean_(o) { const c = {}; Object.keys(o).forEach(k => { if (k !== '_row') c[k] = iso_(o[k]); }); return c; }
function bool_(v) { return v === true || String(v).toUpperCase() === 'TRUE' || v === 1 || String(v).toLowerCase() === 'ja'; }
function lijst_(v) { return String(v || '').split(/[,;\s]+/).map(x => x.trim().toUpperCase()).filter(x => x); }
function pct_(a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; }
function r2_(x) { return Math.round(x * 100) / 100; }

function settings_() {
  const o = {};
  rows_(SH.inst).forEach(r => { o[r['Sleutel']] = r['Waarde']; });
  DEFAULTS.forEach(d => { if (o[d[0]] === undefined || o[d[0]] === '' && typeof d[1] !== 'string') o[d[0]] = d[1]; });
  return {
    test_open: bool_(o.test_open), test_ronde: String(o.test_ronde || 'Ronde 1').trim(), test_code: String(o.test_code || '').trim(),
    test_klassen: lijst_(o.test_klassen),
    test_per_niveau: Math.max(1, Math.min(8, parseInt(o.test_per_niveau, 10) || 4)),
    test_cesuur: Math.max(1, Math.min(100, Number(o.test_cesuur) || 50)),
    test_tijd_min: Math.max(0, parseInt(o.test_tijd_min, 10) || 0),
    test_filter: bool_(o.test_filter), test_toon_resultaat: bool_(o.test_toon_resultaat), oefenen_tijdens_test: bool_(o.oefenen_tijdens_test),
    klassen_b: lijst_(o.klassen_b),
    stapsgewijs: bool_(o.stapsgewijs), vrijgeven_aantal: Math.max(1, Math.min(20, parseInt(o.vrijgeven_aantal, 10) || 3)),
    reeks_tijd_min: Math.max(0, parseInt(o.reeks_tijd_min, 10) || 0),
    aftrek_fout: bool_(o.aftrek_fout),
    logo_url: String(o.logo_url || '').trim()
  };
}

function writeSetting_(key, value) {
  const s = sheet_(SH.inst), v = s.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (v[i][0] === key) {
    const c = s.getRange(i + 1, 2);
    if (typeof value === 'string') c.setNumberFormat('@');
    c.setValue(value); return;
  }
  s.appendRow([key, value, '']);
}

/* ---------------- gebruiker ---------------- */
function me_() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('Je bent niet aangemeld. Meld je aan met je @' + DOMEIN + '-account en laad de pagina opnieuw.');
  if (!email.endsWith('@' + DOMEIN)) throw new Error('Deze website is enkel voor accounts van @' + DOMEIN + '.');
  return email;
}
function isAdmin_(email) {
  const owner = (Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (email === owner) return true;
  return rows_(SH.beh).some(r => String(r['E-mail']).trim().toLowerCase() === email);
}
function requireAdmin_() { const e = me_(); if (!isAdmin_(e)) throw new Error('Enkel beheerders hebben toegang tot dit onderdeel.'); return e; }
function profiel_(email) {
  const r = rows_(SH.ll).find(x => String(x['E-mail']).toLowerCase() === email);
  return r ? { email, voornaam: r['Voornaam'], naam: r['Naam'], klas: r['Klas'], ng: r['Niveaugroep'], stroom: r['Stroom'] === 'B' ? 'B' : 'A', _row: r._row } : null;
}
function stroomVoorKlas_(klas, st) { return (st || settings_()).klassen_b.indexOf(String(klas).toUpperCase()) >= 0 ? 'B' : 'A'; }

/* ---------------- naam uit het schoolaccount ----------------
   1) de Google-schoolgids (People API, adresboek van svsl.be)
   2) lukt dat niet: een gok uit het e-mailadres (familienaam.voornaam@svsl.be) */
function directoryNaam_(email) {
  const cache = CacheService.getScriptCache(), key = 'naam_' + email, c = cache.get(key);
  if (c) return JSON.parse(c) || null;
  let res = null;
  try {
    if (typeof People !== 'undefined') {
      const r = People.People.searchDirectoryPeople({ query: email, readMask: 'names,emailAddresses', sources: ['DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE'] });
      const p = ((r && r.people) || []).find(x => (x.emailAddresses || []).some(e => String(e.value).toLowerCase() === email));
      const n = p && p.names && (p.names.find(x => x.metadata && x.metadata.primary) || p.names[0]);
      if (n && (n.givenName || n.familyName)) res = { voornaam: String(n.givenName || '').trim(), naam: String(n.familyName || '').trim(), bron: 'schoolaccount' };
    }
  } catch (e) { res = null; }
  cache.put(key, JSON.stringify(res), res ? 21600 : 600);
  return res;
}
function naamUitEmail_(email) {
  const delen = email.split('@')[0].replace(/[0-9]+/g, '').split(/[._]/).filter(x => x);
  if (delen.length < 2) return null;
  const hoofd = w => w.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('-');
  return { voornaam: hoofd(delen[delen.length - 1]), naam: delen.slice(0, -1).map(hoofd).join(' '), bron: 'e-mail' };
}
function naamVoorstel_(email) { return directoryNaam_(email) || naamUitEmail_(email); }

/* Leerlingen en Voortgang alfabetisch op familienaam, dan voornaam */
function sorteerOpNaam_() {
  [SH.ll, SH.ovz].forEach(n => {
    const s = sheet_(n), last = s.getLastRow();
    if (last > 2) s.getRange(2, 1, last - 1, HEADERS[n].length).sort([{ column: 3, ascending: true }, { column: 2, ascending: true }]);
  });
}

/* ---------------- voortgang en vrijgeven ---------------- */
function voortgang_(email) {
  const r = rows_(SH.ovz).find(x => String(x['E-mail']).toLowerCase() === email);
  const n = k => r ? Number(r[k]) || 0 : 0;
  const o = { stappen: { juist: n('Begrijpen juist'), pogingen: n('Begrijpen pogingen') }, filter: { juist: n('Filter juist'), pogingen: n('Filter pogingen') },
    reeks: { gemaakt: n('Reeksen gemaakt'), beste: n('Beste reeks %'), laatste: n('Laatste reeks %') } };
  HKEYS.forEach(k => { o[k] = { juist: n(HLABEL[k] + ' juist'), pogingen: n(HLABEL[k] + ' pogingen') }; });
  return o;
}
function openOnderdelen_(vg, st, admin) {
  const out = {};
  ONDERDELEN.forEach((k, i) => {
    out[k] = admin || !st.stapsgewijs || i === 0 || (vg[ONDERDELEN[i - 1]].juist || 0) >= st.vrijgeven_aantal;
  });
  return out;
}
/* kolom-index (0-gebaseerd) van "juist" in Voortgang voor een onderdeel */
function vgKolom_(onderdeel) {
  const h = HEADERS.Voortgang;
  if (onderdeel === 'stappen') return h.indexOf('Begrijpen juist');
  if (onderdeel === 'filter') return h.indexOf('Filter juist');
  return h.indexOf(HLABEL[onderdeel] + ' juist');
}
function updateVoortgang_(prof, f) {
  const s = sheet_(SH.ovz), h = HEADERS.Voortgang;
  const r = rows_(SH.ovz).find(x => String(x['E-mail']).toLowerCase() === prof.email);
  const row = r ? h.map(k => r[k]) : h.map((k, i) => i < 7 ? '' : 0);
  row[0] = prof.email; row[1] = prof.voornaam; row[2] = prof.naam; row[3] = prof.klas; row[4] = prof.ng; row[5] = prof.stroom; row[6] = new Date();
  for (let i = 7; i < row.length; i++) row[i] = Number(row[i]) || 0;
  f(row, h);
  if (r) s.getRange(r._row, 1, 1, h.length).setValues([row]); else { s.appendRow(row); sorteerOpNaam_(); }
}
function telOefening_(prof, onderdeel, juist) {
  updateVoortgang_(prof, row => { const i = vgKolom_(onderdeel); if (juist) row[i]++; row[i + 1]++; });
}

function testStatus_(email, prof, st) {
  st = st || settings_();
  const voorKlas = !!prof && (st.test_klassen.length === 0 || st.test_klassen.indexOf(String(prof.klas).toUpperCase()) >= 0);
  const res = rows_(SH.test).filter(r => String(r['E-mail']).toLowerCase() === email && String(r['Ronde']) === st.test_ronde);
  const sess = rows_(SH.sess).find(r => String(r['E-mail']).toLowerCase() === email && String(r['Ronde']) === st.test_ronde && r['Status'] === 'bezig');
  const out = { open: st.test_open, ronde: st.test_ronde, voorMij: st.test_open && voorKlas, gedaan: res.length > 0, bezig: !!sess,
    codeNodig: !!st.test_code, aantalVragen: st.test_per_niveau * 3, tijd: st.test_tijd_min, cesuur: st.test_cesuur, filter: st.test_filter, aftrek: st.aftrek_fout };
  if (out.gedaan && st.test_toon_resultaat) out.resultaat = resultaatVoorLeerling_(res[res.length - 1], st);
  return out;
}
function resultaatVoorLeerling_(r, st) {
  return { punten: Number(r['Punten']), max: Number(r['Maximum']), totaal: Number(r['Totaal %']), geslaagd: r['Geslaagd'] === 'ja', cesuur: st.test_cesuur,
    per: HKEYS.map(k => ({ key: k, pct: Number(r[HLABEL[k] + ' %']) })), filter: Number(r['Filter %']) };
}

/* ================================================================
   API voor leerlingen
   ================================================================ */
function apiInit() {
  const email = me_(), st = settings_(), prof = profiel_(email), admin = isAdmin_(email);
  const test = testStatus_(email, prof, st), vg = voortgang_(email);
  return {
    email, admin, profiel: prof ? { voornaam: prof.voornaam, naam: prof.naam, klas: prof.klas, ng: prof.ng, stroom: prof.stroom } : null,
    voorstel: prof ? null : naamVoorstel_(email),
    klassen: KLASSEN, niveaugroepen: NIVEAUGROEPEN, klassenB: st.klassen_b, info: HEUR.info(), begrijp: HEUR.begrijpItems(),
    voortgang: vg, open: openOnderdelen_(vg, st, admin),
    regels: { stapsgewijs: st.stapsgewijs, aantal: st.vrijgeven_aantal, reeksTijd: st.reeks_tijd_min, aftrek: st.aftrek_fout },
    test, oefenenGeblokkeerd: !admin && test.voorMij && !test.gedaan && !st.oefenen_tijdens_test, logo: st.logo_url
  };
}

function apiSaveProfile(p) {
  const email = me_(), admin = isAdmin_(email), st = settings_();
  const bestaand = profiel_(email);
  if (bestaand && !admin) throw new Error('Je klas en niveaugroep zijn al ingesteld. Vraag je leerkracht als er iets niet klopt.');
  const dir = directoryNaam_(email);
  const vn = String(dir && dir.voornaam ? dir.voornaam : p.voornaam || '').trim().slice(0, 40);
  const nm = String(dir && dir.naam ? dir.naam : p.naam || '').trim().slice(0, 60);
  if (!vn || !nm) throw new Error('Vul je voornaam en je familienaam in.');
  if (KLASSEN.indexOf(p.klas) < 0) throw new Error('Kies je klas.');
  const stroom = admin && STROMEN.indexOf(p.stroom) >= 0 ? p.stroom : bestaand ? bestaand.stroom : stroomVoorKlas_(p.klas, st);
  /* de B-stroom heeft geen niveaugroepen */
  if (stroom === 'B' && !bestaand) p.ng = 'geen';
  if (NIVEAUGROEPEN.indexOf(p.ng) < 0) throw new Error('Kies je niveaugroep.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sheet_(SH.ll);
    if (bestaand) s.getRange(bestaand._row, 2, 1, 5).setValues([[vn, nm, p.klas, p.ng, stroom]]);
    else s.appendRow([email, vn, nm, p.klas, p.ng, stroom, new Date()]);
    sorteerOpNaam_();
  } finally { lock.releaseLock(); }
  return apiInit();
}

/* gemeenschappelijke controle voor alle oefenonderdelen */
function oefenContext_(onderdeel) {
  const email = me_(), prof = profiel_(email), admin = isAdmin_(email);
  if (!prof && !admin) throw new Error('Stel eerst je klas en niveaugroep in.');
  const st = settings_(), ts = testStatus_(email, prof, st);
  if (!admin && ts.voorMij && !ts.gedaan && !st.oefenen_tijdens_test) throw new Error('Oefenen kan nu niet: de test staat open voor jouw klas.');
  if (onderdeel && ONDERDELEN.indexOf(onderdeel) >= 0 && !openOnderdelen_(voortgang_(email), st, admin)[onderdeel])
    throw new Error('Dit onderdeel is nog niet open. Maak eerst genoeg oefeningen juist in het vorige onderdeel.');
  return { email, prof, admin, st, stroom: prof ? prof.stroom : 'A' };
}
function parseKey_(key) {
  const m = String(key).match(/^([a-z0-9-]+)\|(\d+)\|([AB])$/);
  if (!m) throw new Error('Ongeldige vraag.');
  return HEUR.make(m[1], Number(m[2]), m[3]);
}
function sleutel_(q) { return q.id + '|' + q.seed + '|' + q.stroom; }

/* Uitgewerkt voorbeeld: hier mag de oplossing mee, het is een voorbeeld. */
function apiVoorbeeld(heur, vorige) {
  const c = oefenContext_(heur);
  if (HKEYS.indexOf(heur) < 0) throw new Error('Onbekende heuristiek.');
  const it = HEUR.pickPractice(c.stroom, heur, 'basis', 1, vorige || null)[0];
  const q = HEUR.make(it.id, it.seed, c.stroom);
  return { id: q.id, tekst: q.tekst, fig: q.fig, opties: q.opties, punten: q.punten, ans: q.ans, juistLetter: 'ABCDE'[q.ans], stappen: q.stappen, tip: q.tip, hoofd: q.hoofd, heur: q.heur, signaal: q.signaal };
}

/* modus: 'begeleid' (met tip, eerst heuristiek kiezen), 'zelfstandig' (deel basis/verdieping) of 'filter' (gemengd) */
function apiNewPractice(modus, heur, deel, n, vorige) {
  const onderdeel = modus === 'filter' ? 'filter' : heur;
  if (modus !== 'filter' && HKEYS.indexOf(heur) < 0) throw new Error('Kies een heuristiek.');
  const c = oefenContext_(onderdeel);
  n = Math.max(1, Math.min(10, parseInt(n, 10) || 5));
  const lijst = HEUR.pickPractice(c.stroom, modus === 'filter' ? null : heur, modus === 'zelfstandig' ? (deel === 'verdieping' ? 'verdieping' : 'basis') : null, n, vorige || null);
  return lijst.map(it => { const q = HEUR.make(it.id, it.seed, c.stroom); return { key: sleutel_(q), q: HEUR.publicVersion(q, modus === 'begeleid') }; });
}

function heurTekst_(l) { return [].concat(l || []).filter(k => HKEYS.indexOf(k) >= 0).map(k => HLABEL[k]).join(', '); }

/* keuze: 0..4 of leeg; gekozen: lijst heuristieken (begeleid en filter) */
function apiCheckPractice(key, modus, keuze, gekozen) {
  const q = parseKey_(key);
  const onderdeel = modus === 'filter' ? 'filter' : q.hoofd;
  const c = oefenContext_(onderdeel);
  const g = HEUR.grade(q, keuze);
  const f = (modus === 'filter' || modus === 'begeleid') ? HEUR.gradeFilter(q, gekozen) : null;
  const juist = modus === 'filter' ? f.ok : g.ok;
  const out = Object.assign({}, g, { filter: f, modus, telt: juist });
  if (c.prof) {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      sheet_(SH.oef).appendRow([new Date(), c.email, c.prof.voornaam, c.prof.naam, c.prof.klas, c.prof.ng, c.prof.stroom, modus, HLABEL[q.hoofd], q.id,
        f ? heurTekst_(f.gekozen) : '', f ? (f.ok ? 'ja' : 'nee') : '', g.leeg ? '' : 'ABCDE'[Number(keuze)], g.juistLetter, g.leeg ? '' : (g.ok ? 'ja' : 'nee')]);
      telOefening_(c.prof, onderdeel, juist);
    } finally { lock.releaseLock(); }
  }
  const vg = voortgang_(c.email);
  out.voortgang = vg; out.open = openOnderdelen_(vg, c.st, c.admin);
  return out;
}

function apiCheckBegrijp(id, nodig, vraag) {
  const c = oefenContext_('stappen');
  const g = HEUR.gradeBegrijp(id, nodig, vraag);
  if (c.prof) {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      sheet_(SH.oef).appendRow([new Date(), c.email, c.prof.voornaam, c.prof.naam, c.prof.klas, c.prof.ng, c.prof.stroom, 'begrijpen', '', id, '', '', [].concat(nodig || []).join(',') + ' / vraag ' + vraag, g.nodig.join(',') + ' / vraag ' + g.vraag, g.ok ? 'ja' : 'nee']);
      telOefening_(c.prof, 'stappen', g.ok);
    } finally { lock.releaseLock(); }
  }
  const vg = voortgang_(c.email);
  return Object.assign(g, { voortgang: vg, open: openOnderdelen_(vg, c.st, c.admin) });
}

/* ---------------- scoren (reeksen en test) ----------------
   antwoorden: [{ k: 0..4 of null, h: ['schets', ...] }, ...] */
function scoor_(items, antwoorden, st) {
  antwoorden = antwoorden || [];
  const perH = {}; HKEYS.forEach(k => { perH[k] = { som: 0, max: 0 }; });
  let punten = 0, max = 0, juist = 0, fout = 0, leeg = 0, filterOk = 0, filterN = 0;
  const detail = items.map((it, i) => {
    const q = HEUR.make(it.id, it.seed, it.st || 'A'), a = antwoorden[i] || {};
    const g = HEUR.grade(q, a.k), pt = it.pt || q.punten;
    let s = 0;
    if (g.ok) { s = pt; juist++; } else if (g.leeg) leeg++; else { fout++; if (st.aftrek_fout) s = -pt / 4; }
    punten += s; max += pt; perH[q.hoofd].som += Math.max(0, s); perH[q.hoofd].max += pt;
    let f = null;
    if (a.h && a.h.length) { f = HEUR.gradeFilter(q, a.h); filterN++; if (f.ok) filterOk++; }
    return { nr: i + 1, q, g, f, pt, score: s, a };
  });
  punten = Math.max(0, r2_(punten));
  return { punten, max, pct: pct_(punten, max), juist, fout, leeg, filter: filterN ? pct_(filterOk, filterN) : '', filterN,
    per: HKEYS.map(k => ({ key: k, pct: perH[k].max ? pct_(perH[k].som, perH[k].max) : '' })), detail };
}
function feedback_(r) {
  return r.detail.map(d => ({ nr: d.nr, ok: d.g.ok, leeg: d.g.leeg, keuze: d.g.leeg ? null : Number(d.a.k), juist: d.g.juist, juistLetter: d.g.juistLetter,
    pt: d.pt, score: d.score, hoofd: d.q.hoofd, heur: d.q.heur, signaal: d.q.signaal, stappen: d.q.stappen, filter: d.f }));
}
function samenvatting_(r) { return { punten: r.punten, max: r.max, pct: r.pct, juist: r.juist, fout: r.fout, leeg: r.leeg, filter: r.filter, per: r.per }; }

/* ---------------- Kangoeroe-reeksen (oefenen, met klok) ---------------- */
function apiStartReeks() {
  const c = oefenContext_('reeks');
  const items = HEUR.pickReeks(c.stroom, 4).map(it => Object.assign(it, { st: c.stroom }));
  const start = Date.now();
  CacheService.getScriptCache().put('reeks_' + c.email, JSON.stringify({ items, start }), 21600);
  return { vragen: items.map(it => Object.assign(HEUR.publicVersion(HEUR.make(it.id, it.seed, it.st)), { punten: it.pt })), start, nu: Date.now(),
    einde: c.st.reeks_tijd_min ? start + c.st.reeks_tijd_min * 60000 : null, aftrek: c.st.aftrek_fout };
}

function apiSubmitReeks(antwoorden) {
  const c = oefenContext_('reeks');
  const cache = CacheService.getScriptCache(), raw = cache.get('reeks_' + c.email);
  const o = raw ? JSON.parse(raw) : null;
  if (!o) throw new Error('Deze reeks is verlopen of al ingediend. Start een nieuwe reeks.');
  const r = scoor_(o.items, antwoorden, c.st);
  cache.put('reeks_' + c.email, JSON.stringify(null), 1);
  if (c.prof) {
    const duur = Math.round((Date.now() - o.start) / 6000) / 10, p = c.prof;
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      sheet_(SH.rks).appendRow([new Date(), c.email, p.voornaam, p.naam, p.klas, p.ng, p.stroom, r.punten, r.max, r.pct, r.juist, r.fout, r.leeg]
        .concat(r.per.map(x => x.pct), [r.filter, duur]));
      updateVoortgang_(p, (row, h) => {
        const g = h.indexOf('Reeksen gemaakt'); row[g]++;
        row[g + 1] = Math.max(Number(row[g + 1]) || 0, r.pct); row[g + 2] = r.pct;
      });
    } finally { lock.releaseLock(); }
  }
  return Object.assign(samenvatting_(r), { vragen: feedback_(r), voortgang: voortgang_(c.email) });
}

/* ---------------- test ---------------- */
function sessie_(email, ronde) {
  return rows_(SH.sess).find(r => String(r['E-mail']).toLowerCase() === email && String(r['Ronde']) === ronde && r['Status'] === 'bezig');
}
function testItems_(stroom, st) { return HEUR.pickReeks(stroom, st.test_per_niveau).map(it => Object.assign(it, { st: stroom })); }

function apiStartTest(code, proef) {
  const email = me_(), st = settings_();
  if (proef) {
    if (!isAdmin_(email)) throw new Error('Enkel beheerders kunnen de test uitproberen.');
    const pr = profiel_(email), items = testItems_(proef === 'B' ? 'B' : proef === 'A' ? 'A' : pr ? pr.stroom : 'A', st);
    CacheService.getScriptCache().put('proef_' + email, JSON.stringify({ items, start: Date.now() }), 21600);
    return testPayload_(items, [], Date.now(), st, 0, true);
  }
  const prof = profiel_(email);
  if (!prof) throw new Error('Stel eerst je klas en niveaugroep in.');
  const ts = testStatus_(email, prof, st);
  if (!ts.voorMij) throw new Error('De test staat nu niet open voor jouw klas.');
  if (ts.gedaan) throw new Error('Je hebt de test van "' + st.test_ronde + '" al gemaakt.');
  if (st.test_code && String(code || '').trim().toUpperCase() !== st.test_code.toUpperCase()) throw new Error('De toegangscode klopt niet.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let s;
  try {
    s = sessie_(email, st.test_ronde);
    if (!s) {
      const items = testItems_(prof.stroom, st), now = new Date();
      sheet_(SH.sess).appendRow([email, st.test_ronde, now, JSON.stringify(items), '[]', 'bezig', 0, now]);
      return testPayload_(items, [], now.getTime(), st, 0, false);
    }
  } finally { lock.releaseLock(); }
  const start = new Date(s['Start']).getTime(), items = JSON.parse(s['Vragen']), ans = JSON.parse(s['Antwoorden'] || '[]');
  if (st.test_tijd_min && Date.now() > start + st.test_tijd_min * 60000 + 60000) {
    return { verlopen: true, resultaat: dienIn_(email, prof, s, ans, Number(s['Venster verlaten']) || 0, st, 'automatisch ingediend: tijd verstreken') };
  }
  return testPayload_(items, ans, start, st, Number(s['Venster verlaten']) || 0, false);
}

function testPayload_(items, ans, start, st, verlaten, proef) {
  return { proef: !!proef, vragen: items.map(it => Object.assign(HEUR.publicVersion(HEUR.make(it.id, it.seed, it.st)), { punten: it.pt })), antwoorden: ans, start,
    nu: Date.now(), einde: st.test_tijd_min ? start + st.test_tijd_min * 60000 : null, verlaten, filter: st.test_filter, aftrek: st.aftrek_fout };
}

function apiSaveTest(answers, verlaten) {
  const email = me_(), st = settings_(), s = sessie_(email, st.test_ronde);
  if (!s) return { ok: false };
  sheet_(SH.sess).getRange(s._row, 5, 1, 4).setValues([[JSON.stringify(answers || []).slice(0, 45000), 'bezig', Math.max(Number(s['Venster verlaten']) || 0, Number(verlaten) || 0), new Date()]]);
  return { ok: true };
}

function apiSubmitTest(answers, verlaten, proef) {
  const email = me_(), st = settings_();
  if (proef) {
    const c = CacheService.getScriptCache().get('proef_' + email);
    if (!c) throw new Error('De proeftest is verlopen. Start opnieuw.');
    const r = scoor_(JSON.parse(c).items, answers, st);
    return Object.assign({ ingediend: true, proef: true, geslaagd: r.pct >= st.test_cesuur, cesuur: st.test_cesuur }, samenvatting_(r), { vragen: feedback_(r) });
  }
  const prof = profiel_(email);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sessie_(email, st.test_ronde);
    if (!s) {
      const ts = testStatus_(email, prof, st);
      if (ts.gedaan) return ts.resultaat ? Object.assign({ ingediend: true }, ts.resultaat) : { ingediend: true };
      throw new Error('Er is geen lopende test gevonden.');
    }
    const start = new Date(s['Start']).getTime();
    const laat = st.test_tijd_min && Date.now() > start + st.test_tijd_min * 60000 + 120000;
    return dienIn_(email, prof, s, answers, verlaten, st, laat ? 'ingediend na de tijdslimiet' : '');
  } finally { lock.releaseLock(); }
}

function dienIn_(email, prof, s, answers, verlaten, st, opmerking) {
  const items = JSON.parse(s['Vragen']);
  if (!answers || !answers.length) answers = JSON.parse(s['Antwoorden'] || '[]');
  const r = scoor_(items, answers, st), now = new Date(), geslaagd = r.pct >= st.test_cesuur;
  const duur = Math.round((now.getTime() - new Date(s['Start']).getTime()) / 6000) / 10;
  const vl = Math.max(Number(s['Venster verlaten']) || 0, Number(verlaten) || 0);
  sheet_(SH.test).appendRow([now, st.test_ronde, email, prof.voornaam, prof.naam, prof.klas, prof.ng, prof.stroom, r.punten, r.max, r.pct, geslaagd ? 'ja' : 'nee']
    .concat(r.per.map(x => x.pct), [r.filter, r.juist, r.fout, r.leeg, duur, vl, opmerking || '']));
  const det = r.detail.map(d => [now, st.test_ronde, email, prof.klas, prof.ng, d.nr, HLABEL[d.q.hoofd], d.q.id, d.pt,
    d.g.leeg ? '' : 'ABCDE'[Number(d.a.k)], d.g.juistLetter, d.f ? heurTekst_(d.f.gekozen) : '', d.f ? (d.f.ok ? 'ja' : 'nee') : '', r2_(d.score)]);
  if (det.length) { const ds = sheet_(SH.det), r0 = ds.getLastRow() + 1; ds.getRange(r0, 10, det.length, 2).setNumberFormat('@'); ds.getRange(r0, 1, det.length, det[0].length).setValues(det); }
  sheet_(SH.sess).getRange(s._row, 5, 1, 4).setValues([[JSON.stringify(answers).slice(0, 45000), 'ingediend', vl, now]]);
  /* de leerling ziet enkel de score, niet welke vragen juist waren: zo blijven de testvragen bruikbaar */
  return st.test_toon_resultaat ? Object.assign({ ingediend: true, geslaagd, cesuur: st.test_cesuur }, samenvatting_(r)) : { ingediend: true };
}

/* ================================================================
   API voor beheerders
   ================================================================ */
function apiAdminData() {
  requireAdmin_();
  const st = settings_();
  const vg = rows_(SH.ovz).map(r => {
    const o = { email: r['E-mail'], voornaam: r['Voornaam'], naam: r['Naam'], klas: r['Klas'], ng: r['Niveaugroep'], stroom: r['Stroom'], laatste: iso_(r['Laatste activiteit']),
      stappen: [Number(r['Begrijpen juist']) || 0, Number(r['Begrijpen pogingen']) || 0], filter: [Number(r['Filter juist']) || 0, Number(r['Filter pogingen']) || 0],
      reeksen: Number(r['Reeksen gemaakt']) || 0, beste: Number(r['Beste reeks %']) || 0, laatsteReeks: Number(r['Laatste reeks %']) || 0 };
    HKEYS.forEach(k => { o[k] = [Number(r[HLABEL[k] + ' juist']) || 0, Number(r[HLABEL[k] + ' pogingen']) || 0]; });
    return o;
  });
  return {
    settings: st, beheerders: rows_(SH.beh).map(r => String(r['E-mail'])).filter(x => x),
    klassen: KLASSEN, niveaugroepen: NIVEAUGROEPEN, hkeys: HKEYS, hlabel: HLABEL,
    leerlingen: rows_(SH.ll).map(r => ({ email: r['E-mail'], voornaam: r['Voornaam'], naam: r['Naam'], klas: r['Klas'], ng: r['Niveaugroep'], stroom: r['Stroom'] === 'B' ? 'B' : 'A', sinds: iso_(r['Geregistreerd op']) })),
    test: rows_(SH.test).map(r => clean_(r)), voortgang: vg, reeksen: rows_(SH.rks).slice(-1000).map(r => clean_(r)),
    bezig: rows_(SH.sess).filter(r => r['Status'] === 'bezig').map(r => ({ email: r['E-mail'], ronde: r['Ronde'], start: iso_(r['Start']), laatste: iso_(r['Laatste update']), verlaten: Number(r['Venster verlaten']) || 0,
      beantwoord: (JSON.parse(r['Antwoorden'] || '[]') || []).filter(a => a && a.k !== null && a.k !== undefined && a.k !== '').length, totaal: JSON.parse(r['Vragen'] || '[]').length })),
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
}

function apiAdminSetTestOpen(open) {
  requireAdmin_(); writeSetting_('test_open', !!open); return apiAdminData();
}

function apiAdminSaveSettings(o) {
  requireAdmin_();
  const num = (k, lo, hi, d) => { if (o[k] !== undefined) writeSetting_(k, Math.max(lo, Math.min(hi, parseInt(o[k], 10) || d))); };
  const bl = k => { if (o[k] !== undefined) writeSetting_(k, !!o[k]); };
  if (o.test_ronde !== undefined) writeSetting_('test_ronde', String(o.test_ronde).trim().slice(0, 60) || 'Ronde 1');
  if (o.test_code !== undefined) writeSetting_('test_code', String(o.test_code).trim().slice(0, 30));
  if (o.test_klassen !== undefined) writeSetting_('test_klassen', [].concat(o.test_klassen).filter(k => KLASSEN.indexOf(k) >= 0).join(','));
  num('test_per_niveau', 1, 8, 4); num('test_cesuur', 1, 100, 50); num('test_tijd_min', 0, 300, 0); num('vrijgeven_aantal', 1, 20, 3); num('reeks_tijd_min', 0, 300, 0);
  if (o.test_tijd_min !== undefined && !parseInt(o.test_tijd_min, 10)) writeSetting_('test_tijd_min', 0);
  if (o.reeks_tijd_min !== undefined && !parseInt(o.reeks_tijd_min, 10)) writeSetting_('reeks_tijd_min', 0);
  ['test_filter', 'test_toon_resultaat', 'oefenen_tijdens_test', 'stapsgewijs', 'aftrek_fout'].forEach(bl);
  if (o.logo_url !== undefined) writeSetting_('logo_url', /^https:\/\//.test(o.logo_url) ? o.logo_url : '');
  if (o.klassen_b !== undefined) {
    const kb = [].concat(o.klassen_b).filter(k => KLASSEN.indexOf(k) >= 0);
    writeSetting_('klassen_b', kb.join(','));
    if (o.stroom_toepassen) {
      const s = sheet_(SH.ll);
      rows_(SH.ll).forEach(r => { const w = kb.indexOf(String(r['Klas'])) >= 0 ? 'B' : 'A'; if (r['Stroom'] !== w) s.getRange(r._row, 6).setValue(w); });
    }
  }
  if (o.beheerders !== undefined) {
    const me = me_();
    const list = [].concat(o.beheerders).map(x => String(x).trim().toLowerCase()).filter(x => /^[^@\s]+@[^@\s]+$/.test(x));
    if (list.indexOf(me) < 0) list.unshift(me);
    const s = sheet_(SH.beh);
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, 2).clearContent();
    s.getRange(2, 1, list.length, 2).setValues(list.map(e => [e, '']));
  }
  return apiAdminData();
}

function apiAdminUpdateStudent(email, p) {
  requireAdmin_();
  email = String(email).toLowerCase();
  if (KLASSEN.indexOf(p.klas) < 0 || NIVEAUGROEPEN.indexOf(p.ng) < 0) throw new Error('Ongeldige klas of niveaugroep.');
  const prof = profiel_(email); if (!prof) throw new Error('Leerling niet gevonden.');
  const stroom = STROMEN.indexOf(p.stroom) >= 0 ? p.stroom : prof.stroom;
  const vn = String(p.voornaam || prof.voornaam).trim(), nm = String(p.naam || prof.naam).trim();
  sheet_(SH.ll).getRange(prof._row, 2, 1, 5).setValues([[vn, nm, p.klas, p.ng, stroom]]);
  const o = rows_(SH.ovz).find(x => String(x['E-mail']).toLowerCase() === email);
  if (o) sheet_(SH.ovz).getRange(o._row, 2, 1, 5).setValues([[vn, nm, p.klas, p.ng, stroom]]);
  sorteerOpNaam_();
  return apiAdminData();
}

function apiAdminSyncNames() {
  requireAdmin_();
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  let bijgewerkt = 0, nietGevonden = 0;
  try {
    const ll = sheet_(SH.ll), ovz = sheet_(SH.ovz), ovzRows = rows_(SH.ovz);
    rows_(SH.ll).forEach(r => {
      const email = String(r['E-mail']).toLowerCase(), d = directoryNaam_(email);
      if (!d || !d.voornaam || !d.naam) { nietGevonden++; return; }
      if (d.voornaam !== r['Voornaam'] || d.naam !== r['Naam']) {
        ll.getRange(r._row, 2, 1, 2).setValues([[d.voornaam, d.naam]]); bijgewerkt++;
        const o = ovzRows.find(x => String(x['E-mail']).toLowerCase() === email);
        if (o) ovz.getRange(o._row, 2, 1, 2).setValues([[d.voornaam, d.naam]]);
      }
    });
    sorteerOpNaam_();
  } finally { lock.releaseLock(); }
  return Object.assign(apiAdminData(), { sync: { bijgewerkt, nietGevonden } });
}

function apiAdminResetAttempt(email, ronde) {
  requireAdmin_();
  email = String(email).toLowerCase();
  [SH.test, SH.det, SH.sess].forEach(n => {
    const s = sheet_(n), v = s.getDataRange().getValues(), h = v[0], ie = h.indexOf('E-mail'), ir = h.indexOf('Ronde');
    for (let i = v.length - 1; i >= 1; i--) if (String(v[i][ie]).toLowerCase() === email && String(v[i][ir]) === String(ronde)) s.deleteRow(i + 1);
  });
  return apiAdminData();
}

function apiAdminForceSubmit(email) {
  requireAdmin_();
  email = String(email).toLowerCase();
  const st = settings_(), s = sessie_(email, st.test_ronde), prof = profiel_(email);
  if (!s || !prof) throw new Error('Geen lopende test gevonden voor ' + email + '.');
  dienIn_(email, prof, s, null, 0, st, 'ingediend door beheerder');
  return apiAdminData();
}

function apiAdminTestDetail(email, ronde) {
  requireAdmin_();
  email = String(email).toLowerCase();
  return rows_(SH.det).filter(r => String(r['E-mail']).toLowerCase() === email && String(r['Ronde']) === String(ronde)).map(clean_);
}

function apiAdminPracticeDetail(email) {
  requireAdmin_();
  email = String(email).toLowerCase();
  return {
    oefen: rows_(SH.oef).filter(r => String(r['E-mail']).toLowerCase() === email).slice(-300).map(clean_),
    reeksen: rows_(SH.rks).filter(r => String(r['E-mail']).toLowerCase() === email).map(clean_)
  };
}
