# Pulp — The Plan

## Core Thesis

The gamification IS the studying. Not a reward for studying — the game mechanics are the learning mechanics.

## How It Works

### 1. Notebooks → Exams

Each notebook gets an exam date. Pulp builds a personalized spaced repetition schedule counting backward from each exam. AI auto-generates recall prompts from your notes — you don't have to make flashcards manually.

### 2. Timer = Planting, Retrieval = Watering

Timer sessions still plant trees in that notebook's orchard. But tree health depends on completing recall reviews. Skip reviews → trees wilt → sap yield drops to zero. The timer is the engine, retrieval is the fuel.

### 3. Sap = Readiness Score

Sap production reflects how prepared you actually are. Healthy orchards (reviewed notebooks) produce sap. Neglected ones produce nothing. Your total sap rate is a real-time answer to "am I ready for my exams?"

### 4. Rarer Trees = Higher Stakes

Rare seeds cost more sap and produce more yield — but only if the notebook stays healthy. A sacred tree in a neglected notebook is worthless. You want to plant your best seed in the class you'll actually keep up with. Makes seed selection a real strategic decision.

### 5. Exam Countdown Pressure

As exams approach, Pulp escalates. "Your chem orchard is at 40% health, 6 days left." Wilting trees the week before finals is a visceral signal that no to-do list gives you. The orchard becomes your prep dashboard.

### 6. Competition = Who's Most Prepared

Leaderboards rank students by orchard health within the same exam window — not focus minutes. "Who's actually ready for the bio final" is compelling competition. Crammers have dead orchards and no sap. Consistent reviewers are flush.

### 7. Semester Seasons

Sap resets each semester. Current orchard archives into a past-season grove you can revisit. Your collection is preserved — fresh start energy without loss anxiety. Like prestige in a game, opt-in not forced.

### 8. Exam End = Harvest

When the exam date passes, the orchard freezes and snapshots into a trophy-case grove (e.g. "Bio Final — Spring 26") while the notebook's notes stay fully open and editable. The game goes dormant again — set a new date to reuse the notebook for a retake or next unit.

## The Loop

```
Write notes → Set exam date → Pulp builds review schedule
→ Timer plants trees → Recall prompts keep them alive
→ Healthy trees produce sap → Sap buys rarer seeds
→ Rarer seeds need more consistent review → Better orchard
→ Leaderboard shows who's most prepared → Social pressure to review
→ Exam happens → Season archives → Fresh start
```

## Risks & Guardrails

- **AI recall quality is make-or-break.** Bad auto-generated prompts make the whole loop feel like busywork and people resent the wilting. Need solid note chunking and good question generation. Prototype this first before building wilting mechanics around it.
- **Wilting must be forgiving.** "Missed one review, rare tree died" makes people quit. Needs gradual decay — yellow before dead, water mechanic to revive, grace periods. Motivate, don't punish.
- **Sap accuracy depends on note quality.** Bad notes → bad prompts → pointless reviews → meaningless readiness score. Can't fully control this, but can nudge (note quality hints, minimum content thresholds before recall activates).
- **Semester resets must feel like graduation, not loss.** Archive grove needs to be visible, celebratable — a trophy case, not a graveyard.
- **Leaderboard scoping is tricky.** "Same exam window" needs a clean UX — manual exam dates per notebook, optional class groups. Keep it simple or skip until validated.

## Why This Wins

- Forest/Flora reward sitting. Pulp rewards learning.
- Notion/Google Docs have no opinion on when you should study. Pulp does.
- No other app turns your exam prep into a living, visible, competitive system.
- Students come for the notes, stay because the orchard tells them what they don't know yet.
