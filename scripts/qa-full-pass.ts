/**
 * Full QA pass — creates a fake QA user, submits rich + poor answers for all
 * 30 challenges, and prints a structured results table.
 *
 * Run with:
 *   set -a && source .env.local && set +a && npx tsx scripts/qa-full-pass.ts
 *
 * Prereqs: dev server on http://localhost:3001, DB seeded.
 */
import { db } from '../src/db';
import { users, attempts, pointTransactions } from '../src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { encode } from 'next-auth/jwt';
import { SEED_CHALLENGES } from '../src/lib/data';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3001';
const QA_USER_ID = '00000000-0000-0000-0000-0000000000aa';
const QA_EMAIL = 'qa-tester@nubank.com';
const QA_NAME = 'Ana QA-Tester';

// ─── Submission pairs: { id, rich, poor } ───

interface TestCase {
  id: string;
  rich: string;
  poor: string;
}

const CASES: TestCase[] = [
  // ── Auto-graded (structured list) ──
  {
    id: 'CH-01',
    rich: JSON.stringify([
      'The problem statement is vague — no 12 notifications/day baseline, no 68% dismissal number.',
      'There are no user stories in As-a / I-want / so-that format.',
      'The "users feel happy" metric is not measurable — needs a numeric KPI.',
      'Scope creep: SMS fallback, admin dashboard, and the SNS migration do not belong here.',
      'No explicit out-of-scope / boundary section.',
    ]),
    poor: JSON.stringify(['the prd is bad', 'needs more detail']),
  },
  {
    id: 'CH-04',
    rich: JSON.stringify([
      'The founding year 1999 is wrong — Nubank was founded in 2013.',
      'Buenos Aires / Mexico City is wrong — Nubank is headquartered in São Paulo, Brazil.',
      'The London Stock Exchange claim is wrong — Nubank IPO\'d on the NYSE.',
      'PostgreSQL is wrong — the ledger database is actually Apache Cassandra.',
      'The Argentina expansion is fabricated — Nubank does not operate in Argentina.',
    ]),
    poor: JSON.stringify(['something about the year is wrong']),
  },
  {
    id: 'CH-07',
    rich: JSON.stringify([
      'The ledger uses Cassandra (DataStax), not PostgreSQL.',
      'Berlin is wrong — Nubank does not have a Berlin engineering hub; Mexico City is one of their hubs.',
      'Mastercard is not the sole network — Nubank also issues Visa cards.',
      'There is no biometric mandate above R$200 — that requirement is fabricated.',
    ]),
    poor: JSON.stringify(['I think there might be an error about the database']),
  },
  // ── Auto-graded (structured object) ──
  {
    id: 'CH-06',
    rich: JSON.stringify({
      entities: ['customer', 'account', 'transaction', 'card', 'notification'],
      customerPiiFields: ['cpf', 'name', 'email', 'phone', 'birth_date'],
      accountTypeEnum: ['checking', 'savings'],
      transactionTypeEnum: ['credit', 'debit', 'pix', 'transfer'],
      cardTypeEnum: ['virtual', 'physical'],
      nullableForeignKeys: ['transaction.card_id'],
      oneToManyRelations: ['customer->account', 'account->transaction', 'account->card', 'customer->notification'],
    }),
    poor: JSON.stringify({ entities: ['customer', 'account'], customerPiiFields: ['name'] }),
  },
  {
    id: 'CH-21',
    rich: JSON.stringify({
      method: 'post', path: '/v1/rewards/redeem', operationId: 'redeemReward',
      security: ['bearerAuth'], requestBodyRequired: ['rewardId', 'idempotencyKey'],
      responseStatuses: ['200', '400', '401', '409'], successFields: ['transactionId', 'pointsSpent'],
    }),
    poor: JSON.stringify({ method: 'get', path: '/rewards' }),
  },
  {
    id: 'CH-22',
    rich: JSON.stringify({
      participants: ['user', 'client', 'authServer', 'resourceServer'],
      step1: { from: 'user', to: 'client' },
      step2: { from: 'client', to: 'authServer', label: 'authorization_request' },
      step3: { from: 'authServer', to: 'client', label: 'authorization_code' },
      step4: { from: 'client', to: 'authServer', label: 'token_request' },
      step5: { from: 'authServer', to: 'client', label: 'access_token' },
      step6: { from: 'client', to: 'resourceServer', label: 'access_token' },
    }),
    poor: JSON.stringify({ participants: ['user', 'server'] }),
  },
  // ── Auto-graded (multi-choice) ──
  {
    id: 'CH-02',
    rich: JSON.stringify({ answers: { q1: 't', q2: 's', q3: 'n', q4: 'i', q5: 'v', q6: 'e', q7: 't' } }),
    poor: JSON.stringify({ answers: { q1: 'i', q2: 'i', q3: 'i', q4: 'i', q5: 'i', q6: 'i', q7: 'i' } }),
  },
  {
    id: 'CH-17',
    rich: JSON.stringify({ answers: { q1: 'b', q2: 'b', q3: 'b', q4: 'c', q5: 'b', q6: 'b' } }),
    poor: JSON.stringify({ answers: { q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'a', q6: 'a' } }),
  },
  {
    id: 'CH-20',
    rich: JSON.stringify({ answers: { q1: 'vulnerable', q2: 'safe', q3: 'safe', q4: 'vulnerable', q5: 'vulnerable', q6: ['parameterized-queries', 'allowlist-identifiers'] } }),
    poor: JSON.stringify({ answers: { q1: 'safe', q2: 'safe', q3: 'safe', q4: 'safe', q5: 'safe', q6: ['escape-quotes'] } }),
  },
  {
    id: 'CH-29',
    rich: JSON.stringify({ answers: { q1: 'vulnerable', q2: 'safe', q3: 'vulnerable', q4: 'safe', q5: 'vulnerable', q6: ['structured-roles', 'output-encoding', 'least-privilege-tools', 'input-validation'] } }),
    poor: JSON.stringify({ answers: { q1: 'safe', q2: 'safe', q3: 'safe', q4: 'safe', q5: 'safe', q6: ['longer-system-prompt'] } }),
  },
  // ── Auto-graded (regex) ──
  {
    id: 'CH-09',
    rich: '/^[^\\n]+\\[ERROR\\][^\\n]*ip=(?!10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/',
    poor: '/.*/',
  },
  // ── Auto-graded (code-sandbox) ──
  {
    id: 'CH-10',
    rich: `function normalizeBrPhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/\\D/g, '');
  if (!digits) return null;
  let local = digits;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) local = digits.slice(2);
  if (local.length !== 10 && local.length !== 11) return null;
  const ddd = parseInt(local.slice(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return null;
  if (local.length === 11 && local[2] !== '9') return null;
  return '+55' + local;
}`,
    poor: `function normalizeBrPhone(s) { return s; }`,
  },
  {
    id: 'CH-12',
    rich: `function runTests(validator) {
  const cases = [
    { input: '52998224725', expected: true }, { input: '45317828791', expected: true },
    { input: '00000000000', expected: false }, { input: '11111111111', expected: false },
    { input: '12345678900', expected: false }, { input: '', expected: false },
    { input: 'abc', expected: false }, { input: '5299822472', expected: false },
    { input: '529.982.247-25', expected: true },
  ];
  let passed = 0, failed = 0;
  for (const c of cases) { try { if (validator(c.input) === c.expected) passed++; else failed++; } catch { failed++; } }
  return { total: cases.length, passed, failed };
}`,
    poor: `function runTests(v) { return { total: 1, passed: 1, failed: 0 }; }`,
  },
  {
    id: 'CH-13',
    rich: `function formatBRL(value) {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(2);
  const [intPart, decPart] = abs.split('.');
  const withSeparators = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
  return sign + 'R$ ' + withSeparators + ',' + decPart;
}`,
    poor: `function formatBRL(v) { return 'R$ ' + v; }`,
  },
  {
    id: 'CH-19',
    rich: `function classifyPixKey(key) {
  if (typeof key !== 'string' || key.length === 0) return 'invalid';
  if (/^\\d{11}$/.test(key)) return 'cpf';
  if (/^\\d{14}$/.test(key)) return 'cnpj';
  if (/^\\+55\\d{10,11}$/.test(key)) return 'phone';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)) return 'random';
  if (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(key)) return 'email';
  return 'invalid';
}`,
    poor: `function classifyPixKey(k) { return 'cpf'; }`,
  },
  {
    id: 'CH-23',
    rich: `function aggregateTransactions(csv) {
  const lines = csv.split('\\n').filter(l => l.trim().length > 0);
  if (lines.length <= 1) return {};
  const totals = {};
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    const category = parts[2];
    const amount = parseFloat(parts[3].replace(',', '.'));
    totals[category] = (totals[category] || 0) + amount;
  }
  for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] * 100) / 100;
  return totals;
}`,
    poor: `function aggregateTransactions(csv) { return {}; }`,
  },
  {
    id: 'CH-24',
    rich: `function createIdempotencyStore() {
  const cache = new Map();
  function canonical(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonical).join(',') + ']';
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
  }
  return {
    handle(key, body, compute) {
      const bodyKey = canonical(body);
      const entry = cache.get(key);
      if (entry) { if (entry.bodyKey === bodyKey) return entry.response; return { error: 'idempotency_key_conflict' }; }
      const response = compute();
      cache.set(key, { bodyKey, response });
      return response;
    }
  };
}`,
    poor: `function createIdempotencyStore() { return { handle(k,b,c) { return c(); } }; }`,
  },
  {
    id: 'CH-28',
    rich: `function isValidCPF(cpf) {
  const digits = String(cpf || '').replace(/\\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\\d)\\1{10}$/.test(digits)) return false;
  function calc(len) { let sum = 0; for (let i = 0; i < len; i++) sum += parseInt(digits[i], 10) * (len + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; }
  return calc(9) === parseInt(digits[9], 10) && calc(10) === parseInt(digits[10], 10);
}`,
    poor: `function isValidCPF(cpf) { return true; }`,
  },
  {
    id: 'CH-30',
    rich: `function createRateLimiter(capacity, refillPerSec) {
  let tokens = capacity; let lastNowMs = null;
  return {
    tryAcquire(nowMs) {
      if (lastNowMs !== null) { const e = (nowMs - lastNowMs) / 1000; tokens = Math.min(capacity, tokens + e * refillPerSec); }
      lastNowMs = nowMs;
      if (tokens >= 1) { tokens -= 1; return true; } return false;
    }
  };
}`,
    poor: `function createRateLimiter(c, r) { return { tryAcquire() { return true; } }; }`,
  },
  // ── Hybrid challenges ──
  {
    id: 'CH-25',
    rich: `const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.97;
function discountedAmount(amount) { return amount > DISCOUNT_THRESHOLD ? amount * DISCOUNT_RATE : amount; }
function summarizeOrders(orders) {
  const byStatus = { paid: 0, cancelled: 0, failed: 0 };
  let revenue = 0;
  for (const order of orders) {
    if (order.status === 'paid') { byStatus.paid += 1; revenue += discountedAmount(order.amount); }
    else if (order.status === 'cancelled') { byStatus.cancelled += 1; }
    else if (order.status === 'failed') { byStatus.failed += 1; }
  }
  return { totalRevenue: Math.round(revenue * 100) / 100, byStatus, count: orders.length };
}`,
    poor: `function summarizeOrders(orders) { return { totalRevenue: 0, byStatus: {}, count: 0 }; }`,
  },
  {
    id: 'CH-26',
    rich: `function findDuplicates(arr) {
  const seen = new Set();
  const dupes = new Set();
  for (const v of arr) { if (seen.has(v)) dupes.add(v); else seen.add(v); }
  return Array.from(dupes);
}`,
    poor: `function findDuplicates(arr) { return []; }`,
  },
  {
    id: 'CH-27',
    rich: JSON.stringify({
      issuesFound: ['sql-injection', 'missing-input-validation', 'missing-auth', 'no-error-handling', 'no-idempotency'],
      severity: 'critical',
      categories: ['security', 'validation', 'reliability'],
      recommendations: 'Use parameterized queries, validate inputs, require auth, add try/catch, add idempotency key.',
    }),
    poor: JSON.stringify({ issuesFound: ['maybe a bug'], severity: 'low', categories: ['other'] }),
  },
  // ── AI-judge challenges (free-text submissions) ──
  {
    id: 'CH-05',
    rich: `## Requirements Extraction\n\n### Functional Requirements\n\n**FR-1 (Stated):** Real-time feedback collection via single-tap rating after customer interactions.\n**FR-2 (Stated):** Optional follow-up questions with text input and voice recording.\n**FR-3 (Stated):** Salesforce CRM integration with automatic case creation.\n**FR-4 (Stated):** Independent operation — feedback system works if Salesforce is down.\n**FR-5 (Stated):** Data available in own analytics platform, not just Salesforce.\n**FR-6 (Stated, Phase 2):** AI-powered real-time sentiment analysis for agents.\n\n### Non-Functional Requirements\n**NFR-1 (Implied):** Survey drop-off must stay below 80% — implies ≤2 questions max.\n**NFR-2 (Implied):** System must be highly available (independent of Salesforce).\n\n### Contradictions\n**C-1: Frictionless vs. Detailed Feedback.** VP Product wants single-tap (frictionless), Head of CX wants follow-up questions. **Resolution:** Make the detailed survey optional and progressive — show the single-tap first, then optionally expand.\n**C-2: Sentiment Analysis Timing.** Head of CX wants it in Phase 1, VP Product explicitly defers to Phase 2. **Resolution:** Defer to VP Product's phasing — it's a scope decision, not a feature cut.`,
    poor: `The stakeholders want a feedback system. It should collect feedback and integrate with Salesforce. There are some disagreements about the scope.`,
  },
  {
    id: 'CH-03',
    rich: `## Prioritization Framework Analysis\n\n### Backlog Items\n1. Real-time notification push\n2. Dark mode UI\n3. Expense CSV export\n4. Two-factor authentication\n5. Performance dashboard\n\n### Framework 1: MoSCoW\n- **Must Have:** 2FA (security), Notifications (engagement)\n- **Should Have:** Dashboard (insights)\n- **Could Have:** Dark mode (UX polish)\n- **Won't Have (this sprint):** CSV export\n\n### Framework 2: RICE\n| Item | Reach | Impact | Confidence | Effort | RICE Score |\n|------|-------|--------|-----------|--------|------------|\n| 2FA | 10000 | 3 | 90% | 2 | 13,500 |\n| Notifications | 8000 | 2 | 80% | 3 | 4,267 |\n| Dashboard | 5000 | 2 | 70% | 4 | 1,750 |\n| Dark mode | 10000 | 1 | 95% | 1 | 9,500 |\n| CSV export | 2000 | 1 | 90% | 1 | 1,800 |\n\n### Framework 3: Value vs. Effort\n- High Value, Low Effort: 2FA, Dark mode\n- High Value, High Effort: Notifications, Dashboard\n- Low Value, Low Effort: CSV export\n\n### Comparison\nRICE favors 2FA and Dark mode (high reach). MoSCoW favors 2FA and Notifications (stakeholder must-haves). Value/Effort agrees on 2FA. **Recommendation:** 2FA first (all frameworks agree), then Notifications (stakeholder alignment), then Dark mode (quick win).`,
    poor: `I would prioritize the items based on importance. 2FA seems important. Dark mode is nice to have.`,
  },
  {
    id: 'CH-08',
    rich: `## AI Code Review: Payment Processing Function\n\n### Issue 1: SQL Injection (Critical)\nLine 12 concatenates user input directly into a SQL query string. Use parameterized queries.\n\n### Issue 2: Missing Input Validation (High)\nThe \`amount\` parameter is not validated — negative values, NaN, or extremely large numbers could break downstream logic.\n\n### Issue 3: No Authentication Check (High)\nThe function processes payments without verifying the caller's identity or authorization.\n\n### Issue 4: No Error Handling (Medium)\nThe external payment provider call (line 23) has no try/catch — a network timeout would crash the process.\n\n### Issue 5: No Idempotency Key (Medium)\nRetried requests could double-charge the customer. Add an idempotency header/key.\n\n### Recommendations\n1. Replace string concatenation with parameterized SQL queries\n2. Validate amount (positive number, max limit, two decimal places)\n3. Add auth middleware\n4. Wrap provider call in try/catch with retry logic\n5. Require client-supplied idempotency key`,
    poor: `The code looks mostly fine. Maybe add some error handling.`,
  },
  {
    id: 'CH-14',
    rich: `## AI UX Microcopy Audit\n\n### Error State: Payment Failed\n**Current:** "Error occurred"\n**Revised:** "Your payment didn't go through. Check your card details and try again, or use a different payment method."\n**Rationale:** Specific, actionable, empathetic. Tells the user what happened AND what to do next.\n\n### Empty State: No Transactions\n**Current:** "No data"\n**Revised:** "No transactions yet — your spending history will appear here after your first purchase."\n**Rationale:** Sets expectations and reduces anxiety for new users.\n\n### Success State: Transfer Complete\n**Current:** "Success"\n**Revised:** "Done! R$ 150.00 sent to Maria Santos. It should arrive in up to 10 seconds via Pix."\n**Rationale:** Confirms amount, recipient, and expected timing — reduces "did it work?" anxiety.\n\n### Button Label: CTA\n**Current:** "Submit"\n**Revised:** "Send R$ 150.00 now"\n**Rationale:** Specific verb + amount reduces friction and confirms the user's intent before the irreversible action.`,
    poor: `Change "Error" to "Something went wrong". Change "Submit" to "OK".`,
  },
  {
    id: 'CH-15',
    rich: `## Accessibility Audit Report\n\n### WCAG 2.1 AA Violations Found\n\n**1. Color Contrast (1.4.3) — Critical**\nThe light gray (#999) text on white background has a contrast ratio of 2.85:1, below the 4.5:1 minimum. Fix: Use #595959 or darker.\n\n**2. Missing Alt Text (1.1.1) — Critical**\nProduct images on the catalog page lack alt attributes. Screen readers announce them as "image" with no context.\n\n**3. Keyboard Navigation (2.1.1) — High**\nThe modal dialog traps focus but the "Close" button is not reachable via Tab. Users must click the overlay, which is invisible to keyboard-only users.\n\n**4. Form Labels (1.3.1) — High**\nThe search input uses placeholder text as its only label. When the placeholder disappears on focus, screen readers lose context.\n\n**5. Focus Indicator (2.4.7) — Medium**\nCustom CSS sets \`outline: none\` on interactive elements without providing a visible alternative focus style.\n\n### Recommendations\n1. Set minimum contrast of 4.5:1 for all text\n2. Add descriptive alt text to all informational images\n3. Implement focus-trap with keyboard-accessible close\n4. Use visible <label> elements, not just placeholders\n5. Replace outline:none with a visible focus ring (e.g., 2px solid #4F46E5)`,
    poor: `The website has some accessibility issues. The colors might not be great for some people.`,
  },
  {
    id: 'CH-16',
    rich: `## AI Content Evaluation Rubric Design\n\n### Rubric for Evaluating AI-Generated Marketing Copy\n\n**Criterion 1: Factual Accuracy (Weight: 30%)**\n- 5: All claims are verifiable and correctly attributed\n- 3: Minor inaccuracies that don't mislead\n- 1: Contains fabricated statistics or false claims\n\n**Criterion 2: Brand Voice Alignment (Weight: 25%)**\n- 5: Perfectly matches Nubank's informal-yet-trustworthy tone\n- 3: Acceptable tone with occasional mismatches\n- 1: Sounds generic, corporate, or off-brand\n\n**Criterion 3: Audience Relevance (Weight: 20%)**\n- 5: Addresses the target segment's specific needs and pain points\n- 3: Somewhat relevant but could apply to any fintech customer\n- 1: Irrelevant to the intended audience\n\n**Criterion 4: Actionability (Weight: 15%)**\n- 5: Clear CTA, next steps are obvious\n- 3: CTA exists but is vague\n- 1: No CTA or confusing next step\n\n**Criterion 5: Originality (Weight: 10%)**\n- 5: Fresh angle, avoids clichés\n- 3: Some original elements mixed with boilerplate\n- 1: Entirely generic/template-like\n\n### Inter-rater Calibration\nTwo evaluators should independently score sample content. Acceptable agreement threshold: Cohen's κ ≥ 0.7.`,
    poor: `A rubric should have some criteria like quality and accuracy. Score from 1-5.`,
  },
  {
    id: 'CH-18',
    rich: `## Research Synthesis: User Onboarding Friction Points\n\n### Methodology\nAnalyzed 15 user interview transcripts, 500 survey responses, and 3 months of analytics data.\n\n### Key Findings\n\n**1. Document Upload Failure (Impact: Critical)**\n- 34% of users fail on their first document upload attempt\n- Root cause: unclear file format requirements + confusing error messages\n- Quote: "It just said 'invalid file' — I tried 5 different photos before giving up" (P7)\n\n**2. KYC Wait Time Anxiety (Impact: High)**\n- Average KYC approval: 2.3 hours. Users expect < 5 minutes.\n- 28% abandon during wait because there's no progress indicator\n- Quote: "I didn't know if it was working or if I needed to do something else" (P12)\n\n**3. First Transaction Hesitation (Impact: Medium)**\n- 41% of approved users take > 7 days to make their first transaction\n- Barrier: fear of making a mistake with real money\n- Quote: "I wished there was a way to practice first" (P3)\n\n### Recommendations\n1. Real-time format validation with preview before upload\n2. Progress bar + estimated completion time for KYC\n3. "Practice mode" with simulated transactions for new users`,
    poor: `Some users have trouble with onboarding. We should make it easier.`,
  },
  {
    id: 'CH-11',
    rich: `## SQL Data Analysis: Customer Segmentation\n\n### Query 1: Active Users by Month\n\`\`\`sql\nSELECT DATE_TRUNC('month', last_activity) AS month,\n       COUNT(DISTINCT user_id) AS active_users\nFROM user_sessions\nWHERE last_activity >= CURRENT_DATE - INTERVAL '12 months'\nGROUP BY 1\nORDER BY 1;\n\`\`\`\n**Annotation:** Uses DATE_TRUNC for clean monthly buckets. DISTINCT avoids double-counting users with multiple sessions.\n\n### Query 2: Revenue by Customer Tier\n\`\`\`sql\nSELECT u.tier,\n       COUNT(*) AS customers,\n       SUM(t.amount) AS total_revenue,\n       AVG(t.amount) AS avg_transaction\nFROM users u\nJOIN transactions t ON t.user_id = u.id\nWHERE t.status = 'completed'\n  AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'\nGROUP BY u.tier\nORDER BY total_revenue DESC;\n\`\`\`\n**Annotation:** Joins users to transactions, filters only completed, groups by tier to show revenue concentration.\n\n### Query 3: Churn Risk Identification\n\`\`\`sql\nSELECT u.id, u.name, u.tier,\n       MAX(t.created_at) AS last_transaction,\n       CURRENT_DATE - MAX(t.created_at)::date AS days_inactive\nFROM users u\nLEFT JOIN transactions t ON t.user_id = u.id\nGROUP BY u.id, u.name, u.tier\nHAVING MAX(t.created_at) < CURRENT_DATE - INTERVAL '60 days'\n   OR MAX(t.created_at) IS NULL\nORDER BY days_inactive DESC NULLS FIRST;\n\`\`\`\n**Annotation:** LEFT JOIN catches users with zero transactions. HAVING filters to 60+ days inactive or never-transacted.`,
    poor: `SELECT * FROM users; -- This gets all users`,
  },
];

