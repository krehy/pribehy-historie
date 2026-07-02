# Shot-list — Golem rabbiho Löwa (scénář: KRATŠÍ, 3 beaty)

> Generovací checklist pro média + hudbu. Runtime data: `src/data/stories.ts` (id `20`).
> Zatím běží **placeholdery** (existující soubory). Vygeneruj níže popsaná média,
> ulož pod cílové názvy do `public/stories/cze-golem/` a v datech nahraď placeholder cesty.
> Nálada (`mood`) řídí barvu, částice i hudební loop.

**Cílová složka:** `public/stories/cze-golem/`
**Faktualita:** `legend` (Pověst) · **Kredit médií:** „AI ilustrace (storybook) · Příběhy historie“

---

## Hero
- **Soubor:** `hero.mp4` (placeholder: `cze-bridge-hero.mp4`)
- **Eyebrow:** „Pražská pověst“
- **Media brief:** Noční Praha 16. stol., Josefov / Staronová synagoga v mlze, měsíc nad střechami, tajemné modrozelené světlo. Pomalý kamerový nájezd, filmové zrno. Bez lidí, atmosféra tajemna. 16:9, smyčkovatelné.

## Beat 1 — scene (chroma) · mood: `mystic`
- **Soubor:** `01-rabi-green.png` (placeholder: `cze-charles-iv-green.jpg`)
- **Titulek:** „Rabi Jehuda Löw“
- **Media brief:** Starý učený rabín v tmavém hávu a s dlouhým vousem, kabalistické svitky, klidný soustředěný výraz. **Greenscreen** (chroma key) — postava na sytě zeleném pozadí, celá postava, měkké boční světlo.

## Beat 2 — scene (video) · mood: `mystic`
- **Soubor:** `02-oziveni.mp4` (placeholder: `cze-astrolabe.mp4`)
- **Titulek:** „Šém v ústech“
- **Media brief:** Detail rukou vkládajících malý pergamen (šém) do úst hliněné sochy obra; hlína začíná zářit, prach a jiskry, socha se pohne. Šero dílny, svíčky, zlaté odlesky. Krátká smyčka ~6–10 s.

## Beat 3 — flip („věděli jste?“) · mood: `night`
- **Soubor:** — (flip nemá médium; jen přední/zadní text)
- **Přední:** „Věděli jste, jak se Golem zastavil?“
- **Zadní:** „Prý stačilo vyjmout mu z úst šém… leží na půdě Staronové synagogy.“

---

## Hudba — loopy per nálada (formát `.ogg`/Opus, bezešvé smyčky ~20–40 s)
> Model: `StoryAudio.loops` klíčované náladou; crossfade 800 ms při změně.

| Soubor | Nálada | Music brief |
|---|---|---|
| `loop-intro.ogg` | (hero) | Temný ambient, nízké smyčcové drony, vzdálené cimbál/hackbrett tóny, pocit tajemna a očekávání. Klid, žádný beat. |
| `loop-mystic.ogg` | `mystic` | Mystická, éterická — ženský vokální „ah“ pad, jemná cimbálová ozvěna, mírné napětí; hebrejsko-středověký nádech. |
| `loop-night.ogg` | `night` | Temnější, tíživější — hlubší drony, tlumený tep bubnu, náznak hrozby; ke konci lehké uklidnění (obr usnul). |

## Voiceover — vypravěč (klip na beat, mp3; přehraje se jednou při vstupu)
| Soubor | Beat | Text k namluvení |
|---|---|---|
| `vo-01.mp3` | 1 · rabín | „Učený rabín Jehuda Löw hledal nad Prahou způsob, jak ochránit svůj lid…“ |
| `vo-02.mp3` | 2 · šém | „Vložil obrovi do úst pergamen s posvátným slovem — a hlína se pohnula.“ |
| — | 3 · flip | (bez vypravěče) |
> Tón: tichý, tajemný, pomalý. (Doporučení: dabing přes ElevenLabs / podobné.)

## Zvukové efekty (SFX) — spouštěné triggerem
| Soubor | Trigger | Popis |
|---|---|---|
| `sfx-clay-rise.ogg` | `beatEnter` beat 2 | Skřípot kamene/hlíny, dunivé procitnutí obra. |
| `page-flip.ogg` *(sdílené, `stories/sfx/`)* | `flip` | Šustnutí otočené kartičky, gain 0.6. |
