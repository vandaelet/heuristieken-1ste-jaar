/* =====================================================================
   Heuristieken eerste jaar – vragenbank
   Opbouw volgens de module Problem solving (Level 1):
   4 stappen (begrijpen, plannen, uitvoeren, terugkijken) en
   4 heuristieken (een schets maken, vereenvoudigen van het probleem,
   uitproberen van verschillende oplossingen, een patroon zoeken).

   Alle problemen zijn eigen vragen in de stijl van wiskundewedstrijden
   (5 antwoordmogelijkheden, 3, 4 of 5 punten). Elke vraag wordt gemaakt
   door een generator met een seed: dezelfde (id, seed, stroom) geeft
   altijd dezelfde vraag, zodat de server de juiste antwoorden bijhoudt.
   ===================================================================== */
var HEUR = (function () {

  const STAPPEN = [
    { key: 'begrijpen', nr: 1, naam: 'Begrijpen', tekst: 'Lees de opgave goed. Wat is gegeven? Wat wordt er gevraagd?' },
    { key: 'plannen', nr: 2, naam: 'Plannen', tekst: 'Denk na welke heuristiek je kan helpen: een schets maken, vereenvoudigen, uitproberen of een patroon zoeken.' },
    { key: 'uitvoeren', nr: 3, naam: 'Uitvoeren', tekst: 'Los het probleem op met de methode die je gekozen hebt.' },
    { key: 'terugkijken', nr: 4, naam: 'Terugkijken', tekst: 'Is je antwoord mogelijk? Controleer je oplossing. Kan het ook op een andere manier?' }
  ];

  const H = [
    { key: 'schets', nr: 1, naam: 'Een schets maken', kort: 'Schets',
      wat: 'Je tekent de situatie: een lijn, een rij, een plattegrond, een schema of twee overlappende cirkels. Zo zie je wat er gebeurt, ook als je het in je hoofd nog niet ziet.',
      wanneer: ['Er staan dingen naast elkaar, in een rij of in een kring.', 'Er is sprake van afstanden, palen, bomen, strepen of tussenruimtes.', 'Er zijn groepen die elkaar overlappen (sommigen doen allebei).', 'Je moet een volgorde of een route volgen.'],
      signalen: ['rondom', 'tussen', 'naast elkaar', 'in een rij', 'in een kring', 'allebei / zowel … als', 'eerst … dan …'] },
    { key: 'vereenvoudigen', nr: 2, naam: 'Vereenvoudigen van het probleem', kort: 'Vereenvoudigen',
      wat: 'Je maakt het probleem eenvoudiger: je verschuift stukken van een figuur, je groepeert getallen slim, of je lost eerst dezelfde vraag op met kleinere getallen.',
      wanneer: ['Er zijn heel veel getallen of heel grote getallen.', 'Een figuur heeft veel kleine stukjes die je kan verschuiven of samenleggen.', 'Je kan getallen in handige paren of groepen zetten.', 'Je kan eerst een klein voorbeeld proberen (met 4 in plaats van 64).'],
      signalen: ['1 + 2 + 3 + … + 100', 'heel veel', 'trapvormig', 'telkens', 'samen', 'gekleurd deel'] },
    { key: 'uitproberen', nr: 3, naam: 'Uitproberen van verschillende oplossingen', kort: 'Uitproberen',
      wat: 'Je probeert mogelijke antwoorden uit en controleert of ze aan alle voorwaarden voldoen. Antwoorden die niet kunnen, schrap je. Met de 5 keuzes van een wedstrijdvraag gaat dat vaak snel.',
      wanneer: ['Er zijn een paar voorwaarden waaraan het antwoord moet voldoen.', 'Je zoekt twee aantallen die samen iets geven (dieren en poten, munten).', 'Je zoekt een getal met bepaalde eigenschappen.', 'Iemand liegt of spreekt de waarheid.'],
      signalen: ['deelbaar door', 'samen', 'meer dan … en minder dan', 'liegt', 'welk getal', 'zoveel keer zo oud'] },
    { key: 'patroon', nr: 4, naam: 'Een patroon zoeken', kort: 'Patroon',
      wat: 'Je schrijft de eerste stappen uit en zoekt wat zich herhaalt of hoe het telkens groeit. Daarna hoef je niet alles uit te rekenen: je springt meteen naar de gevraagde stap.',
      wanneer: ['Iets herhaalt zich telkens (dagen, kleuren, letters).', 'Een rij figuren wordt telkens groter.', 'Er wordt gevraagd naar de 50ste, 100ste of 2026ste stap.', 'Iets gebeurt elke dag of elke beurt opnieuw.'],
      signalen: ['de 100ste', 'na 2026 keer', 'figuur 30', 'elke dag', 'telkens', 'volgens hetzelfde patroon'] }
  ];
  const HK = {}; H.forEach(h => { HK[h.key] = h; });

  /* ---------- toeval met seed ---------- */
  function makeRng(seed) {
    let a = (seed >>> 0) || 1;
    const f = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    f.shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
    return f;
  }
  const r2 = x => Math.round(x * 100 + (x >= 0 ? 1e-9 : -1e-9)) / 100;
  function fmt(x, dec) {
    let s = dec === undefined ? String(r2(x)) : r2(x).toFixed(dec);
    let neg = s[0] === '-'; if (neg) s = s.slice(1);
    let [ip, dp] = s.split('.'); ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + (dp ? ip + ',' + dp : ip);
  }
  const eur = x => '€ ' + fmt(x, 2);
  const NAMEN = ['Lina', 'Noah', 'Mila', 'Seppe', 'Yara', 'Jules', 'Fien', 'Rayan', 'Lotte', 'Wout', 'Amira', 'Bram', 'Nora', 'Mats', 'Ines', 'Kobe', 'Elif', 'Finn', 'Hanne', 'Vic'];
  const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

  /* 5 verschillende getallen: juist + 4 afleiders (kandidaten eerst, anders buren) */
  function vijf(juist, kand, r) {
    const out = [juist];
    const heel = Number.isInteger(juist);
    kand.forEach(k => { if (out.length < 5 && typeof k === 'number' && isFinite(k) && k > 0 && (!heel || Number.isInteger(k)) && out.indexOf(r2(k)) < 0) out.push(r2(k)); });
    let d = 1; while (out.length < 5) { [juist + d, juist - d].forEach(k => { if (out.length < 5 && k > 0 && out.indexOf(k) < 0) out.push(k); }); d++; }
    return out;
  }

  const GEN = [];
  /* def(id, hoofdheuristiek, alle bruikbare heuristieken, {A: punten, B: punten} (ontbreekt = niet voor die stroom), signaal, make) */
  function def(id, hoofd, heur, punten, signaal, make) { GEN.push({ id, hoofd, heur, punten, signaal, make }); }

  /* =================================================================
     1. EEN SCHETS MAKEN
     ================================================================= */
  def('palen-veld', 'schets', ['schets'], { A: 4, B: 3 }, '“rondom” en “om de … meter”: teken het veld en zet de palen erop.', (r, B) => {
    const d = B ? r.pick([2, 5]) : r.pick([4, 5, 6, 8]);
    const l = d * (B ? r.int(3, 6) : r.int(6, 15)), b = d * (B ? r.int(2, 4) : r.int(3, 8)), j = 2 * (l + b) / d;
    return {
      tekst: ['Boer Jef zet een omheining rond een rechthoekig weiland van ' + l + ' m lang en ' + b + ' m breed.', 'Hij plaatst een paal in elke hoek en daartussen om de ' + d + ' meter een paal.', 'Hoeveel palen heeft hij nodig?'],
      juist: j, opties: vijf(j, [j + 4, j - 4, j + 2, (l + b) / d, j + 1], r),
      stappen: {
        begrijpen: 'Gegeven: een rechthoek van ' + l + ' m op ' + b + ' m, palen om de ' + d + ' m, ook in de hoeken. Gevraagd: het aantal palen rondom.',
        plannen: 'Maak een schets van het weiland en zet een paar palen. Let op de hoekpalen: die horen bij twee zijden tegelijk.',
        uitvoeren: 'De omtrek is 2 × (' + l + ' + ' + b + ') = ' + 2 * (l + b) + ' m. Rondom een gesloten figuur is het aantal palen gelijk aan het aantal stukken van ' + d + ' m: ' + 2 * (l + b) + ' : ' + d + ' = ' + j + '.',
        terugkijken: 'Controle per zijde: een lange zijde heeft ' + (l / d + 1) + ' palen (met beide hoeken), een korte zijde nog ' + (b / d - 1) + ' palen zonder hoeken. 2 × ' + (l / d + 1) + ' + 2 × ' + (b / d - 1) + ' = ' + j + '.'
      },
      tip: 'Teken de rechthoek. Tel je de hoekpalen niet dubbel?'
    };
  });

  def('bomen-weg', 'schets', ['schets', 'vereenvoudigen'], { A: 3, B: 3 }, '“begint en eindigt met” en “om de … meter”: teken de rij.', (r, B) => {
    const d = r.pick([5, 6, 8, 10]), n = r.int(B ? 4 : 8, B ? 9 : 20), L = d * n, twee = !B && r() < 0.6;
    const j = (n + 1) * (twee ? 2 : 1);
    return {
      tekst: ['Langs ' + (twee ? 'beide kanten van ' : '') + 'een fietspad van ' + L + ' m worden bomen geplant.', 'Aan het begin en aan het einde komt een boom en daartussen staat om de ' + d + ' meter een boom.', 'Hoeveel bomen worden er geplant?'],
      juist: j, opties: vijf(j, twee ? [2 * n, 2 * n + 4, n + 1, 2 * n + 1] : [n, n + 2, n - 1, 2 * n], r),
      stappen: {
        begrijpen: 'Gegeven: ' + L + ' m, om de ' + d + ' m een boom, ook aan begin en einde' + (twee ? ', aan beide kanten' : '') + '. Gevraagd: het aantal bomen.',
        plannen: 'Maak een schets van een kort stuk: bij 2 stukken van ' + d + ' m staan er al 3 bomen. Er staat altijd één boom meer dan er stukken zijn.',
        uitvoeren: L + ' : ' + d + ' = ' + n + ' stukken, dus ' + (n + 1) + ' bomen' + (twee ? ' aan één kant, en 2 × ' + (n + 1) + ' = ' + j + ' aan beide kanten.' : '.'),
        terugkijken: 'Bij een open rij (met een begin en een einde) heb je één boom meer dan stukken. Bij een gesloten kring is dat niet zo.'
      },
      tip: 'Teken een kort stuk met 2 of 3 stukken. Hoeveel bomen staan er dan?'
    };
  });

  def('zebrapad', 'schets', ['schets'], { A: 3, B: 3 }, '“tussen twee strepen” en “begint en eindigt met”: teken de strepen.', (r, B) => {
    const n = r.int(B ? 4 : 6, B ? 6 : 10), w = r.pick([40, 50, 60]), g = r.pick([40, 50, 60]), j = n * w + (n - 1) * g;
    const m = !B;
    const val = x => m ? r2(x / 100) : x;
    return {
      tekst: ['Een zebrapad heeft ' + n + ' witte strepen van ' + w + ' cm breed.', 'Tussen twee witte strepen is er telkens ' + g + ' cm asfalt. Het zebrapad begint en eindigt met een witte streep.', 'Hoe breed is het zebrapad in totaal' + (m ? ', in meter?' : ', in cm?')],
      juist: val(j), eenheid: m ? 'm' : 'cm', opties: vijf(val(j), [val(n * (w + g)), val(n * w + (n + 1) * g), val(n * w), val(j + g)], r).map(x => r2(x)),
      stappen: {
        begrijpen: 'Gegeven: ' + n + ' strepen van ' + w + ' cm, daartussen telkens ' + g + ' cm. Gevraagd: de totale breedte.',
        plannen: 'Teken de strepen: wit, asfalt, wit, asfalt, …, wit. Hoeveel stukken asfalt zijn er?',
        uitvoeren: 'Tussen ' + n + ' strepen liggen ' + (n - 1) + ' stukken asfalt. ' + n + ' × ' + w + ' + ' + (n - 1) + ' × ' + g + ' = ' + j + ' cm' + (m ? ' = ' + fmt(j / 100) + ' m.' : '.'),
        terugkijken: 'Er is altijd één tussenruimte minder dan strepen, omdat je begint en eindigt met wit.'
      },
      tip: 'Teken 3 strepen. Hoeveel stukken asfalt liggen ertussen?'
    };
  });

  def('rij-kinderen', 'schets', ['schets'], { A: 3, B: 3 }, '“de 7de van voren en de 12de van achteren”: teken de rij.', (r, B) => {
    const a = r.int(4, B ? 10 : 18), b = r.int(4, B ? 10 : 18), nm = r.pick(NAMEN), j = a + b - 1;
    return {
      tekst: ['De leerlingen staan in één rij aan de bushalte.', nm + ' staat op de ' + a + 'de plaats van voren en op de ' + b + 'de plaats van achteren.', 'Hoeveel leerlingen staan er in de rij?'],
      juist: j, opties: vijf(j, [a + b, a + b + 1, a + b - 2, Math.abs(a - b) || a + b + 2], r),
      stappen: {
        begrijpen: 'Gegeven: ' + nm + ' is de ' + a + 'de van voren en de ' + b + 'de van achteren. Gevraagd: het aantal leerlingen.',
        plannen: 'Teken de rij met ' + nm + ' als een kruisje. Wie staat er voor en wie achter?',
        uitvoeren: 'Voor ' + nm + ' staan ' + (a - 1) + ' leerlingen, achter ' + nm + ' staan er ' + (b - 1) + '. Samen met ' + nm + ': ' + (a - 1) + ' + 1 + ' + (b - 1) + ' = ' + j + '.',
        terugkijken: 'Als je ' + a + ' + ' + b + ' doet, tel je ' + nm + ' twee keer. Daarom ' + a + ' + ' + b + ' − 1.'
      },
      tip: 'Teken de rij. Hoeveel keer tel je ' + nm + ' als je ' + a + ' + ' + b + ' doet?'
    };
  });

  def('kring', 'schets', ['schets'], { A: 4 }, '“in een kring”, “links van” en “rechts van”: teken de kring.', r => {
    const a = r.int(3, 9), b = r.int(a + 2, 15), x = r.pick(NAMEN), y = r.pick(NAMEN.filter(n => n !== x)), j = a + b;
    return {
      tekst: ['Een groep kinderen staat in een kring.', x + ' is het ' + a + 'de kind links van ' + y + ', en ook het ' + b + 'de kind rechts van ' + y + '.', 'Hoeveel kinderen staan er in de kring?'],
      juist: j, opties: vijf(j, [j - 1, j + 1, j - 2, j + 2], r),
      stappen: {
        begrijpen: 'Gegeven: links tel je ' + a + ' plaatsen van ' + y + ' tot ' + x + ', rechts ' + b + ' plaatsen. Gevraagd: het aantal kinderen.',
        plannen: 'Teken een kring met ' + y + ' bovenaan. Ga links rond tot ' + x + ' en rechts rond tot ' + x + '.',
        uitvoeren: 'Links rond zet je ' + a + ' stappen, rechts rond ' + b + ' stappen, en samen ben je één keer helemaal rond. Een kring met ' + j + ' kinderen heeft precies ' + j + ' stappen: ' + a + ' + ' + b + ' = ' + j + '.',
        terugkijken: 'Controle met een kleine kring: in een kring van 5 is een kind dat 2 plaatsen links staat, 3 plaatsen rechts. 2 + 3 = 5.'
      },
      tip: 'Teken een kleine kring van 5 of 6 kinderen. Wat zie je?'
    };
  });

  def('venn', 'schets', ['schets'], { A: 4, B: 4 }, '“sommigen doen allebei”: teken twee overlappende cirkels.', (r, B) => {
    const n = B ? r.int(20, 26) : r.int(24, 30), c = r.int(3, 7), s = c + r.int(4, 9), m = c + r.int(3, 8);
    const geen = n - (s + m - c);
    if (geen < 1) return null;
    const vraagGeen = r() < 0.5;
    const j = vraagGeen ? geen : s - c;
    return {
      tekst: ['In een klas zitten ' + n + ' leerlingen. ' + s + ' leerlingen sporten in een club en ' + m + ' leerlingen spelen een muziekinstrument.', c + ' leerlingen doen allebei.', vraagGeen ? 'Hoeveel leerlingen sporten niet in een club en spelen ook geen instrument?' : 'Hoeveel leerlingen sporten in een club maar spelen geen instrument?'],
      juist: j, opties: vijf(j, vraagGeen ? [n - s - m, c, geen + c, n - s - m + 2 * c, s + m - c] : [s, c, s + c, m - c, s - 2 * c], r),
      stappen: {
        begrijpen: 'Gegeven: ' + n + ' leerlingen, ' + s + ' sporten, ' + m + ' muziek, ' + c + ' allebei. Gevraagd: ' + (vraagGeen ? 'wie geen van beide doet.' : 'wie alleen sport.'),
        plannen: 'Teken twee cirkels die overlappen: sport en muziek. Zet ' + c + ' in het overlappende stuk.',
        uitvoeren: 'Alleen sport: ' + s + ' − ' + c + ' = ' + (s - c) + '. Alleen muziek: ' + m + ' − ' + c + ' = ' + (m - c) + '. Samen in de cirkels: ' + (s - c) + ' + ' + c + ' + ' + (m - c) + ' = ' + (s + m - c) + (vraagGeen ? '. Geen van beide: ' + n + ' − ' + (s + m - c) + ' = ' + geen + '.' : '.'),
        terugkijken: 'Tel alle vakjes van je schets op: ' + (s - c) + ' + ' + c + ' + ' + (m - c) + ' + ' + geen + ' = ' + n + '. Dat klopt met de klas.'
      },
      tip: 'Twee overlappende cirkels. Welk getal hoort in het midden?'
    };
  });

  def('zagen', 'schets', ['schets', 'vereenvoudigen'], { A: 4, B: 3 }, '“in stukken zagen”: teken de balk met de zaagsneden.', (r, B) => {
    const s = r.pick([1, 2, 3]), n = r.int(B ? 4 : 6, B ? 6 : 12), L = s * n, t = r.pick([2, 3, 4, 5]), j = (n - 1) * t;
    return {
      tekst: ['Een balk van ' + L + ' meter wordt in stukken van ' + s + ' meter gezaagd.', 'Elke zaagsnede duurt ' + t + ' minuten.', 'Hoeveel minuten duurt het om de hele balk in stukken te zagen?'],
      juist: j, opties: vijf(j, [n * t, (n + 1) * t, (n - 2) * t, L * t], r), eenheid: 'minuten',
      stappen: {
        begrijpen: 'Gegeven: ' + L + ' m, stukken van ' + s + ' m, ' + t + ' minuten per snede. Gevraagd: de totale tijd.',
        plannen: 'Teken de balk en duid de zaagsneden aan. Zijn er evenveel sneden als stukken?',
        uitvoeren: 'Je krijgt ' + L + ' : ' + s + ' = ' + n + ' stukken. Daarvoor zijn ' + (n - 1) + ' sneden nodig. ' + (n - 1) + ' × ' + t + ' = ' + j + ' minuten.',
        terugkijken: 'Met 1 snede heb je 2 stukken. Er is altijd één snede minder dan stukken.'
      },
      tip: 'Hoeveel sneden heb je nodig om 2 stukken te krijgen? En 3 stukken?'
    };
  });

  def('trap-treden', 'schets', ['schets'], { B: 3, A: 3 }, '“eerst … dan …”: teken de trap of een getallenlijn.', (r, B) => {
    const n = r.int(15, 25), k = r.int(5, n - 8), a = r.int(3, 7), b = r.int(2, a + 3), c = r.int(2, 6);
    const j = k + a - b + c; if (j < 1 || j > n || k + a > n) return null;
    const nm = r.pick(NAMEN);
    return {
      tekst: ['Een trap heeft ' + n + ' treden. ' + nm + ' staat op trede ' + k + '.', nm + ' gaat ' + a + ' treden omhoog, dan ' + b + ' treden omlaag en daarna nog ' + c + ' treden omhoog.', 'Op welke trede staat ' + nm + ' nu?'],
      juist: j, opties: vijf(j, [k + a + b + c, j + 1, j - 1, a - b + c, j + 2], r),
      stappen: {
        begrijpen: 'Gegeven: start op trede ' + k + ', +' + a + ', −' + b + ', +' + c + '. Gevraagd: de trede op het einde.',
        plannen: 'Teken een getallenlijn of een trap en zet elke beweging als een pijl.',
        uitvoeren: k + ' + ' + a + ' = ' + (k + a) + ', − ' + b + ' = ' + (k + a - b) + ', + ' + c + ' = ' + j + '.',
        terugkijken: 'In totaal ging ' + nm + ' ' + (a - b + c) + ' treden omhoog: ' + k + ' + ' + (a - b + c) + ' = ' + j + '.'
      },
      tip: 'Zet de bewegingen op een getallenlijn.'
    };
  });

  def('tafel', 'schets', ['schets', 'uitproberen'], { A: 5 }, 'Twee situaties met dezelfde voorwerpen: teken beide situaties naast elkaar.', r => {
    const T = r.int(12, 18) * 5, d = r.int(2, 5) * 5, x = T + d, y = T - d;
    return {
      tekst: ['Een kat zit op de tafel en een hond zit op de grond. De kop van de kat zit ' + x + ' cm hoger dan de kop van de hond.', 'Ze wisselen van plaats: nu zit de hond op de tafel en de kat op de grond. De kop van de hond zit nu ' + y + ' cm hoger dan de kop van de kat.', 'Hoe hoog is de tafel?'],
      juist: T, opties: vijf(T, [x, y, x - y, T + 10, T - 10], r), eenheid: 'cm',
      stappen: {
        begrijpen: 'Gegeven: twee hoogteverschillen, ' + x + ' cm en ' + y + ' cm. Gevraagd: de hoogte van de tafel.',
        plannen: 'Teken beide situaties naast elkaar. Wat gebeurt er als je de twee tekeningen op elkaar zet?',
        uitvoeren: 'Tel beide situaties op: de kat en de hond staan er telkens één keer op de grond en één keer op de tafel. Wat overblijft, is twee keer de tafel: ' + x + ' + ' + y + ' = ' + (x + y) + ' cm, dus de tafel is ' + (x + y) + ' : 2 = ' + T + ' cm.',
        terugkijken: 'Het verschil tussen de kat en de hond is ' + d + ' cm. Kat op tafel: ' + T + ' + ' + d + ' = ' + x + '. Hond op tafel: ' + T + ' − ' + d + ' = ' + y + '. Klopt.'
      },
      tip: 'Teken beide situaties. Tel de twee verschillen eens op.'
    };
  });

  def('handdrukken', 'schets', ['schets', 'vereenvoudigen', 'patroon'], { A: 4 }, '“iedereen geeft iedereen een hand”: teken punten en verbind ze, begin met weinig personen.', r => {
    const n = r.int(6, 12), j = n * (n - 1) / 2;
    return {
      tekst: [n + ' vrienden komen samen op een feestje.', 'Iedereen geeft iedereen precies één keer een hand.', 'Hoeveel handdrukken worden er gegeven?'],
      juist: j, opties: vijf(j, [n * (n - 1), n * n, n * (n + 1) / 2, (n - 1) * (n - 1), 2 * n], r),
      stappen: {
        begrijpen: 'Gegeven: ' + n + ' personen, iedereen geeft iedereen één keer een hand. Gevraagd: het aantal handdrukken.',
        plannen: 'Teken de personen als punten en elke handdruk als een lijn. Begin met 3 of 4 personen.',
        uitvoeren: 'De eerste geeft ' + (n - 1) + ' handen, de tweede nog ' + (n - 2) + ' nieuwe, … de laatste geen nieuwe meer. ' + (n - 1) + ' + ' + (n - 2) + ' + … + 1 = ' + j + '.',
        terugkijken: 'Iedereen geeft ' + (n - 1) + ' handen: ' + n + ' × ' + (n - 1) + ' = ' + n * (n - 1) + ', maar zo tel je elke handdruk twee keer. ' + n * (n - 1) + ' : 2 = ' + j + '.'
      },
      tip: 'Teken 4 punten en verbind ze allemaal. Hoeveel lijnen tel je?'
    };
  });

  def('rangorde', 'schets', ['schets', 'uitproberen'], { A: 3, B: 3 }, '“groter dan” en “kleiner dan”: zet de namen op een lijn.', r => {
    const ns = r.shuffle(NAMEN).slice(0, 4); // ns[0] grootste
    const rel = [[0, 1], [1, 2], [2, 3]].map(p => r() < 0.5 ? ns[p[0]] + ' is groter dan ' + ns[p[1]] + '.' : ns[p[1]] + ' is kleiner dan ' + ns[p[0]] + '.');
    const opts = ns.slice().sort().concat(['Dat kan je niet weten']);
    return {
      tekst: r.shuffle(rel).concat(['Wie is de op één na grootste?']),
      juist: ns[1], opties: opts, tekstOpties: true,
      stappen: {
        begrijpen: 'Gegeven: drie vergelijkingen tussen vier kinderen. Gevraagd: wie op de tweede plaats staat.',
        plannen: 'Zet de namen op een verticale lijn: de grootste bovenaan.',
        uitvoeren: 'Van groot naar klein: ' + ns.join(', ') + '. De op één na grootste is ' + ns[1] + '.',
        terugkijken: 'Lees elke zin nog eens en controleer hem met je lijn.'
      },
      tip: 'Teken een ladder en zet elk kind op de juiste plaats.'
    };
  });

  def('wandeling', 'schets', ['schets'], { A: 4 }, '“blokken noord, oost, zuid, west”: teken de route op een rooster.', r => {
    const N = r.int(2, 6), O = r.int(3, 8), Z = r.int(N + 1, N + 6), W = r.int(1, O - 1), j = (Z - N) + (O - W);
    const nm = r.pick(NAMEN);
    return {
      tekst: [nm + ' wandelt in een stad met rechte straten.', nm + ' stapt ' + N + ' blokken naar het noorden, dan ' + O + ' blokken naar het oosten, dan ' + Z + ' blokken naar het zuiden en tot slot ' + W + ' blokken naar het westen.', 'Hoeveel blokken moet ' + nm + ' minstens stappen om langs de straten terug te keren naar het vertrekpunt?'],
      juist: j, opties: vijf(j, [N + O + Z + W, Z - N, O - W, N + O, j + 2], r),
      stappen: {
        begrijpen: 'Gegeven: de route in vier stukken. Gevraagd: de kortste weg terug langs de straten.',
        plannen: 'Teken de route op ruitjespapier.',
        uitvoeren: 'Noord en zuid samen: ' + Z + ' − ' + N + ' = ' + (Z - N) + ' blokken te ver naar het zuiden. Oost en west samen: ' + O + ' − ' + W + ' = ' + (O - W) + ' blokken te ver naar het oosten. Terug: ' + (Z - N) + ' + ' + (O - W) + ' = ' + j + ' blokken.',
        terugkijken: 'Op je tekening tel je de blokjes van het eindpunt tot het vertrekpunt: ' + j + '.'
      },
      tip: 'Teken de route op ruitjespapier.'
    };
  });

  /* =================================================================
     2. VEREENVOUDIGEN VAN HET PROBLEEM
     ================================================================= */
  def('trap-omtrek', 'vereenvoudigen', ['vereenvoudigen', 'schets'], { A: 3, B: 4 }, 'Een trapvormige figuur: verschuif de kleine stukjes tot een rechthoek.', (r, B) => {
    const k = r.int(3, 5), sw = r.int(2, B ? 3 : 4), sh = r.int(1, B ? 3 : 4), W = k * sw, Hh = k * sh, j = 2 * (W + Hh);
    return {
      tekst: ['De figuur is een trap met ' + k + ' treden. Elke trede is ' + sw + ' cm breed en ' + sh + ' cm hoog.', 'De hele trap is dus ' + W + ' cm breed en ' + Hh + ' cm hoog.', 'Wat is de omtrek van de figuur?'],
      fig: { t: 'trap', k, sw, sh }, juist: j, opties: vijf(j, [W + Hh, j + 2 * k, j - 2, W * Hh / 2, 2 * W + Hh], r), eenheid: 'cm',
      stappen: {
        begrijpen: 'Gegeven: een trap van ' + W + ' cm breed en ' + Hh + ' cm hoog. Gevraagd: de omtrek, de lengte van de hele rand.',
        plannen: 'Alle kleine treden apart optellen kan, maar het gaat sneller: verschuif de horizontale stukjes naar boven en de verticale stukjes naar rechts.',
        uitvoeren: 'Na het verschuiven heb je de rand van een rechthoek van ' + W + ' cm op ' + Hh + ' cm. Omtrek: 2 × (' + W + ' + ' + Hh + ') = ' + j + ' cm.',
        terugkijken: 'Tel na: onderaan ' + W + ', links ' + Hh + ', de treden samen ' + W + ' horizontaal en ' + Hh + ' verticaal. ' + W + ' + ' + Hh + ' + ' + W + ' + ' + Hh + ' = ' + j + '.'
      },
      tip: 'Schuif de korte stukjes naar buiten. Welke figuur krijg je?'
    };
  });

  def('hap-omtrek', 'vereenvoudigen', ['vereenvoudigen', 'schets'], { A: 3, B: 3 }, 'Een figuur met een hap uit de hoek: verschuif de randen.', (r, B) => {
    const l = r.int(B ? 8 : 10, B ? 14 : 24), b = r.int(B ? 5 : 6, B ? 9 : 14), x = r.int(2, Math.floor(l / 2)), y = r.int(2, Math.floor(b / 2)), j = 2 * (l + b);
    return {
      tekst: ['Uit een rechthoekig stuk karton van ' + l + ' cm op ' + b + ' cm knipt Ilse een rechthoekje van ' + x + ' cm op ' + y + ' cm weg, in een hoek.', 'Wat is de omtrek van het stuk karton dat overblijft?'],
      fig: { t: 'hap', l, b, x, y }, juist: j, opties: vijf(j, [j - 2 * (x + y), j + 2 * (x + y), j - x - y, l * b - x * y], r), eenheid: 'cm',
      stappen: {
        begrijpen: 'Gegeven: een rechthoek ' + l + ' × ' + b + ' met een hap van ' + x + ' × ' + y + ' in een hoek. Gevraagd: de omtrek van wat overblijft.',
        plannen: 'De rand in de hap kan je naar buiten schuiven: dan krijg je opnieuw de rand van de grote rechthoek.',
        uitvoeren: 'De twee randjes van de hap (' + x + ' cm en ' + y + ' cm) vervangen precies de stukken die weg zijn. De omtrek blijft 2 × (' + l + ' + ' + b + ') = ' + j + ' cm.',
        terugkijken: 'De oppervlakte wordt wel kleiner, maar de omtrek blijft even groot. Oppervlakte en omtrek zijn twee verschillende dingen.'
      },
      tip: 'Duw de hoek van de hap naar buiten. Wat gebeurt er met de rand?'
    };
  });

  def('som-1-n', 'vereenvoudigen', ['vereenvoudigen', 'patroon'], { A: 4 }, 'Heel veel getallen optellen: zet ze in handige paren.', r => {
    const n = r.pick([20, 30, 40, 50, 60, 80, 100]), j = n * (n + 1) / 2;
    return {
      tekst: ['Bereken 1 + 2 + 3 + 4 + … + ' + (n - 1) + ' + ' + n + '.'],
      juist: j, opties: vijf(j, [n * n / 2, n * (n - 1) / 2, n * (n + 1), n * n], r),
      stappen: {
        begrijpen: 'Gevraagd: de som van alle natuurlijke getallen van 1 tot en met ' + n + '.',
        plannen: 'Alles één voor één optellen duurt te lang. Maak paren: de kleinste met de grootste.',
        uitvoeren: '1 + ' + n + ' = ' + (n + 1) + ', 2 + ' + (n - 1) + ' = ' + (n + 1) + ', … Er zijn ' + n / 2 + ' paren van ' + (n + 1) + ': ' + n / 2 + ' × ' + (n + 1) + ' = ' + j + '.',
        terugkijken: 'Controle met een klein voorbeeld: 1 + 2 + 3 + 4 = 10, en met paren: 2 × 5 = 10. Het werkt.'
      },
      tip: 'Tel de eerste en de laatste op. En de tweede en de voorlaatste?'
    };
  });

  def('som-afwisselend', 'vereenvoudigen', ['vereenvoudigen', 'patroon'], { A: 5 }, 'Lange som met plus en min: groepeer telkens twee getallen.', r => {
    const n = r.pick([20, 40, 50, 60, 100]), j = n / 2;
    return {
      tekst: ['Bereken ' + n + ' − ' + (n - 1) + ' + ' + (n - 2) + ' − ' + (n - 3) + ' + … + 4 − 3 + 2 − 1.'],
      juist: j, opties: vijf(j, [n, 1, j + 1, j - 1, 2 * n - 1], r),
      stappen: {
        begrijpen: 'Gevraagd: de uitkomst van een lange rij met afwisselend plus en min, van ' + n + ' tot 1.',
        plannen: 'Groepeer telkens twee getallen: (' + n + ' − ' + (n - 1) + ') + (' + (n - 2) + ' − ' + (n - 3) + ') + …',
        uitvoeren: 'Elk paar is 1. Er zijn ' + n + ' getallen, dus ' + j + ' paren. De uitkomst is ' + j + '.',
        terugkijken: 'Klein voorbeeld: 4 − 3 + 2 − 1 = 2 = 4 : 2. Klopt.'
      },
      tip: 'Zet haakjes rond telkens twee getallen.'
    };
  });

  def('cijfers-tellen', 'vereenvoudigen', ['vereenvoudigen', 'patroon'], { A: 4 }, 'Tellen tot 100: kijk eerst naar 1 tot 10 of 1 tot 20.', r => {
    const c = r.int(2, 9), j = 20;
    return {
      tekst: ['Jonas schrijft alle getallen van 1 tot en met 100 op een lang blad.', 'Hoeveel keer schrijft hij het cijfer ' + c + '?'],
      juist: j, opties: vijf(j, [10, 11, 19, 21, 18], r),
      stappen: {
        begrijpen: 'Gevraagd: hoe vaak het cijfer ' + c + ' voorkomt in alle getallen van 1 tot 100.',
        plannen: 'Vereenvoudig: tel apart hoe vaak ' + c + ' een eenheid is en hoe vaak het een tiental is.',
        uitvoeren: 'Als eenheid: ' + c + ', 1' + c + ', 2' + c + ', …, 9' + c + ': 10 keer. Als tiental: ' + c + '0 tot ' + c + '9: 10 keer. Samen 20 keer (in ' + c + c + ' staat het cijfer twee keer).',
        terugkijken: 'Let op: ' + c + c + ' telt voor 2. Wie 19 vindt, vergat dat.'
      },
      tip: 'Tel eerst de eenheden, dan de tientallen.'
    };
  });

  def('toernooi', 'vereenvoudigen', ['vereenvoudigen', 'schets'], { A: 4, B: 4 }, 'Veel ploegen: probeer eerst met 4 ploegen.', (r, B) => {
    const n = B ? r.pick([8, 16]) : r.pick([16, 32, 64, 24, 40]), j = n - 1;
    return {
      tekst: ['Op een tennistoernooi spelen ' + n + ' spelers. Wie een wedstrijd verliest, ligt eruit. Wie wint, speelt verder' + (n & (n - 1) ? ' (soms mag een speler een ronde overslaan)' : '') + '.', 'Op het einde blijft er één winnaar over.', 'Hoeveel wedstrijden worden er in totaal gespeeld?'],
      juist: j, opties: vijf(j, [n, n / 2, n + 1, n - 2, 2 * n], r),
      stappen: {
        begrijpen: 'Gegeven: ' + n + ' spelers, wie verliest ligt eruit. Gevraagd: het aantal wedstrijden.',
        plannen: 'Vereenvoudig: wat gebeurt er met 4 spelers? Of denk aan wat elke wedstrijd doet.',
        uitvoeren: 'Elke wedstrijd heeft precies één verliezer. Op het einde zijn er ' + (n - 1) + ' verliezers en 1 winnaar. Dus ' + j + ' wedstrijden.',
        terugkijken: 'Met 4 spelers: 2 halve finales + 1 finale = 3 = 4 − 1.'
      },
      tip: 'Hoeveel spelers vallen af per wedstrijd?'
    };
  });

  def('broodjes', 'vereenvoudigen', ['vereenvoudigen', 'uitproberen'], { A: 5 }, 'Twee bestellingen met dezelfde dingen: tel ze samen.', r => {
    const b = r.int(18, 35) / 10, d = r.int(12, 25) / 10, p1 = r2(3 * b + 2 * d), p2 = r2(2 * b + 3 * d), j = r2(b + d);
    return {
      tekst: ['3 broodjes en 2 drankjes kosten samen ' + eur(p1) + '.', '2 broodjes en 3 drankjes kosten samen ' + eur(p2) + '.', 'Hoeveel kosten 1 broodje en 1 drankje samen?'],
      juist: j, opties: vijf(j, [r2((p1 + p2) / 2), r2(p1 - p2), r2(j + 0.5), r2(j - 0.5), r2((p1 + p2) / 10)], r), euro: true,
      stappen: {
        begrijpen: 'Gegeven: twee bestellingen. Gevraagd: de prijs van 1 broodje + 1 drankje.',
        plannen: 'Je hoeft de prijs van een broodje niet apart te kennen. Tel beide bestellingen samen.',
        uitvoeren: 'Samen: 5 broodjes en 5 drankjes kosten ' + eur(p1) + ' + ' + eur(p2) + ' = ' + eur(p1 + p2) + '. Dat is 5 keer (1 broodje + 1 drankje): ' + eur(p1 + p2) + ' : 5 = ' + eur(j) + '.',
        terugkijken: 'Een broodje kost ' + eur(b) + ' en een drankje ' + eur(d) + ': ' + eur(b) + ' + ' + eur(d) + ' = ' + eur(j) + '.'
      },
      tip: 'Tel de twee bestellingen eens op.'
    };
  });

  def('kubus-verf', 'vereenvoudigen', ['vereenvoudigen', 'schets', 'patroon'], { A: 5 }, 'Een grote kubus: kijk eerst naar een 3 × 3 × 3-kubus.', r => {
    const n = r.int(4, 6), soort = r.pick(['geen', 'een']);
    const j = soort === 'geen' ? Math.pow(n - 2, 3) : 6 * (n - 2) * (n - 2);
    return {
      tekst: ['Een grote kubus is gemaakt van ' + n * n * n + ' kleine blokjes (' + n + ' × ' + n + ' × ' + n + ').', 'De buitenkant van de grote kubus wordt rood geverfd. Daarna valt de kubus uit elkaar in de kleine blokjes.', soort === 'geen' ? 'Hoeveel kleine blokjes hebben helemaal geen rode verf?' : 'Hoeveel kleine blokjes hebben precies één rood zijvlak?'],
      juist: j, opties: vijf(j, [Math.pow(n - 2, 3), 6 * (n - 2) * (n - 2), Math.pow(n - 1, 3), n * n * n - Math.pow(n - 2, 3), 12 * (n - 2), 6 * n * n], r),
      stappen: {
        begrijpen: 'Gegeven: een ' + n + ' × ' + n + ' × ' + n + '-kubus, buitenkant geverfd. Gevraagd: blokjes met ' + (soort === 'geen' ? 'geen verf.' : 'precies één rood vlak.'),
        plannen: 'Vereenvoudig: bekijk eerst een 3 × 3 × 3-kubus. Waar zitten de blokjes zonder verf, en met één rood vlak?',
        uitvoeren: soort === 'geen' ? 'Zonder verf zijn de blokjes binnenin: als je rondom een laag weghaalt, blijft een kubus van ' + (n - 2) + ' × ' + (n - 2) + ' × ' + (n - 2) + ' = ' + j + ' over.' : 'Eén rood vlak hebben de blokjes in het midden van elk zijvlak (niet aan een rand): per zijvlak ' + (n - 2) + ' × ' + (n - 2) + ' = ' + (n - 2) * (n - 2) + ', en er zijn 6 zijvlakken: ' + j + '.',
        terugkijken: 'Bij 3 × 3 × 3: 1 blokje zonder verf en 6 met één rood vlak. Klopt met de formule.'
      },
      tip: 'Teken een 3 × 3 × 3-kubus. Waar zit het blokje dat geen verf krijgt?'
    };
  });

  def('half-gekleurd', 'vereenvoudigen', ['vereenvoudigen', 'schets'], { A: 3, B: 3 }, '“welk deel is gekleurd”: verschuif of vouw stukken.', (r, B) => {
    const v = r.int(0, 1);
    return {
      tekst: v ? ['In een rechthoek is een driehoek gekleurd. De onderkant van de driehoek is de onderkant van de rechthoek. De top van de driehoek ligt ergens op de bovenkant.', 'Welk deel van de rechthoek is gekleurd?'] : ['Een vierkant wordt verdeeld door de twee diagonalen. Twee driehoeken die tegenover elkaar liggen, zijn gekleurd.', 'Welk deel van het vierkant is gekleurd?'],
      fig: { t: v ? 'driehoek' : 'diag', top: r.int(20, 80) },
      juist: '50 %', opties: ['25 %', '33 %', '40 %', '50 %', '60 %'], tekstOpties: true,
      stappen: {
        begrijpen: 'Gevraagd: welk deel (in %) gekleurd is.',
        plannen: v ? 'Trek een verticale lijn vanuit de top naar beneden. Je krijgt twee kleine rechthoeken.' : 'Tel de stukken die even groot zijn.',
        uitvoeren: v ? 'Elke kleine rechthoek wordt door een zijde van de driehoek in twee gelijke helften verdeeld. In elke kleine rechthoek is dus de helft gekleurd: 50 %.' : 'De diagonalen verdelen het vierkant in 4 even grote driehoeken. 2 van de 4 zijn gekleurd: 50 %.',
        terugkijken: v ? 'Oppervlakte driehoek = basis × hoogte : 2, en de rechthoek = basis × hoogte. Dat is precies de helft.' : '2 van de 4 gelijke delen is de helft.'
      },
      tip: v ? 'Trek een hulplijn vanuit de top.' : 'In hoeveel gelijke stukken verdelen de diagonalen het vierkant?'
    };
  });

  /* =================================================================
     3. UITPROBEREN VAN VERSCHILLENDE OPLOSSINGEN
     ================================================================= */
  def('kippen-konijnen', 'uitproberen', ['uitproberen', 'schets'], { A: 4, B: 4 }, 'Twee soorten met samen een aantal en een totaal: probeer mogelijkheden.', (r, B) => {
    const k = r.int(B ? 6 : 10, B ? 12 : 25), c = r.int(2, k - 2), p = 2 * (k - c) + 4 * c;
    return {
      tekst: ['Op de boerderij lopen kippen en konijnen. Samen zijn het ' + k + ' dieren.', 'Ze hebben samen ' + p + ' poten.', 'Hoeveel konijnen zijn er?'],
      juist: c, opties: vijf(c, [k - c, p / 4, Math.round(p / 6), c + 2, c - 2], r),
      stappen: {
        begrijpen: 'Gegeven: ' + k + ' dieren, ' + p + ' poten. Kippen hebben 2 poten, konijnen 4. Gevraagd: het aantal konijnen.',
        plannen: 'Probeer de antwoorden uit: neem een aantal konijnen, reken de poten uit en vergelijk met ' + p + '.',
        uitvoeren: 'Met ' + c + ' konijnen en ' + (k - c) + ' kippen: ' + c + ' × 4 + ' + (k - c) + ' × 2 = ' + 4 * c + ' + ' + 2 * (k - c) + ' = ' + p + ' poten. Klopt.',
        terugkijken: 'Slimme controle: als alle ' + k + ' dieren kippen waren, had je ' + 2 * k + ' poten. Er zijn er ' + (p - 2 * k) + ' meer, en elk konijn geeft 2 poten extra: ' + (p - 2 * k) + ' : 2 = ' + c + '.'
      },
      tip: 'Probeer een antwoord uit. Hoeveel poten krijg je dan?'
    };
  });

  def('leeftijd', 'uitproberen', ['uitproberen'], { A: 3, B: 3 }, '“zoveel keer zo oud” en “samen”: probeer de antwoorden.', (r, B) => {
    const m = r.pick([2, 3, 4, 5]), jan = r.int(6, 13), S = jan * (m + 1), nm = r.pick(NAMEN);
    return {
      tekst: ['Mama is ' + m + ' keer zo oud als ' + nm + '.', 'Samen zijn ze ' + S + ' jaar.', 'Hoe oud is ' + nm + '?'],
      juist: jan, opties: vijf(jan, [S / m, Math.round(S / 2), jan + 2, jan - 2, jan * m], r), eenheid: 'jaar',
      stappen: {
        begrijpen: 'Gegeven: mama = ' + m + ' × ' + nm + ', samen ' + S + '. Gevraagd: de leeftijd van ' + nm + '.',
        plannen: 'Probeer de antwoorden: neem een leeftijd, maak ze ' + m + ' keer zo groot en tel op.',
        uitvoeren: 'Met ' + jan + ': mama is ' + m + ' × ' + jan + ' = ' + m * jan + ', samen ' + jan + ' + ' + m * jan + ' = ' + S + '. Klopt.',
        terugkijken: 'Samen zijn ze ' + (m + 1) + ' “delen” van de leeftijd van ' + nm + ': ' + S + ' : ' + (m + 1) + ' = ' + jan + '.'
      },
      tip: 'Kies een antwoord en controleer: klopt het totaal?'
    };
  });

  function cijfersom(x) { return String(x).split('').reduce((a, c) => a + Number(c), 0); }
  def('getal-raden', 'uitproberen', ['uitproberen'], { A: 4, B: 4 }, 'Een getal met meerdere eigenschappen: controleer elke keuze.', r => {
    for (let tries = 0; tries < 60; tries++) {
      const d = r.pick([3, 4, 6]), x = d * r.int(3, 16); if (x < 12 || x > 96) continue;
      const even = x % 2 === 0, s = cijfersom(x);
      const ok = y => y % d === 0 && (y % 2 === 0) === even && cijfersom(y) === s;
      const pool = []; for (let y = 10; y < 100; y++) if (y !== x && !ok(y)) pool.push(y);
      const near = r.shuffle(pool.filter(y => (y % d === 0) || cijfersom(y) === s)).slice(0, 4);
      if (near.length < 4) continue;
      return {
        tekst: ['Ik denk aan een getal van twee cijfers.', 'Het is ' + (even ? 'even' : 'oneven') + ' en deelbaar door ' + d + '.', 'Als je de twee cijfers optelt, krijg je ' + s + '.', 'Aan welk getal denk ik?'],
        juist: x, opties: [x].concat(near),
        stappen: {
          begrijpen: 'Drie voorwaarden: ' + (even ? 'even' : 'oneven') + ', deelbaar door ' + d + ', cijfersom ' + s + '. Gevraagd: het getal.',
          plannen: 'Probeer elke keuze uit en schrap ze zodra één voorwaarde niet klopt.',
          uitvoeren: x + ': ' + (even ? 'even' : 'oneven') + ', ' + x + ' : ' + d + ' = ' + x / d + ', ' + String(x).split('').join(' + ') + ' = ' + s + '. Alle drie kloppen.',
          terugkijken: 'Bij de andere keuzes klopt telkens minstens één voorwaarde niet.'
        },
        tip: 'Schrap eerst de keuzes met de verkeerde cijfersom.'
      };
    }
    return null;
  });

  def('munten', 'uitproberen', ['uitproberen'], { A: 3, B: 3 }, 'Twee soorten munten met een aantal en een totaal: probeer uit.', (r, B) => {
    const n = r.int(B ? 5 : 7, B ? 9 : 15), twee = r.int(2, n - 2), T = n + twee, nm = r.pick(NAMEN);
    return {
      tekst: [nm + ' heeft ' + n + ' munten in de spaarpot: alleen munten van 1 euro en van 2 euro.', 'Samen is dat ' + T + ' euro.', 'Hoeveel munten van 2 euro heeft ' + nm + '?'],
      juist: twee, opties: vijf(twee, [n - twee, Math.round(T / 2), twee + 1, twee - 1], r),
      stappen: {
        begrijpen: 'Gegeven: ' + n + ' munten, samen € ' + T + '. Gevraagd: het aantal munten van 2 euro.',
        plannen: 'Probeer de keuzes uit: hoeveel geld is het dan?',
        uitvoeren: twee + ' munten van 2 euro en ' + (n - twee) + ' van 1 euro: ' + 2 * twee + ' + ' + (n - twee) + ' = ' + T + ' euro. Klopt.',
        terugkijken: 'Als alle ' + n + ' munten 1 euro waren, had je € ' + n + '. Je hebt € ' + (T - n) + ' meer, en elke munt van 2 euro geeft 1 euro extra: ' + twee + '.'
      },
      tip: 'Neem een keuze en reken het bedrag uit.'
    };
  });

  def('opeenvolgend', 'uitproberen', ['uitproberen', 'vereenvoudigen'], { A: 3, B: 3 }, '“opeenvolgende getallen” met een gegeven som: probeer uit of neem het middelste.', (r, B) => {
    const k = r.pick(B ? [3] : [3, 5]), mid = r.int(B ? 8 : 15, B ? 25 : 60), S = mid * k, j = mid + (k - 1) / 2;
    return {
      tekst: ['De som van ' + k + ' opeenvolgende natuurlijke getallen is ' + S + '.', 'Wat is het grootste van die getallen?'],
      juist: j, opties: vijf(j, [mid, j + 1, mid - 1, Math.round(S / 2)], r),
      stappen: {
        begrijpen: 'Gegeven: ' + k + ' getallen na elkaar, samen ' + S + '. Gevraagd: het grootste.',
        plannen: 'Probeer een keuze: als het grootste ' + j + ' is, welke getallen heb je dan? Of vereenvoudig: het middelste getal is het gemiddelde.',
        uitvoeren: 'Het middelste getal is ' + S + ' : ' + k + ' = ' + mid + '. De getallen zijn ' + Array.from({ length: k }, (_, i) => mid - (k - 1) / 2 + i).join(', ') + '. Het grootste is ' + j + '.',
        terugkijken: Array.from({ length: k }, (_, i) => mid - (k - 1) / 2 + i).join(' + ') + ' = ' + S + '. Klopt.'
      },
      tip: 'Wat is het middelste getal?'
    };
  });

  const LEUGEN = [
    { regel: 'Precies één van hen spreekt de waarheid.', waar: 1, zin: [[1, 'heeft het gedaan.'], ['zelf', 'Ik was het niet.'], ['zelf', 'Ik was het niet.']] },
    { regel: 'Precies één van hen liegt.', waar: 2, zin: [[1, 'heeft het gedaan.'], [2, 'heeft het gedaan.'], ['zelf', 'Ik was het niet.']] },
    { regel: 'Precies twee van hen liegen.', waar: 1, zin: [['zelf', 'Ik was het niet.'], [0, 'heeft het gedaan.'], [1, 'was het niet.']] }
  ];
  function leugenOplossing(s) {
    const ok = [];
    for (let dader = 0; dader < 3; dader++) {
      const w = s.zin.map((z, i) => z[0] === 'zelf' ? (z[1] === 'Ik was het.' ? dader === i : dader !== i) : (z[1] === 'heeft het gedaan.' ? dader === z[0] : dader !== z[0]));
      if (w.filter(x => x).length === s.waar) ok.push(dader);
    }
    return ok;
  }
  def('leugenaars', 'uitproberen', ['uitproberen'], { A: 5 }, '“liegt” of “spreekt de waarheid”: probeer elke persoon als dader.', r => {
    const s = r.pick(LEUGEN), ns = r.shuffle(NAMEN).slice(0, 3), sol = leugenOplossing(s);
    if (sol.length !== 1) return null;
    const zin = s.zin.map((z, i) => ns[i] + ': “' + (z[0] === 'zelf' ? z[1] : ns[z[0]] + ' ' + z[1]) + '”');
    return {
      tekst: ['Iemand heeft het laatste stuk taart opgegeten. ' + ns.join(', ').replace(/, ([^,]*)$/, ' en $1') + ' zeggen:'].concat(zin, [s.regel, 'Wie heeft de taart opgegeten?']),
      juist: ns[sol[0]], opties: ns.slice().sort().concat([ns.slice(0, 2).sort().join(' of '), 'Dat kan je niet weten']), tekstOpties: true,
      stappen: {
        begrijpen: 'Gegeven: drie uitspraken en de regel: ' + s.regel.toLowerCase() + ' Gevraagd: wie de dader is.',
        plannen: 'Probeer elke persoon als dader. Kijk telkens welke uitspraken waar zijn en welke gelogen.',
        uitvoeren: [0, 1, 2].map(d => 'Als ' + ns[d] + ' de dader is, ' + (sol[0] === d ? 'klopt de regel.' : 'klopt de regel niet.')).join(' ') + ' Dus ' + ns[sol[0]] + '.',
        terugkijken: 'Er mag maar één persoon overblijven bij wie alles klopt. Controleer die nog eens zin per zin.'
      },
      tip: 'Stel: ' + ns[0] + ' heeft het gedaan. Welke zinnen zijn dan waar?'
    };
  });

  def('fles-kurk', 'uitproberen', ['uitproberen', 'schets'], { A: 4 }, '“samen” en “… meer dan”: probeer uit, het snelle antwoord klopt vaak niet.', r => {
    const k = r.pick([5, 10, 15, 20, 25]) / 100, V = r.pick([1, 2, 3]), f = V + k, T = r2(f + k);
    return {
      tekst: ['Een fles en een kurk kosten samen ' + eur(T) + '.', 'De fles kost ' + eur(V) + ' meer dan de kurk.', 'Hoeveel kost de kurk?'],
      juist: r2(k), opties: vijf(r2(k), [r2(T - V), r2(k / 2), r2(k + 0.05), r2(T / 2)], r), euro: true,
      stappen: {
        begrijpen: 'Gegeven: samen ' + eur(T) + ', de fles kost ' + eur(V) + ' meer. Gevraagd: de prijs van de kurk.',
        plannen: 'Het snelle antwoord is ' + eur(T - V) + '. Probeer het uit!',
        uitvoeren: 'Met een kurk van ' + eur(T - V) + ' kost de fles ' + eur(T - V + V) + ' en samen ' + eur(2 * (T - V) + V) + ': te veel. Met een kurk van ' + eur(k) + ' kost de fles ' + eur(f) + ', samen ' + eur(T) + '. Klopt.',
        terugkijken: 'Zonder het verschil van ' + eur(V) + ' blijft ' + eur(T - V) + ' over voor twee keer de kurk: ' + eur(T - V) + ' : 2 = ' + eur(k) + '.'
      },
      tip: 'Controleer het antwoord dat meteen in je opkomt.'
    };
  });

  def('weegschaal', 'uitproberen', ['uitproberen', 'schets'], { A: 4 }, 'Dingen die even zwaar zijn als andere dingen: probeer uit.', r => {
    const a = 20 * r.int(4, 9), p = 1.5 * a, M = a + p;
    return {
      tekst: ['3 appels wegen evenveel als 2 peren.', '1 appel en 1 peer wegen samen ' + M + ' g.', 'Hoeveel weegt 1 appel?'],
      juist: a, opties: vijf(a, [p, M / 2, M / 3, a + 20, a - 20], r), eenheid: 'g',
      stappen: {
        begrijpen: 'Gegeven: 3 appels = 2 peren, 1 appel + 1 peer = ' + M + ' g. Gevraagd: het gewicht van 1 appel.',
        plannen: 'Probeer de keuzes: neem een gewicht voor de appel, reken de peer uit en controleer.',
        uitvoeren: 'Appel ' + a + ' g: 3 appels = ' + 3 * a + ' g, dus 1 peer = ' + 3 * a + ' : 2 = ' + p + ' g. Samen ' + a + ' + ' + p + ' = ' + M + ' g. Klopt.',
        terugkijken: 'Een peer is anderhalve appel. Dus 1 appel + 1 peer = 2,5 appels = ' + M + ' g, en 1 appel = ' + M + ' : 2,5 = ' + a + ' g.'
      },
      tip: 'Kies een gewicht voor de appel. Hoeveel weegt de peer dan?'
    };
  });

  def('tickets', 'uitproberen', ['uitproberen'], { A: 4, B: 3 }, 'Twee prijzen, een aantal en een totaal: probeer uit.', (r, B) => {
    const v = r.pick([8, 9, 10, 12]), k = r.pick([4, 5, 6]), n = r.int(B ? 6 : 8, B ? 10 : 16), a = r.int(2, n - 2), T = a * v + (n - a) * k;
    return {
      tekst: ['Een ticket voor de cinema kost ' + v + ' euro voor een volwassene en ' + k + ' euro voor een kind.', 'Een groep koopt ' + n + ' tickets en betaalt in totaal ' + T + ' euro.', 'Hoeveel volwassenen zitten er in de groep?'],
      juist: a, opties: vijf(a, [n - a, Math.round(T / v), a + 1, a - 1, Math.round(T / (v + k))], r),
      stappen: {
        begrijpen: 'Gegeven: ' + n + ' tickets, € ' + T + ', volwassene € ' + v + ', kind € ' + k + '. Gevraagd: het aantal volwassenen.',
        plannen: 'Probeer de keuzes uit en reken telkens het totaal uit.',
        uitvoeren: a + ' volwassenen en ' + (n - a) + ' kinderen: ' + a + ' × ' + v + ' + ' + (n - a) + ' × ' + k + ' = ' + a * v + ' + ' + (n - a) * k + ' = ' + T + '. Klopt.',
        terugkijken: 'Als iedereen een kind was: ' + n + ' × ' + k + ' = ' + n * k + '. Er is ' + (T - n * k) + ' euro meer, en elke volwassene kost ' + (v - k) + ' euro meer: ' + (T - n * k) + ' : ' + (v - k) + ' = ' + a + '.'
      },
      tip: 'Kies een aantal volwassenen. Klopt het totaal?'
    };
  });

  def('omgekeerd-getal', 'uitproberen', ['uitproberen'], { A: 5 }, 'Een getal met voorwaarden op de cijfers: probeer de keuzes.', r => {
    const a = r.int(1, 6), b = r.int(a + 1, 9), s = a + b, x = 10 * a + b, d = 9 * (b - a);
    const opts = [x]; for (let t = 1; t <= 9 && opts.length < 5; t++) { const u = s - t; if (u >= 0 && u <= 9 && t !== a) opts.push(10 * t + u); }
    if (opts.length < 5) return null;
    return {
      tekst: ['Een getal van twee cijfers heeft als cijfersom ' + s + '.', 'Als je de twee cijfers van plaats verwisselt, krijg je een getal dat ' + d + ' groter is.', 'Welk getal is het?'],
      juist: x, opties: opts,
      stappen: {
        begrijpen: 'Gegeven: cijfersom ' + s + ', omgekeerd is ' + d + ' groter. Gevraagd: het getal.',
        plannen: 'Alle keuzes hebben cijfersom ' + s + '. Probeer elke keuze: draai de cijfers om en reken het verschil uit.',
        uitvoeren: x + ' wordt ' + (10 * b + a) + ', en ' + (10 * b + a) + ' − ' + x + ' = ' + d + '. Klopt.',
        terugkijken: 'Het omgekeerde moet groter zijn, dus het eerste cijfer is het kleinste. Dat schrapt meteen een paar keuzes.'
      },
      tip: 'Moet het eerste cijfer groter of kleiner zijn dan het tweede?'
    };
  });

  /* =================================================================
     4. EEN PATROON ZOEKEN
     ================================================================= */
  def('slak', 'patroon', ['patroon', 'schets'], { A: 4, B: 4 }, '“elke dag … en elke nacht …”: schrijf de eerste dagen uit.', (r, B) => {
    const u = r.int(3, 6), d = r.int(1, u - 1), D = (u - d) * r.int(B ? 3 : 4, B ? 6 : 10) + u, j = (D - u) / (u - d) + 1;
    return {
      tekst: ['Een slak zit op de bodem van een put van ' + D + ' meter diep.', 'Elke dag kruipt ze ' + u + ' meter omhoog. Elke nacht glijdt ze ' + d + ' meter terug naar beneden.', 'Op welke dag bereikt de slak de bovenrand van de put?'],
      juist: j, opties: vijf(j, [D / (u - d), j - 1, j + 1, Math.ceil(D / u), j + 2], r),
      stappen: {
        begrijpen: 'Gegeven: ' + D + ' m diep, overdag +' + u + ' m, ’s nachts −' + d + ' m. Gevraagd: op welke dag ze boven is.',
        plannen: 'Schrijf de eerste dagen uit: waar is de slak ’s avonds en ’s morgens? Zoek het patroon.',
        uitvoeren: 'Elke dag en nacht samen: +' + (u - d) + ' m. Maar op de laatste dag hoeft ze niet meer terug te glijden. Na ' + (j - 1) + ' volle dagen zit ze ’s morgens op ' + (j - 1) * (u - d) + ' m. Op dag ' + j + ' kruipt ze ' + u + ' m en is ze op ' + D + ' m: boven.',
        terugkijken: 'Wie ' + D + ' : ' + (u - d) + ' = ' + fmt(D / (u - d)) + ' rekent, vergeet dat de slak op de laatste dag niet meer zakt.'
      },
      tip: 'Schrijf uit: dag 1 avond, dag 2 morgen, dag 2 avond, …'
    };
  });

  def('lucifers', 'patroon', ['patroon', 'schets'], { A: 4, B: 3 }, '“figuur 1, 2, 3, …” en de vraag naar een verre figuur: zoek hoe het telkens groeit.', (r, B) => {
    const n = r.int(B ? 8 : 15, B ? 15 : 40), j = 3 * n + 1;
    return {
      tekst: ['Met lucifers leg je vierkantjes naast elkaar, zoals in de tekening.', 'Voor 1 vierkantje heb je 4 lucifers nodig, voor 2 vierkantjes 7 lucifers, voor 3 vierkantjes 10 lucifers.', 'Hoeveel lucifers heb je nodig voor ' + n + ' vierkantjes naast elkaar?'],
      fig: { t: 'lucifers' }, juist: j, opties: vijf(j, [4 * n, 3 * n, 3 * n + 2, 4 * n - 1, 3 * n - 1], r),
      stappen: {
        begrijpen: 'Gegeven: 4, 7, 10 lucifers voor 1, 2, 3 vierkantjes. Gevraagd: het aantal voor ' + n + ' vierkantjes.',
        plannen: 'Zoek een patroon: hoeveel lucifers komen er telkens bij?',
        uitvoeren: 'Telkens komen er 3 lucifers bij. Je begint met 1 lucifer links en per vierkantje leg je er 3 bij: 1 + 3 × ' + n + ' = ' + j + '.',
        terugkijken: 'Controle met 3 vierkantjes: 1 + 3 × 3 = 10. Klopt met de tekening.'
      },
      tip: 'Hoeveel lucifers komen er telkens bij?'
    };
  });

  def('laatste-cijfer', 'patroon', ['patroon', 'vereenvoudigen'], { A: 5 }, 'Een macht met een heel grote exponent: schrijf de eerste machten uit.', r => {
    const b = r.pick([2, 3, 7, 8]), n = r.int(30, 2026);
    const cyc = []; let x = b % 10; for (let i = 0; i < 4; i++) { cyc.push(x); x = (x * b) % 10; }
    const j = cyc[(n - 1) % 4];
    const opts = Array.from(new Set(cyc)); [0, 1, 5, 9, 4, 6].forEach(c => { if (opts.length < 5 && opts.indexOf(c) < 0) opts.push(c); });
    return {
      tekst: ['Op welk cijfer eindigt ' + b + '^' + n + '?', '(' + b + '^' + n + ' betekent ' + b + ' × ' + b + ' × … × ' + b + ', met ' + n + ' factoren ' + b + '.)'],
      juist: j, opties: opts.slice(0, 5),
      stappen: {
        begrijpen: 'Gevraagd: het laatste cijfer van een heel groot getal.',
        plannen: 'Je kan ' + b + '^' + n + ' nooit uitrekenen. Schrijf de eerste machten uit en kijk alleen naar het laatste cijfer.',
        uitvoeren: 'Laatste cijfers: ' + cyc.join(', ') + ', ' + cyc.join(', ') + ', … Het patroon herhaalt zich na 4 stappen. ' + n + ' : 4 = ' + Math.floor(n / 4) + ' rest ' + (n % 4) + ', dus het laatste cijfer is ' + j + '.',
        terugkijken: 'Controle met een kleine exponent: ' + b + '^' + ((n - 1) % 4 + 1) + ' = ' + Math.pow(b, (n - 1) % 4 + 1) + ' eindigt ook op ' + j + '.'
      },
      tip: 'Bereken ' + b + '^1, ' + b + '^2, ' + b + '^3, ' + b + '^4, ' + b + '^5. Wat herhaalt zich?'
    };
  });

  def('letters-draaien', 'patroon', ['patroon'], { A: 4 }, '“na 2026 keer”: schrijf de eerste stappen uit tot je terug bij het begin bent.', r => {
    const w = r.pick(['WISKU', 'LEVEL', 'ZEBRA', 'KANGO', 'PIRAM']).split(''), n = r.int(30, 2026);
    const rot = k => { const s = ((k % 5) + 5) % 5; return w.slice(5 - s).concat(w.slice(0, 5 - s)).join(''); };
    const j = rot(n), opts = [0, 1, 2, 3, 4].map(rot);
    if (new Set(opts).size < 5) return null;
    return {
      tekst: ['Lien schrijft het woord ' + w.join('') + '.', 'Bij elke stap zet ze de laatste letter vooraan. Na 1 stap staat er ' + rot(1) + ', na 2 stappen ' + rot(2) + '.', 'Wat staat er na ' + n + ' stappen?'],
      juist: j, opties: opts.sort(), tekstOpties: true,
      stappen: {
        begrijpen: 'Gegeven: elke stap gaat de laatste letter vooraan. Gevraagd: het woord na ' + n + ' stappen.',
        plannen: n + ' stappen uitschrijven kan niet. Schrijf de eerste stappen uit tot het oorspronkelijke woord terugkomt.',
        uitvoeren: 'Na 5 stappen staat er weer ' + w.join('') + '. ' + n + ' : 5 = ' + Math.floor(n / 5) + ' rest ' + (n % 5) + ', dus je krijgt hetzelfde als na ' + (n % 5) + ' stap(pen): ' + j + '.',
        terugkijken: 'Na 10, 15, 20, … stappen staat er ook weer ' + w.join('') + '. Dat klopt met het patroon.'
      },
      tip: 'Na hoeveel stappen staat het woord er terug?'
    };
  });

  def('kalender', 'patroon', ['patroon'], { A: 4, B: 3 }, '“… dagen later”: de dagen herhalen zich elke 7 dagen.', (r, B) => {
    const d0 = r.int(0, 6), k = B ? r.int(15, 60) : r.int(60, 400), j = DAGEN[(d0 + k) % 7];
    const opts = [j]; [1, -1, 2, 3, -2].forEach(s => { const x = DAGEN[(((d0 + k + s) % 7) + 7) % 7]; if (opts.length < 5 && opts.indexOf(x) < 0) opts.push(x); });
    return {
      tekst: ['Vandaag is het ' + DAGEN[d0] + '.', 'Welke dag is het over ' + k + ' dagen?'],
      juist: j, opties: DAGEN.filter(x => opts.indexOf(x) >= 0), tekstOpties: true,
      stappen: {
        begrijpen: 'Gegeven: vandaag ' + DAGEN[d0] + '. Gevraagd: de dag over ' + k + ' dagen.',
        plannen: 'De dagen van de week herhalen zich elke 7 dagen. Na 7, 14, 21, … dagen is het weer ' + DAGEN[d0] + '.',
        uitvoeren: k + ' : 7 = ' + Math.floor(k / 7) + ' rest ' + (k % 7) + '. Na ' + 7 * Math.floor(k / 7) + ' dagen is het weer ' + DAGEN[d0] + ', en dan nog ' + (k % 7) + ' dag(en) verder: ' + j + '.',
        terugkijken: 'Tel de laatste ' + (k % 7) + ' dag(en) op je vingers verder vanaf ' + DAGEN[d0] + '.'
      },
      tip: 'Na hoeveel dagen is het weer ' + DAGEN[d0] + '?'
    };
  });

  def('kralen', 'patroon', ['patroon'], { A: 3, B: 3 }, '“volgens hetzelfde patroon” en “de 100ste”: zoek hoe lang het patroon is.', (r, B) => {
    const kleuren = r.shuffle(['rood', 'blauw', 'geel', 'groen', 'wit', 'zwart', 'paars']);
    const len = r.int(3, 5), pat = []; for (let i = 0; i < len; i++) pat.push(kleuren[i % Math.min(len, 4)]);
    if (len === 4 && r() < 0.5) pat[1] = pat[0];
    const n = r.int(B ? 20 : 50, B ? 60 : 300), j = pat[(n - 1) % len];
    const opts = Array.from(new Set(pat)); kleuren.forEach(k => { if (opts.length < 5 && opts.indexOf(k) < 0) opts.push(k); });
    const toon = []; for (let i = 0; i < 2 * len; i++) toon.push(pat[i % len]);
    return {
      tekst: ['Mira rijgt kralen aan een ketting, altijd in dezelfde volgorde:', toon.join(', ') + ', …', 'Welke kleur heeft de ' + n + 'ste kraal?'],
      juist: j, opties: opts.sort(), tekstOpties: true,
      stappen: {
        begrijpen: 'Gegeven: een kleurenpatroon dat zich herhaalt. Gevraagd: de kleur van kraal ' + n + '.',
        plannen: 'Zoek hoe lang het patroon is voor het zich herhaalt.',
        uitvoeren: 'Het patroon (' + pat.join(', ') + ') telt ' + len + ' kralen. ' + n + ' : ' + len + ' = ' + Math.floor(n / len) + ' rest ' + (n % len) + '. ' + ((n % len) === 0 ? 'Rest 0: de laatste kraal van het patroon, ' + j + '.' : 'Rest ' + (n % len) + ': kraal nummer ' + (n % len) + ' van het patroon, ' + j + '.'),
        terugkijken: 'Kraal ' + len + ', ' + 2 * len + ', ' + 3 * len + ', … is telkens ' + pat[len - 1] + '. Controleer of dat past bij je antwoord.'
      },
      tip: 'Hoeveel kralen telt één keer het patroon?'
    };
  });

  def('tafels', 'patroon', ['patroon', 'schets'], { A: 4, B: 4 }, 'Tafels aan elkaar schuiven: teken er 1, 2, 3 en zoek het patroon.', (r, B) => {
    const t = r.int(B ? 5 : 8, B ? 10 : 20), P = 2 * t + 2;
    return {
      tekst: ['Aan een vierkante tafel kunnen 4 personen zitten, aan elke kant één.', 'Voor een feest worden de tafels in één lange rij tegen elkaar geschoven.', 'Hoeveel tafels heb je nodig zodat er precies ' + P + ' personen kunnen zitten?'],
      juist: t, opties: vijf(t, [P / 4, P / 2, t + 1, t - 1, Math.round(P / 3)], r),
      stappen: {
        begrijpen: 'Gegeven: 4 personen per losse tafel, tafels in een rij. Gevraagd: het aantal tafels voor ' + P + ' personen.',
        plannen: 'Teken 1, 2 en 3 tafels in een rij en tel de plaatsen. Zoek het patroon.',
        uitvoeren: '1 tafel: 4, 2 tafels: 6, 3 tafels: 8. Elke extra tafel geeft 2 plaatsen bij: t tafels geven 2 × t + 2 plaatsen. 2 × t + 2 = ' + P + ' geeft t = ' + t + '.',
        terugkijken: t + ' tafels: ' + t + ' personen aan elke lange kant en 1 aan elk uiteinde: ' + t + ' + ' + t + ' + 2 = ' + P + '.'
      },
      tip: 'Teken 2 en 3 tafels tegen elkaar. Hoeveel plaatsen komen er telkens bij?'
    };
  });

  def('blokkentrap', 'patroon', ['patroon', 'vereenvoudigen'], { A: 4 }, 'Een trap die telkens hoger wordt: zoek hoeveel blokjes er telkens bijkomen.', r => {
    const n = r.int(8, 15), j = n * (n + 1) / 2;
    return {
      tekst: ['Saar bouwt een trap met blokjes. Een trap met 1 trede is 1 blokje, met 2 treden 3 blokjes, met 3 treden 6 blokjes.', 'Hoeveel blokjes heeft ze nodig voor een trap met ' + n + ' treden?'],
      fig: { t: 'blokken' }, juist: j, opties: vijf(j, [n * n, n * (n - 1) / 2, 3 * n, j + n, 2 * n], r),
      stappen: {
        begrijpen: 'Gegeven: 1, 3, 6 blokjes voor 1, 2, 3 treden. Gevraagd: het aantal voor ' + n + ' treden.',
        plannen: 'Zoek het patroon: er komen telkens 2, dan 3, dan 4 blokjes bij.',
        uitvoeren: 'Een trap met ' + n + ' treden heeft kolommen van 1, 2, 3, …, ' + n + ' blokjes: 1 + 2 + … + ' + n + ' = ' + j + '.',
        terugkijken: 'Twee zulke trappen samen vormen een rechthoek van ' + n + ' op ' + (n + 1) + ': ' + n * (n + 1) + ' : 2 = ' + j + '.'
      },
      tip: 'Hoeveel blokjes komen er bij als de trap één trede hoger wordt?'
    };
  });

  def('stippen-v', 'patroon', ['patroon', 'schets'], { A: 3, B: 3 }, '“patroon met nummer 30”: kijk hoe elk patroon uit het vorige groeit.', (r, B) => {
    const n = r.int(B ? 10 : 20, B ? 20 : 60), j = 2 * n + 1;
    return {
      tekst: ['Met stippen worden V-vormen gemaakt. V-vorm 1 heeft 3 stippen, V-vorm 2 heeft 5 stippen, V-vorm 3 heeft 7 stippen.', 'Hoeveel stippen heeft V-vorm ' + n + '?'],
      fig: { t: 'v' }, juist: j, opties: vijf(j, [2 * n, 2 * n + 2, 3 * n, n + 2, 2 * n - 1], r),
      stappen: {
        begrijpen: 'Gegeven: 3, 5, 7 stippen. Gevraagd: het aantal stippen in V-vorm ' + n + '.',
        plannen: 'Hoe groeit de V? Kijk naar de punt onderaan en de twee armen.',
        uitvoeren: 'V-vorm ' + n + ' heeft 1 stip onderaan en twee armen van ' + n + ' stippen: 1 + 2 × ' + n + ' = ' + j + '.',
        terugkijken: 'Controle met V-vorm 3: 1 + 2 × 3 = 7. Klopt.'
      },
      tip: 'Hoeveel stippen heeft elke arm van V-vorm 3?'
    };
  });

  /* =================================================================
     Begrijpen: wat is gegeven, wat is nodig, wat is gevraagd?
     Elke opgave is opgedeeld in stukjes; de leerling duidt de stukjes aan
     die nodig zijn om het probleem op te lossen.
     ================================================================= */
  const BEGRIJP = [
    { id: 'b1', stukken: [['Elif fietst elke schooldag naar school.', 0], ['Haar school ligt 4 km van huis.', 1], ['Ze fietst met een rode fiets met 7 versnellingen.', 0], ['Ze fietst ’s morgens naar school en ’s avonds terug naar huis.', 1], ['Hoeveel kilometer fietst ze in een schoolweek van 5 dagen?', 2]] },
    { id: 'b2', stukken: [['In de klas van meneer Peeters zitten 24 leerlingen.', 1], ['Meneer Peeters is 42 jaar.', 0], ['Elke leerling krijgt 3 schriften.', 1], ['Een pak bevat 10 schriften.', 1], ['De schriften zijn blauw.', 0], ['Hoeveel pakken moet meneer Peeters minstens kopen?', 2]] },
    { id: 'b3', stukken: [['Een bus vertrekt om 8u15.', 1], ['Er zitten 32 reizigers op de bus.', 0], ['De rit naar Brugge duurt 1 uur en 20 minuten.', 1], ['Onderweg stopt de bus 6 keer.', 0], ['Hoe laat komt de bus in Brugge aan?', 2]] },
    { id: 'b4', stukken: [['Noah spaart voor een skateboard van 85 euro.', 1], ['Hij heeft al 25 euro.', 1], ['Zijn zus heeft 40 euro gespaard.', 0], ['Elke week krijgt hij 6 euro zakgeld en hij spaart alles.', 1], ['Hoeveel weken moet hij nog sparen?', 2]] },
    { id: 'b5', stukken: [['Een rechthoekige tuin is 12 m lang en 8 m breed.', 1], ['In de tuin staan 3 appelbomen.', 0], ['Rondom de tuin komt een haag.', 1], ['Een meter haag kost 15 euro.', 1], ['De buren hebben een vierkante tuin.', 0], ['Hoeveel kost de haag?', 2]] }
  ];

  /* ---------- publieke functies ---------- */
  const byId = {}; GEN.forEach(g => { byId[g.id] = g; });
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  function fmtOptie(q, v) {
    if (q.tekstOpties) return String(v);
    const s = q.euro ? eur(v) : fmt(v);
    return q.eenheid ? s + ' ' + q.eenheid : s;
  }
  function make(id, seed, stroom) {
    const g = byId[id]; if (!g) throw new Error('Onbekende vraag: ' + id);
    const B = stroom === 'B';
    let q = null, s = seed;
    for (let i = 0; i < 25 && !q; i++) { q = g.make(makeRng(s), B); s = s * 31 + 7; }
    if (!q) throw new Error('Geen vraag gemaakt: ' + id);
    let opts = q.opties.slice(0, 5);
    if (!q.tekstOpties) opts.sort((a, b) => a - b);
    const ans = opts.indexOf(q.juist);
    return { id, seed, stroom: B ? 'B' : 'A', hoofd: g.hoofd, heur: g.heur, signaal: g.signaal, punten: g.punten[B ? 'B' : 'A'] || g.punten.A || g.punten.B,
      tekst: q.tekst, fig: q.fig || null, opties: opts.map(v => fmtOptie(q, v)), ans, stappen: q.stappen, tip: q.tip };
  }
  function publicVersion(q, metTip) {
    const o = { id: q.id, punten: q.punten, tekst: q.tekst, fig: q.fig, opties: q.opties };
    if (metTip) o.tip = q.tip;
    return o;
  }
  function grade(q, keuze) {
    const k = keuze === '' || keuze === null || keuze === undefined ? null : Number(keuze);
    return { ok: k === q.ans, leeg: k === null, juist: q.ans, juistLetter: LETTERS[q.ans], stappen: q.stappen, hoofd: q.hoofd, heur: q.heur, signaal: q.signaal };
  }
  /* filter: de leerling kiest welke heuristiek(en) kunnen helpen.
     Juist als de hoofdheuristiek gekozen is en elke gekozen heuristiek bruikbaar is. */
  function gradeFilter(q, gekozen) {
    gekozen = [].concat(gekozen || []).filter(k => HK[k]);
    const ok = gekozen.indexOf(q.hoofd) >= 0 && gekozen.every(k => q.heur.indexOf(k) >= 0);
    return { ok, hoofd: q.hoofd, heur: q.heur, signaal: q.signaal, gekozen };
  }
  function pool(stroom, filt) {
    const B = stroom === 'B';
    return GEN.filter(g => (B ? g.punten.B : g.punten.A) && (!filt || filt(g)));
  }
  function randSeed() { return Math.floor(Math.random() * 2147483646) + 1; }
  function shuffleRand(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function niveau(g, stroom) { return g.punten[stroom === 'B' ? 'B' : 'A']; }

  /* oefenreeks: heuristiek optioneel, niveau 'basis' (3–4 punten) of 'verdieping' (5 punten) */
  function pickPractice(stroom, heur, deel, n, vorige) {
    let p = pool(stroom, g => (!heur || g.hoofd === heur));
    if (deel === 'verdieping') { const v = p.filter(g => niveau(g, stroom) === 5); if (v.length) p = v; }
    else if (deel === 'basis') { const v = p.filter(g => niveau(g, stroom) < 5); if (v.length) p = v; }
    const out = []; let last = vorige || null;
    for (let i = 0; i < n; i++) {
      let g, t = 0; do { g = p[Math.floor(Math.random() * p.length)]; t++; } while (p.length > 1 && g.id === last && t < 10);
      last = g.id; out.push({ id: g.id, seed: randSeed() });
    }
    return out;
  }
  /* wedstrijdreeks: per puntenwaarde een aantal vragen, verdeeld over de heuristieken */
  function pickReeks(stroom, perNiveau) {
    const items = [];
    [3, 4, 5].forEach(pt => {
      let p = shuffleRand(pool(stroom, g => niveau(g, stroom) === pt));
      if (!p.length) p = shuffleRand(pool(stroom, g => niveau(g, stroom) === (pt === 5 ? 4 : 3)));
      if (!p.length) return;
      const perH = {}; H.forEach(h => { perH[h.key] = p.filter(g => g.hoofd === h.key); });
      const order = shuffleRand(H.map(h => h.key)); let k = 0, gekozen = [];
      while (gekozen.length < perNiveau && k < 200) { const l = perH[order[k % 4]]; const g = l[Math.floor(k / 4) % (l.length || 1)]; if (g) gekozen.push(g); k++; }
      gekozen.forEach(g => items.push({ id: g.id, seed: randSeed(), pt }));
    });
    return items;
  }
  function begrijpItems() { return BEGRIJP.map(b => ({ id: b.id, stukken: b.stukken.map(s => s[0]) })); }
  function gradeBegrijp(id, nodig, vraag) {
    const b = BEGRIJP.find(x => x.id === id); if (!b) throw new Error('Onbekende oefening');
    const juistNodig = b.stukken.map((s, i) => s[1] === 1 ? i : -1).filter(i => i >= 0), juistVraag = b.stukken.findIndex(s => s[1] === 2);
    nodig = [].concat(nodig || []).map(Number);
    const okN = juistNodig.length === nodig.length && juistNodig.every(i => nodig.indexOf(i) >= 0);
    return { ok: okN && Number(vraag) === juistVraag, okNodig: okN, okVraag: Number(vraag) === juistVraag, nodig: juistNodig, vraag: juistVraag };
  }
  function info() { return { stappen: STAPPEN, heuristieken: H }; }

  return { STAPPEN, H, GEN, make, publicVersion, grade, gradeFilter, pickPractice, pickReeks, begrijpItems, gradeBegrijp, info, leugenOplossing, LEUGEN, fmt };
})();

if (typeof module !== 'undefined') module.exports = HEUR;
