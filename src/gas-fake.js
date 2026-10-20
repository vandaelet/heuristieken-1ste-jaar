/* Nagebootste Google Apps Script-diensten (in het geheugen).
   Gebruikt voor de demo in de browser en voor de automatische tests.
   Niet nodig in de echte Apps Script-omgeving. */
var GASFAKE = (function () {
  function Range(sheet, r, c, nr, nc) { this.s = sheet; this.r = r; this.c = c; this.nr = nr || 1; this.nc = nc || 1; }
  Range.prototype.setValues = function (vals) {
    for (let i = 0; i < this.nr; i++) { const row = this.s.ensure(this.r + i); for (let j = 0; j < this.nc; j++) row[this.c - 1 + j] = vals[i][j]; }
    return this;
  };
  Range.prototype.setValue = function (v) { this.s.ensure(this.r)[this.c - 1] = v; return this; };
  Range.prototype.getValues = function () {
    const out = []; for (let i = 0; i < this.nr; i++) { const row = this.s.data[this.r - 1 + i] || []; const o = []; for (let j = 0; j < this.nc; j++) o.push(row[this.c - 1 + j] === undefined ? '' : row[this.c - 1 + j]); out.push(o); }
    return out;
  };
  Range.prototype.clearContent = function () { for (let i = 0; i < this.nr; i++) { const row = this.s.data[this.r - 1 + i]; if (row) for (let j = 0; j < this.nc; j++) row[this.c - 1 + j] = ''; } this.s.trim(); return this; };
  Range.prototype.setFontWeight = function () { return this; };
  Range.prototype.setNumberFormat = function () { return this; };
  Range.prototype.setDataValidation = function (v) { this.s.validation = this.s.validation || []; this.s.validation.push({ c: this.c, v }); return this; };
  Range.prototype.sort = function (spec) {
    const rows = this.getValues(), cmp = (a, b) => { for (const k of [].concat(spec)) { const c = typeof k === 'number' ? { column: k, ascending: true } : k, i = c.column - this.c; const x = a[i], y = b[i]; const r = String(x).localeCompare(String(y), 'nl'); if (r) return c.ascending === false ? -r : r; } return 0; };
    rows.sort(cmp); return this.setValues(rows);
  };
  Range.prototype.setBackground = function () { return this; };

  function Sheet(name) { this.name = name; this.data = []; }
  Sheet.prototype.ensure = function (r) { while (this.data.length < r) this.data.push([]); return this.data[r - 1]; };
  Sheet.prototype.width = function () { return this.data.reduce((m, r) => Math.max(m, r.length), 0); };
  Sheet.prototype.trim = function () { while (this.data.length && this.data[this.data.length - 1].every(v => v === '' || v === undefined)) this.data.pop(); };
  Sheet.prototype.getRange = function (r, c, nr, nc) { return new Range(this, r, c, nr, nc); };
  Sheet.prototype.getDataRange = function () { return new Range(this, 1, 1, Math.max(1, this.data.length), Math.max(1, this.width())); };
  Sheet.prototype.appendRow = function (row) { this.data.push(row.slice()); return this; };
  Sheet.prototype.getLastRow = function () { return this.data.length; };
  Sheet.prototype.deleteRow = function (r) { this.data.splice(r - 1, 1); };
  Sheet.prototype.setFrozenRows = function () { };
  Sheet.prototype.getName = function () { return this.name; };

  const book = { sheets: [new Sheet('Blad1')] };
  const dvb = () => { const o = { list: null, requireValueInList: l => { o.list = l; return o; }, setAllowInvalid: () => o, setHelpText: () => o, build: () => ({ list: o.list }) }; return o; };
  const SpreadsheetApp = {
    newDataValidation: dvb,
    getActiveSpreadsheet: () => ({
      getSheetByName: n => book.sheets.find(s => s.name === n) || null,
      insertSheet: n => { const s = new Sheet(n); book.sheets.push(s); return s; },
      getSheets: () => book.sheets.slice(),
      deleteSheet: s => { book.sheets = book.sheets.filter(x => x !== s); },
      getUrl: () => 'https://docs.google.com/spreadsheets/'
    })
  };
  let active = '', owner = 'beheerder.demo@svsl.be';
  const Session = {
    getActiveUser: () => ({ getEmail: () => active }),
    getEffectiveUser: () => ({ getEmail: () => owner }),
    getScriptTimeZone: () => 'Europe/Brussels',
    setUser: e => { active = e; }, setOwner: e => { owner = e; }
  };
  const LockService = { getScriptLock: () => ({ waitLock: () => { }, releaseLock: () => { } }) };
  const store = {};
  const CacheService = { getScriptCache: () => ({ get: k => store['c_' + k] || null, put: (k, v) => { store['c_' + k] = v; } }) };
  const props = {};
  const PropertiesService = { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) };
  const pad = n => String(n).padStart(2, '0');
  const Utilities = { formatDate: d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) };
  const gids = {};
  const People = { People: { searchDirectoryPeople: o => { const d = gids[String(o.query).toLowerCase()];
    return d ? { people: [{ emailAddresses: [{ value: o.query }], names: [{ metadata: { primary: true }, givenName: d[0], familyName: d[1] }] }] } : {}; } } };
  return { gids, People, SpreadsheetApp, Session, LockService, CacheService, PropertiesService, Utilities, book };
})();
var SpreadsheetApp = GASFAKE.SpreadsheetApp, Session = GASFAKE.Session, LockService = GASFAKE.LockService,
    CacheService = GASFAKE.CacheService, People = GASFAKE.People, PropertiesService = GASFAKE.PropertiesService, Utilities = GASFAKE.Utilities;
if (typeof module !== 'undefined') module.exports = GASFAKE;
