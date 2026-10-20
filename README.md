# Heuristieken wiskunde · 1ste jaar

Oefensite voor Campus Lievegem (svsl.be) waarop leerlingen van het eerste jaar
**problemen leren oplossen met heuristieken**, als opstap naar wiskundewedstrijden
(Kangoeroe/Wallabie) en de Vlaamse toetsen.

De opbouw volgt de module *Problem solving* van Level: 4 stappen en 4 heuristieken.

| Onderdeel | Wat de leerling doet |
|---|---|
| **0. Probleemoplossen in 4 stappen** | begrijpen, plannen, uitvoeren, terugkijken; oefenen op *begrijpen*: per zin aanduiden of hij nodig, niet nodig of de vraag is |
| **1. Een schets maken** | uitleg, wanneer, signaalwoorden, uitgewerkt voorbeeld in 4 stappen |
| **2. Vereenvoudigen van het probleem** | daarna begeleid oefenen (heuristiek kiezen → tip → oplossen → terugkijken) |
| **3. Uitproberen van verschillende oplossingen** | en zelfstandig oefenen in de tabbladen *Basis en oefenen* en *Verdieping* |
| **4. Een patroon zoeken** | |
| **5. Filtertraining** | bij gemengde problemen de juiste heuristiek(en) aanvinken, met het signaal als feedback |
| **6. Kangoeroe-reeksen** | 12 gemengde vragen (4 × 3, 4 × 4, 4 × 5 punten), vijf keuzes, met klok en uitwerking achteraf |
| **Test** | aan/uit door de beheerder, met code, klassen, rondes en resultaten per klas en niveaugroep |

- Onderdelen gaan **stap voor stap** open: 3 juiste oefeningen in een onderdeel openen het volgende. Het aantal kan je aanpassen of uitzetten.
- **A- en B-stroom apart**: B-stroom krijgt eenvoudigere getallen en geen verdiepingsvragen van A-niveau. Je kiest in *Beheer › Instellingen* welke klassen B-stroom zijn; per leerling kan je het ook aanpassen.
- Alle 40 probleemtypes zijn **eigen vragen** in wedstrijdstijl (geen vragen van Kangoeroe, Wallabie of Level). Elk type maakt telkens nieuwe getallen.
- De juiste antwoorden en uitwerkingen blijven op de server. Leerlingen zien ze pas na het verbeteren.
- Namen komen uit het svsl-schoolaccount; leerlingen worden gesorteerd op familienaam.

## Installatie (Google Apps Script)

1. Maak in de Google Drive van je svsl.be-account een nieuwe **Google Sheet**, bv. *Heuristieken 1ste jaar*.
2. Kies **Extensies › Apps Script**.
3. Zet in de editor de bestanden uit de map [`dist/apps-script`](dist/apps-script):
   - `Code.gs`: vervang de inhoud van het bestaande `Code.gs`.
   - `Problemen.gs`: klik op **+ › Script**, noem het `Problemen` en plak de inhoud.
   - `Index.html`: klik op **+ › HTML**, noem het `Index` en plak de inhoud.
   - `appsscript.json`: zet bij **Projectinstellingen** *"appsscript.json-manifestbestand weergeven in editor"* aan en vervang de inhoud.
4. Klik links op **Services +** en voeg **People API** toe (als dat nog niet gebeurde via het manifest). Zo komen de namen uit het schoolaccount.
5. Kies bovenaan de functie `setup` en klik op **Uitvoeren**. Geef de gevraagde toestemmingen. De tabbladen van de Sheet worden aangemaakt.
6. **Implementeren › Nieuwe implementatie › Web-app**:
   - Uitvoeren als: **Ik**
   - Wie heeft toegang: **Iedereen binnen svsl.be**
7. Deel de webadres (eindigt op `/exec`) met de leerlingen, bv. via Smartschool of Classroom.

**Wijzigingen doorvoeren?** Na elke aanpassing aan de code: **Implementeren › Implementaties beheren › potloodje › Versie: Nieuwe versie › Implementeren**. Het `/exec`-adres blijft hetzelfde. Wil je eerst testen, gebruik dan de testimplementatie (`/dev`).

## Beheer

Wie het script implementeerde is automatisch beheerder. Extra beheerders voeg je toe in *Beheer › Instellingen* of in het tabblad **Beheerders** van de Sheet.

In het tabblad **Leerlingen** van de Sheet kan je klas, niveaugroep en stroom rechtstreeks aanpassen (keuzelijsten). Wat je daar verandert, geldt meteen.

Tabbladen in de Sheet: Instellingen, Beheerders, Leerlingen, Voortgang, Oefenresultaten, Reeksen, Testresultaten, Testdetail, Testsessies.

## Voor ontwikkelaars

```
src/problemen.js   vragenbank (40 generatoren met seed, A- en B-stroom)
src/server.js      Apps Script-server (Code.gs)
src/Index.html     webpagina (huisstijl Campus Lievegem)
src/gas-fake.js    nagebootste Google-diensten voor tests en demo
src/demo-seed.js   fictieve gegevens voor de demo
build.py           maakt dist/apps-script/* en dist/demo.html
```

```
node test/problemen.test.js   # elke generator × stroom × 300 seeds
node test/server.test.js      # profiel, vrijgeven, oefenen, reeksen, test, beheer
python3 build.py
```
