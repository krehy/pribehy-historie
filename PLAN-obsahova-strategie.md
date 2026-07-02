# Plán: obsahová strategie & GoldenTouch engine

> Výstup gril-session z 2026-07-02. Navazuje na `DESIGN.md` (to popisuje *hotové* UX;
> tohle popisuje *kam jdeme* s obsahem, datovým modelem a znovuprodejností).
> Rozhodnutá rozhodnutí, ne PRD.

## 0. Vize (GoldenTouch)

Produkt = **kvalitní AI-generovaný zážitek s lidským „zlatým dotekem"**. AI dělá těžkou
práci, člověk dává autorství a kvalitu.

- **Geografické fázování:** Česko → sousední státy → zbytek Evropy → celý svět.
- **Marketplace pro autory (pozdější fáze):** autoři po světě tvoří příběhy, vydělávají,
  platforma bere provizi za zprostředkování. Finálka = celý svět pokrytý kvalitními
  příběhy od skutečných lidí.
- **Authoring přes prompty (pozdější fáze, admin):** průvodce provede autora tvorbou
  komponent (video, obrázky, charaktery, text). Cíl UX: autor napíše prompt a zážitek
  se vygeneruje.
- **Fakt i fikce:** doložená historie (Egypt), pověst (vejce v maltě), i čistá fikce
  zasazená do reálné doby/místa.
