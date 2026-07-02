/**
 * RichTextEditor — lehký WYSIWYG pro článek (bez závislostí, contentEditable +
 * document.execCommand). Umí tučné/kurzívu, nadpis, citaci, seznam a vložení
 * obrázku URL. Ukládá HTML string (Story.body). Nekontrolovaný — obsah se nastaví
 * jednou z `initialHtml`; parent ho může resetovat změnou `key`.
 */
import { useEffect, useRef } from "react";
import { Bold, Italic, Heading, Quote, List, ImagePlus } from "lucide-react";

export function RichTextEditor({
  initialHtml,
  onChange,
  placeholder = "Piš článek…",
  minHeight = 320,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? "");
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };
  const insertImage = () => {
    const url = window.prompt("URL obrázku (např. z Wikimedia Commons):");
    if (url) exec("insertImage", url);
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800">
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 focus-within:border-amber-400">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <Btn onClick={() => exec("bold")} title="Tučně"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("italic")} title="Kurzíva"><Italic className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-zinc-200" />
        <Btn onClick={() => exec("formatBlock", "<h2>")} title="Nadpis"><Heading className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("formatBlock", "<blockquote>")} title="Citace"><Quote className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("insertUnorderedList")} title="Seznam"><List className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-zinc-200" />
        <Btn onClick={insertImage} title="Vložit obrázek"><ImagePlus className="h-4 w-4" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className="rte prose-editor max-w-none px-4 py-3 text-sm leading-relaxed text-zinc-800 outline-none"
        style={{ minHeight }}
      />
      <style>{`
        .rte:empty:before { content: attr(data-placeholder); color: #a1a1aa; }
        .rte h2 { font-family: var(--font-display, inherit); font-weight: 800; font-size: 1.15rem; margin: 0.6em 0 0.3em; color: #18181b; }
        .rte blockquote { border-left: 3px solid #f4c430; padding-left: 0.8em; margin: 0.6em 0; font-style: italic; color: #52525b; }
        .rte ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .rte p { margin: 0.5em 0; }
        .rte img { max-width: 100%; border-radius: 0.5rem; margin: 0.6em 0; }
      `}</style>
    </div>
  );
}
