# NuChallenge UI/UX Design Specification

**Version:** 1.0
**Date:** March 30, 2026
**Role:** Product Designer
**Input:** PRD v2.1 (CEO-reviewed)

---

## Table of Contents

1. [Design System Foundation](#1-design-system-foundation)
2. [Screen Specifications](#2-screen-specifications)
3. [Component Library](#3-component-library)
4. [Interaction Patterns](#4-interaction-patterns)
5. [Micro-Animations & Celebration Moments](#5-micro-animations--celebration-moments)
6. [Responsive Strategy](#6-responsive-strategy)

---

## 1. Design System Foundation

### 1.1 Visual Language

**Design philosophy:** NuChallenge should feel like a *productivity tool with game sensibility* — not a game with productivity features. The aesthetic is professional, calm, and focused, with celebration moments that feel earned. Think Linear meets Duolingo: clean workspace, delightful rewards.

**Color Palette:**

| Token | Value | Usage |
|-------|-------|-------|
| `--purple-600` | `#7C3AED` | Primary brand, CTAs, active states |
| `--purple-100` | `#EDE9FE` | Primary tint, backgrounds, badges |
| `--purple-50` | `#F5F3FF` | Subtle primary background |
| `--gray-900` | `#111827` | Primary text |
| `--gray-600` | `#4B5563` | Secondary text |
| `--gray-400` | `#9CA3AF` | Tertiary text, placeholders |
| `--gray-200` | `#E5E7EB` | Borders, dividers |
| `--gray-50` | `#F9FAFB` | Page background |
| `--white` | `#FFFFFF` | Card backgrounds |
| `--emerald-500` | `#10B981` | Success, completion |
| `--emerald-50` | `#ECFDF5` | Success background |
| `--amber-500` | `#F59E0B` | Warning, in-progress |
| `--amber-50` | `#FFFBEB` | Warning background |
| `--red-500` | `#EF4444` | Error, failed |
| `--blue-500` | `#3B82F6` | Info, links |

**Difficulty Colors:**
| Difficulty | Badge Color | Background |
|-----------|------------|------------|
| Beginner | `emerald-600` on `emerald-50` | Approachable green |
| Intermediate | `blue-600` on `blue-50` | Calm blue |
| Advanced | `amber-600` on `amber-50` | Warm amber |
| Expert | `purple-600` on `purple-50` | Brand purple |

**Typography:**

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|-------------|
| Page title | Inter | 28px / 1.75rem | 700 (bold) | 1.3 |
| Section heading | Inter | 20px / 1.25rem | 600 (semibold) | 1.4 |
| Card title | Inter | 16px / 1rem | 600 | 1.4 |
| Body | Inter | 14px / 0.875rem | 400 (regular) | 1.6 |
| Small / Caption | Inter | 12px / 0.75rem | 500 (medium) | 1.5 |
| Code | JetBrains Mono | 13px / 0.8125rem | 400 | 1.6 |

**Spacing Scale:** 4px base unit. Common spacings: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.

**Border Radius:**
- Cards: 12px (`rounded-xl`)
- Buttons: 8px (`rounded-lg`)
- Badges/pills: 9999px (`rounded-full`)
- Inputs: 8px (`rounded-lg`)

**Shadows:**
- Card: `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)`
- Card hover: `0 4px 12px rgba(0,0,0,0.08)`
- Dropdown: `0 10px 40px rgba(0,0,0,0.12)`
- Modal: `0 20px 60px rgba(0,0,0,0.15)`

### 1.2 Iconography

Use **Lucide** icon set (consistent with Mission Marketplace MVP). Challenge tag icons are specified in the PRD Section 2.2.

### 1.3 Grid & Layout

- **Max content width:** 1280px (`max-w-7xl`)
- **Page padding:** 16px mobile, 24px tablet, 32px desktop
- **Card grid:** 1 column mobile, 2 tablet, 3 desktop (challenge explorer)
- **Sidebar layout:** 2/3 + 1/3 on desktop, stacked on mobile

---

## 2. Screen Specifications

### 2.1 Login / Onboarding (First Screen)

**URL:** `/login`

**Layout:** Centered card on gradient background (`purple-600` to `indigo-600`)

**Components:**
```
┌─────────────────────────────────────────┐
│          ◇ NuChallenge Logo ◇           │
│     "Master AI tools through            │
│      real challenges"                    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Email                              │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ Password                           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [     Sign In (primary button)      ]   │
│                                          │
│  "New here? Sign up" link                │
│                                          │
│  ── or ──                               │
│  [Sign in with Okta] (Phase 2)          │
└─────────────────────────────────────────┘
```

**Post-login first-time flow:**
1. Welcome modal: "Welcome to NuChallenge! Pick 3+ skill tags you're interested in."
2. Tag selector grid: All 22 tags as clickable pills, each with icon. Pre-select tags based on department (suggestions, not locks).
3. "Your first challenge is ready" CTA → navigates directly to the easiest challenge (CH-21 or CH-01), targeting <10 minute completion.

**Design note:** The onboarding flow must feel fast. No tutorial, no walkthrough, no "tour of the app." Pick tags → start first challenge. Everything else is discoverable.

---

### 2.2 Challenge Explorer (Home Page)

**URL:** `/` (authenticated)

**Layout:** Full-width page with sidebar

**Structure:**
```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER (sticky, 56px)                                             │
│ Logo  |  Explorer  Leaderboard  Profile  |  [pts] [avatar▾]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─ HERO / PROGRESS SECTION ──────────────────────────────────┐  │
│  │ "Welcome back, Sofia"                                       │  │
│  │ 12/50 challenges completed  ████████░░░░░  24%              │  │
│  │                                                              │  │
│  │ [You Might Enjoy]                                           │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │  │
│  │ │ CH-05    │ │ CH-14    │ │ CH-23    │  ← 3 recommended   │  │
│  │ │ Spot the │ │ SQL Gen  │ │ Test Gen │    challenges       │  │
│  │ │ Halluc.  │ │          │ │          │                      │  │
│  │ └──────────┘ └──────────┘ └──────────┘                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ FILTERS ──────────────────────────────────────────────────┐  │
│  │ Tags: [Prompt Eng ✕] [Coding ✕] [+ Add tag]               │  │
│  │ Difficulty: [All ▾]  Time: [All ▾]  Status: [All ▾]       │  │
│  │ Sort: [Recommended ▾]                                       │  │
│  │                                                              │  │
│  │ Quick paths: [AI Prompt Mastery] [Code & Ship] [Think...]  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ CHALLENGE GRID ───────────────────────────┐ ┌─ SIDEBAR ──┐  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │ Tag Radar  │  │
│  │ │ CH-01    │ │ CH-02    │ │ CH-03 🔒 │    │ │ Chart      │  │
│  │ │ First    │ │ User     │ │ PRD Peer │    │ │            │  │
│  │ │ AI PRD   │ │ Story    │ │ Review   │    │ │ ┌────────┐ │  │
│  │ │          │ │ Decomp   │ │          │    │ │ │ Spider │ │  │
│  │ │ Beginner │ │ Beginner │ │ Intermed │    │ │ │ Chart  │ │  │
│  │ │ 30 min   │ │ 25 min   │ │ 40 min   │    │ │ └────────┘ │  │
│  │ │ 100 pts  │ │ 80 pts   │ │ 200 pts  │    │ │            │  │
│  │ │ PromptEn │ │ PromptEn │ │ CritRev  │    │ │ Weekly     │  │
│  │ │ Writing  │ │ ProdThk  │ │ AIEval   │    │ │ Spotlight  │  │
│  │ │ ProdThk  │ │ Writing  │ │ Writing  │    │ │ ┌────────┐ │  │
│  │ └──────────┘ └──────────┘ └──────────┘    │ │ │ CH-46  │ │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │ │ AI     │ │  │
│  │ │ CH-04    │ │ CH-05    │ │ ...      │    │ │ │ Ethics │ │  │
│  │ └──────────┘ └──────────┘ └──────────┘    │ │ └────────┘ │  │
│  └────────────────────────────────────────────┘ └────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Challenge Card Design (detailed):**
```
┌──────────────────────────────────────────┐
│ CH-01                    [Beginner] 🟢   │  ← difficulty badge, right-aligned
│                                           │
│ Your First AI-Assisted PRD               │  ← title, font-semibold, gray-900
│                                           │
│ Write a 1-page PRD for a given feature   │  ← description excerpt, 2 lines max
│ using AI assistance...                    │     gray-600, text-sm
│                                           │
│ ┌──────┐ ┌────────┐ ┌──────────┐        │  ← tag pills, rounded-full
│ │Prompt│ │Writing │ │Product   │        │     purple-100 text-purple-700
│ │Eng   │ │& Docs  │ │Thinking  │        │
│ └──────┘ └────────┘ └──────────┘        │
│                                           │
│ ⏱ 30 min    ⭐ 100 pts    ✓ Completed  │  ← footer: time, points, status
└──────────────────────────────────────────┘
```

**Card states:**
- **Available:** Full color, hover lifts with shadow transition
- **Completed:** Emerald check icon, subtle emerald-50 border tint, score shown
- **In Progress:** Amber clock icon, amber-50 border tint, "Resume" CTA
- **Locked:** Gray-200 border, opacity-60, lock icon, "Requires CH-XX" tooltip
- **Recommended:** Subtle purple-50 background glow, "Suggested" badge

**Sidebar components:**
- **Tag Radar Chart:** Spider/radar chart (all 22 tags as axes, sized by completion %). Uses `recharts` library. Shows competency coverage at a glance.
- **Weekly Spotlight:** Featured challenge card with editorial note. Rotated weekly by admin.
- **Path Progress:** If user has started a path, show mini progress bar (e.g., "Code & Ship: 4/10")

---

### 2.3 Challenge Detail / Pre-Start

**URL:** `/challenges/[id]`

**Layout:** Wide content area with right sidebar

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to Explorer                                               │
│                                                                   │
│ ┌─ MAIN CONTENT ──────────────────────────┐ ┌─ SIDEBAR ───────┐ │
│ │                                          │ │                  │ │
│ │ CH-05: Spot the Hallucination           │ │ ┌──────────────┐ │ │
│ │ Market Analysis                          │ │ │ Difficulty   │ │ │
│ │                                          │ │ │ Intermediate │ │ │
│ │ ┌───────┐ ┌────────┐ ┌────────┐        │ │ │              │ │ │
│ │ │AIEval │ │CritThk │ │Resrch  │        │ │ │ Time: 35 min │ │ │
│ │ └───────┘ └────────┘ └────────┘        │ │ │ Points: 200  │ │ │
│ │                                          │ │ │              │ │ │
│ │ ## Description                          │ │ │ Evaluation:  │ │ │
│ │ You receive an AI-generated market      │ │ │ AI Judge     │ │ │
│ │ analysis with 5 planted factual errors  │ │ │              │ │ │
│ │ (hallucinations). Find all 5...         │ │ │ Anti-cheat:  │ │ │
│ │                                          │ │ │ T1           │ │ │
│ │ ## What You'll Submit                   │ │ │              │ │ │
│ │ Annotated document with corrections     │ │ │ Prerequisites│ │ │
│ │ and source citations                     │ │ │ None ✓       │ │ │
│ │                                          │ │ └──────────────┘ │ │
│ │ ## Evaluation Criteria                  │ │                  │ │
│ │ • Errors found (50%)                    │ │ ┌──────────────┐ │ │
│ │ • Quality of corrections (30%)          │ │ │ Hints (3)    │ │ │
│ │ • Source reliability (20%)              │ │ │ [Hint 1]     │ │ │
│ │                                          │ │ │ [Hint 2] 🔒 │ │ │
│ │ ## What This Challenge Produces         │ │ │ [Hint 3] 🔒 │ │ │
│ │ Corrected analysis (used in later       │ │ └──────────────┘ │ │
│ │ challenges)                              │ │                  │ │
│ │                                          │ │ [Start Challenge]│ │
│ │                                          │ │ (primary button) │ │
│ └──────────────────────────────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Key interactions:**
- "Start Challenge" button locks the context and begins the timer
- Hints reveal progressively (click to unlock next hint — no cost, but tracked)
- If challenge has prerequisites, show them as linked cards with completion status
- Evaluation criteria shown transparently before starting — no surprises

---

### 2.4 Active Challenge Workspace

**URL:** `/challenges/[id]/workspace`

**Layout:** Split-pane — instructions left, submission area right. Resizable divider.

```
┌──────────────────────────────────────────────────────────────────┐
│ CH-05: Spot the Hallucination        ⏱ 12:34 elapsed    [Save] │
├────────────────────────────┬─────────────────────────────────────┤
│                            │                                     │
│  INSTRUCTIONS              │  YOUR SUBMISSION                    │
│                            │                                     │
│  ## Context                │  ┌─────────────────────────────┐   │
│  The following market      │  │                             │   │
│  analysis was generated    │  │  Rich text editor           │   │
│  by an AI assistant for    │  │  (Markdown-capable)         │   │
│  Nubank's Q3 planning...  │  │                             │   │
│                            │  │  - Bold, italic, headers    │   │
│  [Embedded: market         │  │  - Code blocks              │   │
│   analysis document]       │  │  - Bullet lists             │   │
│                            │  │  - Link insertion           │   │
│  ## Your Task              │  │                             │   │
│  Find all 5 hallucinations│  │  Autosave indicator:        │   │
│  and correct them...       │  │  "Saved 10s ago" ✓         │   │
│                            │  │                             │   │
│  ## Hints                  │  └─────────────────────────────┘   │
│  [Show Hint 1]             │                                     │
│  [Hint 2 locked]           │  ┌─────────────────────────────┐   │
│  [Hint 3 locked]           │  │ File uploads (optional)     │   │
│                            │  │ Drag & drop zone            │   │
│                            │  └─────────────────────────────┘   │
│                            │                                     │
│                            │  [ Submit for Evaluation ]          │
│                            │  (primary button, full width)       │
├────────────────────────────┴─────────────────────────────────────┤
│  ITERATION PANEL (for T2 challenges)                             │
│  Round 1 ✓  │  Round 2 (current)  │  Round 3 (locked)          │
│  "Good start, but corrections #2 and #4 need stronger sources" │
└──────────────────────────────────────────────────────────────────┘
```

**For code challenges (CH-21, CH-23, etc.):**
- Right panel becomes Monaco editor with syntax highlighting
- Language selector dropdown (Python, JavaScript, Clojure, etc.)
- Run button → executes in sandbox → shows test results inline
- Console output panel below editor

**Key interactions:**
- **Autosave:** Every 30 seconds, visual "Saved ✓" indicator
- **Timer:** Non-punitive, displayed in header. No auto-submit.
- **Resizable panes:** Drag divider to resize instruction vs. submission areas
- **Submit confirmation:** Modal: "Ready to submit? You have X/3 attempts remaining."
- **Leave warning:** Browser `beforeunload` event if unsaved changes exist

---

### 2.5 Results Screen

**URL:** `/challenges/[id]/results/[attemptId]`

**Layout:** Single column, centered, celebration-first

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌─ CELEBRATION HEADER ──────────────────────────────────────┐   │
│  │                     🎯                                     │   │
│  │           Challenge Completed!                             │   │
│  │                                                            │   │
│  │        ┌────────────────────┐                              │   │
│  │        │   Score: 87/100    │  ← large, animated counter  │   │
│  │        │   ████████████░░░  │                              │   │
│  │        └────────────────────┘                              │   │
│  │                                                            │   │
│  │   +200 pts base  +22 pts quality bonus  = 222 pts total   │   │
│  │                                                            │   │
│  │   🏅 Badge earned: "Bug Hunter"  (if applicable)          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ DETAILED EVALUATION ─────────────────────────────────────┐   │
│  │                                                            │   │
│  │  Errors Found (50%)              ████████░░  8/10         │   │
│  │  "You found 4 of 5 hallucinations. The revenue figure     │   │
│  │   in paragraph 3 was also fabricated — Nubank's actual    │   │
│  │   Q3 revenue was R$6.1B, not R$8.3B."                     │   │
│  │                                                            │   │
│  │  Quality of Corrections (30%)    █████████░  9/10         │   │
│  │  "Corrections were well-sourced and clearly explained.     │   │
│  │   Strong use of official financial reports."               │   │
│  │                                                            │   │
│  │  Source Reliability (20%)        ████████░░  8/10         │   │
│  │  "Most sources were authoritative. Consider using the      │   │
│  │   SEC filing directly instead of secondary news sources." │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ WHAT'S NEXT ─────────────────────────────────────────────┐   │
│  │  You've unlocked:                                          │   │
│  │  ┌──────────┐ ┌──────────┐                                │   │
│  │  │ CH-08    │ │ CH-46    │  ← newly unlocked challenges  │   │
│  │  │ Retro    │ │ AI Ethics│                                │   │
│  │  │ Analysis │ │ Case St. │                                │   │
│  │  └──────────┘ └──────────┘                                │   │
│  │                                                            │   │
│  │  [Try Again (2 attempts left)]   [Back to Explorer]       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ APPEAL ──────────────────────────────────────────────────┐   │
│  │  Disagree with this evaluation?                            │   │
│  │  [File an Appeal] — reviewed within 7 days                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Score animation:** Counter animates from 0 to final score over 1.5s with easing. Points count up simultaneously. If badge earned, badge flies in after score settles (0.5s delay).

**Failed attempt (score < 60):**
- Header changes to "Almost there!" (encouraging, not punitive)
- Focus shifts to specific feedback on what to improve
- "Try Again" button is prominent
- No badge animation

---

### 2.6 Profile / Portfolio

**URL:** `/profile`

**Layout:** Wide page with stats header + tabbed content

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌─ PROFILE HEADER ──────────────────────────────────────────┐   │
│  │ ┌──────┐                                                   │   │
│  │ │Avatar│  Sofia Mendes                                     │   │
│  │ │  SM  │  Product Manager · Joined Jan 2026               │   │
│  │ └──────┘                                                   │   │
│  │                                                            │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │ │ Level 2  │ │ 2,450    │ │ 12/50    │ │ 7-day    │      │   │
│  │ │Contribut.│ │ points   │ │completed │ │ streak 🔥│      │   │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Overview]  [Portfolio]  [Badges]  [Activity]  ← tabs           │
│                                                                   │
│  ── OVERVIEW TAB ──                                              │
│                                                                   │
│  ┌─ TAG RADAR CHART ────────────┐  ┌─ DIFFICULTY DIST. ──────┐  │
│  │                               │  │                          │  │
│  │    Prompt Eng                 │  │ Beginner    ████████ 6  │  │
│  │       ╱    ╲                  │  │ Intermediate ████░░░ 4  │  │
│  │  Research    AI Eval          │  │ Advanced     ██░░░░░ 2  │  │
│  │     │    ╳    │              │  │ Expert       ░░░░░░░ 0  │  │
│  │  Coding    CritThk           │  │                          │  │
│  │       ╲    ╱                  │  └──────────────────────────┘  │
│  │    Writing                    │                                │
│  │                               │  ┌─ PATH PROGRESS ────────┐  │
│  └───────────────────────────────┘  │ AI Prompt: 3/7 ████░░  │  │
│                                      │ Code&Ship: 1/10 █░░░░  │  │
│                                      │ Think&An: 0/9 ░░░░░░  │  │
│                                      └────────────────────────┘  │
│                                                                   │
│  ── PORTFOLIO TAB ──                                             │
│  Grid of completed challenge artifacts, organized by tag         │
│                                                                   │
│  ── BADGES TAB ──                                                │
│  All badges: earned ones in color, unearned grayed with          │
│  progress indicator ("3/5 challenges for Bug Hunter")            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2.7 Leaderboard

**URL:** `/leaderboard`

**Layout:** Single column with tabs and podium

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Leaderboard                Q1 2026 ▾                            │
│                                                                   │
│  [Overall]  [By Tag ▾]  [By Team]                                │
│                                                                   │
│  ┌─ PODIUM ──────────────────────────────────────────────────┐   │
│  │          ┌──────┐                                          │   │
│  │    ┌─────│  #1  │─────┐                                    │   │
│  │    │     │ 4,200│     │                                    │   │
│  │  ┌─┤     │ pts  │     ├─┐                                  │   │
│  │  │#2     └──────┘     #3│                                  │   │
│  │  │3,100              2,800│                                 │   │
│  │  │pts                 pts│                                  │   │
│  │  └───────────────────────┘                                 │   │
│  │  Camila S.  Rafael M.  Diego P.                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ TABLE ───────────────────────────────────────────────────┐   │
│  │ #  │ Name          │ Level │ Points │ Challenges │ Streaks │   │
│  │ 4  │ Sofia M.  ←you│ 2     │ 2,450  │ 12         │ 7🔥    │   │
│  │ 5  │ Fernanda R.   │ 2     │ 2,100  │ 10         │ 3      │   │
│  │ 6  │ ...           │       │        │            │         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  "You" row is highlighted and always visible, even if scrolled   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**"By Tag" view:** Dropdown selects a tag → shows top performers for challenges tagged with that skill. Useful for finding experts in specific domains.

**"By Team" view:** Shows aggregated team stats (manager's department). Encourages collective progress, not individual competition.

---

### 2.8 Manager Dashboard

**URL:** `/manager`

**Layout:** Stats cards + team table

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Team Dashboard — Product Management (8 reports)                 │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 6/8      │ │ 73%      │ │ 42       │ │ 3.2 hrs  │           │
│  │ Started  │ │ Avg Score│ │ Total    │ │ Avg time │           │
│  │          │ │          │ │ completed│ │ to first │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  ┌─ TEAM PROGRESS TABLE ─────────────────────────────────────┐   │
│  │ Name         │ Started │ Completed │ Current Streak │ Last │   │
│  │ Sofia M.     │ ✓       │ 12        │ 7🔥           │ Today│   │
│  │ Rafael A.    │ ✓       │ 8         │ 3             │ Yday │   │
│  │ Pedro L.     │ ✗       │ 0         │ -             │ -    │   │
│  │ ...          │         │           │               │      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ TAG COVERAGE ────────────────────────────────────────────┐   │
│  │ Heatmap of 22 tags × team members. Color = completion.    │   │
│  │ Spots gaps in team skills at a glance.                    │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Send Slack Nudge to Non-Starters]  (button)                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Privacy:** No individual scores visible. Only completion status and streak count. The manager sees "Sofia completed 12 challenges" but NOT "Sofia scored 67 on CH-05."

---

## 3. Component Library

### 3.1 Challenge Card

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Challenge ID (CH-XX) |
| `title` | string | Challenge title |
| `description` | string | Truncated to 2 lines |
| `difficulty` | enum | beginner / intermediate / advanced / expert |
| `timeMinutes` | number | Estimated time |
| `points` | number | Base points |
| `tags` | Tag[] | 2-4 skill tags |
| `status` | enum | available / in_progress / completed / locked |
| `score` | number? | Score if completed |
| `prerequisitesMet` | boolean | Whether prerequisites are satisfied |

### 3.2 Tag Pill

Rounded-full pill with icon + label. Colors match the purple-100/purple-700 palette. Active (selected) state: purple-600 bg, white text.

Sizes: `sm` (12px text, used in cards), `md` (14px text, used in filters), `lg` (16px text, used in tag selector).

### 3.3 Difficulty Badge

Rounded-full badge with difficulty-specific colors (see Section 1.1). Includes level name text.

### 3.4 Score Ring

Circular progress indicator used in results screen. Animated fill from 0% to score%. Color transitions: red (0-40) → amber (40-70) → emerald (70-90) → purple (90-100).

### 3.5 Stat Card

White card with icon, label, and large value. Used on dashboard headers and manager view. Four variants matching stat type colors.

### 3.6 Progress Bar

Segmented progress bar for path tracking. Segments represent challenges in order. Completed segments filled, current segment pulsing, future segments empty.

---

## 4. Interaction Patterns

### 4.1 Navigation

- **Header** is sticky (z-50). Contains: logo, nav links, points badge, user avatar dropdown.
- **Explorer** is the landing page. No separate "dashboard" — the explorer IS the dashboard.
- **Breadcrumbs** on detail/workspace pages: Explorer → CH-05 → Workspace

### 4.2 Filtering

- **Tag filter** is multi-select with typeahead search. Selected tags appear as removable pills above the grid.
- **Filters are URL-persistent**: `/challenges?tags=coding,testing&difficulty=advanced&sort=points`
- **Filter counts** shown on badges: "Coding (12)" where 12 = matching challenges

### 4.3 Progressive Disclosure

Challenge detail page reveals sections as user scrolls. Instructions section shows first, evaluation criteria expand on click, hints are behind accordion toggles.

### 4.4 Autosave

- Workspace autosaves every 30 seconds
- Visual indicator: "Saved ✓" (gray text, fades in/out)
- If offline: "Offline — changes saved locally" (amber text)
- On reconnect: automatic sync with conflict-free merge

### 4.5 Submission Flow

1. User clicks "Submit for Evaluation"
2. Confirmation modal: "Submit CH-05? You have 2 attempts remaining after this."
3. User confirms → loading state: "Evaluating your submission..." with spinner
4. AI evaluation completes (typically 5-15 seconds)
5. Redirect to Results screen with celebration animation

### 4.6 Navigation Guards

- Leaving workspace with unsaved changes → "You have unsaved changes. Leave anyway?"
- Starting a challenge resets the timer and locks context
- Returning to an in-progress challenge resumes where you left off

---

## 5. Micro-Animations & Celebration Moments

### 5.1 Challenge Completion

**Trigger:** Score animation on results page

**Sequence:**
1. Page loads with header "Evaluating..." + subtle pulse
2. After 1s, header transitions to "Challenge Completed!" with confetti burst (canvas-based, 2s duration, then fades)
3. Score counter animates from 0 → final score (1.5s, ease-out-cubic)
4. Points earned counter animates simultaneously
5. If badge earned: badge icon slides in from right with a gentle bounce (0.5s delay after score)
6. Criterion bars animate their fill width sequentially (0.3s each, staggered by 0.15s)

**Failed attempt (score < 60):**
- No confetti
- Header: "Almost there!" with encouraging message
- Score still animates but in amber tone
- Focus immediately on improvement areas

### 5.2 Badge Earned

Full-screen overlay (0.3s fade in), badge icon in center with scale animation (0 → 1.1 → 1.0), badge name appears below, "Continue" button. Auto-dismiss after 4 seconds.

### 5.3 Streak Continuation

When user completes a challenge that extends their streak:
- Streak counter in header pulses once
- Small fire emoji animation next to the counter
- Toast notification: "🔥 7-day streak! Keep it going!"

### 5.4 Level Up

Full-screen overlay similar to badge, but with level name prominently displayed. Brief explanation of what the new level means (e.g., "Expert — Difficulty warnings removed for Advanced challenges").

### 5.5 Hover & Click Feedback

- Cards: subtle lift on hover (translate-y -2px, shadow increase, 150ms transition)
- Buttons: scale(0.98) on mousedown, back to 1.0 on release
- Tag pills: background color shift on hover (100ms)
- Links: underline on hover, color shift

### 5.6 Loading States

- **Page loads:** Skeleton screens (gray shimmer rectangles matching layout)
- **Evaluation:** Pulsing "Evaluating..." with animated dots
- **Data fetches:** Skeleton cards in grid (matching card dimensions)
- **No spinners** except for short inline actions (< 2s)

---

## 6. Responsive Strategy

### 6.1 Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640-1024px | 2-column grid, sidebar below |
| Desktop | > 1024px | Full 3-column grid, sidebar right |

### 6.2 Mobile Adaptations

- **Header:** Logo + hamburger menu. Nav items in slide-out drawer.
- **Challenge grid:** Single column, cards stack vertically
- **Workspace:** Full-width single panel (instructions above, submission below, no split pane)
- **Code editor:** Falls back to plain textarea with monospace font
- **Tag radar chart:** Replaced with simple tag list with completion percentages
- **Leaderboard podium:** Simplified to horizontal row

### 6.3 Tablet Adaptations

- **Challenge grid:** 2 columns
- **Workspace:** Tabs to switch between instructions and submission (not split)
- **Sidebar:** Below main content, full width

### 6.4 Touch Targets

All interactive elements ≥ 44px touch target (minimum). Tag pills, buttons, and cards have comfortable padding for thumb interaction.

---

## 7. Accessibility Requirements (PM Review Addition)

### 7.1 Color Contrast
- All text meets WCAG 2.1 AA contrast ratios: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- Difficulty badge colors verified against their backgrounds
- Links distinguishable by more than just color (underline on hover + color change)

### 7.2 Keyboard Navigation
- All interactive elements reachable via Tab key in logical order
- Visible focus indicators: 2px purple-600 outline with 2px offset (not the browser default)
- Skip-to-content link on every page (hidden until focused)
- Challenge grid navigable with arrow keys once focused
- Modal focus trap: Tab stays within modal while open, Escape closes

### 7.3 Screen Reader Support
- All images have meaningful alt text or are aria-hidden if decorative
- Icons are aria-hidden with accompanying text labels, OR have aria-label if standalone
- Tag radar chart has a text-based fallback: table of tag names + completion scores
- Score animation final value is announced via aria-live region after animation completes
- Challenge status (locked/available/completed) conveyed via aria-label, not just visual state

### 7.4 Motion Sensitivity
- All animations respect `prefers-reduced-motion` media query:
  - Confetti: skipped entirely
  - Score counter: jumps to final value immediately
  - Card hover lifts: disabled
  - Badge fly-in: appears instantly without animation
- Streak fire emoji animation: static emoji if reduced motion

### 7.5 Semantic HTML
- Challenge grid uses `<article>` elements
- Navigation uses `<nav>` with aria-label
- Sections use heading hierarchy (h1 → h2 → h3, never skipping)
- Forms use `<label>` elements associated with inputs
- Tables include `<caption>` and `scope` attributes on headers

---

## 8. Empty States (PM Review Addition)

### 8.1 No Filter Matches
- Illustration: magnifying glass with question mark
- Message: "No challenges match your current filters"
- CTA: [Clear all filters] (ghost button) or "Try different tags"

### 8.2 No Completed Challenges (New User)
- Illustration: rocket on launchpad
- Message: "Your challenge journey starts here"
- CTA: [Start Your First Challenge →] (primary button)

### 8.3 Empty Leaderboard (< 3 Participants)
- Simplified podium with placeholder silhouettes
- Message: "Be among the first to earn a spot!"
- CTA: [Browse Challenges →]

### 8.4 Empty Manager Dashboard
- Illustration: team silhouettes
- Message: "None of your team members have started yet"
- CTA: [Send Slack Invite →] (primary) + "Share this link with your team" (copy link)

### 8.5 Empty Portfolio
- Message: "Complete challenges to build your portfolio of work products"
- Shows 3 example challenge cards as "start here" suggestions

---

## 9. Slack Message Designs (PM Review Addition)

### 9.1 Challenge Completion Notification
```
┌──────────────────────────────────────────────┐
│ 🎯 NuChallenge                               │
│                                               │
│ Sofia completed CH-05: Spot the Hallucination│
│                                               │
│ Score: 87/100  •  Points: +222               │
│ Tags: AI Evaluation, Critical Thinking       │
│                                               │
│ [View on NuChallenge]                        │
└──────────────────────────────────────────────┘
```

### 9.2 Badge Earned
```
┌──────────────────────────────────────────────┐
│ 🏅 NuChallenge                               │
│                                               │
│ Sofia earned the "Bug Hunter" badge!         │
│ Found all planted errors in 3+ challenges    │
│                                               │
│ [View Profile]                               │
└──────────────────────────────────────────────┘
```

### 9.3 Weekly Team Digest
```
┌──────────────────────────────────────────────┐
│ 📊 NuChallenge Weekly — Product Management   │
│                                               │
│ This week: 8 challenges completed by 4 team  │
│ members. Team average score: 81/100          │
│                                               │
│ 🔥 Longest streak: Rafael (12 days)          │
│ ⭐ Highest score: Sofia (97 on CH-09)        │
│ 🆕 2 team members started this week          │
│                                               │
│ [View Team Dashboard]                        │
└──────────────────────────────────────────────┘
```

---

## 10. Additional PM Review Additions

### 10.1 Search Bar (Explorer)

Search input appears above the filter row:
```
┌──────────────────────────────────────────────┐
│ 🔍 Search challenges...                      │
└──────────────────────────────────────────────┘
```
- Searches title, description, and tags simultaneously
- Results highlight matching text with yellow background
- Debounced (300ms) to avoid excessive filtering
- URL-persistent: `/challenges?q=hallucination`
- Keyboard shortcut: `/` focuses the search bar (like GitHub)

### 10.2 Tag Map View (Explorer)

Toggle between "Grid" and "Map" views on the Explorer page.

**Map view:** All 22 tags displayed as interactive bubbles:
- Bubble size proportional to number of challenges with that tag
- Bubble color: gradient from gray (0% completed) to purple (100% completed)
- Click a bubble → filter grid view to that tag
- Hover shows: "Prompt Engineering — 8 challenges, 3 completed"

### 10.3 Context Assets Panel (Workspace)

For challenges with prerequisites that produced assets:
```
┌─ CONTEXT ASSETS ──────────────────────────────┐
│ 📎 Your Data Dictionary (from CH-12)          │
│    Completed Mar 28  •  Score: 92/100         │
│    [Expand to view full asset ▾]              │
│                                                │
│ 📎 This challenge also references:            │
│    CH-12 rubric context (auto-loaded)         │
└────────────────────────────────────────────────┘
```
- Assets are read-only in the workspace
- Expandable/collapsible (starts collapsed to save space)
- If the prerequisite score was low, a note: "Consider retrying CH-12 for a stronger foundation asset"

### 10.4 Appeal Modal (Results)

```
┌─ Appeal Evaluation ──────────────────────────┐
│                                               │
│ Which criteria do you want to appeal?        │
│ ☑ Errors Found (50%) — scored 8/10          │
│ ☐ Quality of Corrections (30%) — scored 9/10│
│ ☐ Source Reliability (20%) — scored 8/10     │
│                                               │
│ Explain why you disagree:                    │
│ ┌───────────────────────────────────────────┐│
│ │                                           ││
│ │ I found all 5 hallucinations, including   ││
│ │ the revenue figure which was marked as    ││
│ │ missed in my evaluation...                ││
│ │                                           ││
│ └───────────────────────────────────────────┘│
│                                               │
│ Appeals are reviewed within 7 days by a      │
│ different evaluator.                          │
│                                               │
│ [Cancel]                    [Submit Appeal]   │
└───────────────────────────────────────────────┘
```

### 10.5 Onboarding Value Proposition Screen

Inserted before tag selector:
```
┌──────────────────────────────────────────────┐
│                                               │
│      [Illustration: challenge loop]          │
│      Start → Solve → Evaluate → Earn         │
│                                               │
│  Prove your AI skills through real           │
│  challenges. Pick skills you're interested   │
│  in and start your first challenge in        │
│  under 2 minutes.                            │
│                                               │
│         [Let's Go →] (primary button)        │
│                                               │
└──────────────────────────────────────────────┘
```
- Single screen, no pagination, no skip button needed (it's already 5 seconds)
- Illustration shows the 4-step cycle with simple icons
- After clicking "Let's Go" → tag selector appears

---

## Appendix: Screen Inventory

| # | Screen | URL | Priority |
|---|--------|-----|----------|
| 1 | Login | `/login` | Phase 1 |
| 2 | Onboarding (first-time) | `/onboarding` | Phase 1 |
| 3 | Challenge Explorer | `/` | Phase 1 |
| 4 | Challenge Detail | `/challenges/[id]` | Phase 1 |
| 5 | Challenge Workspace | `/challenges/[id]/workspace` | Phase 1 |
| 6 | Results | `/challenges/[id]/results/[attemptId]` | Phase 1 |
| 7 | Profile | `/profile` | Phase 1 |
| 8 | Leaderboard | `/leaderboard` | Phase 1 |
| 9 | Manager Dashboard | `/manager` | Phase 1 |
| 10 | Admin Dashboard | `/admin` | Phase 3 |
| 11 | Challenge Builder | `/admin/challenges/new` | Phase 3 |
| 12 | Evaluator Queue | `/evaluator` | Phase 2 |