- **Znovuprodejnost:** celé jako **modul do [krehy/wv](https://github.com/krehy/wv)** —
  GoldTouchWebs prodá klientovi **firemní příběh na míru** (brand story) v jeho wv webu.

### Fáze projektu (kde teď jsme)
1. **TEĎ → klientský frontend + seed obsah** (tento plán).
2. Později → admin/operátorský režim: authoring pipeline, schvalovací brána, `status`.
3. Později → monetizace, nábor autorů, marketplace, provize.
4. Později → brand-story modul pro wv klienty.

Schvalovací brána (draft→published human review) **patří do fáze 2**, teď ji nestavíme —
ale datový model už nese švy (`status`, `author`, `sources`, `factuality`, `license`).

---

## 1. Datový model — švy, které přidat teď

Rozšířit `Story` v `src/data/stories.ts` (levné teď, drahé retro):

```ts
type Factuality = "fact" | "legend" | "fiction" | "brand";
type Status = "draft" | "published"; // web default zobrazuje jen "published"

interface Story {
  // …stávající pole…
  factuality: Factuality;      // první-třídní typ, web vizuálně odliší odznakem
  status?: Status;             // default "published"; draft až pro admin fázi
  author?: { name: string; url?: string }; // fikce/brand mají autora
  sources?: string[];          // POVINNÉ u factuality==="fact" (URL: Wikipedia/muzeum)
  license?: string;            // u PD médií + kvůli čistým právům pro wv přeprodej
}
```

**Pravidla:**
- `factuality: "fact"` → **vyžaduje `sources[]`** (dohledatelnost).
- `factuality: "legend"` → „traduje se, že…"; zdroj je folklor (vejce v maltě = legend).
- `factuality: "fiction"` → **má `author`**, web viditelně značí „Fikce", **ale VŽDY vychází
  z reálného faktu/události** — fikce je nadstavba nad kotvou, drží se `sources` toho faktu.
  (Proces: nápad = ověřený fakt → z něj se staví příběh, ať už doložený, nebo fikce kolem něj.)
- `factuality: "brand"` → firemní příběh z wv modulu; jako fiction, s autorem/klientem.
- **Odznak na webu:** Doložený příběh / Pověst / Fikce — pojistka kredibility.
- **Retro migrace:** Karlův most = smíšený (fakt + `legend` části); označit `fact` s tím,
  že legendární tvrzení (vejce, palindrom) jsou v textu explicitně „podle pověsti".

---

## 2. Zdrojový model faktů (kde je pravda)

**Wikipedia/Wikidata jako kotva** — AI je jen „překladatel do příběhu", ne zdroj pravdy.

- **Wikipedia** (CC-BY-SA, legálně citovatelná) → narativ, kontext.
- **Wikidata** → strukturovaná data: datumy, souřadnice, obrázky (P18), útvary.
- Každý `fact` příběh nese `sources[]` s URL → auditovatelné.
- AI dávkově vyrobí draft; publikace bez zdrojů se u `fact` nepřipouští.

---

## 3. Dvouúrovňový obsah

Každý příběh má **stejný datový tvar**, jen `beats`/`hero` jsou volitelné.

- **Krátký příběh** (základna, desítky–stovky): `excerpt` + `body` + 1 cover
  (u faktů PD obraz). Rychlá výroba = ověřený fakt + poutavý odstavec.
- **Vlajkový kinematický** (vybrané): `hero` + `beats` (scene/flip/scrub/quiz) + vlastní
  média. Drahé; povyšuje se **postupně** z krátkých.

---

## 4. Politika médií

Navázaná na `factuality`:

- **`fact`** → primárně **dobové public-domain** obrazy (Wikimedia Commons, muzejní
  open-access, díla před ~1900). AI jen doplněk, vždy značený `AI ilustrace`.
- **`legend` / `fiction` / `brand`** → **AI storybook** je legit hlavní médium.
- **Vždy `mediaCredit`**, u PD i `license` — kvůli kredibilitě i čistým právům pro wv.

---

## 5. Český seed (fáze 1 — „předvyplnit web")

Pokrýt **všechny tři historické země** (Čechy / Morava / Slezsko), ne jen Čechy.

**Launch ≈ 14 příběhů: 12 krátkých (fakt/pověst) + 1 kinematický + 1 fikce.**

Krátké (kandidáti, napříč érami a zeměmi):
- Velká Morava / Cyril a Metoděj (863, Morava)
- Sv. Václav (10. stol., Čechy)
- Karel IV. — Založení univerzity (1348, *už hotové*)
- Jan Hus (1415, Čechy)
- Bílá hora (1620, Čechy)
- Rudolf II. a pražská alchymie (~1600, Čechy)
- Národní obrození (19. stol.)
- Vznik ČSR (1918)
- Mnichov (1938)
- Pražské jaro (1968)
- Sametová revoluce (1989)
- Slezsko: slezské války / Opava (18. stol., Slezsko) — ať země není prázdná

Vlajkový kinematický: **Karlův most (hotový)**; druhý se povýší později.
Fikce showcase: 1 autorský příběh zasazený do Čech → **demo obou tváří (fakt + fikce)**.

---

## 6. „Nápady na nové příběhy" — zásobník

**Teď = drafty přímo v ose** (`status: "draft"`): nasbírané ověřené události žijí jako
draft `Story` a naplní časovou osu už teď (pro design i jako zásobník). Z každého draftu
se pak staví plný příběh (doložený, nebo fikce kolem něj). **Později se stanou frontou pro
admin authoring generátor** (fáze 2). Veřejné hlasování návštěvníků = backlog, ne teď.

---

## 7. Engine jako přenositelný modul (příprava na wv)

**Tvrdé pravidlo: renderer nesmí vědět, odkud data jsou.** Čte z **data-adaptéru**.

- Dnes adaptér = `stories.ts`. Zítra = CMS/API. Pozítří = klientský wv modul (brand story).
- Oddělit „engine zážitku" (renderer beatů + osa + mapa) od zdroje dat rozhraním
  (`StorySource`), aby šel celý balík vložit do jiného webu.
- Brand-story = stejný engine, `factuality: "brand"`, jiný data-adaptér.

---

## 8. Borders — časový posuvník historických území (pozdější fáze, mapa „borders-ready" už teď)

**Emoční jádro, ne efekt:** uživatel má *vidět příslušnost území v čase* —
kdy bylo Česko **Protektorátem Čechy a Morava (okupace 1939–45)**, součástí
**Rakouska-Uherska**, **Svaté říše římské**, **Velké Moravy**, kdy samostatné **ČSR**.

- **Data:** [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)
  — GeoJSON politických hranic v časových řezech, pojmenované útvary, volná licence.
- **v1 (skromná):** odehrává se **na přiblíženém státě / části světa**, navázané na rok
  příběhu (čteš 1348 → mapa ukáže útvar ~1350). Ne volný scrub tisíciletími.
- **Adaptivní re-framing:** posuvník **není zamčený na bbox moderního Česka** — když
  scrubneš do minulosti, mapa se **sama oddálí/přerámuje** podle rozsahu historického
  útvaru (Velká Morava, monarchie…). Útvar se **obarví/pojmenuje**.
- **Snap** na nejbližší dostupný časový řez datasetu.
- Mapa se navrhne borders-ready už teď (stejný adaptér princip), morf až ve fázi feature.

---

## 9. Immediate polish (mimo gril — drobné UI úkoly ze zadání)

- **Časová osa:** posunout slider **níž** v panelu.
- **Časová osa:** umožnit **scroll kolečkem** (krok mezi příběhy).

---

## 9b. Creator/editor, scénáře a audio (rozhodnuto 2026-07-02)

**Pořadí:** nejdřív 2–3 propracované příběhy (mockupy) → podle nich navrhneme vizuální
editor. Média mockupů se pak recyklují v prototypu editoru (později API na generování za běhu).

**Scénáře = předdefinované délky (šablony beatů), typy beatů volné z palety `{scene, flip, scrub, quiz}` (kvíz volitelný):**

| Scénář | Hero | Počet beatů | Cca délka |
|---|---|---|---|
| Kratší | ano | 3 | ~1 min |
| Střední | ano | 5–6 | ~2–3 min |
| Delší (= Karlův most) | ano | 8 | ~4–5 min |

Delší = nadmnožina kratší → příběh jde „povýšit" bez přepisu. Creator = krokový průvodce:
vybere scénář → naplní beat-sloty → **hudbu řeší až na konci** (popíše atmosféru per beat).

**Mockupy (hotové jako data, placeholder média + shot-listy):**
- **Kratší → Golem** (`legend`, Čechy) — `stories.ts` id 20, `docs/shotlist-golem.md`.
- **Střední → Cyril a Metoděj** (`fact`, Morava) — id 21, `docs/shotlist-cyril.md`.
- **Delší → Karlův most** (hotový).

**Audio = 3 vrstvy řízené aktivním beatem** (`StoryAudio`; přehrávač = backlog, odemčení přes Play v hero):
1. **Hudba** — bezešvé **loopy per nálada** (`mood`), crossfade při změně. Formát `.ogg`/`.m4a` (ne mp3 — gapless problém). Generovat víc kratších loopů (přirozené pro AI hudbu).
2. **Voiceover** — klip **per beat**, přehraje se jednou při vstupu (zní jen aktuální beat).
3. **SFX** — spouštěné **triggerem**: `beatEnter` / `flip` / `quizCorrect` / `quizWrong` / `click`.

Media + music/VO/SFX **briefy** žijí v `docs/shotlist-*.md` (generovací checklist + předloha
pro krok „hudba/zvuk" v creatoru); runtime data zůstávají čistá.

### Creator pipeline — wizard + kroky (rozhodnuto 2026-07-02)
Dvě fáze:

**A) Setup wizard** (konfigurace předem) → vyrobí *draft skeleton*:
- výchozí **scénář/délka** (kratší/střední/delší), pak doladit **kolik + jakých beatů** (`scene/flip/scrub/quiz`)
- **přepínače vrstev:** hudba on/off, voiceover on/off, SFX on/off → určí, které části `StoryAudio` draft dostane
- výstup = `Story` s prázdnými beat-sloty + `status: "draft"`

**B) Creator** (kroková výroba; pořadí = závislosti, každý krok potřebuje výstup předchozího):
1. **Text & příběh** — `title/text/front/back/captions/quiz` + `mood` + atmosféra per beat → vzniká interní **shot-list**
2. **Média** — API vygeneruje médium per beat z brief-u (→ `media`, `hero`)
3. **Přechody** — `mood`, crossfade, přechod mezi beaty
4. **Hudba/zvuk** — z atmosfér se vygenerují loopy + voiceover + SFX

