/**
 * Sanity-check the trigram-Jaccard overlap used to detect copy-paste
 * in finalPMReview. We want:
 *  - identical text → ~100%
 *  - light paraphrase / typo fixes → 70–90%
 *  - serious rewrite that keeps some phrases → 10–30%
 *  - completely new text → near 0%
 */

function tokenTrigrams(s: string): Set<string> {
  const toks = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + 2 < toks.length; i++) {
    set.add(`${toks[i]} ${toks[i + 1]} ${toks[i + 2]}`);
  }
  return set;
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
function sim(a: string, b: string): number {
  return jaccard(tokenTrigrams(a), tokenTrigrams(b));
}

const raw = `# Smart Notifications PRD
## Problem
Users get too many notifications. We need to make them smarter.
## Goals
- Reduce notification volume
- Keep critical alerts working
## User Stories
- As a user, I want fewer notifications so I'm less annoyed.
- As a user, I want important alerts so I don't miss them.
## Success Metrics
- Better engagement
- Less churn
## Out of scope
- SMS
- Email unification`;

const cases: [string, string][] = [
  ['identical', raw],
  ['trivial reformat (same text)', raw.replace(/\n/g, '\n')],
  [
    'pasted with header tweak only',
    raw.replace('# Smart Notifications PRD', '# Smart Notifications — PRD v1'),
  ],
  [
    'light paraphrase',
    raw
      .replace('Users get too many notifications', 'Users receive too many notifications')
      .replace('make them smarter', 'make notifications smarter'),
  ],
  [
    'serious rewrite keeping numbers',
    `# Smart Notifications PRD

## Problem
Today we send ~12 push notifications per day per user. 68% of users have already disabled non-critical notifications.

## Goals
Cut push volume by 50% (from 12/day to ≤6/day) without losing critical-alert open-rate.

## User Stories
- As a customer, I want only critical alerts so I can re-enable push.
- As a customer, I want security alerts to always reach me.
- As a CRM operator, I want to see which categories got deprioritized.

## KPIs
- Daily push volume ≤ 6 per user.
- Opt-out rate 68% → ≤50% in 90 days.

## Out of scope
- SMS/email unification.
- SNS migration.
`,
  ],
  ['completely new text', 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt'],
];

for (const [label, b] of cases) {
  const s = sim(raw, b);
  const band = s >= 0.85 ? 'HIGH' : s >= 0.6 ? 'MODERATE' : s >= 0.35 ? 'LOW-MID' : 'LOW';
  console.log(`${String(Math.round(s * 100)).padStart(3)}% ${band.padEnd(8)} — ${label}`);
}
