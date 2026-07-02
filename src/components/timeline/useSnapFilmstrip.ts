import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent, type MotionValue } from "framer-motion";

/**
 * Sdílené jádro „snap-filmstrip" mechaniky (osa příběhů i EraSlider).
 * `x` je jediný zdroj pravdy; aktivní slot se z něj odvodí (`nearest`) — žádná zpětná
 * smyčka. Snap na nejbližší slot přes spring (klik/šipky) i přes setrvačnost tahu
 * (dragTransition.modifyTarget). Krokování kolečkem má zámek (wheelLockMs).
 */
export interface SnapFilmstripOptions {
  /** Počet slotů (příběhů / epoch) na páse. */
  count: number;
  /** Cílová hodnota `x` pro vycentrování slotu `i` na playhead. */
  centerFor: (i: number) => number;
  /** Prodleva zámku krokování kolečkem (ms) — brzdí rychlost stepperu. */
  wheelLockMs: number;
  /** Výchozí aktivní index (první render, než se `x` ustaví). */
  initialIndex?: number;
  /** Volá se při změně aktivního (vycentrovaného) indexu. */
  onActive?: (i: number) => void;
  /** Tuhost/tlumení snap springu. */
  stiffness?: number;
  damping?: number;
}

export interface SnapFilmstrip {
  x: MotionValue<number>;
  activeIndex: number;
  /** Index slotu nejblíž dané hodnotě `x`. */
  nearest: (xv: number) => number;
  /** Plynulý snap na slot `i` (clamp do rozsahu). */
  goTo: (i: number) => void;
  /** Krok o `delta` slotů se zámkem kolečka (no-op, pokud je zámek aktivní). */
  stepBy: (delta: number) => void;
  /** Sdílený dragTransition (setrvačnost + snap na nejbližší slot). */
  dragTransition: { power: number; timeConstant: number; modifyTarget: (t: number) => number };
}

export function useSnapFilmstrip({
  count,
  centerFor,
  wheelLockMs,
  initialIndex = 0,
  onActive,
  stiffness = 260,
  damping = 32,
}: SnapFilmstripOptions): SnapFilmstrip {
  const x = useMotionValue(0);
  const wheelLock = useRef(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(count - 1, i)), [count]);

  // Nejbližší slot = argmin |centerFor(i) − x| (funguje pro proporční i uniformní rozteč).
  const nearest = useCallback(
    (xv: number) => {
      let n = 0;
      let best = Infinity;
      for (let i = 0; i < count; i++) {
        const d = Math.abs(centerFor(i) - xv);
        if (d < best) {
          best = d;
          n = i;
        }
      }
      return n;
    },
    [count, centerFor]
  );

  const goTo = useCallback(
    (i: number) => {
      animate(x, centerFor(clamp(i)), { type: "spring", stiffness, damping });
    },
    [x, centerFor, clamp, stiffness, damping]
  );

  const stepBy = useCallback(
    (delta: number) => {
      if (wheelLock.current) return;
      wheelLock.current = true;
      goTo(nearest(x.get()) + delta);
      window.setTimeout(() => (wheelLock.current = false), wheelLockMs);
    },
    [goTo, nearest, x, wheelLockMs]
  );

  useMotionValueEvent(x, "change", (xv) => {
    const n = nearest(xv);
    setActiveIndex((prev) => (prev === n ? prev : n));
  });

  // onActive drží nejnovější closure, ale běží jen při reálné změně indexu.
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;
  useEffect(() => {
    onActiveRef.current?.(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const dragTransition = {
    power: 0.3,
    timeConstant: 340,
    modifyTarget: (t: number) => centerFor(nearest(t)),
  };

  return { x, activeIndex, nearest, goTo, stepBy, dragTransition };
}