**TODO modelu (až sem dojdeme):**
- `Story.stage?: "text" | "media" | "transitions" | "audio" | "done"` — rozpracovanost pro resumable creator + dashboard.
- Beat `transition?` (typ + délka) — krok „Přechody" zatím nemá datové pole (beaty mají jen `mood`).
- Draft se ukládá po každém kroku (resumable).
- Ruční shot-listy (`docs/shotlist-golem.md`, `-cyril.md`) = referenční výstup kroku 1 pro návrh creatoru.

## 9c. Autorská zóna / Studio (rozhodnuto 2026-07-02)

Dashboard autora = kontejner pro setup wizard + creator (viz 9b). Obsah:
- **Moje příběhy** (drafty + published, s `stage` rozpracovaností) — filtr `stories.ts` podle `author`
- **Statistiky** (zobrazení, dokončení, výsledky kvízů; později výdělky/provize) — teď **mock čísla**
- **[+ Nový příběh]** → setup wizard → creator

**Navmenu:** odkaz v oddělené sekci **níž**; později **gated jen pro přihlášené autory**.

**Pro design teď:** **mock auth kontext** `currentAuthor = { name: "Křehy" }` — nasimulované
přihlášení, celý web ukazuje přihlášené UI (jméno/avatar + odkaz do zóny). **Ne reálný login**
(ten = pozdější fáze, Supabase/auth). Route `/studio` (nebo `/autor`). Mockům (Golem/Cyril/most)
přiřadit `author: { name: "Křehy" }`, ať dashboard hned něco zobrazí. Přepínač přihlášen/ne
držet za adaptérem, aby šel vyměnit za reálný auth.

