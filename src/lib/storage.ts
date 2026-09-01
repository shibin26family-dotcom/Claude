import type { Character, EducationLevel, LifeEventRecord, PersonalityTrait, LifeGoal, Relationship } from "@/types/game";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

const LOCAL_STORAGE_KEY = "life-sim-character";

// ---------------------------------------------------------------------------
// Persistence layer. When Supabase env vars are configured, character state
// is read from / written to Supabase (see supabase/schema.sql). Otherwise it
// transparently falls back to localStorage so the MVP works with zero setup.
// ---------------------------------------------------------------------------

export function usingSupabase(): boolean {
  return isSupabaseConfigured();
}

function saveLocal(character: Character) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(character));
}

function loadLocal(): Character | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Character;
  } catch {
    return null;
  }
}

function clearLocal() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

interface CharacterRow {
  id: string;
  name: string;
  age: number;
  cash: number;
  health: number;
  happiness: number;
  stress: number;
  energy: number;
  job_title: string | null;
  job_salary: number | null;
  job_performance: number | null;
  education: EducationLevel;
  study_progress: number;
  personality_traits: PersonalityTrait[];
  life_goals: LifeGoal[];
  months_elapsed: number;
  created_at: string;
  updated_at: string;
}

interface RelationshipRow {
  id: string;
  character_id: string;
  name: string;
  type: Relationship["type"];
  closeness: number;
}

interface LifeEventRow {
  id: string;
  character_id: string;
  month: number;
  title: string;
  description: string;
  category: LifeEventRecord["category"];
  stat_changes: LifeEventRecord["statChanges"];
  created_at: string;
}

function rowsToCharacter(
  row: CharacterRow,
  relationshipRows: RelationshipRow[],
  eventRows: LifeEventRow[]
): Character {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    cash: Number(row.cash),
    stats: {
      health: row.health,
      happiness: row.happiness,
      stress: row.stress,
      energy: row.energy,
    },
    job: row.job_title
      ? { title: row.job_title, salary: Number(row.job_salary ?? 0), performance: row.job_performance ?? 0 }
      : null,
    education: row.education,
    studyProgress: row.study_progress,
    personalityTraits: row.personality_traits,
    lifeGoals: row.life_goals,
    monthsElapsed: row.months_elapsed,
    relationships: relationshipRows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      closeness: r.closeness,
    })),
    recentEvents: eventRows.map((e) => ({
      id: e.id,
      month: e.month,
      title: e.title,
      description: e.description,
      category: e.category,
      statChanges: e.stat_changes ?? {},
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function characterToRow(character: Character): Omit<CharacterRow, "created_at"> {
  return {
    id: character.id,
    name: character.name,
    age: character.age,
    cash: character.cash,
    health: character.stats.health,
    happiness: character.stats.happiness,
    stress: character.stats.stress,
    energy: character.stats.energy,
    job_title: character.job?.title ?? null,
    job_salary: character.job?.salary ?? null,
    job_performance: character.job?.performance ?? null,
    education: character.education,
    study_progress: character.studyProgress,
    personality_traits: character.personalityTraits,
    life_goals: character.lifeGoals,
    months_elapsed: character.monthsElapsed,
    updated_at: character.updatedAt,
  };
}

export async function loadCharacter(): Promise<Character | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return loadLocal();

  const localId = typeof window !== "undefined" ? window.localStorage.getItem(`${LOCAL_STORAGE_KEY}-id`) : null;
  if (!localId) return null;

  const { data: characterRow, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", localId)
    .maybeSingle();

  if (error || !characterRow) return null;

  const [{ data: relationshipRows }, { data: eventRows }] = await Promise.all([
    supabase.from("relationships").select("*").eq("character_id", localId),
    supabase
      .from("life_events")
      .select("*")
      .eq("character_id", localId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return rowsToCharacter(characterRow as CharacterRow, relationshipRows ?? [], eventRows ?? []);
}

export async function persistCharacter(
  character: Character,
  newEvents: LifeEventRecord[] = []
): Promise<void> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    saveLocal(character);
    return;
  }

  const row = characterToRow(character);
  await supabase.from("characters").upsert(row);

  // Relationships: simplest correct approach for MVP scale — replace all rows.
  await supabase.from("relationships").delete().eq("character_id", character.id);
  if (character.relationships.length > 0) {
    await supabase.from("relationships").insert(
      character.relationships.map((r) => ({
        id: r.id,
        character_id: character.id,
        name: r.name,
        type: r.type,
        closeness: r.closeness,
      }))
    );
  }

  if (newEvents.length > 0) {
    await supabase.from("life_events").insert(
      newEvents.map((e) => ({
        id: e.id,
        character_id: character.id,
        month: e.month,
        title: e.title,
        description: e.description,
        category: e.category,
        stat_changes: e.statChanges,
      }))
    );
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(`${LOCAL_STORAGE_KEY}-id`, character.id);
  }
}

export async function deleteCharacter(character: Character | null): Promise<void> {
  clearLocal();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`${LOCAL_STORAGE_KEY}-id`);
  }
  const supabase = getSupabaseClient();
  if (supabase && character) {
    await supabase.from("characters").delete().eq("id", character.id);
  }
}
