import type { EducationLevel, LifeGoal, PersonalityTrait } from "@/types/game";

export const PERSONALITY_TRAITS: { id: PersonalityTrait; label: string; description: string }[] = [
  { id: "ambitious", label: "Ambitious", description: "Driven to climb the ladder and achieve more." },
  { id: "disciplined", label: "Disciplined", description: "Sticks to routines and long-term plans." },
  { id: "impulsive", label: "Impulsive", description: "Acts on instinct, spends and decides quickly." },
  { id: "frugal", label: "Frugal", description: "Careful with money, avoids unnecessary spending." },
  { id: "extroverted", label: "Extroverted", description: "Recharges through social contact." },
  { id: "introverted", label: "Introverted", description: "Prefers solitude and quiet time to recharge." },
  { id: "optimistic", label: "Optimistic", description: "Tends to see the bright side of setbacks." },
  { id: "anxious", label: "Anxious", description: "Prone to worry, more sensitive to stress." },
  { id: "creative", label: "Creative", description: "Thrives on novelty and self-expression." },
  { id: "workaholic", label: "Workaholic", description: "Finds identity and drive through work." },
  { id: "laid_back", label: "Laid-back", description: "Easygoing, doesn't sweat the small stuff." },
  { id: "generous", label: "Generous", description: "Gives time and money to others readily." },
];

export const LIFE_GOALS: { id: LifeGoal; label: string; description: string }[] = [
  { id: "get_rich", label: "Get Rich", description: "Build significant wealth." },
  { id: "career_success", label: "Career Success", description: "Rise to the top of a chosen field." },
  { id: "work_life_balance", label: "Work-Life Balance", description: "Keep work from swallowing everything else." },
  { id: "find_love", label: "Find Love", description: "Build a meaningful romantic partnership." },
  { id: "raise_a_family", label: "Raise a Family", description: "Invest in family and home life." },
  { id: "get_fit", label: "Get Fit", description: "Achieve and maintain great physical health." },
  { id: "further_education", label: "Further Education", description: "Keep learning and earn new credentials." },
  { id: "peace_of_mind", label: "Peace of Mind", description: "Minimize stress and stay mentally well." },
  { id: "build_community", label: "Build Community", description: "Invest in friendships and community ties." },
];

export const EDUCATION_LEVELS: { id: EducationLevel; label: string }[] = [
  { id: "high_school", label: "High School Diploma" },
  { id: "some_college", label: "Some College" },
  { id: "bachelors", label: "Bachelor's Degree" },
  { id: "masters", label: "Master's Degree" },
  { id: "doctorate", label: "Doctorate" },
];

export const EDUCATION_ORDER: EducationLevel[] = [
  "high_school",
  "some_college",
  "bachelors",
  "masters",
  "doctorate",
];

export const STARTER_JOBS: { title: string; salary: number; minEducation: EducationLevel }[] = [
  { title: "Retail Associate", salary: 28000, minEducation: "high_school" },
  { title: "Barista", salary: 26000, minEducation: "high_school" },
  { title: "Office Assistant", salary: 34000, minEducation: "some_college" },
  { title: "Junior Developer", salary: 62000, minEducation: "bachelors" },
  { title: "Marketing Coordinator", salary: 48000, minEducation: "bachelors" },
  { title: "Registered Nurse", salary: 68000, minEducation: "bachelors" },
  { title: "Research Analyst", salary: 58000, minEducation: "masters" },
  { title: "Unemployed", salary: 0, minEducation: "high_school" },
];

export const BASE_COST_OF_LIVING = 1400; // monthly baseline, USD

export const MAX_RECENT_EVENTS = 12;
