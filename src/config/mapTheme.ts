/**
 * mapTheme.ts — CENTRÁLNÍ konfigurace vzhledu mapy.
 *
 * Vše, co se týká vizuálu pergamenové mapy, se řídí odsud: barvy, tloušťky
 * čar, hover/selected stavy, textura papíru, roztřepené hranice (SVG filtr),
 * kompasová růžice i ozdobný rám. Komponenty mapy nikdy nedefinují barvy
 * natvrdo — čtou je z tohoto objektu.
 *
 * Styl: SVĚTLÝ PERGAMEN — teplá bílo-žlutavá slonovina, jemný hnědý inkoust.
 */

export interface MapPalette {
  /** Pozadí mapy — teplá slonovina */
  paper: string;
  /** Světlá místa / highlighty papíru */
  paperLight: string;
  /** Výplň státu */
  country: string;
  /** Výplň státu při hoveru */
  countryHover: string;
  /** Výplň vybraného státu */
  countrySelected: string;
  /** Hranice států — měkká hnědá */
  stroke: string;
  /** Text / popisky — hnědý inkoust */
  ink: string;
  /** Tlumené zlato — timeline body, odkazy, akcenty */
  accent: string;
  /** Barva oceánu (pozadí za pevninou) */
  ocean: string;
}

export const palette: MapPalette = {
  paper: "#f8f1de",
  paperLight: "#fdfaf0",
  country: "#efe4c8",
  countryHover: "#e6d5a8",
  countrySelected: "#dcc48f",
  stroke: "#b89b6a",
  ink: "#6b5836",
  accent: "#c9a24b",
  ocean: "#f3ead2",
};

export interface CountryStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Opacita — pro tlumení států bez příběhů */
  opacity: number;
}

export interface MapTheme {
  palette: MapPalette;

  /** Stavy jednotlivých států */
  country: {
    default: CountryStyle;
    hover: CountryStyle;
    selected: CountryStyle;
    /** Stát, který má příběhy, ale není vybraný — jemné zvýraznění */
    hasStories: Partial<CountryStyle>;
    /** Stát bez příběhů — ztlumený */
    muted: Partial<CountryStyle>;
  };

  /** Roztřepené hranice (feTurbulence / feDisplacementMap) */
  roughEdges: {
    enabled: boolean;
    /** Frekvence šumu — vyšší = jemnější třepení */
    baseFrequency: number;
    /** Počet oktáv šumu */
    octaves: number;
    /** Síla posunu hran v px */
    scale: number;
    /** Seed generátoru šumu */
    seed: number;
  };

  /** Papírová textura jako overlay vrstva */
  paperTexture: {
    enabled: boolean;
    /** Opacita overlaye — nízká, ať zůstane světlý */
    opacity: number;
    baseFrequency: number;
    octaves: number;
    /** Barevný nádech textury (mix do světla i stínu) */
    tint: string;
  };

  /** Vinětace — jemné ztmavení okrajů mapy */
  vignette: {
    enabled: boolean;
    opacity: number;
    color: string;
  };

  /** Kompasová růžice */
  compass: {
    enabled: boolean;
    size: number;
    strokeWidth: number;
    color: string;
    accent: string;
    /** Pomalá rotace růžice */
    rotate: boolean;
  };

  /** Ozdobný rám mapy */
  frame: {
    enabled: boolean;
    color: string;
    /** Tloušťka dvojité linky rámu */
    strokeWidth: number;
    /** Odsazení rámu od okraje v px */
    inset: number;
    /** Ozdobné rohy */
    corners: boolean;
  };

  /** Chování zoomu při výběru státu */
  zoom: {
    /** Cílové přiblížení na vybraný stát */
    selectedZoom: number;
    /** Výchozí přiblížení */
    defaultZoom: number;
    /** Doba animace přechodu v s */
    transition: number;
    minZoom: number;
    maxZoom: number;
  };

  /** Výchozí střed a scale projekce */
  projection: {
    scale: number;
    center: [number, number];
    rotate: [number, number, number];
  };
}

export const mapTheme: MapTheme = {
  palette,

  country: {
    default: {
      fill: palette.country,
      stroke: palette.stroke,
      strokeWidth: 0.5,
      opacity: 1,
    },
    hover: {
      fill: palette.countryHover,
      stroke: palette.ink,
      strokeWidth: 0.8,
      opacity: 1,
    },
    selected: {
      fill: palette.countrySelected,
      stroke: palette.ink,
      strokeWidth: 1,
      opacity: 1,
    },
    hasStories: {
      fill: "#e9d6ac",
      stroke: palette.accent,
      strokeWidth: 0.7,
    },
    muted: {
      fill: palette.country,
      opacity: 0.72,
    },
  },

  roughEdges: {
    enabled: true,
    baseFrequency: 0.028,
    octaves: 3,
    scale: 3.2,
    seed: 7,
  },

  paperTexture: {
    enabled: true,
    opacity: 0.16,
    baseFrequency: 0.9,
    octaves: 2,
    tint: "#c9a970",
  },

  vignette: {
    enabled: true,
    opacity: 0.22,
    color: "#8a6d3a",
  },

  compass: {
    enabled: true,
    size: 120,
    strokeWidth: 1.4,
    color: palette.stroke,
    accent: palette.accent,
    rotate: true,
  },

  frame: {
    enabled: true,
    color: palette.stroke,
    strokeWidth: 2,
    inset: 14,
    corners: true,
  },

  zoom: {
    selectedZoom: 4,
    defaultZoom: 1,
    transition: 1.1,
    minZoom: 1,
    maxZoom: 8,
  },

  projection: {
    scale: 165,
    center: [0, 20],
    rotate: [0, 0, 0],
  },
};

export default mapTheme;
