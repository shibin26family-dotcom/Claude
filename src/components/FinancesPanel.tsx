import type { Character } from "@/types/game";
import { BASE_COST_OF_LIVING } from "@/lib/game/constants";

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function FinancesPanel({ character }: { character: Character }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">Finances</h2>

      <div className="flex items-baseline justify-between mb-3">
        <span className="text-slate-300">Cash</span>
        <span className={`text-2xl font-bold ${character.cash < 0 ? "text-red-400" : "text-slate-50"}`}>
          {currency(character.cash)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Job</span>
          <span className="text-slate-200">{character.job ? character.job.title : "Unemployed"}</span>
        </div>
        {character.job && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Salary</span>
              <span className="text-slate-200">{currency(character.job.salary)}/yr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Performance</span>
              <span className="text-slate-200">{character.job.performance}/100</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Cost of living</span>
          <span className="text-slate-200">~{currency(BASE_COST_OF_LIVING)}/mo</span>
        </div>
      </div>
    </section>
  );
}
