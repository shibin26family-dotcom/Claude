# AI Life Simulator

A web-based life simulator built with Next.js (App Router) and Supabase.
Create a character, then click **Simulate Month** to advance their life one
month at a time — an AI layer chooses which actions the character takes,
and a deterministic game engine turns those choices (plus random life
events) into stat, cash, and relationship changes.

This is an **MVP**: it ships with a mock AI decision-maker so the whole
game loop works with zero setup, and swaps in the real Claude API the
moment `ANTHROPIC_API_KEY` is set. It also works with or without Supabase —
without it, state is saved to the browser's `localStorage` instead.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The game works immediately — no environment
variables required.

## Architecture

The key design constraint: **the AI never touches a number.** It only ever
selects action ids from a predefined whitelist; every stat/cash/relationship
change is computed by plain, deterministic JavaScript.

```
src/
  types/game.ts          Character, Stats, Job, Relationship, LifeEvent, etc.
  lib/game/
    constants.ts          Personality traits, life goals, education levels, starter jobs
    actions.ts             The predefined action whitelist + deterministic effect functions
    events.ts               Weighted random life event generator
    engine.ts                 simulateMonth(): the deterministic game engine
    ai.ts                       AI decision layer (mock heuristic + real Claude API call)
    rng.ts                        Seedable PRNG so a month can be replayed for debugging
    newCharacter.ts                 Character creation factory
  lib/
    supabase.ts             Supabase client, only instantiated if env vars are set
    storage.ts                Persistence: Supabase when configured, localStorage otherwise
  app/
    page.tsx                Main game screen (client component)
    api/simulate-month/route.ts   Orchestrates: AI decision -> game engine -> response
  components/               UI: CharacterCreation, CharacterProfile, StatsPanel,
                             FinancesPanel, RelationshipsPanel, LifeEventsFeed,
                             MonthSummaryModal
supabase/schema.sql        Postgres schema for Supabase (characters, relationships, life_events)
```

### The Simulate Month flow

1. The client sends the character's current state to `POST /api/simulate-month`.
2. **AI decision** (`lib/game/ai.ts`) picks 2-4 action ids from the whitelist
   in `lib/game/actions.ts`, based on the character's stats, personality,
   and goals. It returns `{ actionIds, reasoning }` — nothing numeric.
3. **Game engine** (`lib/game/engine.ts`) applies each action's
   pre-defined effect function, adds monthly income and cost of living,
   rolls random life events (`lib/game/events.ts`), resolves job
   promotions and education level-ups, clamps every stat to 0-100, and
   builds a narrative summary — all deterministic.
4. The route returns the updated character, the events that occurred, and
   the narrative.
5. The client persists the new state (Supabase if configured, otherwise
   localStorage) and renders the "Month Summary" modal.

### Swapping in the real Claude API

`lib/game/ai.ts` already contains `getAnthropicAIDecision()`, which sends
the character's state to Claude with a system prompt constrained to return
`{"actionIds": string[], "reasoning": string}`, chosen only from the
whitelist. Any id the model returns that isn't in the whitelist is silently
dropped before the engine ever sees it. Set `ANTHROPIC_API_KEY` in your
environment and the app switches over automatically (`getAIDecision()`
tries the real API first and falls back to the mock heuristic if it fails).

## Supabase setup (optional)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (creates `characters`,
   `relationships`, and `life_events` tables with permissive RLS policies —
   there's no auth system yet, so treat this as a personal/demo setup).
3. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your
   project's API settings.
4. Restart `npm run dev`. The footer under the character creation form (and
   the header once a character exists) will say "Supabase" instead of
   "Local mode".

Without Supabase configured, everything still works — state just lives in
the browser's `localStorage` under a single active character.

## Game design notes

- **Actions** (`lib/game/actions.ts`): ~14 predefined actions across career,
  wellbeing, social, finance, and growth categories (Work Hard, Ask for a
  Raise, Exercise, Socialize with Friends, Study & Learn, etc.), each with a
  deterministic effect function (with small randomized variance) on stats,
  cash, relationships, job performance, or study progress.
- **Random events** (`lib/game/events.ts`): a weighted pool of events
  (car trouble, a surprise bonus, burnout, an old friend visiting, ...)
  where some probabilities scale with the character's current state (e.g.
  burnout is far more likely above 75 stress).
- **Job & education progression**: job performance accumulated by actions
  triggers a promotion (raise + reset) at 100; study progress triggers an
  education level-up the same way.
- **Cost of living**: a monthly baseline expense adjusted by personality
  traits (frugal characters spend less, impulsive/generous characters spend
  more).

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Next steps beyond the MVP

- Add Supabase Auth so multiple users can each have their own character(s)
  instead of a single browser-local character.
- Let the AI choose from a larger, more nuanced action set, or generate
  short flavor text for the narrative (still without ever setting a stat
  directly).
- Multiple relationships gained through actions (e.g. starting a new
  friendship or relationship as a distinct action/event) rather than a
  fixed starting set.
