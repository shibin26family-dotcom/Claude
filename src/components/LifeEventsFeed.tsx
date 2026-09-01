import type { LifeEventRecord } from "@/types/game";

const CATEGORY_STYLE: Record<LifeEventRecord["category"], string> = {
  work: "border-l-indigo-400",
  health: "border-l-emerald-400",
  social: "border-l-pink-400",
  finance: "border-l-yellow-400",
  random: "border-l-slate-500",
};

export default function LifeEventsFeed({ events }: { events: LifeEventRecord[] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">Recent Life Events</h2>
      {events.length === 0 && <p className="text-sm text-slate-500">Nothing has happened yet.</p>}
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className={`border-l-2 pl-3 ${CATEGORY_STYLE[e.category]}`}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-100">{e.title}</span>
              <span className="text-xs text-slate-500">Month {e.month}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{e.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
