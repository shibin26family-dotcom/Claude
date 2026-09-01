import { NextRequest, NextResponse } from "next/server";
import type { Character, SimulateMonthResult } from "@/types/game";
import { getAIDecision } from "@/lib/game/ai";
import { simulateMonth } from "@/lib/game/engine";
import { createRng } from "@/lib/game/rng";

// This route is the only place the AI decision layer and the game engine
// meet. Steps 1-4 from the spec happen here, server-side:
//   1. Character state comes in from the client.
//   2. The AI selects actions from the predefined whitelist (ai.ts).
//   3. The deterministic engine (engine.ts) turns those actions + random
//      events into stat/cash/relationship changes.
//   4. The result (new state + narrative) is returned to the client, which
//      persists it (Supabase or localStorage) and renders the summary.
export async function POST(request: NextRequest) {
  let character: Character;
  try {
    const body = await request.json();
    character = body.character as Character;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!character || !character.id || !character.stats) {
    return NextResponse.json({ error: "A valid character is required" }, { status: 400 });
  }

  try {
    const decision = await getAIDecision(character);
    const result: SimulateMonthResult = simulateMonth(character, decision.actionIds, createRng());
    result.aiReasoning = decision.reasoning;

    return NextResponse.json(result);
  } catch (err) {
    console.error("simulate-month failed:", err);
    return NextResponse.json({ error: "Failed to simulate month" }, { status: 500 });
  }
}
