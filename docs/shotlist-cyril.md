# Shot-list — Cyril a Metoděj na Velké Moravě (scénář: STŘEDNÍ, 6 beatů)

> Generovací checklist pro média + hudbu. Runtime data: `src/data/stories.ts` (id `21`).
> Zatím běží **placeholdery** (existující soubory). Vygeneruj níže popsaná média,
> ulož pod cílové názvy do `public/stories/cze-cyril/` a v datech nahraď placeholder cesty.

**Cílová složka:** `public/stories/cze-cyril/`
**Faktualita:** `fact` (Doložený příběh) · **Kredit médií:** „AI ilustrace (storybook) · Příběhy historie“

---

## Hero
- **Soubor:** `hero.mp4` (placeholder: `cze-bridge-hero.mp4`)
- **Eyebrow:** „Zrození písma“
- **Media brief:** Rozbřesk nad velkomoravským hradištěm (Mikulčice / Velehrad), dřevěné kostely a valy, řeka Morava v mlze, letící ptáci. Pomalý nájezd, teplé ranní světlo, epický klid. 16:9, smyčkovatelné.

## Beat 1 — scene (video) · mood: `dawn`
- **Soubor:** `01-rastislav.mp4` (placeholder: `cze-bridge-founding.mp4`)
- **Titulek:** „Prosba knížete Rastislava“
- **Media brief:** Kníže Rastislav ve velkomoravské síni diktuje poselství, pergamen, posel odjíždí na koni k jihu. Ranní světlo, slovanské ornamenty, teplé tóny. Krátká smyčka.

## Beat 2 — scene (chroma) · mood: `mystic`
- **Soubor:** `02-bratri-green.png` (placeholder: `cze-charles-iv-green.jpg`)
- **Titulek:** „Bratři ze Soluně“
- **Media brief:** Dva byzantští mniši — starší učenec (Konstantin/Cyril) se svitkem a mladší (Metoděj); zdobené byzantské roucho, ikonový nádech. **Greenscreen**, celé postavy, měkké světlo.

## Beat 3 — scene (video) · mood: `mystic`
- **Soubor:** `03-hlaholice.mp4` (placeholder: `cze-astrolabe.mp4`)
- **Titulek:** „Nové písmo — hlaholice“
- **Media brief:** Ruka píše brkem hlaholská písmena na pergamen ve svitu svíce; písmena se rozzáří. Skriptorium, zlaté iniciály, detailní záběr. Krátká smyčka ~6–10 s.

## Beat 4 — flip („věděli jste?“) · mood: `mystic`
- **Přední:** „Odkud se vzala azbuka?“
- **Zadní:** „Z hlaholice žáci vytvořili cyrilici… z ní vzešla azbuka, kterou píše půl světa.“

## Beat 5 — scrub (přišpendlené video, titulky scrollem) · mood: `day`
- **Soubor:** `05-liturgie.mp4` (placeholder: `cze-bridge-eggs.mp4`)
- **Media brief:** Bohoslužba v dřevěném kostele plném lidí → konfrontace s latinskými kněžími → cesta bratří do Říma před papeže. Delší plynulý záběr (~15–25 s), vhodný ke scrubování; tři vizuální fáze odpovídají titulkům.
- **Titulky (`at`):** 0.0 „Bohoslužba, které je rozumět“ · 0.45 „Spor s franskými kněžími“ · 0.8 „Obhajoba v Římě“

## Beat 6 — scene (foto) · mood: `dawn`
- **Soubor:** `06-odkaz.jpg` (placeholder: `cze-bridge-workers.jpg`)
- **Titulek:** „Odkaz, který přetrval“
- **Media brief:** Symbolický epilog — hlaholský/cyrilský rukopis a kříž ve východním slohu, rozbřesk, kořeny rostoucí do dálky (šíření k jižním a východním Slovanům). Teplé, důstojné.

---

## Hudba — loopy per nálada (formát `.ogg`/Opus, bezešvé smyčky ~20–40 s)
> Model: `StoryAudio.loops` klíčované náladou; crossfade 800 ms při změně.

| Soubor | Nálada | Music brief |
|---|---|---|
| `loop-intro.ogg` | (hero) | Epický klidný rozbřesk — nízké smyčce, vzdálený mužský sbor (byzantský nádech), pocit velikosti a naděje. |
| `loop-dawn.ogg` | `dawn` | Teplé, nadějné — jemné smyčce a flétna, lehký pohyb vpřed; slovanský/moravský folklorní nádech. |
| `loop-mystic.ogg` | `mystic` | Posvátné, éterické — pravoslavný/byzantský sborový pad, isokratéma (držený tón), pocit zázraku psaní. |
| `loop-day.ogg` | `day` | Živější, s mírným napětím ve scrubu (spor) → uvolnění (Řím); rytmičtější, ale stále vznešené. |

> Pozn.: nálady `dawn`/`mystic`/`day` sdílí beaty stejné nálady (beat 1 a 6 = `dawn`, beat 2–4 = `mystic`).

## Voiceover — vypravěč (klip na beat, mp3; přehraje se jednou při vstupu)
| Soubor | Beat | Text k namluvení |
|---|---|---|
| `vo-01.mp3` | 1 · Rastislav | „Moravský kníže Rastislav toužil po učitelích, kteří by kázali v jazyce, jemuž lid rozumí…“ |
| `vo-02.mp3` | 2 · bratři | „Z daleké Soluně přišli dva bratři — učenec Konstantin a jeho bratr Metoděj.“ |
| `vo-03.mp3` | 3 · hlaholice | „Aby zapsali slovanská slova, sestavil Konstantin úplně nové písmo — hlaholici.“ |
| — | 4 · flip | (bez vypravěče) |
| `vo-05.mp3` | 5 · liturgie (scrub) | „Sloužili mši ve staroslověnštině — a slovanskou bohoslužbu obhájili až v Římě.“ |
| `vo-06.mp3` | 6 · odkaz | „Jejich dílo přežilo staletí a rozšířilo se k jižním i východním Slovanům.“ |
> Tón: důstojný, epický, klidný.

## Zvukové efekty (SFX) — spouštěné triggerem
| Soubor | Trigger | Popis |
|---|---|---|
| `sfx-quill.ogg` | `beatEnter` beat 3 | Škrábání brku po pergamenu, gain 0.7. |
| `sfx-bell.ogg` | `beatEnter` beat 6 | Kostelní zvon, dozvuk (odkaz). |
| `page-flip.ogg` *(sdílené, `stories/sfx/`)* | `flip` | Šustnutí otočené kartičky, gain 0.6. |