// ─── Helpers ───

async function mintCookie(userId: string, email: string, name: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET not set');
  const token = await encode({
    token: { sub: userId, id: userId, email, name },
    secret,
    salt: 'authjs.session-token',
  });
  return `authjs.session-token=${token}`;
}

async function ensureQAUser() {
  const [existing] = await db.select().from(users).where(eq(users.id, QA_USER_ID)).limit(1);
  if (existing) {
    console.log(`QA user already exists: ${QA_EMAIL} (${QA_USER_ID})`);
    return;
  }
  await db.insert(users).values({
    id: QA_USER_ID,
    email: QA_EMAIL,
    name: QA_NAME,
    department: 'Quality Assurance',
    title: 'Senior QA Engineer',
    platformRole: ['challenger'],
    level: 1,
    levelName: 'Novice',
    pointsTotal: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    interests: [],
    passwordHash: 'demo',
  });
  console.log(`QA user created: ${QA_EMAIL} (${QA_USER_ID})`);
}

async function clearAttemptsFor(userId: string, challengeIds: string[]) {
  const rows = await db.select({ id: attempts.id }).from(attempts)
    .where(and(eq(attempts.userId, userId), inArray(attempts.challengeId, challengeIds)));
  if (rows.length === 0) return;
  const ids = rows.map(r => r.id);
  await db.delete(pointTransactions).where(inArray(pointTransactions.attemptId, ids));
  await db.delete(attempts).where(inArray(attempts.id, ids));
}