## 9d. Role a dev „Tweaks" panel (rozhodnuto 2026-07-02)

Jeden zdroj pravdy — mock session kontext `currentUser = { name, role }`,
`role ∈ {reader, author, admin}` (+ odhlášen). Veškeré role-gated UI čte odtud;
reálný auth později jen vymění providera.

**Dev „Tweaks" panel** (plovoucí, roh / klávesová zkratka, jen `import.meta.env.DEV`
nebo query flag): přepíná **role + přihlášen/odhlášen** → návrh a screenshoty rozhraní.
Do produkce se nezapne.

**Co která role vidí:**
- **Čtenář** (default) — čtenářské rozhraní; **gamifikace pozdější** (úspěchy, levely, XP) → backlog, teď max placeholder v profilu.
- **Autor** — Studio jen s **vlastními** příběhy + statistiky svých příběhů (9c).
- **Admin** — navíc **globální statistiky** celého webu + přehled autorů (mock čísla).

**Doporučení:** gating deklarativně (`<RequireRole role="admin">` / helper), ať se logika
neroztéká; admin vs. autor statistiky = sdílené komponenty grafů, jiný scope dat (vše vs. `author`).

## 9e. Lifecycle autora + veřejný profil (rozhodnuto 2026-07-02)

**Progrese:** každý začíná jako **čtenář** → aktivní vracející se čtenář (napojeno na
gamifikaci 9d) dostane **nabídku stát se autorem** → onboarding → **veřejný profil**.

**Onboarding + profil:**
- Autor **odhalí skutečnou tvář, jméno, příjmení** = pilíř kredibility (ladí se strategií
  ověřenosti). Reálná identita/GDPR → až reálný auth (pozdější fáze).
- **Veřejný profil = vizitka, vizuálně jako příběh** — běží na **stejném enginu/estetice**
  (hero + `chroma` postava). AI charakter s tváří autora = technika `chroma` greenscreen
  (už v datech: Karel IV., kameník).
- **AI charakter z reálné tváře** = stejný styl jako gtw-web sekce „Kdo jsme" (Samuel + Michal);
  až se bude stavět, portne se pipeline/asset stejně jako header z gtw-web.
- Profil ukáže: charakter + „o autorovi" + **jeho práce** (filtr příběhů podle autora).

**Model (evoluce):** `Story.author?: {name; url?}` → později `authorId` + entita `Author`
(`authors.ts`): `{ id, name, realName, faceCharacter, bio, works[], verified }`.

**Onboarding wizard — kroky:** (1) info o autorovi (jméno/příjmení/bio) → (2) **sken obličeje**
(kamera přes `getUserMedia`) **+ nahrání min. 3 fotek** (odhad typu postavy a stylu oblékání →
realističtější **full-figure** charakter) → (3) náhled AI charakteru + úprava → (4) publikace profilu.
Charakter = celá postava na greenscreenu (jako story `chroma` postavy) → **může vystupovat
i ve vlastních příbězích autora** jako vypravěč/postava.

**„3D sken" — realita:** plný 3D sken (TrueDepth/ARKit, fotogrammetrie) je device-závislý;
baseline = **naváděný multi-úhlový záběr** (fotky/krátké video) → **identity-preserving AI**
generace → stylizovaný `chroma` charakter (ne syrový sken). Depth = nice-to-have, ne požadavek.
Naváděcí UX: MediaPipe FaceMesh / foto-capture.
⚠ **Biometrie = citlivá data (GDPR)** — explicitní souhlas + politika uložení/smazání (reálná auth fáze).

**Pro design teď:** mock kinematický **profil autora „Křehy"** (AI charakter dočasně reuse
gtw-web / chroma placeholder), bio + práce (Golem/Cyril/most); sken-krok = UI flow
(žádost o kameru → capture → loader → placeholder charakter), bez reálného capture/AI.

## 9f. Design pass — scope, IA, vizuál, data, metriky (rozhodnuto 2026-07-02)

**Scope (clickable mock, v pořadí závislostí):** 1) role/session mock + dev Tweaks panel →
2) Studio dashboard → 4) Admin statistiky → 5) Profil autora + onboarding wizard →
**(GATE)** → 3) Setup wizard + Creator. **Mimo pass (placeholder):** reálný auth, generování
médií/AI charakteru, reálná analytika, **borders feature**.

> **GATE před Creatorem:** Creator se staví **až po ručním doladění referenčních příběhů
> (Golem/Cyril, příp. most) k dokonalosti** — včetně **reálných médií** z shot-listů. Creator
> se navrhuje podle hotového příběhu a recykluje jeho média; dřív nemá smysl. Proto je Creator
> poslední krok design passu.

