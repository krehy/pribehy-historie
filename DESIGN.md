# Příběhy historie — design & rozhodnutí

Lehký spec (ne PRD) — zachycuje rozhodnutá UX/architektonická rozhodnutí, ať se v tom příště nebloudí.

## Mapa (WorldMap)
- **Dvě hlavní úrovně:** svět (obrysy světadílů) → světadíl (státy). Výběr jen klikáním.
- **Zoom kolečkem vypnutý** globálně; výjimka: na **přiblíženém světadílu** JEDNO kolečko = jeden plynulý krok na předdefinovanou úroveň (`contZoom ↔ contZoom × 1.6`) — pro husté oblasti s malými státy. Dvojklik vypnutý.
- **Pan (tažení)** je omezen `translateExtent` na rám mapy (mapa nevyjede z view).
- Na světadílu jsou **ostatní světadíly slabě viditelné**; **tažením** se výběr přeznačí na světadíl nejvíc ve středu (`nearestContinent`), bez přecentrování (`panSwitchRef`).
- Přepínání aktivního světadílu = **crossfade** (framer `AnimatePresence`).
- Data-driven: státy/kontinenty/timeline se odvozují z `src/data/stories.ts`.

## Časová osa (StoryTimeline)
- Po kliknutí na stát **mapa zůstane** (~52 %, lehce nahoru), zespodu vyjede panel (~48 %).
- **Diskrétní centrování:** aktivní příběh je vždy uprostřed; přepíná se **hover/klik** na čtverec a **zůstane** vycentrovaný, dokud nenajedeš na jiný. Kolečko/šipky = krok. Aktivní čtverec zvětšen + Ken Burns (video slow-mo).
- Osa je **proporční podle roku**; velké prázdné mezery **zkráceny** (značka „… N let“).
- Pod osou **jeden aktivní příspěvek** (fade in/out): rok, název, úryvek, tagy, „Číst celý příběh".
- **Žádné „Zpět na mapu"** v ose — návrat řeší kontextové „‹ Zpět / Světadíly" nahoře na mapě.
- **Hover-focus (desktop, jemný):** hover na mapu → osa lehce zajede + ztlumí; hover na osu → osa plná, mapa nepatrně ztlumená.
- **Přepínání států s otevřenou osou:** mapa zůstává klikací; klik na jiný stát přepne osu bez zavření.

