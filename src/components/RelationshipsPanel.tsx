import type { Relationship } from "@/types/game";

const TYPE_LABEL: Record<Relationship["type"], string> = {
  family: "Family",
  friend: "Friend",
  partner: "Partner",
  colleague: "Colleague",
};

export default function RelationshipsPanel({ relationships }: { relationships: Relationship[] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">Relationships</h2>
      {relationships.length === 0 && <p className="text-sm text-slate-500">No relationships yet.</p>}
      <div className="space-y-3">
        {relationships.map((r) => (
          <div key={r.id}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-200">
                {r.name} <span className="text-slate-500">&middot; {TYPE_LABEL[r.type]}</span>
              </span>
              <span className="text-slate-400">{r.closeness}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-pink-400 transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, r.closeness))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
