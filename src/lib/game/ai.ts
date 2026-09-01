import type { AIDecision, Character, PersonalityTrait } from "@/types/game";
import { availableActions } from "./actions";

// ---------------------------------------------------------------------------
// AI decision layer
//
// This module's ONLY job is to choose which predefined action ids the
// character takes this month. It must never return numeric stat changes —
// those are always computed by the deterministic game engine (see engine.ts).
//
// Two implementations are provided:
//   - getMockAIDecision: a heuristic stand-in used for the MVP, no API key
//     required. This is what the app uses by default.
//   - getAnthropicAIDecision: a real Claude API call, used automatically once
//     ANTHROPIC_API_KEY is set. Its output is strictly validated against the
//     action whitelist before it ever reaches the engine.
// ---------------------------------------------------------------------------

const TRAIT_ACTION_WEIGHTS: Partial<Record<PersonalityTrait, Record<string, number>>> = {
  workaholic: { work_hard: 2, ask_for_raise: 1.5, relax_and_recharge: -1 },
  ambitious: { ask_for_raise: 1.5, work_hard: 1.2, job_search: 1.2, study_and_learn: 1 },
  frugal: { save_and_budget: 2, side_hustle: 0.8, relax_and_recharge: -0.5 },
  impulsive: { relax_and_recharge: 1.2, socialize_with_friends: 1, save_and_budget: -1 },
  extroverted: { socialize_with_friends: 2, volunteer_in_community: 1, meditate_and_rest: -0.5 },
  introverted: { meditate_and_rest: 1.3, relax_and_recharge: 1, socialize_with_friends: -0.8 },
  optimistic: { job_search: 0.5, ask_for_raise: 0.5 },
  anxious: { meditate_and_rest: 1.5, see_a_doctor: 0.8, ask_for_raise: -0.8 },
  creative: { study_and_learn: 0.8, volunteer_in_community: 0.5 },
  laid_back: { relax_and_recharge: 1.3, work_hard: -0.8 },
  generous: { volunteer_in_community: 1.5, quality_time_family: 0.8 },
  disciplined: { study_and_learn: 1, exercise: 1, save_and_budget: 1 },
};

const GOAL_ACTION_WEIGHTS: Record<string, Record<string, number>> = {
  get_rich: { side_hustle: 2, save_and_budget: 1.5, ask_for_raise: 1.5, work_hard: 1 },
  career_success: { work_hard: 2, ask_for_raise: 1.5, job_search: 1 },
  work_life_balance: { relax_and_recharge: 1.5, meditate_and_rest: 1.2, work_hard: -1 },
  find_love: { nurture_relationship: 2, socialize_with_friends: 1.2 },
  raise_a_family: { quality_time_family: 2 },
  get_fit: { exercise: 2, see_a_doctor: 0.8 },
  further_education: { study_and_learn: 2.5 },
  peace_of_mind: { meditate_and_rest: 2, relax_and_recharge: 1 },
  build_community: { volunteer_in_community: 2, socialize_with_friends: 1 },
};

/**
 * Heuristic mock "AI". Scores every currently-available action based on the
 * character's stat deficits, personality traits, and life goals, then picks
 * the top few. This lets the whole game loop work end-to-end with zero API
 * keys, and is swapped out for `getAnthropicAIDecision` transparently.
 */
export async function getMockAIDecision(character: Character): Promise<AIDecision> {
  const candidates = availableActions(character);
  const scored = candidates.map((action) => {
    let score = 1 + Math.random() * 0.6; // small variety noise

    // Stat-deficit heuristics
    if (action.id === "relax_and_recharge" || action.id === "meditate_and_rest") {
      if (character.stats.energy < 40) score += 2;
      if (character.stats.stress > 60) score += 2;
    }
    if (action.id === "exercise" || action.id === "see_a_doctor") {
      if (character.stats.health < 50) score += 2.5;
    }
    if (action.id === "side_hustle" || action.id === "save_and_budget" || action.id === "work_hard") {
      if (character.cash < 500) score += 2;
    }
    if (action.id === "work_hard" || action.id === "relax_and_recharge") {
      if (character.stats.energy < 20) score -= 2; // too tired to work hard
    }

    for (const trait of character.personalityTraits) {
      score += TRAIT_ACTION_WEIGHTS[trait]?.[action.id] ?? 0;
    }
    for (const goal of character.lifeGoals) {
      score += GOAL_ACTION_WEIGHTS[goal]?.[action.id] ?? 0;
    }

    return { action, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored.slice(0, 3).map((s) => s.action);

  const reasoning = `Based on ${character.name}'s current stats (energy ${character.stats.energy}, stress ${character.stats.stress}, health ${character.stats.health}, cash $${Math.round(
    character.cash
  )}), personality (${character.personalityTraits.join(", ") || "none"}), and goals (${
    character.lifeGoals.join(", ") || "none"
  }), the top priorities this month are: ${chosen.map((a) => a.label).join(", ")}.`;

  return {
    actionIds: chosen.map((a) => a.id),
    reasoning,
    source: "mock",
  };
}

/**
 * Real Claude API call. The model is asked to return ONLY a JSON object of
 * the shape { actionIds: string[], reasoning: string }, choosing exclusively
 * from the provided whitelist. Any id outside the whitelist is dropped
 * before the result is handed to the engine — the model can never inject a
 * stat change, only pick from the allowed menu.
 */
export async function getAnthropicAIDecision(character: Character): Promise<AIDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const candidates = availableActions(character);
  const whitelist = candidates.map((a) => a.id);

  const systemPrompt = `You are the decision-making layer of a life simulation game. Given a character's current state, choose 2-4 actions for them to take this month.
You MUST respond with ONLY a JSON object of the exact shape {"actionIds": string[], "reasoning": string}.
"actionIds" MUST be chosen exclusively from this whitelist: ${JSON.stringify(whitelist)}.
Never include any id not in that list. Never include numeric stat values — those are computed elsewhere.`;

  const userPrompt = JSON.stringify({
    name: character.name,
    age: character.age,
    cash: Math.round(character.cash),
    stats: character.stats,
    job: character.job,
    education: character.education,
    personalityTraits: character.personalityTraits,
    lifeGoals: character.lifeGoals,
    relationships: character.relationships.map((r) => ({ type: r.type, closeness: r.closeness })),
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? "{}";

  let parsed: { actionIds?: unknown; reasoning?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  const rawIds = Array.isArray(parsed.actionIds) ? parsed.actionIds : [];
  const validated = rawIds.filter((id): id is string => typeof id === "string" && whitelist.includes(id));

  // Fall back to the mock decision if the model returned nothing usable.
  if (validated.length === 0) {
    const fallback = await getMockAIDecision(character);
    return { ...fallback, source: "anthropic" };
  }

  return {
    actionIds: validated,
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    source: "anthropic",
  };
}

/**
 * Entry point used by the API route. Uses the real Claude API when
 * ANTHROPIC_API_KEY is configured, otherwise falls back to the mock AI so
 * the game is fully playable with zero setup.
 */
export async function getAIDecision(character: Character): Promise<AIDecision> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await getAnthropicAIDecision(character);
    } catch (err) {
      console.error("Anthropic AI decision failed, falling back to mock AI:", err);
    }
  }
  return getMockAIDecision(character);
}
