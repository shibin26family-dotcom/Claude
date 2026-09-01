import type { Character, NewCharacterInput } from "@/types/game";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createNewCharacter(input: NewCharacterInput): Character {
  const now = new Date().toISOString();
  return {
    id: randomId(),
    name: input.name.trim() || "Alex",
    age: input.age,
    cash: input.startingCash,
    stats: { health: 75, happiness: 65, stress: 25, energy: 80 },
    job:
      input.jobTitle && input.jobTitle !== "Unemployed"
        ? { title: input.jobTitle, salary: input.salary, performance: 20 }
        : null,
    education: input.education,
    studyProgress: 0,
    personalityTraits: input.personalityTraits,
    lifeGoals: input.lifeGoals,
    monthsElapsed: 0,
    relationships: [
      { id: randomId(), name: "Mom & Dad", type: "family", closeness: 60 },
      { id: randomId(), name: "Best Friend", type: "friend", closeness: 55 },
    ],
    recentEvents: [
      {
        id: randomId(),
        month: 0,
        title: "A New Beginning",
        description: `${input.name.trim() || "Alex"} starts a new chapter in life.`,
        category: "random",
        statChanges: {},
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}
