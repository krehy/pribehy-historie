import { useEffect, useRef, useState } from "react";

interface ChromaImageProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Vyklíčuje zelené pozadí (chroma key) přímo v prohlížeči přes canvas —
 * z greenscreen obrázku udělá průhlednou postavu (jako „kdo jsme" na gtw-web).
 * Odstraní zelené pixely + potlačí zelený lem (despill).
 */
export function ChromaImage({ src, alt, className }: ChromaImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, c.width, c.height);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        // Silně zelené → úplně průhledné
        if (g > 90 && g > r * 1.4 && g > b * 1.4) {
          d[i + 3] = 0;
        } else if (g > 80 && g > r * 1.1 && g > b * 1.1) {
          // Zelený lem → poloprůhledné + despill (sraž zelenou k okolí)
          d[i + 3] = Math.min(d[i + 3], 120);
          d[i + 1] = Math.max(r, b);
        } else if (g > r && g > b) {
          // Jemný despill i uvnitř postavy (potlač zelený nádech)
          d[i + 1] = Math.round((g + Math.max(r, b)) / 2);
        }
      }
      ctx.putImageData(frame, 0, 0);
      setReady(true);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className={className}
      style={{ opacity: ready ? 1 : 0, transition: "opacity .5s ease" }}
    />
  );
}
