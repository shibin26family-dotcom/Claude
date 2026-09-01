import type { SimulateMonthResult } from "@/types/game";

export default function MonthSummaryModal({
  result,
  onClose,
}: {
  result: SimulateMonthResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-50">Month {result.character.monthsElapsed} Summary</h2>

        {result.aiReasoning && (
          <div className="mt-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300 mb-1">AI Focus</p>
            <p className="text-sm text-indigo-100">{result.aiReasoning}</p>
          </div>
        )}

        {result.appliedActions.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Actions Taken</p>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
              {result.appliedActions.map((a) => (
                <li key={a.id}>{a.label}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Narrative</p>
          <p className="text-sm leading-relaxed text-slate-200">{result.narrative}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold py-2.5 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
