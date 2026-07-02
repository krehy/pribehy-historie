/**
 * RequireRole — deklarativní role-gating pro nástrojové obrazovky.
 * Mock: když role nesedí, ukáže hlášku + hint na Tweaks panel (místo reálného redirectu).
 */
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSession, type Role } from "@/context/session";

export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: React.ReactNode;
}) {
  const { user } = useSession();
  const allowed = Array.isArray(role) ? role : [role];
  if (user && allowed.includes(user.role)) return <>{children}</>;

  return (
    <div className="grid min-h-[60vh] place-items-center bg-zinc-50 px-6">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-500">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-zinc-900">Přístup jen pro roli: {allowed.join(" / ")}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {user ? `Jsi přihlášen jako „${user.name}" (${user.role}).` : "Nejsi přihlášen."} Přepni roli v
          dev <span className="font-medium text-zinc-700">Tweaks</span> panelu vpravo dole.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-full bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-zinc-900 transition-transform hover:-translate-y-0.5"
        >
          Zpět na web
        </Link>
      </div>
    </div>
  );
}