**Routy anglicky (příprava na celosvětové SEO):**

| Route | Obrazovka | SEO |
|---|---|---|
| `/` | Home | index |
| `/story/:slug` | Zážitek příběhu | index |
| `/about` | O projektu | index |
| `/author/:slug` | Veřejný profil autora | index |
| `/profile` | Čtenářský profil (gamifikace) | noindex |
| `/studio` | Dashboard autora | noindex |
| `/studio/new` | Setup wizard | noindex |
| `/studio/editor/:id` | Creator (4 kroky) | noindex |
| `/become-author` | Onboarding wizard | noindex |
| `/admin` | Globální statistiky | noindex |

Migrace: `/pribeh/:slug`→`/story/:slug`, `/o-projektu`→`/about` (přepsat odkazy).

**i18n / SEO:** lokalizované veřejné routy > stejné pro všechny (klíčová slova v URL, hreflang).
Teď anglické canonical + obsah česky; později **locale prefix `/:lang/`** + přeložené slugy +
`hreflang` u veřejných rout. Strukturní segmenty anglicky, lokalizace přes prefix + slug-mapu.
Nástrojové routy = anglicky + `noindex`, nelokalizují se.

**Navmenu (drawer):** nahoře čtenář (Domů · Příběhy/Mapa · O projektu); dole oddělené autor
(Autorská zóna; Admin jen pro admin roli); přihlášený indikátor (avatar „Křehy — autor" →
Studio · Profil · Odhlásit). Tweaks panel = samostatný dev overlay, ne v navmenu.

**Vizuální jazyk = hybrid (sdílený design systém, dvě vrstvy):** čtenář = atmosféra
(pergamen, Cinzel, částice); nástroje = **workspace** (víc bílého místa, sans na data/formuláře,
čisté karty, bez textury). Creator = čisté chrome + immersivní náhled příběhu. Sdílené tokeny.

**Viditelnost dat podle role:** `published` = vidí čtenář · `draft` = jen Studio (autor/admin).
Čtenářská mapa/osa/grid filtruje na `published`. **30 českých draftů → `published`** (krátká
úroveň splňuje bar), **Golem + Cyril → `published`**, + **1–2 skutečné `draft`** pod autorem
„Křehy" pro ukázku rozpracovaného stavu ve Studiu.

**Metriky (mock, deterministicky ze `stories.ts`):**
- **Autor:** KPI (počet příběhů, zobrazení, prům. dokončenost, později výdělek) · grafy (zobrazení v čase, top příběhy) · tabulka per příběh (zobrazení, dokončenost %, skóre kvízu, uložení, sparkline).
- **Admin:** KPI (příběhy, autoři, čtenáři/MAU, zobrazení, dokončenost) · grafy (zobrazení & registrace v čase, žebříček autorů, rozložení obsahu podle kontinentu/země a fakt/pověst/fikce) · moderační fronta.
- **Čtenář:** level + XP, odznaky (zamčené/odemčené), přečtené příběhy, streak (placeholder).

## 9g. Mobile-first + PWA (rozhodnuto 2026-07-02)

**Pilíř: celá appka je mobile-first** — čtenář, časová osa, mapa, Studio, Creator, onboarding,
vše optimalizované pro dotyk. Cíl: **autoři si stáhnou PWA** (instalovatelná appka).

- **Časová osa (hotovo):** menší kostky (celé viditelné) + swipe vlevo/vpravo.
- **Mapa — lite mód (hotovo, 1. pass):** na `(max-width:767px)`/`(pointer:coarse)` se vypíná
  filtr `#rough-edges` (feTurbulence+feDisplacement se jinak přepočítával každý snímek → sekání).
  - *Deeper (backlog):* zvážit zjednodušenou geometrii pro mobil, méně re-renderů při zoomu,
    případně canvas/raster renderer; vypnout i další statické textury na slabých zařízeních.
- **PWA (backlog, brzy):** `manifest.webmanifest` (ikony, splash, `display: standalone`, theme
  color) + service worker (offline shell, cache assetů) → instalace na plochu. Cíl hlavně pro autory.
- **Creator/onboarding na mobilu:** sken obličeje + ≥3 fotky = přirozené přes mobilní kameru.

## 10. Deferred / backlog

- Admin/operátor režim, authoring pipeline, `draft→published` schvalovací brána (fáze 2).
- Monetizace, nábor autorů, marketplace, provize (fáze 3).
- Brand-story modul pro wv klienty (fáze 4).
- Veřejné hlasování o nových příbězích.
- Ambient hudba / voiceover, code-splitting (viz `DESIGN.md`).