interface SubmitResult {
  id: string;
  quality: 'rich' | 'poor';
  status: string;
  score: number | null;
  points: number | null;
  evaluator: string | null;
  error: string | null;
  durationMs: number;
}

async function submitOne(
  c: { id: string; submission: string; quality: 'rich' | 'poor' },
  cookie: string,
  userId: string
): Promise<SubmitResult> {
  const t0 = Date.now();
  try {
    await clearAttemptsFor(userId, [c.id]);

    const startRes = await fetch(`${BASE}/api/challenges/${c.id}/start`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
    });
    if (!startRes.ok) {
      return { id: c.id, quality: c.quality, status: 'start_failed', score: null, points: null, evaluator: null, error: `start ${startRes.status}`, durationMs: Date.now() - t0 };
    }
    const { attemptId } = await startRes.json();

    const submitRes = await fetch(`${BASE}/api/challenges/${c.id}/submit`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ attemptId, submissionText: c.submission }),
    });
    if (!submitRes.ok) {
      const txt = await submitRes.text();
      return { id: c.id, quality: c.quality, status: 'submit_failed', score: null, points: null, evaluator: null, error: `submit ${submitRes.status}: ${txt.slice(0, 120)}`, durationMs: Date.now() - t0 };
    }

    // Read persisted attempt
    const [row] = await db.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1);
    return {
      id: c.id,
      quality: c.quality,
      status: row?.status ?? 'unknown',
      score: row?.qualityScore ? Number(row.qualityScore) : null,
      points: row?.pointsAwarded ?? null,
      evaluator: row?.evaluatorType ?? null,
      error: null,
      durationMs: Date.now() - t0,
    };
  } catch (e) {
    return { id: c.id, quality: c.quality, status: 'error', score: null, points: null, evaluator: null, error: String(e).slice(0, 200), durationMs: Date.now() - t0 };
  }
}

