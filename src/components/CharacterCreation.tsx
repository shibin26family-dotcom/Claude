"use client";

import { useState } from "react";
import type { EducationLevel, LifeGoal, NewCharacterInput, PersonalityTrait } from "@/types/game";
import { EDUCATION_LEVELS, LIFE_GOALS, PERSONALITY_TRAITS, STARTER_JOBS } from "@/lib/game/constants";

const MAX_TRAITS = 4;
const MAX_GOALS = 3;

export default function CharacterCreation({ onCreate }: { onCreate: (input: NewCharacterInput) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(24);
  const [education, setEducation] = useState<EducationLevel>("bachelors");
  const [jobTitle, setJobTitle] = useState(STARTER_JOBS[3].title);
  const [salary, setSalary] = useState(STARTER_JOBS[3].salary);
  const [startingCash, setStartingCash] = useState(1500);
  const [traits, setTraits] = useState<PersonalityTrait[]>(["ambitious", "extroverted"]);
  const [goals, setGoals] = useState<LifeGoal[]>(["career_success"]);
  const [error, setError] = useState<string | null>(null);

  function toggleTrait(id: PersonalityTrait) {
    setTraits((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= MAX_TRAITS) return prev;
      return [...prev, id];
    });
  }

  function toggleGoal(id: LifeGoal) {
    setGoals((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, id];
    });
  }

  function handleJobChange(title: string) {
    setJobTitle(title);
    const preset = STARTER_JOBS.find((j) => j.title === title);
    if (preset) setSalary(preset.salary);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your character a name.");
      return;
    }
    if (traits.length === 0) {
      setError("Pick at least one personality trait.");
      return;
    }
    if (goals.length === 0) {
      setError("Pick at least one life goal.");
      return;
    }
    setError(null);
    onCreate({ name, age, education, jobTitle, salary, personalityTraits: traits, lifeGoals: goals, startingCash });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Create Your Character</h1>
        <p className="text-sm text-slate-400 mt-1">Set the starting conditions for your AI-simulated life.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-slate-300">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-300">Age</span>
          <input
            type="number"
            min={18}
            max={80}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-slate-300">Education</span>
        <select
          value={education}
          onChange={(e) => setEducation(e.target.value as EducationLevel)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {EDUCATION_LEVELS.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-slate-300">Starting Job</span>
          <select
            value={jobTitle}
            onChange={(e) => handleJobChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STARTER_JOBS.map((j) => (
              <option key={j.title} value={j.title}>
                {j.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-300">Salary ($/yr)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            disabled={jobTitle === "Unemployed"}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-slate-300">Starting Cash ($)</span>
        <input
          type="number"
          min={0}
          step={100}
          value={startingCash}
          onChange={(e) => setStartingCash(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>

      <div>
        <span className="text-sm text-slate-300">Personality Traits (up to {MAX_TRAITS})</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PERSONALITY_TRAITS.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => toggleTrait(t.id)}
              title={t.description}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                traits.includes(t.id)
                  ? "bg-indigo-500 border-indigo-400 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm text-slate-300">Life Goals (up to {MAX_GOALS})</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {LIFE_GOALS.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              title={g.description}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                goals.includes(g.id)
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold py-2.5 transition-colors"
      >
        Start Life Simulation
      </button>
    </form>
  );
}
