import type { Character, LifeEventCategory, LifeEventRecord, Stats } from "@/types/game";
import type { RNG } from "./rng";
import { chance } from "./rng";

interface EventDefinition {
  id: string;
  title: string;
  description: string;
  category: LifeEventCategory;
  /** base monthly probability, 0-1 */
  baseChance: number;
  /** multiply baseChance based on current character state */
  weight?: (character: Character) => number;
  statChanges: Partial<Stats> & { cash?: number };
}

const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    id: "car_trouble",
    title: "Car Trouble",
    description: "The car broke down and needed an unexpected repair.",
    category: "finance",
    baseChance: 0.08,
    statChanges: { cash: -350, stress: 8 },
  },
  {
    id: "surprise_bonus",
    title: "Surprise Bonus",
    description: "Work paid out a surprise performance bonus.",
    category: "finance",
    baseChance: 0.06,
    weight: (c) => (c.job && c.job.title !== "Unemployed" ? 1.5 : 0),
    statChanges: { cash: 600, happiness: 10 },
  },
  {
    id: "caught_a_cold",
    title: "Caught a Cold",
    description: "Came down with a nasty cold for a few days.",
    category: "health",
    baseChance: 0.1,
    weight: (c) => (c.stats.health < 50 ? 1.8 : 1),
    statChanges: { health: -12, energy: -10 },
  },
  {
    id: "burnout",
    title: "Burnout",
    description: "Weeks of stress caught up all at once.",
    category: "health",
    baseChance: 0.05,
    weight: (c) => (c.stats.stress > 75 ? 2.5 : c.stats.stress > 50 ? 1.2 : 0.2),
    statChanges: { health: -10, happiness: -12, energy: -15 },
  },
  {
    id: "old_friend_visits",
    title: "An Old Friend Visits",
    description: "An old friend was in town and stopped by.",
    category: "social",
    baseChance: 0.08,
    statChanges: { happiness: 10 },
  },
  {
    id: "made_new_friend",
    title: "Made a New Friend",
    description: "Hit it off with someone new.",
    category: "social",
    baseChance: 0.07,
    weight: (c) => (c.personalityTraits.includes("extroverted") ? 1.6 : 1),
    statChanges: { happiness: 8 },
  },
  {
    id: "unexpected_bill",
    title: "Unexpected Bill",
    description: "A surprise bill arrived that had to be paid.",
    category: "finance",
    baseChance: 0.1,
    statChanges: { cash: -220, stress: 6 },
  },
  {
    id: "market_gains",
    title: "Investment Gains",
    description: "Some savings grew nicely this month.",
    category: "finance",
    baseChance: 0.05,
    weight: (c) => (c.cash > 3000 ? 1.5 : 0.4),
    statChanges: { cash: 250, happiness: 4 },
  },
  {
    id: "recognition_at_work",
    title: "Recognized at Work",
    description: "Got public recognition for a job well done.",
    category: "work",
    baseChance: 0.06,
    weight: (c) => (c.job && c.job.title !== "Unemployed" ? 1.4 : 0),
    statChanges: { happiness: 10, stress: -5 },
  },
  {
    id: "conflict_with_coworker",
    title: "Workplace Conflict",
    description: "Butted heads with a coworker over a project.",
    category: "work",
    baseChance: 0.06,
    weight: (c) => (c.job && c.job.title !== "Unemployed" ? 1.2 : 0),
    statChanges: { stress: 10, happiness: -6 },
  },
  {
    id: "quiet_month",
    title: "A Quiet Month",
    description: "Nothing dramatic happened — just steady, ordinary life.",
    category: "random",
    baseChance: 0.12,
    statChanges: {},
  },
];

export function rollLifeEvents(
  character: Character,
  month: number,
  rng: RNG
): LifeEventRecord[] {
  const events: LifeEventRecord[] = [];

  for (const def of EVENT_DEFINITIONS) {
    const weight = def.weight ? def.weight(character) : 1;
    const probability = Math.min(0.95, def.baseChance * weight);
    if (chance(rng, probability)) {
      events.push({
        id: `${def.id}-${month}-${Math.floor(rng() * 1e6)}`,
        month,
        title: def.title,
        description: def.description,
        category: def.category,
        statChanges: def.statChanges,
      });
    }
    if (events.length >= 2) break; // cap at 2 random events per month
  }

  return events;
}
