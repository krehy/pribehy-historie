/**
 * TweaksPanel — DEV-only plovoucí panel pro návrh a screenshoty rozhraní.
 * Přepíná roli (čtenář/autor/admin) + přihlášen/odhlášen. V produkci se nevykreslí.
 */
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSession, mockUserForRole, type Role } from "@/context/session";

const STATES: { key: Role | "guest"; label: string }[] = [
  { key: "guest", label: "Odhlášen" },
  { key: "reader", label: "Čtenář" },
  { key: "author", label: "Autor" },
  { key: "admin", label: "Admin" },
];

export function TweaksPanel() {
  // Design preview: panel je viditelný i v produkčním buildu (GH Pages), aby šlo
  // přepínat role na mobilu. Až půjde do ostrého provozu, vrátit `import.meta.env.DEV`.
  return <TweaksPanelInner />;
}

function TweaksPanelInner() {
  const { user, setUser } = useSession();
  const [open, setOpen] = useState(false);
  const current: Role | "guest" = user?.role ?? "guest";

  const apply = (key: Role | "guest") =>
    setUser(key === "guest" ? null : mockUserForRole(key));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Dev tweaks"
        className="fixed bottom-4 right-4 z-[70] grid h-11 w-11 place-items-center rounded-full bg-zinc-900/90 text-zinc-100 shadow-lg ring-1 ring-white/10 backdrop-blur transition-transform hover:scale-105"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-60 rounded-2xl bg-zinc-900/95 p-4 font-sans text-zinc-100 shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Dev · Tweaks
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Zavřít"
          className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1.5 text-[11px] text-zinc-500">Přihlášení / role</div>
      <div className="grid grid-cols-2 gap-1.5">
        {STATES.map((s) => {
          const active = current === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => apply(s.key)}
              className={
                "rounded-lg px-2.5 py-2 text-sm font-medium transition-colors " +
                (active
                  ? "bg-amber-400 text-zinc-900"
                  : "bg-white/5 text-zinc-200 hover:bg-white/10")
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-zinc-500">
        {user ? (
          <>
            Přihlášen: <span className="text-zinc-300">{user.name}</span> ·{" "}
            <span className="text-amber-400">{user.role}</span>
          </>
        ) : (
          "Nepřihlášený návštěvník"
        )}
      </div>
    </div>
  );
}
