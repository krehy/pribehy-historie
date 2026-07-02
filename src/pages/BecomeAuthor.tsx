/**
 * BecomeAuthor — onboarding wizard (MOCK). Kroky: o autorovi → sken obličeje +
 * ≥3 fotky → náhled charakteru → publikace. Bez reálné kamery/AI (design flow).
 * Na konci nastaví mock session na autora a přesměruje na jeho profil.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, ImagePlus, Sparkles, User, ArrowRight, ArrowLeft } from "lucide-react";
import { useSession } from "@/context/session";

const BASE = import.meta.env.BASE_URL;
const STEPS = ["O tobě", "Tvář", "Fotky", "Charakter"];

export default function BecomeAuthor() {
  const { setUser } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [photos, setPhotos] = useState(0);

  const canNext = step === 1 ? scanned : step === 2 ? photos >= 3 : true;

  const publish = () => {
    setUser({ name: "Křehy", role: "author", slug: "krehy" });
    navigate("/author/krehy");
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 font-sans text-zinc-800">
      <div className="mx-auto max-w-xl px-5 py-8">
        <h1 className="font-display text-2xl font-extrabold text-zinc-900">Staň se autorem</h1>
        <p className="mt-1 text-sm text-zinc-500">Vytvoř si veřejný profil a začni tvořit příběhy.</p>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={
                  "grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors " +
                  (i < step
                    ? "bg-green-600 text-white"
                    : i === step
                    ? "bg-amber-400 text-zinc-900"
                    : "bg-zinc-200 text-zinc-400")
                }
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={"text-[11px] " + (i === step ? "text-zinc-800" : "text-zinc-400")}>{label}</span>
            </div>
          ))}
        </div>

        {/* Obsah kroku */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900">
                <User className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-lg font-bold">Řekni nám o sobě</h2>
              </div>
              <div className="grid gap-3">
                <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-amber-400" placeholder="Jméno" defaultValue="Samuel" />
                <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-amber-400" placeholder="Příjmení" defaultValue="Křehy" />
                <textarea rows={3} className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-amber-400" placeholder="Něco o tobě — co tě na dějinách baví…" />
              </div>
              <p className="text-xs text-zinc-400">Autoři vystupují pod skutečným jménem — buduje to důvěru čtenářů.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-zinc-900">
                <Camera className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-lg font-bold">Naskenuj svou tvář</h2>
              </div>
              <div className="mx-auto grid aspect-square w-48 place-items-center rounded-full border-4 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400">
                {scanned ? (
                  <span className="flex flex-col items-center text-green-600">
                    <Check className="h-10 w-10" />
                    <span className="mt-1 text-sm font-medium">Naskenováno</span>
                  </span>
                ) : (
                  <Camera className="h-12 w-12" />
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Naváděný sken (mobil/webka) — z něj se vytvoří tvůj AI charakter. Biometrická data se
                zpracují jen se souhlasem.
              </p>
              <button
                onClick={() => setScanned(true)}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                {scanned ? "Skenovat znovu" : "Spustit kameru (mock)"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900">
                <ImagePlus className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-lg font-bold">Nahraj alespoň 3 fotky</h2>
              </div>
              <p className="text-xs text-zinc-500">
                Podle nich odhadneme typ postavy a styl oblékání → realističtější charakter. Ideálně celá
                postava z různých úhlů.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: Math.max(3, photos) }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      "grid aspect-square place-items-center rounded-lg border text-xs " +
                      (i < photos ? "border-green-300 bg-green-50 text-green-600" : "border-dashed border-zinc-300 bg-zinc-50 text-zinc-300")
                    }
                  >
                    {i < photos ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhotos((p) => p + 1)}
                className="w-full rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                + Přidat fotku (mock)
              </button>
              <div className="text-center text-xs text-zinc-400">{photos}/3 nahráno</div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-zinc-900">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-lg font-bold">Tvůj AI charakter</h2>
              </div>
              <div className="mx-auto h-56 w-44 overflow-hidden rounded-2xl border-2 border-amber-300 bg-zinc-900 shadow">
                <img src={`${BASE}stories/cze-charles-iv-green.jpg`} alt="charakter" className="h-full w-full object-cover" />
              </div>
              <p className="text-xs text-zinc-500">
                Placeholder — z reálného skenu a fotek se vygeneruje stylizovaná podobizna, která pak může
                vystupovat i v tvých příbězích.
              </p>
            </div>
          )}
        </div>

        {/* Navigace */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" /> Zpět
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-900 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Pokračovat <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={publish}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <Check className="h-4 w-4" /> Publikovat profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
