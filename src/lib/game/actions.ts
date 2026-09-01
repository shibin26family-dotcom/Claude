import type { Character, Stats } from "@/types/game";
import type { RNG } from "./rng";
import { chance, rngInt } from "./rng";

// The AI decision layer may ONLY pick action ids from this list. Every
// numeric effect is defined here in plain deterministic JavaScript — the AI
// never supplies a stat delta itself.

export type StatDelta = Partial<Stats>;

export interface ActionEffectResult {
  statDelta: StatDelta;
  cashDelta: number;
  /** relationship type to nudge closeness for, if any */
  relationshipTypeBoost?: { type: Character["relationships"][number]["type"]; amount: number };
  studyProgressDelta?: number;
  performanceDelta?: number;
  narrative: string;
}

export interface ActionDefinition {
  id: string;
  label: string;
  description: string;
  category: "career" | "wellbeing" | "social" | "finance" | "growth";
  /** Whether this action can currently be chosen for this character */
  isAvailable: (character: Character) => boolean;
  effect: (character: Character, rng: RNG) => ActionEffectResult;
}

function clampDelta(base: number, variancePct: number, rng: RNG): number {
  const variance = base * variancePct;
  return Math.round(base + rngInt(rng, -variance, variance));
}

export const ACTIONS: ActionDefinition[] = [
  {
    id: "work_hard",
    label: "Work Hard",
    description: "Put in extra effort and hours at your job.",
    category: "career",
    isAvailable: (c) => !!c.job && c.job.title !== "Unemployed",
    effect: (c, rng) => {
      const workaholic = c.personalityTraits.includes("workaholic");
      return {
        statDelta: {
          energy: -clampDelta(18, 0.2, rng),
          stress: clampDelta(12, 0.3, rng),
          happiness: workaholic ? 4 : -2,
        },
        cashDelta: 0,
        performanceDelta: clampDelta(15, 0.25, rng),
        narrative: "put in extra effort at work, impressing the team.",
      };
    },
  },
  {
    id: "ask_for_raise",
    label: "Ask for a Raise",
    description: "Make the case to your manager for higher pay.",
    category: "career",
    isAvailable: (c) => !!c.job && c.job.title !== "Unemployed" && (c.job?.performance ?? 0) >= 40,
    effect: (c, rng) => {
      const ambitious = c.personalityTraits.includes("ambitious");
      const successChance = 0.3 + (c.job!.performance / 100) * 0.4 + (ambitious ? 0.1 : 0);
      const succeeded = chance(rng, successChance);
      return {
        statDelta: { stress: 8, happiness: succeeded ? 15 : -8 },
        cashDelta: 0,
        performanceDelta: succeeded ? -20 : 0,
        narrative: succeeded
          ? "asked for a raise and got it!"
          : "asked for a raise but was turned down this time.",
      };
    },
  },
  {
    id: "job_search",
    label: "Search for a New Job",
    description: "Spend time hunting for a better opportunity.",
    category: "career",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { energy: -12, stress: 10 },
      cashDelta: 0,
      narrative: chance(rng, 0.35)
        ? "found a promising new job lead."
        : "sent out applications with no bites yet.",
    }),
  },
  {
    id: "side_hustle",
    label: "Work a Side Hustle",
    description: "Pick up freelance or gig work for extra cash.",
    category: "finance",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { energy: -20, health: -5, stress: 6 },
      cashDelta: clampDelta(420, 0.4, rng),
      narrative: "hustled on the side for extra income.",
    }),
  },
  {
    id: "save_and_budget",
    label: "Save & Budget",
    description: "Cut discretionary spending and stick to a budget.",
    category: "finance",
    isAvailable: () => true,
    effect: (c, rng) => {
      const frugal = c.personalityTraits.includes("frugal");
      return {
        statDelta: { happiness: frugal ? 0 : -4, stress: -6 },
        cashDelta: clampDelta(180, 0.25, rng),
        narrative: "tightened the budget and set money aside.",
      };
    },
  },
  {
    id: "relax_and_recharge",
    label: "Relax & Recharge",
    description: "Take it easy — movies, games, a lazy weekend.",
    category: "wellbeing",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { energy: clampDelta(22, 0.2, rng), happiness: 7, stress: -14 },
      cashDelta: -clampDelta(40, 0.3, rng),
      narrative: "took time to relax and recharge.",
    }),
  },
  {
    id: "exercise",
    label: "Exercise",
    description: "Hit the gym or go for regular runs.",
    category: "wellbeing",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { health: clampDelta(14, 0.2, rng), energy: -8, stress: -8, happiness: 5 },
      cashDelta: -20,
      narrative: "kept up a solid exercise routine.",
    }),
  },
  {
    id: "meditate_and_rest",
    label: "Meditate & Rest",
    description: "Focus on sleep, mindfulness, and mental health.",
    category: "wellbeing",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { stress: -clampDelta(20, 0.2, rng), energy: 10, happiness: 4 },
      cashDelta: 0,
      narrative: "prioritized rest and mindfulness.",
    }),
  },
  {
    id: "see_a_doctor",
    label: "See a Doctor",
    description: "Get a checkup and address any health concerns.",
    category: "wellbeing",
    isAvailable: (c) => c.stats.health < 90,
    effect: (_c, rng) => ({
      statDelta: { health: clampDelta(22, 0.2, rng), stress: -4 },
      cashDelta: -120,
      narrative: "went in for a medical checkup.",
    }),
  },
  {
    id: "socialize_with_friends",
    label: "Socialize with Friends",
    description: "Go out and spend time with friends.",
    category: "social",
    isAvailable: (c) => c.relationships.some((r) => r.type === "friend") || true,
    effect: (c, rng) => {
      const extroverted = c.personalityTraits.includes("extroverted");
      return {
        statDelta: { happiness: extroverted ? 14 : 8, energy: extroverted ? -6 : -14, stress: -6 },
        cashDelta: -clampDelta(60, 0.3, rng),
        relationshipTypeBoost: { type: "friend", amount: clampDelta(10, 0.3, rng) },
        narrative: "spent quality time out with friends.",
      };
    },
  },
  {
    id: "quality_time_family",
    label: "Quality Time with Family",
    description: "Invest time and attention into family relationships.",
    category: "social",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { happiness: 9, energy: -5, stress: -5 },
      cashDelta: -20,
      relationshipTypeBoost: { type: "family", amount: clampDelta(12, 0.3, rng) },
      narrative: "spent meaningful time with family.",
    }),
  },
  {
    id: "nurture_relationship",
    label: "Nurture Your Relationship",
    description: "Plan a date or deepen your romantic partnership.",
    category: "social",
    isAvailable: (c) => c.relationships.some((r) => r.type === "partner"),
    effect: (_c, rng) => ({
      statDelta: { happiness: 12, energy: -8, stress: -6 },
      cashDelta: -clampDelta(80, 0.3, rng),
      relationshipTypeBoost: { type: "partner", amount: clampDelta(12, 0.25, rng) },
      narrative: "nurtured the relationship with a thoughtful date.",
    }),
  },
  {
    id: "volunteer_in_community",
    label: "Volunteer in the Community",
    description: "Give time to a local cause or community group.",
    category: "social",
    isAvailable: () => true,
    effect: (_c, rng) => ({
      statDelta: { happiness: 10, energy: -10, stress: -4 },
      cashDelta: 0,
      relationshipTypeBoost: { type: "friend", amount: clampDelta(6, 0.3, rng) },
      narrative: "volunteered and gave back to the community.",
    }),
  },
  {
    id: "study_and_learn",
    label: "Study & Learn",
    description: "Take courses or study toward the next credential.",
    category: "growth",
    isAvailable: (c) => c.education !== "doctorate",
    effect: (_c, rng) => ({
      statDelta: { energy: -14, stress: 8, happiness: 2 },
      cashDelta: -clampDelta(90, 0.3, rng),
      studyProgressDelta: clampDelta(18, 0.2, rng),
      narrative: "studied hard toward the next qualification.",
    }),
  },
];

export const ACTION_MAP: Record<string, ActionDefinition> = Object.fromEntries(
  ACTIONS.map((a) => [a.id, a])
);

export function availableActions(character: Character): ActionDefinition[] {
  return ACTIONS.filter((a) => a.isAvailable(character));
}
