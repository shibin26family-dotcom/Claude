import type { Character } from "@/types/game";
import { EDUCATION_LEVELS, LIFE_GOALS, PERSONALITY_TRAITS } from "@/lib/game/constants";

export default function CharacterProfile({ character }: { character: Character }) {
  const educationLabel = EDUCATION_LEVELS.find((e) => e.id === character.education)?.label ?? character.education;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-slate-50">{character.name}</h2>
        <span className="text-sm text-slate-400">Age {character.age}</span>
      </div>
      <p className="text-sm text-slate-400 mt-1">
        {educationLabel} &middot; Month {character.monthsElapsed}
      </p>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Personality</h3>
        <div className="flex flex-wrap gap-1.5">
          {character.personalityTraits.map((t) => (
            <span
              key={t}
              className="rounded-full bg-indigo-500/15 text-indigo-300 text-xs px-2 py-0.5 border border-indigo-500/30"
            >
              {PERSONALITY_TRAITS.find((p) => p.id === t)?.label ?? t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Life Goals</h3>
        <div className="flex flex-wrap gap-1.5">
          {character.lifeGoals.map((g) => (
            <span
              key={g}
              className="rounded-full bg-emerald-500/15 text-emerald-300 text-xs px-2 py-0.5 border border-emerald-500/30"
            >
              {LIFE_GOALS.find((l) => l.id === g)?.label ?? g}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
