import type { Stats } from "@/types/game";
import StatBar from "./StatBar";

export default function StatsPanel({ stats }: { stats: Stats }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">Stats</h2>
      <div className="space-y-4">
        <StatBar label="Health" value={stats.health} colorClass="bg-emerald-500" />
        <StatBar label="Happiness" value={stats.happiness} colorClass="bg-yellow-400" />
        <StatBar label="Stress" value={stats.stress} colorClass="bg-red-500" />
        <StatBar label="Energy" value={stats.energy} colorClass="bg-sky-400" />
      </div>
    </section>
  );
}
