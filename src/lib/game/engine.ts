import type {
  AppliedAction,
  Character,
  LifeEventRecord,
  SimulateMonthResult,
  Stats,
} from "@/types/game";
import { ACTION_MAP, availableActions } from "./actions";
import { BASE_COST_OF_LIVING, EDUCATION_ORDER, MAX_RECENT_EVENTS } from "./constants";
import { rollLifeEvents } from "./events";
import { createRng, rngInt, type RNG } from "./rng";

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function cloneCharacter(character: Character): Character {
  return {
    ...character,
    stats: { ...character.stats },
    job: character.job ? { ...character.job } : null,
    personalityTraits: [...character.personalityTraits],
    lifeGoals: [...character.lifeGoals],
    relationships: character.relationships.map((r) => ({ ...r })),
    recentEvents: character.recentEvents.map((e) => ({ ...e, statChanges: { ...e.statChanges } })),
  };
}

function costOfLivingMultiplier(character: Character): number {
  let multiplier = 1;
  if (character.personalityTraits.includes("frugal")) multiplier -= 0.15;
  if (character.personalityTraits.includes("impulsive")) multiplier += 0.15;
  if (character.personalityTraits.includes("generous")) multiplier += 0.08;
  return Math.max(0.5, multiplier);
}

function moodWord(stats: Stats): string {
  if (stats.happiness >= 75) return "thriving";
  if (stats.happiness >= 55) return "content";
  if (stats.happiness >= 35) return "a bit worn down";
  return "struggling emotionally";
}

/**
 * Deterministic game engine. Given a character and a list of AI-selected
 * action ids, computes every stat/cash/relationship change in plain
 * JavaScript. The AI decision layer never touches numbers directly — it
 * only ever supplies `actionIds`, which are validated against the action
 * whitelist here.
 */
export function simulateMonth(
  character: Character,
  chosenActionIds: string[],
  rng: RNG = createRng()
): SimulateMonthResult {
  const next = cloneCharacter(character);
  const month = next.monthsElapsed + 1;

  // 1. Income & cost of living
  const monthlyIncome = next.job ? next.job.salary / 12 : 0;
  const cost = BASE_COST_OF_LIVING * costOfLivingMultiplier(next);
  next.cash += monthlyIncome - cost;

  // 2. Apply chosen actions (validated against the whitelist + availability)
  const validActionIds = new Set(availableActions(next).map((a) => a.id));
  const appliedActions: AppliedAction[] = [];
  const statAccumulator: Stats = { health: 0, happiness: 0, stress: 0, energy: 0 };

  for (const actionId of chosenActionIds) {
    const def = ACTION_MAP[actionId];
    if (!def || !validActionIds.has(actionId)) continue; // ignore anything AI hallucinates

    const result = def.effect(next, rng);
    (Object.keys(result.statDelta) as (keyof Stats)[]).forEach((key) => {
      statAccumulator[key] += result.statDelta[key] ?? 0;
    });
    next.cash += result.cashDelta;

    if (result.performanceDelta && next.job) {
      next.job.performance = Math.max(0, next.job.performance + result.performanceDelta);
    }
    if (result.studyProgressDelta) {
      next.studyProgress = Math.max(0, next.studyProgress + result.studyProgressDelta);
    }
    if (result.relationshipTypeBoost) {
      const { type, amount } = result.relationshipTypeBoost;
      next.relationships
        .filter((r) => r.type === type)
        .forEach((r) => {
          r.closeness = clampStat(r.closeness + amount);
        });
    }

    appliedActions.push({ id: def.id, label: def.label, narrative: result.narrative });
  }

  // 3. Random life events (rolled against post-action state)
  const randomEvents = rollLifeEvents(next, month, rng);
  const systemEvents: LifeEventRecord[] = [];

  for (const event of randomEvents) {
    statAccumulator.health += event.statChanges.health ?? 0;
    statAccumulator.happiness += event.statChanges.happiness ?? 0;
    statAccumulator.stress += event.statChanges.stress ?? 0;
    statAccumulator.energy += event.statChanges.energy ?? 0;
    next.cash += event.statChanges.cash ?? 0;
  }

  // 4. Apply accumulated stat deltas, then clamp
  next.stats.health = clampStat(next.stats.health + statAccumulator.health);
  next.stats.happiness = clampStat(next.stats.happiness + statAccumulator.happiness);
  next.stats.stress = clampStat(next.stats.stress + statAccumulator.stress);
  next.stats.energy = clampStat(next.stats.energy + statAccumulator.energy);
  next.relationships.forEach((r) => (r.closeness = clampStat(r.closeness)));

  // 5. Job promotion (deterministic threshold, not AI-decided)
  if (next.job && next.job.performance >= 100) {
    const raisePct = rngInt(rng, 12, 18) / 100;
    const newSalary = Math.round(next.job.salary * (1 + raisePct));
    systemEvents.push({
      id: `promotion-${month}`,
      month,
      title: "Promotion!",
      description: `Promoted at work — salary rose from $${next.job.salary.toLocaleString()} to $${newSalary.toLocaleString()}.`,
      category: "work",
      statChanges: { happiness: 10 },
    });
    next.job.salary = newSalary;
    next.job.performance -= 100;
    next.stats.happiness = clampStat(next.stats.happiness + 10);
  }

  // 6. Education level-up (deterministic threshold)
  if (next.studyProgress >= 100) {
    const currentIndex = EDUCATION_ORDER.indexOf(next.education);
    if (currentIndex < EDUCATION_ORDER.length - 1) {
      next.education = EDUCATION_ORDER[currentIndex + 1];
      systemEvents.push({
        id: `graduation-${month}`,
        month,
        title: "Graduated!",
        description: `Completed studies and advanced to ${next.education.replace("_", " ")}.`,
        category: "work",
        statChanges: { happiness: 12 },
      });
      next.stats.happiness = clampStat(next.stats.happiness + 12);
    }
    next.studyProgress = 0;
  }

  // 7. Age up once every 12 simulated months
  next.monthsElapsed = month;
  if (month % 12 === 0) {
    next.age += 1;
  }

  // 8. Merge this month's events into recent history
  const monthEvents = [...systemEvents, ...randomEvents];
  next.recentEvents = [...monthEvents, ...next.recentEvents].slice(0, MAX_RECENT_EVENTS);

  next.updatedAt = new Date().toISOString();

  // 9. Narrative summary (deterministic template, independent of the AI)
  const actionSentences = appliedActions.map((a) => `${next.name} ${a.narrative}`);
  const eventSentences = monthEvents.map((e) => `${e.title}: ${e.description}`);
  const financeLine = `Ended the month with $${Math.round(next.cash).toLocaleString()} in cash, feeling ${moodWord(
    next.stats
  )}.`;

  const narrative = [...actionSentences, ...eventSentences, financeLine].join(" ");

  return {
    character: next,
    appliedActions,
    events: monthEvents,
    narrative,
    aiReasoning: "",
  };
}
