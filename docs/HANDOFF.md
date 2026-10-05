# Handoff — Timer + Recall ("topics as trees")

Read this first, then `docs/timer-recall-design.txt` (the full product design)
and `docs/active-recall-engine.txt` (the longer-term engine plan).

## Where things are

- **Branch:** `feature/recall-mode`, checked out in the worktree
  `~/Documents/Code/Pulp/.worktrees/recall-mode`. Do the recall work here.
- **Dev servers:** `main` runs from `~/Documents/Code/Pulp` on :3000; this
  branch runs on :3001. Both stop when the session that launched them ends.
  Relaunch this one with: `cd .worktrees/recall-mode && npx next dev -p 3001`.
  (Two dev servers can't share one folder — that's why the worktree exists.)
- **Other sessions commit to `main` concurrently.** Before merging, check
  `git log main` for commits you didn't make. Never `git add -A`; stage only
  your own files.
- `main` is 4 commits ahead of origin and **not pushed**. Production AI is
  broken until it's pushed and deployed (see "Open decisions").

## Done

On `main` (commit `8bcf78b`):
- Groq removed `llama-3.3-70b-versatile`; AI assist, chat, search and recall
  now use `openai/gpt-oss-120b` (rewrite + grading use `gpt-oss-20b`). Model
  IDs live in `lib/aiModels.ts`. gpt-oss models are reasoning models: always
  send `reasoning_effort: "low"` and leave headroom in `max_tokens`.
- Rewrite moved from HuggingFace to Groq. AI sketches ("Img Gen") removed.

On this branch:
- `4600a8a` — recall answers grow trees via `growTree()` in
  `app/lib/treeGrowth.ts` (shared plant/grow logic mirroring
  `VitalitySystem.claimReward`).
- `40b2550` — typed answers + AI grading. `/api/recall/grade` returns
  `{ verdict: correct|partial|wrong, feedback }`. Growth weight comes from the
  verdict (1 / 0.5 / 0); grade buttons are limited by verdict. Also removed a
  duplicate `ReviewView` render that sat on top of the real one (which had
  silently disabled recall rewards), and the sidebar now collapses while
  review is open.

## Next: build steps 1–6 (see design file for the why)

1. **Topic tagging.** Snapshot notebook text when a focus session starts;
   at session end, diff it and make one AI call that names the topic and
   writes cards tagged to it. Store the topic on the new tree.
2. **Growth split.** Timer caps at sapling (visual stage 2); recall on a
   topic's cards grows that topic's sapling to full. Recall needed scales
   with tree rarity (tangerine ~5 correct, rare ~15).
3. **Banked nutrients.** Recall with no sapling waiting banks growth for the
   topic; the next sapling for that topic absorbs it.
4. **Orchard.** Topic name on hover; tap a sapling -> "Review <topic>".
   `OrchardView.tsx` is ~3800 lines; tread carefully.
5. **Sap only from full trees.** Existing trees keep their current growth.
6. **Freshness.** Tree color fades (CSS saturation/brightness) as the
   topic's cards go overdue; returns when reviewed. Visual only, has a floor.

Step 7 (due count on focus button, quiet mode, optional quick check) waits
until the user has tried 1–6.

## Key code

- `app/components/VitalitySystem.tsx` — timer; `claimReward` (~line 371)
  plants/grows trees on session completion. `startSession` sets the
  notebook (`selectedNotebookId`).
- `app/components/ReviewView.tsx` — recall UI; `grade()` and
  `submitAnswer()`; fires `onCorrect(weight)` and `onComplete`.
- `app/app/page.tsx` — owns grove/sap (Zustand `useGroveStore`, setters take
  value-or-updater) and renders `ReviewView` (search `key="review-view"`).
- `lib/recallSchedule.ts` — SM-2 decks, stored in localStorage at
  `pulp-recall-<noteId>` (browser only, not synced to Supabase).
- `lib/recallPrompt.ts` — card-generation and grading prompts (single
  source of truth, also used by `scripts/recall-eval.ts`).
- `app/types.ts` — `Tree`: id, type, stage, progress, plantedAt, notebookId,
  focusMinutes, growthTarget. Grove persists to localStorage (`pulp-grove`,
  signed via `groveIntegrity`) and Supabase `player_profiles.grove` (jsonb).
- `PlantIcon` draws only 4 visual stages (`Math.min(3, stage)`). Stage 4
  looks the same as 3, so ripeness/freshness must be a style, not a stage.

## Testing

- AI routes require a signed-in user (401 otherwise). Test the UI with
  Playwright and `page.route()` to mock `/api/recall` and
  `/api/recall/grade`; test prompts directly against Groq with
  `set -a; source .env.local; set +a; npx tsx <script>.mts` (use `.mts` for
  top-level await).
- Verify growth by reading `localStorage['pulp-grove']` after a flow.

## Open decisions (ask the user)

- **Push + deploy `main`** so production AI works again.
- **Embeddings** (still on HuggingFace, broken; cause of `/api/embed` 500s on
  every save). Recommended: drop embeddings and point sidebar semantic search
  and notebook-chat context at the working Groq `api/search`. Alternative:
  Gemini embeddings (needs a key — none in `.env.local`).
- Unused tier/quota code (`tierLimits`, `limitEnforcer`,
  `UsageLimitIndicator`) could be deleted.
- Topic design questions: same topic studied twice plants a new tree in the
  topic's cluster (proposed); one topic per tree; names on hover only.

## Working with this user

Short, plain answers. End every reply with a status line:
`Branch: … · Server: … · Working on: …`. Never push or merge without asking.