// ─── Main ───

async function main() {
  await ensureQAUser();
  const cookie = await mintCookie(QA_USER_ID, QA_EMAIL, QA_NAME);

  console.log(`\nRunning ${CASES.length * 2} submissions (${CASES.length} rich + ${CASES.length} poor) against ${BASE}\n`);

  const results: SubmitResult[] = [];

  for (const c of CASES) {
    // Rich submission first
    process.stdout.write(`  ${c.id} rich... `);
    const rich = await submitOne({ id: c.id, submission: c.rich, quality: 'rich' }, cookie, QA_USER_ID);
    console.log(`${rich.status} score=${rich.score} pts=${rich.points} ${rich.durationMs}ms${rich.error ? ' ERR: ' + rich.error : ''}`);
    results.push(rich);

    // Poor submission (must clear + re-attempt)
    process.stdout.write(`  ${c.id} poor... `);
    const poor = await submitOne({ id: c.id, submission: c.poor, quality: 'poor' }, cookie, QA_USER_ID);
    console.log(`${poor.status} score=${poor.score} pts=${poor.points} ${poor.durationMs}ms${poor.error ? ' ERR: ' + poor.error : ''}`);
    results.push(poor);
  }

  // ─── Results Table ───
  console.log('\n' + '═'.repeat(100));
  console.log('QA RESULTS TABLE');
  console.log('═'.repeat(100));
  console.log(
    'ID'.padEnd(7) +
    'Quality'.padEnd(8) +
    'Status'.padEnd(12) +
    'Score'.padEnd(8) +
    'Points'.padEnd(8) +
    'Evaluator'.padEnd(14) +
    'Time'.padEnd(8) +
    'Error'
  );
  console.log('─'.repeat(100));
  for (const r of results) {
    console.log(
      r.id.padEnd(7) +
      r.quality.padEnd(8) +
      r.status.padEnd(12) +
      String(r.score ?? '-').padEnd(8) +
      String(r.points ?? '-').padEnd(8) +
      (r.evaluator ?? '-').padEnd(14) +
      `${r.durationMs}ms`.padEnd(8) +
      (r.error ?? '')
    );
  }

  // ─── Summary ───
  const richResults = results.filter(r => r.quality === 'rich');
  const poorResults = results.filter(r => r.quality === 'poor');
  const richOk = richResults.filter(r => r.status === 'completed');
  const poorOk = poorResults.filter(r => r.status === 'completed' || r.status === 'failed');
  const errors = results.filter(r => r.error);

  console.log('\n' + '═'.repeat(100));
  console.log('SUMMARY');
  console.log('─'.repeat(100));
  console.log(`Total submissions: ${results.length}`);
  console.log(`Rich — completed: ${richOk.length}/${richResults.length}, avg score: ${richOk.length > 0 ? Math.round(richOk.reduce((s, r) => s + (r.score ?? 0), 0) / richOk.length) : '-'}`);
  console.log(`Poor — processed:  ${poorOk.length}/${poorResults.length}, avg score: ${poorOk.length > 0 ? Math.round(poorOk.reduce((s, r) => s + (r.score ?? 0), 0) / poorOk.length) : '-'}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`  ✗ ${e.id} (${e.quality}): ${e.error}`);
  }

  // Score discrimination check
  console.log('\nSCORE DISCRIMINATION (rich vs poor — higher gap = better challenge design):');
  for (const c of CASES) {
    const rich = results.find(r => r.id === c.id && r.quality === 'rich');
    const poor = results.find(r => r.id === c.id && r.quality === 'poor');
    if (rich?.score != null && poor?.score != null) {
      const gap = rich.score - poor.score;
      const bar = gap > 0 ? '█'.repeat(Math.min(50, Math.round(gap / 2))) : '▒';
      console.log(`  ${c.id.padEnd(7)} rich=${String(rich.score).padEnd(4)} poor=${String(poor.score).padEnd(4)} gap=${String(gap).padEnd(4)} ${bar}`);
    } else {
      console.log(`  ${c.id.padEnd(7)} (incomplete — rich=${rich?.score ?? '?'} poor=${poor?.score ?? '?'})`);
    }
  }

  console.log('\n' + '═'.repeat(100));

  if (errors.length > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
