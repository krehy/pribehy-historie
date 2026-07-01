import { mapTheme } from "@/config/mapTheme";

/**
 * SVG <defs> pro pergamenový efekt mapy — vše řízené z mapTheme.
 *  - #rough-edges: feTurbulence + feDisplacementMap pro roztřepené hranice
 *  - #paper-grain: jemná zrnitost papíru (použito v overlay vrstvě)
 */
export function ParchmentDefs() {
  const { roughEdges, paperTexture } = mapTheme;
  return (
    <defs>
      {roughEdges.enabled && (
        <filter id="rough-edges" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={roughEdges.baseFrequency}
            numOctaves={roughEdges.octaves}
            seed={roughEdges.seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={roughEdges.scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      )}

      {paperTexture.enabled && (
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={paperTexture.baseFrequency}
            numOctaves={paperTexture.octaves}
            stitchTiles="stitch"
            result="grain"
          />
          <feColorMatrix type="saturate" values="0" in="grain" result="mono" />
          <feComponentTransfer in="mono">
            <feFuncA type="linear" slope={paperTexture.opacity} intercept="0" />
          </feComponentTransfer>
        </filter>
      )}
    </defs>
  );
}