## Velký příběh (StoryExperience / beaty)
- Příběh = sekvence **beatů**: `scene` (médium + text; `chroma` = greenscreen postava klíčovaná canvasem), `flip` (kartička „věděli jste?"), `scrub` (přišpendlené video scrubované scrollem + naskakující titulky), `quiz` (otázka).
- **Kvíz** je dobrovolný (opt-in), otázky po jedné, okamžitá zpětná vazba + skóre. Scroll se při interakci nesmí resetovat (scroll-guard).
- Detail běží jako **fullscreen overlay** (`z-60`) nad globálním headerem.

### Hero vstup příběhu (plánováno)
- **Tajemný poster + Play.** Před Play klidný ztmavený záběr + zářící Play.
- Po Play: nadpis se **pozvolna „vypíše"** → najede úvodní text → rozjede se **video na pozadí**.
- **Bez zvuku**, ale slot na ambientní tajemnou hudbu (on/off).

### Atmosféra (plánováno)
- Zůstáváme u tématu mostu, jen **tajemněji**.
- **Nálada podle beatu:** barevný nádech + částice (prach / zlaté jiskry u magického data / mlha nad Vltavou) + vinětace; scéna se plynule přebarvuje podle děje.

## Média (public/stories/)
- Egypt (public domain): `egy-pyramid.jpg`, `egy-cleopatra.jpg`, `egy-tutankhamun.jpg`.
- Karlův most (AI storybook): `cze-charles-iv-green.jpg` (greenscreen), `cze-bridge-founding.mp4`, `cze-bridge-eggs.mp4`, `cze-bridge-workers.jpg`.
- Plánováno: `cze-bridge-hero.mp4`, `cze-astrolabe.mp4`, `cze-mason-green.jpg`, `cze-bridge-night.jpg`.

## 3. úroveň mapy — historické země (hotovo)
- Klik na **Česko** → přiblížení (zoom ~46, `maxZoom` 80 v region módu, bez rough filtru) a rozpad na **historické země** Koruny české: **Čechy / Morava / Slezsko** (`public/cz-lands.json`, dissolve krajů přes mapshaper; POZOR: d3-geo chce vnější ring **CW**).
- Klik na zemi → kinematická osa jen s příběhy té země. Příběh nese `region` (Karlův most + univerzita = `cechy`). Země bez příběhů ztlumené.
- **Kritické:** `ZoomableGroup.onMoveEnd` reaguje jen na `event.sourceEvent` (skutečné gesto). Bez toho vzniká feedback loop (setView → RSM echo → setView) + spurious přeznačování světadílu/state.

## Autorský creator — článek → příběh (design z grilu, rozpracováno)
Pipeline, která z článku postupně dopěstuje kinematický příběh. Cíl = „ultimátní generátor" příběhů: AI navrhuje, autor kurátoruje.

### Datový model
- **Jeden `Story` záznam roste** — nezakládá se druhá entita. Nové pole `production: 'article' | 'characters' | 'beats' | 'texts' | 'media' | 'audio' | 'done'` sleduje produkční fázi. Beat má dvě textová pole: **`outline`** (kostra, fáze 2) a **`text`** (plná próza, fáze 3).
- **`Ruler` se zobecní na `Character`** (migrace před creatorem): `kind: 'ruler' | 'figure' | 'fictional'`. `reignFrom/To` a `house` jsou optional (jen ruler). `ownerStory?: string` jen u `fictional` (patří jednomu příběhu, nelezou do globálního rejstříku). **Osa party = filter `kind === 'ruler'`** → fiktivní vypravěč na ni nikdy nevleze. `figureImage()` fallback platí pro všechny kind.
- **Dvě osy postavy:** `kind` je globální (co postava JE); dramatická **`role`** je per-příběh (co v NĚM DĚLÁ). Proto `Story.characters` už není `string[]`, ale `{ slug: string; role: 'protagonist' | 'narrator' | 'antagonist' | 'supporting' }[]`. (Dotkne se `stories.ts`, `StoryTimeline`, `StoryExperience`.)

### Tok a routy
- **`/studio/new`** = lehký formulář článku (název, vazba na událost/rok + zemi, `factuality`, `body`). Uloží draft `Story` (`production: 'article'`). Kdo chce jen článek, do creatoru nemusí.
- Dashboard (`/studio`) → CTA **„Povýšit na příběh →"** → **`/studio/editor/:id`**.
- **Shell editoru = trvalá fázová lišta s gatingem** (ne wizard): stavy hotovo ✓ / rozdělané ● / zamčeno 🔒. Do odemčených fází se lze vracet a ladit; odchod = autosave, pokračuje se z dashboardu. Fáze: **0 Článek · 1 Postavy · 2 Beaty (kostra) · 3 Texty · 4 Média · 5 Zvuk · ★ Publikace.**
- **Gamifikace** = záměrně jen ta lehká, co plyne z pipeline (progres v seznamu, „Pokračovat", fázové ✓/🔒). Žádné XP/odznaky/questy — zatím neřešíme.

### Fáze 1 — Postavy
- AI vyčte cast z `body` a vrátí **plné koncepty k odklepnutí**: jméno, odhad `kind`, navržená `role`, 1–2 věty bio, návrh promptu na vzhled. Autor u každé: přijmout / upravit / zahodit + přidat vlastní.
- **Dedupe proti globálnímu poolu** — „Václav" se napáruje na existující `svaty-vaclav`, nezaloží duplikát. Nová reálná figura → globální `Character` (reuse příště); fiktivní → `ownerStory`.
- **Životní cyklus karty postavy** (`pending → accepted → locked`):
  - `pending` = nastavení editovatelné, vidíš **Schválit / Zahodit**.
  - `accepted` = pořád editovatelné, vidíš **Vygenerovat tvář** / **Napárovat**. **Změna identity (jméno/kind/bio/vzhled) shodí kartu zpět na `pending`** (znovu Schválit/Zahodit) — nutí to k intencionalitě.
  - `locked` = po vygenerování tváře / napárování je **identita zamčená** (nejde měnit). **Zámek mrazí jen identitu — dramatická `role` zůstává editovatelná** (je per-příběh). Odemknout jde přes **„Odemknout"** s potvrzením (zahodí tvář / odpojí panovníka → zpět na `accepted`).
- **Podobizna** se generuje ve fázi 1 explicitním tlačítkem **„Vygenerovat tvář"** (figure/fictional).
- **Panovník (`kind: ruler`) se místo generování tváře MUSÍ napárovat na profil** z `rulers.ts` (picker); **médium = `figureImage(ruler)`**, jméno/bio se převezmou z profilu. Chybějící panovník → **„+ Vytvořit nový profil panovníka" inline** (založí globální `Ruler`, znovupoužitelný i na ose).
- **Gate 1→2:** všechny návrhy vyřešené (žádný `pending`) **A** ≥1 postava má roli `protagonist` nebo `narrator`. Tváře k odemčení netřeba.

### Fáze 2 — Beaty (kostra)
- AI z článku + castu navrhne **celý storyboard**, ale jen **kostru**: typ (`scene`/`flip`/`quiz`/`scrub`), `mood`, která postava vystupuje a **`outline`** = jednovětný účel (co se v beatu stane). **Žádná plná próza.** Autor kurátoruje — přeskládání (‹ ›), přepis outline, mazání, přidání.
- **Layout: filmstrip nahoře** (mini-karty — pořadí, barva dle mood, ikona typu) **+ detail panel dole** (typ, mood, outline, postava).
- **Gate 2→3:** každý beat má neprázdný `outline`.

### Fáze 3 — Texty
- AI vygeneruje **plnou prózu (`text`) každého beatu** z outline + článku + hlasů postav (scene/scrub = text; flip = přední strana + `extra` zadní; quiz = otázka + `extra` odpověď). To čte čtenář i používá médium.
- **Layout: vertikální rukopis** — beaty pod sebou jako plynulý příběh (outline jako nadpis + pole s prózou + per-beat Vygenerovat/Přegenerovat), nahoře master „Vygenerovat všechny texty". Autor čte tok shora dolů.
- **Gate 3→4:** každý beat má neprázdný `text`.

### Fáze 4 — Média / pozadí
- AI generuje **jen POZADÍ scény** (mood-laděně); postava = **vyklíčovaný cutout z fáze 1 složený přes chroma** (existující `ChromaImage`). Tvář zůstává konzistentní napříč beaty (proto se zamyká ve fázi 1). Hero médium se řeší tady.
- **Gate 4→5:** každý `scene` beat má pozadí.

### Fáze 5 — Zvuk *(default z doporučení, čeká na potvrzení)*
- AI navrhne 3 vrstvy modelu `StoryAudio`: **hudba** = jeden loop per použitá `mood`; **voiceover** = TTS načte text každého beatu **jedním vypravěčským hlasem** (`VoiceoverLayer.perBeat`); **SFX** dle typu/triggeru beatu. Autor každou vrstvu přepne / přegeneruje.
- Otevřené: hlas per postava (vyžadovalo by `voiceId` na `Character`) — zatím ne.

### Publikace + factuality *(default, čeká na potvrzení)*
- **Fikce vždy vizuálně označená** a drží se `sources` události jako kotvy; `factuality: 'fact'` vyžaduje `sources`.

## Postavy — taxonomie a data (rozhodnutí z grilu)
Rozšíření `Ruler` na plnou `Character` entitu, aby vedle panovníků pojala i vynálezce, umělce, vědce, celebrity atd. **Dvě nezávislé osy** místo jednoho `kind`:

- **`real: boolean`** — fakt vs fikce (drží fakt/fikce integritu projektu). Fiktivní postava má navíc `ownerStory` (patří jednomu příběhu, neleze do globálního rejstříku).
- **`category`** — primární doména (**kurátovaný číselník**), řídí ikonu, track na ose a filtr:
  - MOC: `ruler` · `statesman` · `military` · `diplomat`
  - VÍRA: `religious`
  - VĚDA/TECHNIKA: `scientist` · `inventor` · `physician` · `explorer`
  - KULTURA: `artist` · `writer` · `composer` · `architect` · `performer`
  - SPOLEČNOST: `activist` · `entrepreneur` · `commoner`
- **`alsoCategories?: Category[]`** — polyhistoři (Leonardo: `artist` + `inventor` + `scientist`). Filtr jede po primární, ale najde je i pod vedlejší.
- **`prominence: 'major' | 'notable' | 'minor'`** — řídí hustotu osy: odzoomováno jen `major`, přiblížením přibývají `notable` a `minor`.

**Čas / ukotvení na osu a epochu:**
- **`activeFrom` / `activeTo`** (floruit) = období, kdy byla postava významná → řídí pozici na ose i příslušnost k epoše. U panovníka = roky vlády (`reign` je jen speciální případ).
- **`bornYear/bornDate/birthPlace`, `diedYear/diedDate/deathPlace`** — pro profil.
- Ruler-only: `reignFrom/reignTo`, `house`, `title`.
- Obraz beze změny: fallback cutout → portrait → placeholder (`figureImage`).

**Vazby (bez denormalizace):**
- **Epochy = počítaný překryv** `activeFrom/activeTo` × `era.from/to` (jako `rulersForRange`/`eraForYear`) — `charactersForEra(era)`. Žádný uložený `eraId`.
- **Země**: `countryCode` (+ `region?`) pro filtr.
- **Příběhy**: přes `story.characters: { slug, role }[]` (role = dramatická funkce, per-příběh). Postava existuje globálně i bez jakéhokoli příběhu.

**Mapování ze starého `kind`:** `ruler` → `category:'ruler'` + `real:true` · `figure` → `real:true` + doména · `fictional` → `real:false` (+ `ownerStory`). Migrace `rulers.ts` → `characters.ts` je stále pending (viz creator sekce).

## Backlog
- Ambient hudba (audio slot); voiceover.
- Code-splitting (bundle > 500 kB).
- Další příběhy + per-země obsah (Morava/Slezsko).
