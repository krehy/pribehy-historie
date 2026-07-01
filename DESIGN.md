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

## Backlog
- Ambient hudba (audio slot); voiceover.
- Code-splitting (bundle > 500 kB).
- Další příběhy + per-země obsah (Morava/Slezsko).
