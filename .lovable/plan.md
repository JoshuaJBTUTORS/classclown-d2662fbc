
# Add Cleo Demo Experience After Signup

## Overview

After completing the Interactive Signup, users are redirected to a **Cleo Demo** page instead of going straight to the onboarding wizard. This page lets them:

1. Select their **year group**
2. Select a **subject**
3. Experience a super-short Cleo lesson (1 teaching moment + 1 question with feedback)
4. Then proceed to the existing onboarding wizard

## New Flow

```text
Interactive Signup -> Success -> Cleo Demo Page -> Onboarding Wizard -> Learning Hub
```

## What the Demo Page Looks Like

### Phase 1: Selection Screen
A clean, welcoming card where the student picks:
- **Year Group** (fetched from `year_groups` table via existing `useYearGroups` pattern)
- **Subject** (fetched from `subjects` table via existing `useSubjects` hook)
- A "Start Demo" button

### Phase 2: Mini Cleo Lesson
Once selections are made, the full `CleoInteractiveLearning` component loads with a **micro demo lesson** -- a tiny `LessonData` object with:
- **1 teaching step** (a brief explanation + a definition/table)
- **1 question step** (a single multiple-choice question)
- Cleo delivers the teaching, asks the question, gives feedback
- On lesson complete, a "Continue to Setup" button appears instead of the normal lesson-complete flow

### Phase 3: Redirect to Onboarding
After the demo, the user is redirected to `/onboarding` (the existing onboarding wizard).

## Demo Lesson Content Strategy

Pre-built mini lessons per subject, with **two tiers**: KS3 (Years 7-9) and GCSE (Years 10-11). Each has exactly 2 steps: one "Learn" step with 1-2 content blocks, one "Quick Check" step with 1 multiple-choice question.

### KS3 Demo Lessons (Years 7-9)

| Subject | Topic | Teaching Content | Question |
|---------|-------|-----------------|----------|
| Biology | Cell Structure Basics | Parts of a cell (nucleus, membrane, cytoplasm) | Identify which organelle controls the cell |
| Chemistry | States of Matter | Solids, liquids, gases and particle arrangement | Identify particle arrangement for a given state |
| Physics | Types of Energy | Energy stores (kinetic, thermal, chemical, etc.) | Identify the energy type in a scenario |
| Maths | Adding Fractions | Finding common denominators, adding numerators | Solve a simple fraction addition |
| English | Comprehension | Reading for meaning, identifying key information | Answer a comprehension question on a short passage |
| Computer Science | CPU Basics | Fetch-decode-execute cycle, CPU components | Identify a CPU component's role |

### GCSE Demo Lessons (Years 10-11)

| Subject | Topic | Teaching Content | Question |
|---------|-------|-----------------|----------|
| Biology | Cell Structure Basics | Eukaryotic vs prokaryotic cells, organelle functions | Identify organelle function |
| Chemistry | States of Matter | Particle model, state changes, energy and bonds | Identify what happens to particles during a state change |
| Physics | Types of Energy | Energy stores and transfers, conservation of energy | Identify energy transfers in a scenario |
| Maths | Adding Fractions | Adding algebraic fractions with different denominators | Solve an algebraic fraction addition |
| English | Comprehension | Analysing writer's methods, language techniques | Identify a language technique and its effect |
| Computer Science | CPU Basics | Von Neumann architecture, registers, clock speed | Identify the role of a register |

### Content Selection Logic

The demo page detects the user's year group selection:
- Years 7, 8, 9 → KS3 tier
- Years 10, 11 → GCSE tier
- Then picks the matching subject demo lesson from the appropriate tier

## Technical Details

### New Files

**1. `src/pages/CleoDemo.tsx`** -- New page component
- Two-phase UI: selection screen, then Cleo lesson
- Uses `useSubjects` hook for subject list
- Uses `useYearGroups` for year groups
- Picks demo lesson from `demoLessons.ts` based on year group tier + subject
- Wraps `CleoInteractiveLearning` with `isDemo` prop
- On demo completion, navigates to `/onboarding`

**2. `src/data/lessons/demoLessons.ts`** -- Demo lesson data
- Map of `{ ks3: { [subject]: LessonData }, gcse: { [subject]: LessonData } }`
- Each `LessonData` has 2 steps, 2-3 content blocks total
- Covers: Biology, Chemistry, Physics, Maths, English, Computer Science

### Modified Files

**3. `src/components/signup/SuccessStep.tsx`**
- Navigate to `/cleo-demo` instead of `/heycleo`

**4. `src/App.tsx`**
- Add protected route: `/cleo-demo` → `<CleoDemo />`

**5. `src/components/cleo/CleoInteractiveLearning.tsx`**
- Add optional `isDemo` prop and `onDemoComplete` callback
- In demo mode: hide sidebar, skip DB persistence, call `onDemoComplete` on completion

### No Database Changes Required

Demo is entirely client-side using pre-built lesson data.
