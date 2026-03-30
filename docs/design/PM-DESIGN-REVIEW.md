# PM Review: UI/UX Design Specification v1.0

**Reviewer:** Product Manager
**Date:** March 30, 2026
**Input:** UI-UX-DESIGN-SPEC.md v1.0
**Verdict:** Strong foundation with 8 specific improvements needed

---

## Overall Assessment: 8/10

The design spec is comprehensive and well-structured. The visual language is professional without being sterile, and the celebration moments add the right amount of delight. The tag-based navigation is well-executed. However, there are gaps in how some PRD objectives are met.

---

## What Works Well

1. **Explorer-as-dashboard** — Making the challenge explorer the landing page is the right call. No unnecessary intermediary screens.
2. **Split-pane workspace** — Instructions + submission side-by-side is optimal for the challenge workflow.
3. **Transparent evaluation** — Showing rubric criteria before starting AND detailed per-criterion feedback after. This builds trust.
4. **Manager dashboard privacy model** — Not showing individual scores to managers is correct. Completion + streak is enough for coaching.
5. **Celebration moments** — The confetti + score animation + badge fly-in sequence is well-designed. Not overdone.
6. **Failed attempt handling** — "Almost there!" is the right tone. Encouraging, not punitive.

---

## Issues & Required Changes

### Issue 1: Tag Navigation Needs a "Discovery Mode"

**Problem:** The filter system (multi-select tags, difficulty, time) is functional but passive. The PRD specifies a "Tag Heat Map" (Section 4.3) showing all 22 tags as bubbles, sized by challenge count, colored by user completion. This is missing from the design spec.

**Fix:** Add a "Tag Map" view toggle on the Explorer page. When active, replace the grid with a bubble visualization of all 22 tags. Clicking a tag filters the grid. This makes tag exploration visual and playful — essential for encouraging users to try new areas.

### Issue 2: First-Time Onboarding Flow Is Too Light

**Problem:** The onboarding is described as: pick 3 tags → start first challenge. This is fast (good), but doesn't communicate the *value proposition*. A user landing on the tag selector with no context may feel confused.

**Fix:** Add a single screen before the tag selector:
- Hero image/illustration of the challenge loop (Start → Solve → Evaluate → Earn → Level Up)
- One sentence: "Prove your AI skills through real challenges. Pick skills you're interested in and start your first challenge in under 2 minutes."
- This is NOT a tour or tutorial. It's a 5-second context frame.

### Issue 3: Workspace Doesn't Show Context from Prerequisite Challenges

**Problem:** The PRD's anti-cheating model heavily relies on asset chaining — CH-03 reviews a PRD from CH-01, CH-14 uses a data dictionary from CH-12. The workspace spec doesn't show where/how prior assets are surfaced.

**Fix:** Add a "Context Assets" panel in the workspace. When a challenge has prerequisites that produced assets, those assets appear as collapsible sections in the instructions panel. Example: CH-14 workspace shows "Your Data Dictionary (from CH-12)" as an expandable section with the user's prior submission embedded.

### Issue 4: Appeal Flow Needs UX Detail

**Problem:** Results screen shows an "File an Appeal" button but no UX for what happens next. The PRD specifies a 7-day window, different evaluator, and feedback on disagreement.

**Fix:** Define the appeal modal:
- Text area: "Explain why you disagree with this evaluation (be specific about which criteria)"
- Reference to specific criterion scores (checkboxes to select which criteria to appeal)
- Confirmation: "Appeals are reviewed within 7 days by a different evaluator."
- After submission: appeal status badge on the results page (Pending → Reviewed → Upheld/Overturned)

### Issue 5: Slack Notification Preview Missing

**Problem:** The PRD (Section 8.4) specifies Slack integration as Phase 1 scope. The design spec doesn't show what Slack messages look like.

**Fix:** Add a "Slack Message Designs" section:
- Completion notification: Rich format with challenge name, score, points, and "View on NuChallenge" link
- Badge notification: Badge icon + name + "Sofia earned Bug Hunter on NuChallenge!"
- Weekly digest: Summary card format with team stats
- This ensures the Slack messages feel on-brand and are not just plain text.

### Issue 6: Empty States Not Defined

**Problem:** No empty state designs for: no challenges matching filter, no completed challenges yet, leaderboard with < 3 participants, manager dashboard with no team activity.

**Fix:** Define empty states for all major views. Each empty state should have an illustration, a short message, and a CTA. Examples:
- No filter matches: "No challenges match your filters. [Clear filters] or [Explore all]"
- No completions: "You haven't completed any challenges yet. [Start your first challenge →]"
- Empty manager view: "None of your team has started yet. [Send a Slack invite →]"

### Issue 7: Accessibility Specifics Missing

**Problem:** The design spec mentions touch targets (≥44px) and responsive design, but doesn't address: color contrast ratios, keyboard navigation, screen reader considerations, focus indicators, or ARIA labels.

**Fix:** Add a Section 7: Accessibility Requirements:
- All text meets WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large)
- All interactive elements are keyboard-navigable with visible focus indicators
- Radar chart has a text-based fallback (table of tag scores) for screen readers
- Score animations respect `prefers-reduced-motion`
- Confetti animation skips if `prefers-reduced-motion` is set
- All icons have aria-label or are aria-hidden if decorative

### Issue 8: Search is Missing

**Problem:** With 50 challenges, users need a way to search by title or keyword, not just filter by tags. The spec only has tag-based filtering.

**Fix:** Add a search bar above the filter row. Searches challenge titles, descriptions, and tags simultaneously. Results highlight matching text. Search is URL-persistent: `/challenges?q=hallucination`.

---

## Summary of Required Changes

| # | Section | Change | Priority |
|---|---------|--------|----------|
| 1 | Explorer | Add Tag Map bubble visualization view | High |
| 2 | Onboarding | Add value proposition screen before tag selector | Medium |
| 3 | Workspace | Add Context Assets panel for prerequisite assets | High |
| 4 | Results | Define appeal modal UX | Medium |
| 5 | New section | Slack message designs | Medium |
| 6 | All screens | Define empty states | High |
| 7 | New section | Accessibility requirements | High |
| 8 | Explorer | Add search bar | Medium |

---

*PM Review complete. Designer should incorporate these changes before Design Director review.*
