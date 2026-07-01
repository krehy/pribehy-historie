# Příběhy historie

Interaktivní vzdělávací web — **pergamenová mapa světa**, po které se proklikáte
k příběhům dějin. Vyberte zemi, projděte její časovou osu a čtěte příběhy z
daného období.

> Fáze projektu: **design & frontend skeleton**. Data jsou mocková
> (`src/data/stories.ts`), žádný backend.

## Spuštění

```bash
npm install
npm run dev      # http://localhost:5173
```

Další příkazy:

```bash
npm run build    # produkční build do dist/
npm run preview  # náhled produkčního buildu
npm run lint     # typová kontrola (tsc --noEmit)
```

## Flow (landing)

1. **Loading screen** s progresem.
2. **Hero** s logem — po kliknutí na „Prozkoumat mapu" plynule **odjede nahoru**.
3. Odkryje se **fullscreen pergamenová mapa světa**
   (hover = zvýraznění, klik na zvýrazněnou zemi = **zoom** na zemi).
4. **Timeline** vybrané země s časovými body.
5. Klik na časový bod → **filtr příběhů** pro dané období.

## Stack

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion ·
react-router-dom · react-simple-maps + d3-geo + topojson

## Struktura

```
public/world-110m.json          topojson mapy (bundled, žádné API)
src/
  config/mapTheme.ts            ← CENTRÁLNÍ styl mapy (barvy, filtry, zoom…)
  data/stories.ts               ← mock příběhy
  data/countries.ts             ISO numeric ↔ A3 + názvy zemí
  lib/history.ts                odvození zemí a časové osy z dat
  components/
    layout/                     Header, Footer, Layout
    loading/                    LoadingScreen (progres)
    hero/                       Hero (odjezd nahoru)
    map/                        WorldMap, ParchmentDefs, CompassRose, MapFrame
    timeline/                   Timeline
    stories/                    StoryCard, StoryGrid
    ui/                         button, badge, card (shadcn styl)
  pages/                        Home, StoryDetail, About
```

## Přizpůsobení vzhledu mapy

Veškerý vizuál mapy je řízen jediným souborem **`src/config/mapTheme.ts`** —
paleta (světlý pergamen), výplně a hover/selected stavy zemí, roztřepené
hranice (`feTurbulence`/`feDisplacementMap`), papírová textura, vinětace,
kompasová růžice, ozdobný rám i chování zoomu. Nic není natvrdo v komponentách.
