"use client";

import { useEffect, useState } from "react";
import type { Character, NewCharacterInput, SimulateMonthResult } from "@/types/game";
import { createNewCharacter } from "@/lib/game/newCharacter";
import { deleteCharacter, loadCharacter, persistCharacter, usingSupabase } from "@/lib/storage";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterProfile from "@/components/CharacterProfile";
import StatsPanel from "@/components/StatsPanel";
import FinancesPanel from "@/components/FinancesPanel";
import RelationshipsPanel from "@/components/RelationshipsPanel";
import LifeEventsFeed from "@/components/LifeEventsFeed";
import MonthSummaryModal from "@/components/MonthSummaryModal";

export default function Home() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [summary, setSummary] = useState<SimulateMonthResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCharacter()
      .then(setCharacter)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(input: NewCharacterInput) {
    const newCharacter = createNewCharacter(input);
    await persistCharacter(newCharacter, newCharacter.recentEvents);
    setCharacter(newCharacter);
  }

  async function handleSimulateMonth() {
    if (!character || simulating) return;
    setSimulating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/simulate-month", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ character }),
      });
      if (!res.ok) throw new Error("Simulation request failed");
      const result: SimulateMonthResult = await res.json();

      await persistCharacter(result.character, result.events);
      setCharacter(result.character);
      setSummary(result);
    } catch {
      setErrorMsg("Something went wrong simulating this month. Please try again.");
    } finally {
      setSimulating(false);
    }
  }

  async function handleStartOver() {
    await deleteCharacter(character);
    setCharacter(null);
    setSummary(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </main>
    );
  }

  if (!character) {
    return (
      <main className="min-h-screen px-4 py-12">
        <CharacterCreation onCreate={handleCreate} />
        <p className="mt-4 text-center text-xs text-slate-600">
          {usingSupabase() ? "Connected to Supabase." : "Running in local-only mode (no Supabase env vars set)."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-slate-50">AI Life Simulator</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {usingSupabase() ? "Supabase" : "Local mode"}
          </span>
          <button
            onClick={handleStartOver}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CharacterProfile character={character} />
        <StatsPanel stats={character.stats} />
        <FinancesPanel character={character} />
        <RelationshipsPanel relationships={character.relationships} />
        <div className="md:col-span-2">
          <LifeEventsFeed events={character.recentEvents} />
        </div>
      </div>

      {errorMsg && <p className="mt-4 text-sm text-red-400 text-center">{errorMsg}</p>}

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleSimulateMonth}
          disabled={simulating}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-8 py-3 transition-colors shadow-lg shadow-indigo-500/20"
        >
          {simulating ? "Simulating..." : "Simulate Month"}
        </button>
      </div>

      {summary && <MonthSummaryModal result={summary} onClose={() => setSummary(null)} />}
    </main>
  );
}
