// Core domain types for the life simulator.
// The AI layer only ever produces `actionIds: string[]` — every numeric
// stat change is computed by the deterministic game engine.

export type PersonalityTrait =
  | "ambitious"
  | "disciplined"
  | "impulsive"
  | "frugal"
  | "extroverted"
  | "introverted"
  | "optimistic"
  | "anxious"
  | "creative"
  | "workaholic"
  | "laid_back"
  | "generous";

export type LifeGoal =
  | "get_rich"
  | "career_success"
  | "work_life_balance"
  | "find_love"
  | "raise_a_family"
  | "get_fit"
  | "further_education"
  | "peace_of_mind"
  | "build_community";

export type EducationLevel =
  | "high_school"
  | "some_college"
  | "bachelors"
  | "masters"
  | "doctorate";

export interface Job {
  title: string;
  salary: number; // annual, USD
  performance: number; // 0-100 progress toward next promotion
}

export interface Stats {
  health: number; // 0-100
  happiness: number; // 0-100
  stress: number; // 0-100
  energy: number; // 0-100
}

export type RelationshipType = "family" | "friend" | "partner" | "colleague";

export interface Relationship {
  id: string;
  name: string;
  type: RelationshipType;
  closeness: number; // 0-100
}

export type LifeEventCategory = "work" | "health" | "social" | "finance" | "random";

export interface LifeEventRecord {
  id: string;
  month: number;
  title: string;
  description: string;
  category: LifeEventCategory;
  statChanges: Partial<Stats> & { cash?: number };
}

export interface Character {
  id: string;
  name: string;
  age: number;
  cash: number;
  stats: Stats;
  job: Job | null;
  education: EducationLevel;
  studyProgress: number; // 0-100, accumulated toward next education level
  personalityTraits: PersonalityTrait[];
  lifeGoals: LifeGoal[];
  monthsElapsed: number;
  relationships: Relationship[];
  recentEvents: LifeEventRecord[]; // most recent first, capped
  createdAt: string;
  updatedAt: string;
}

export interface NewCharacterInput {
  name: string;
  age: number;
  education: EducationLevel;
  jobTitle: string;
  salary: number;
  personalityTraits: PersonalityTrait[];
  lifeGoals: LifeGoal[];
  startingCash: number;
}

// --- AI decision layer -----------------------------------------------------

export interface AIDecision {
  actionIds: string[];
  reasoning: string;
  source: "mock" | "anthropic";
}

// --- Simulation result -------------------------------------------------

export interface AppliedAction {
  id: string;
  label: string;
  narrative: string;
}

export interface SimulateMonthResult {
  character: Character;
  appliedActions: AppliedAction[];
  events: LifeEventRecord[];
  narrative: string;
  aiReasoning: string;
}
