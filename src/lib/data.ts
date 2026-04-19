import { Challenge, User, Attempt, LeaderboardEntry } from './types';

export const SEED_CHALLENGES: Challenge[] = [
  {
    id: 'CH-01',
    title: 'Spot the Bad PRD — Smart Notifications',
    description: 'An AI-drafted PRD for a smart notification system contains 5 planted problems. Find them all and submit your findings. Auto-graded by keyword-based fuzzy matching.',
    instructions: '## Your Task\n\nBelow is a PRD draft an engineer pasted into Slack after asking an LLM to "write a quick PRD for smart notifications." It contains **exactly 5 planted problems** that would get flagged in a real PRD review at Nubank. Find them all and submit your 5 findings — one per line, as a bulleted/numbered list, or as a JSON array.\n\n### Feature Brief (the real requirements)\n\nNubank\'s mobile app sends an average of **12 push notifications per day per user**. User research shows **68% of users have disabled** non-critical notifications. The smart notification system should learn user preferences and prioritize alerts, reducing notification volume by **50%** while maintaining engagement on critical alerts (transactions, security).\n\nA good 1-page PRD for this feature must include:\n1. **Problem statement** grounded in the baseline numbers\n2. **At least 3 user stories** in proper `As a <role>, I want <action> so that <outcome>` format\n3. **2–3 measurable KPIs** (numeric targets, not feelings)\n4. **An explicit out-of-scope section** listing what is cut from v1\n\n### The AI-drafted PRD under review\n\n```markdown\n# Smart Notifications PRD\n\n## Problem\nNotifications are annoying. Users get too many. We should make it smarter\nand more personalized so users are happier.\n\n## Users\nAll 80 million Nubank users across Brazil, Mexico, and Colombia.\n\n## Success Metrics\n- Users feel happier about notifications\n- Better overall engagement\n- Reduced churn on the notifications feature\n\n## What we will build\n- A lightweight ML model that predicts per-notification priority\n- Real-time inference on every push event\n- A brand-new admin dashboard for the ops team\n- SMS and email unification with push\n- Migrate off AWS SNS to a custom in-house notification bus\n- Integration with the marketing automation platform for campaign pushes\n```\n\n### Submission format\n\nWrite 5 findings in plain prose — each one must mention **both** what is wrong AND what a correct version would look like, using the keywords the grader looks for. You can use any of these formats:\n\n**Bulleted list (easiest):**\n```\n- The problem statement is vague — it never cites the 12 notifications/day baseline or 68% opt-out rate.\n- There are no user stories in the required As-a/I-want/so-that format.\n- The success metrics are not measurable — "users feel happy" is not a KPI, real metrics need numeric targets.\n- Scope creep — SMS, admin dashboard, and SNS migration are out of a v1 smart-notifications release.\n- There is no explicit out-of-scope section — a good PRD lists what is intentionally cut from v1.\n```\n\n**JSON array (if you prefer):**\n```json\n[\n  "The problem statement is vague — it never cites the 12 notifications/day baseline or the 68% opt-out rate from the brief.",\n  "There are no user stories in the required As-a/I-want/so-that format.",\n  "The success metrics are not measurable — \'users feel happy\' is not a KPI; real metrics need numeric targets like the 50% volume reduction.",\n  "Scope creep — SMS, the admin dashboard, and the SNS migration are clearly out of a v1 smart-notifications release.",\n  "There is no explicit out-of-scope section — a good PRD lists what is intentionally cut from v1."\n]\n```\n\n> The grader fuzzy-matches each of your entries against an answer key by keyword overlap. Order does not matter, and extra findings beyond the 5 planted ones are ignored.\n\n### The 5 planted problems\n1. **Vague problem statement** — no baseline numbers (12/day, 68% opt-out) from the brief.\n2. **No user stories** — the brief required at least 3 in `As a … I want … so that …` format.\n3. **Unmeasurable success metrics** — "users feel happier" is a feeling, not a KPI; no numeric targets.\n4. **Scope creep** — SMS unification, admin dashboard, and the SNS migration are clearly v1+ territory.\n5. **No explicit out-of-scope section** — a good PRD states what is intentionally cut.',
    tags: ['AI Evaluation', 'Critical Thinking', 'Product Thinking', 'Writing & Documentation'],
    difficulty: 'beginner',
    timeMinutes: 25,
    pointsBase: 120,
    submissionFormat: 'List of 5 findings (bulleted, numbered, or JSON array)',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Problems found', weight: 100, description: '% of planted problems identified with the right keywords' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'list',
          matchMode: 'fuzzy',
          partialCredit: true,
          answerKey: [
            {
              label: 'Vague problem statement (ignores the 12/day + 68% baseline)',
              keywords: ['problem', 'vague', '68', '12', 'baseline'],
              minOverlap: 2,
            },
            {
              label: 'No user stories in As-a / I-want / so-that format',
              keywords: ['user stor', 'no user', 'format', 'as a'],
              minOverlap: 2,
            },
            {
              label: 'Unmeasurable metrics ("users feel happy")',
              keywords: ['happy', 'measurable', 'metric', 'kpi', 'numeric'],
              minOverlap: 2,
            },
            {
              label: 'Scope creep (SMS / admin dashboard / SNS migration)',
              keywords: ['scope', 'creep', 'sms', 'admin dashboard', 'sns'],
              minOverlap: 2,
            },
            {
              label: 'No explicit out-of-scope section',
              keywords: ['out of scope', 'out-of-scope', 'boundar', 'explicit'],
              minOverlap: 2,
            },
          ],
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: false,
    assetType: null,
    hints: [
      { level: 1, text: 'Cross-check the PRD\'s "Problem" and "Success Metrics" sections against the concrete numbers in the feature brief. Anything qualitative where the brief gives you numbers is a red flag.' },
      { level: 2, text: 'Count the user stories in the draft, then count how many are in `As a <role>, I want <action> so that <outcome>` format.' },
      { level: 3, text: 'The grader looks for keyword pairs — each finding should mention BOTH the wrong thing AND the fix. "Problem statement is vague — it ignores the 68% baseline from the brief" scores; just "problem is vague" does not.' },
    ],
    active: true,
  },
  {
    id: 'CH-02',
    title: 'INVEST Triage — Spot the Broken User Story',
    description: 'Diagnose 7 AI-generated user stories. For each one, pick which INVEST letter it violates. Auto-graded multi-choice quiz.',
    instructions: '## Your Task\n\nAn AI assistant was asked to write user stories for Nubank\'s internal **team expense tracker**. It produced 7 stories. **Each one violates exactly one INVEST criterion.** Your job: for each story, identify which letter is broken.\n\n### INVEST cheat sheet\n- **I — Independent:** can be delivered without waiting on another story.\n- **N — Negotiable:** captures intent, not a hard implementation spec.\n- **V — Valuable:** delivers real value to a user or the business.\n- **E — Estimable:** small and concrete enough for the team to size.\n- **S — Small:** fits comfortably in one sprint.\n- **T — Testable:** has an objective, verifiable pass/fail.\n\n### The 7 stories\n\n**q1 —** *"As an employee, I want the expense tracker to offer a delightful, magical experience so that I feel valued."*\n\n**q2 —** *"As an employee, I want to submit a new expense, upload a receipt photo, categorize it, tag the project, route it to my manager, wait for approval, receive reimbursement, and export a year-end tax report — all in one story."*\n\n**q3 —** *"As an employee, I want the expense tracker to be built in React with Redux Toolkit, backed by a PostgreSQL database, running on Kubernetes with a Kafka event bus, so that the architecture is modern."*\n\n**q4 —** *"As an employee, I want to submit an expense **after** the Finance team finishes migrating their ledger, **after** HR publishes the new cost-center taxonomy, and **after** my manager\'s delegation workflow is live."*\n\n**q5 —** *"As a designer, I want the expense tracker to use the new icon set so that the UI looks consistent with the rest of the portal."*\n\n**q6 —** *"As Nubank, I want the expense tracker to transform the company\'s financial culture over the next 5 years so that spending becomes fully self-service."*\n\n**q7 —** *"As an employee, I want to receive a notification when my expense is approved."*\n\nq7 actually looks okay at first — but the **acceptance criteria** attached to it say only: *"The system should notify the user in a timely and satisfactory way."* Pick which INVEST letter that acceptance criteria breaks.\n\n### How to answer\n\nFor each question q1…q7, submit the single letter of the broken criterion: `"i"`, `"n"`, `"v"`, `"e"`, `"s"`, or `"t"`.\n\n### Submission shape\n\n```json\n{\n  "answers": {\n    "q1": "t",\n    "q2": "s",\n    "q3": "n",\n    "q4": "i",\n    "q5": "v",\n    "q6": "e",\n    "q7": "t"\n  }\n}\n```\n\n> The example above is **illustrative of the format only** — not the answer key. Think it through.',
    tags: ['Product Thinking', 'Critical Thinking', 'Writing & Documentation'],
    difficulty: 'beginner',
    timeMinutes: 15,
    pointsBase: 120,
    submissionFormat: 'JSON object of answers',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'INVEST recognition', weight: 100, description: '% of stories correctly diagnosed' },
      ],
      grader: {
        type: 'multi-choice',
        config: {
          questions: [
            { id: 'q1', correctAnswer: 't', points: 1 },
            { id: 'q2', correctAnswer: 's', points: 1 },
            { id: 'q3', correctAnswer: 'n', points: 1 },
            { id: 'q4', correctAnswer: 'i', points: 1 },
            { id: 'q5', correctAnswer: 'v', points: 1 },
            { id: 'q6', correctAnswer: 'e', points: 1 },
            { id: 'q7', correctAnswer: 't', points: 1 },
          ],
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: false,
    assetType: 'document',
    hints: [
      { level: 1, text: 'INVEST = Independent, Negotiable, Valuable, Estimable, Small, Testable. Each story breaks exactly one.' },
      { level: 2, text: 'If a story hard-codes a tech stack, it is not Negotiable. If it depends on other work landing first, it is not Independent.' },
      { level: 3, text: '"Delightful", "magical", "satisfactory", "timely" — all vague adjectives that fail Testable. Objective pass/fail only.' },
    ],
    active: true,
  },
  {
    id: 'CH-04',
    title: 'Spot the Hallucination — Market Analysis',
    description: 'Find 5 planted factual errors in an AI-generated market analysis and submit your findings. Auto-graded by keyword-based fuzzy matching.',
    instructions: '## Your Task\n\nThe following market analysis was generated by an AI assistant. It contains **exactly 5 planted factual errors** about Nubank. Find them all and submit your 5 findings — one per line, as a bulleted/numbered list, or as a JSON array.\n\n### AI-Generated Market Analysis\n\n**Nubank Market Brief**\n\nNubank is a digital bank **founded in 1999 in Buenos Aires** by David Vélez, Cristina Junqueira, and Edward Wible. The company is **headquartered in Mexico City** and now serves customers across Brazil, Mexico, and Colombia.\n\nNubank had its initial public offering in 2021 **on the London Stock Exchange under the ticker NULN**, raising roughly $2.8 billion.\n\nThe engineering organization is well-known for its backend: the transactional ledger is built on **PostgreSQL**, which Nubank has tuned to process billions of events per day. Their mobile app is built in Clojure and React Native.\n\nOne of Nubank\'s biggest product wins was being **the first neobank to launch in Argentina**, where it now has several million active users.\n\n### Submission format\n\nExplain each error in your own words in plain prose. Your explanation must mention **both** the wrong claim and the correct fact, using the keywords the grader looks for. You can use any of these formats:\n\n**Bulleted list (easiest):**\n```\n- The founding year 1999 is wrong — Nubank was founded in 2013.\n- Buenos Aires / Mexico City is wrong — Nubank is headquartered in São Paulo, Brazil.\n- The London Stock Exchange claim is wrong — Nubank IPO\'d on the NYSE under ticker NU.\n- PostgreSQL is wrong — Nubank\'s ledger is built on Apache Cassandra.\n- The Argentina claim is fabricated — Nubank does not operate in Argentina.\n```\n\n**JSON array (if you prefer):**\n```json\n[\n  "The founding year 1999 is wrong — Nubank was founded in 2013.",\n  "Buenos Aires is wrong — Nubank is headquartered in São Paulo, Brazil.",\n  "The London Stock Exchange claim is wrong — Nubank IPO\'d on the NYSE under ticker NU.",\n  "PostgreSQL is wrong — Nubank\'s ledger is built on Apache Cassandra.",\n  "The Argentina claim is fabricated — Nubank does not operate in Argentina."\n]\n```\n\n> The grader fuzzy-matches each of your entries against an answer key by keyword overlap, so the order of your array does not matter. You can submit 5 or more findings — extras are ignored, but each of the 5 planted errors must be covered.\n\n### The 5 planted errors\n1. Founding year — the doc says 1999. The real year is **2013**.\n2. Founding location / HQ — the doc says Buenos Aires / Mexico City. The real HQ is **São Paulo, Brazil**. (This counts as **one** error about location — you must mention both São Paulo AND correct the wrong city.)\n3. IPO venue — the doc says London Stock Exchange. Nubank IPO\'d on the **NYSE** (ticker NU).\n4. Primary database — the doc says PostgreSQL. The ledger is built on **Apache Cassandra**.\n5. Argentina expansion — fabricated. Nubank **does not operate in Argentina**.',
    tags: ['AI Evaluation', 'Critical Thinking', 'Research'],
    difficulty: 'intermediate',
    timeMinutes: 35,
    pointsBase: 200,
    submissionFormat: 'List of 5 findings (bulleted, numbered, or JSON array)',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Errors found', weight: 100, description: '% of planted errors identified with the right keywords' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'list',
          matchMode: 'fuzzy',
          partialCredit: true,
          answerKey: [
            {
              label: 'Wrong founding year (1999 → 2013)',
              keywords: ['1999', '2013', 'founded'],
              minOverlap: 2,
            },
            {
              label: 'Wrong HQ / founding location (Buenos Aires or Mexico City → São Paulo)',
              keywords: ['são paulo', 'sao paulo', 'brazil', 'headquarter'],
              minOverlap: 2,
            },
            {
              label: 'Wrong IPO venue (LSE → NYSE)',
              keywords: ['nyse', 'new york', 'london', 'ipo'],
              minOverlap: 2,
            },
            {
              label: 'Wrong ledger database (PostgreSQL → Cassandra)',
              keywords: ['cassandra', 'postgresql', 'ledger', 'database'],
              minOverlap: 2,
            },
            {
              label: 'Fabricated Argentina presence',
              keywords: ['argentina', 'not', 'does not', 'fabricat'],
              minOverlap: 2,
            },
          ],
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Every Nubank founding-era fact in the doc is suspect: year, city, founders. Cross-check with Wikipedia or Nubank\'s investor relations page.' },
      { level: 2, text: 'The tech stack claim has one specific lie that Nubank engineering blogs will immediately contradict — look for "Cassandra" in Nubank\'s engineering posts.' },
      { level: 3, text: 'The grader looks for keyword pairs — each finding should mention BOTH the wrong claim AND the correct fact. "1999 is wrong, the real year is 2013" scores; just "wrong year" does not.' },
    ],
    active: true,
  },
  {
    id: 'CH-05',
    title: 'Requirements Elicitation from Transcript',
    description: 'Extract and organize requirements from a simulated stakeholder interview, identifying contradictions.',
    instructions: '## Your Task\n\nRead the stakeholder interview transcript below and extract all requirements.\n\n### Transcript\n\n**Interviewer:** What are the main goals for the new customer feedback system?\n\n**Stakeholder (VP Product):** We need real-time feedback collection. Customers should be able to rate their experience immediately after any interaction — app usage, customer service call, transaction. We want it to be frictionless, maybe just a single tap.\n\n**Stakeholder (Head of CX):** I agree on real-time, but we also need detailed feedback. A single rating isn\'t enough — we need to understand WHY customers feel a certain way. So we need follow-up questions, text input, maybe even voice recording.\n\n**VP Product:** Wait, I said frictionless. Adding follow-up questions makes it friction-ful. We\'ve seen drop-off rates of 80% when surveys have more than 2 questions.\n\n**Head of CX:** But without the context, the data is useless. We already have star ratings — they tell us nothing actionable.\n\n**VP Product:** Fine, but the detailed survey should be optional, not blocking.\n\n**Head of CX:** Also, we need to integrate with our existing Salesforce CRM. Every piece of feedback should create a case automatically.\n\n**VP Product:** Salesforce integration is important, but I want to be clear — the feedback system should work independently. If Salesforce is down, we still collect feedback. And we need the data in our own analytics platform too, not just Salesforce.\n\n**Head of CX:** One more thing — we need sentiment analysis. AI-powered. Real-time. So our agents can see customer mood before picking up a call.\n\n**VP Product:** Real-time sentiment is a Phase 2 thing. Let\'s not scope-creep Phase 1.\n\n### Your Deliverable\n1. Extract all functional requirements (FR) and non-functional requirements (NFR)\n2. Categorize each as: Stated (explicitly said), Implied (reasonable inference), or Contradicted (conflicting statements)\n3. Flag all contradictions with both sides of the argument\n4. Propose a resolution for each contradiction',
    tags: ['Critical Thinking', 'Writing & Documentation', 'Problem Solving'],
    difficulty: 'beginner',
    timeMinutes: 25,
    pointsBase: 80,
    submissionFormat: 'Structured requirements document',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Completeness', weight: 30, description: 'All requirements captured from transcript' },
        { name: 'Categorization', weight: 30, description: 'Correct classification as stated/implied/contradicted' },
        { name: 'Contradiction identification', weight: 40, description: 'All contradictions flagged with both perspectives' },
      ],
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Read the transcript twice — once for content, once for contradictions.' },
      { level: 2, text: 'The tension between "frictionless" and "detailed feedback" is the central contradiction.' },
      { level: 3, text: 'Look for implied requirements like data persistence, offline capability, and multi-channel support.' },
    ],
    active: true,
  },
  {
    id: 'CH-06',
    title: 'Data Dictionary Builder',
    description: 'Read an ERD carefully and answer a structured JSON quiz about its entities, enums, nullable FKs, and relationships. Auto-graded.',
    instructions: '## Your Task\n\nRead the entity-relationship description below and fill in a structured JSON object with the facts the grader checks for.\n\n### ERD Description\n\nEntities: Customer, Account, Transaction, Card, Notification\n\nRelationships:\n- Customer (1) → (N) Account\n- Account (1) → (N) Transaction\n- Account (1) → (N) Card\n- Customer (1) → (N) Notification\n- Transaction → references Card (optional / nullable)\n\nFields:\n- **Customer**: id, cpf, name, email, phone, birth_date, created_at\n- **Account**: id, customer_id, type (checking / savings), balance, status, created_at\n- **Transaction**: id, account_id, card_id (nullable), amount, type (credit / debit / pix / transfer), description, merchant, category, timestamp\n- **Card**: id, account_id, number_last4, type (virtual / physical), status, limit, created_at\n- **Notification**: id, customer_id, type, title, body, read, channel, sent_at\n\n### Submission shape\n\nReturn a JSON object with exactly these keys (arrays are order-insensitive — the grader treats them as sets, but the length must match):\n\n```json\n{\n  "entities": ["customer", "account", "transaction", "card", "notification"],\n  "customerPiiFields": ["cpf", "name", "email", "phone", "birth_date"],\n  "accountTypeEnum": ["checking", "savings"],\n  "transactionTypeEnum": ["credit", "debit", "pix", "transfer"],\n  "cardTypeEnum": ["virtual", "physical"],\n  "nullableForeignKeys": ["transaction.card_id"],\n  "oneToManyRelations": [\n    "customer->account",\n    "account->transaction",\n    "account->card",\n    "customer->notification"\n  ]\n}\n```\n\n### Rules\n- All identifiers are lower_snake_case (or lowercase) — match the spelling above.\n- Arrays are sets: `["savings", "checking"]` is equivalent to `["checking", "savings"]`.\n- `entities` must list all 5 entity names, lowercased.\n- `customerPiiFields` must include **only** the PII fields, not `id` or `created_at`.\n- `nullableForeignKeys` uses dotted notation `entity.field`.\n- `oneToManyRelations` uses arrow notation `parent->child` (no spaces).',
    tags: ['Data Analysis', 'Writing & Documentation', 'Critical Thinking'],
    difficulty: 'beginner',
    timeMinutes: 20,
    pointsBase: 100,
    submissionFormat: 'JSON object',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Fields correct', weight: 100, description: '% of fields matching the canonical answer' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'object',
          matchMode: 'exact',
          answerKey: {
            entities: ['customer', 'account', 'transaction', 'card', 'notification'],
            customerPiiFields: ['cpf', 'name', 'email', 'phone', 'birth_date'],
            accountTypeEnum: ['checking', 'savings'],
            transactionTypeEnum: ['credit', 'debit', 'pix', 'transfer'],
            cardTypeEnum: ['virtual', 'physical'],
            nullableForeignKeys: ['transaction.card_id'],
            oneToManyRelations: [
              'customer->account',
              'account->transaction',
              'account->card',
              'customer->notification',
            ],
          },
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'PII = personally identifiable information. `id` and `created_at` are not PII.' },
      { level: 2, text: 'Only one FK in the ERD is explicitly marked nullable — `transaction.card_id` (purchases vs Pix/transfer).' },
      { level: 3, text: 'Arrays are order-insensitive but length-sensitive — no extras, no missing values.' },
    ],
    active: true,
  },
  {
    id: 'CH-10',
    title: 'Brazilian Phone Normalizer',
    description: 'Implement `normalizeBrPhone(input)` that canonicalizes Brazilian phone numbers to E.164 format. Auto-graded by code sandbox.',
    instructions: '## Your Task\n\nImplement a JavaScript function `normalizeBrPhone(input)` that takes a messy Brazilian phone number and returns its canonical E.164 form (`+55` + area code + subscriber number). Return `null` if the input cannot be normalized.\n\n### Rules\n\n1. Strip all non-digit characters (`+`, `-`, `(`, `)`, spaces, dots, etc.).\n2. If the cleaned string starts with `55` and has **12 or 13** digits, drop the leading `55` — the remainder must be a valid Brazilian local number.\n3. A valid Brazilian local number has **10 or 11** digits:\n   - 10 digits = landline (2-digit area code + 8-digit number).\n   - 11 digits = mobile (2-digit area code + 9-digit number; the 3rd digit — first of the subscriber — must be `9`).\n4. The 2-digit area code (DDD) must be between `11` and `99` inclusive.\n5. If valid, return `"+55" + <10 or 11 digits>`. Otherwise return `null`.\n\n### Test cases\n\n| Input | Expected |\n|---|---|\n| `"+55 (11) 98765-4321"` | `"+5511987654321"` |\n| `"11 98765-4321"` | `"+5511987654321"` |\n| `"(21) 3333-4444"` | `"+552133334444"` |\n| `"5521999887766"` | `"+5521999887766"` |\n| `"11 8765-4321"` (old 8-digit mobile, no leading 9) | `"+551187654321"` (treated as landline) |\n| `"11 12345-6789"` (11 digits but no leading 9) | `null` |\n| `"01198765432"` (area code 01) | `null` |\n| `""` | `null` |\n| `"abc"` | `null` |\n| `"+1 415 555 1212"` (not Brazilian) | `null` |\n\n### Submission shape\n\nSubmit a single JavaScript function named `normalizeBrPhone` — no imports, no `require`, no `process`. The sandbox runs it directly against hidden test cases.\n\n```javascript\nfunction normalizeBrPhone(input) {\n  // your implementation here\n}\n```',
    tags: ['Coding', 'Data Validation'],
    difficulty: 'beginner',
    timeMinutes: 25,
    pointsBase: 100,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Tests passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'normalizeBrPhone',
          timeoutMs: 1000,
          testCases: [
            { description: 'Formatted mobile with +55', input: ['+55 (11) 98765-4321'], expected: '+5511987654321' },
            { description: 'Mobile without country code', input: ['11 98765-4321'], expected: '+5511987654321' },
            { description: 'Landline with parens', input: ['(21) 3333-4444'], expected: '+552133334444' },
            { description: 'Raw 13-digit with 55 prefix', input: ['5521999887766'], expected: '+5521999887766' },
            { description: 'Old 8-digit mobile treated as landline', input: ['11 8765-4321'], expected: '+551187654321' },
            { description: '11-digit mobile without leading 9 → null', input: ['11 12345-6789'], expected: null },
            { description: 'Invalid area code 01', input: ['01198765432'], expected: null },
            { description: 'Empty string → null', input: [''], expected: null },
            { description: 'Letters → null', input: ['abc'], expected: null },
            { description: 'Non-Brazilian number → null', input: ['+1 415 555 1212'], expected: null },
            { description: 'Dotted format', input: ['11.98765.4321'], expected: '+5511987654321' },
            { description: 'Leading/trailing whitespace', input: ['  11987654321  '], expected: '+5511987654321' },
          ],
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Start by stripping everything that is not a digit with `replace(/\\D/g, \'\')`.' },
      { level: 2, text: 'After stripping, handle the 12/13-digit country-code case first, then validate the remaining 10- or 11-digit local number.' },
      { level: 3, text: 'For 11-digit numbers, check that the 3rd digit (index 2) is `9` — that is the mobile marker post-2012.' },
    ],
    active: true,
  },
  {
    id: 'CH-11',
    title: 'Code Review of AI Output',
    description: 'Review an AI-generated code module and find 5 planted bugs.',
    instructions: '## Your Task\n\nReview the following AI-generated TypeScript code module for a simple rate limiter. It contains **5 bugs** — find them all.\n\n```typescript\nclass RateLimiter {\n  private requests: Map<string, number[]> = new Map();\n  private maxRequests: number;\n  private windowMs: number;\n\n  constructor(maxRequests: number, windowMs: number) {\n    this.maxRequests = maxRequests;\n    this.windowMs = windowMs;\n  }\n\n  isAllowed(clientId: string): boolean {\n    const now = Date.now();\n    const timestamps = this.requests.get(clientId) || [];\n    \n    // Remove expired timestamps\n    const valid = timestamps.filter(t => now - t > this.windowMs);\n    \n    if (valid.length >= this.maxRequests) {\n      return false;\n    }\n\n    valid.push(now);\n    this.requests.set(clientId, valid);\n    return true;\n  }\n\n  getRemainingRequests(clientId: string): number {\n    const timestamps = this.requests.get(clientId) || [];\n    return this.maxRequests - timestamps.length;\n  }\n\n  reset(clientId: string): void {\n    this.requests.delete(clientId);\n  }\n\n  resetAll(): void {\n    this.requests = new Map();\n  }\n}\n```\n\n### Steps\n1. Read the code carefully\n2. Identify the 5 bugs\n3. For each bug: describe the issue, explain the impact, rate severity (Low/Medium/High/Critical), and provide the fix\n\n### Submission\nCode review document with all 5 bugs documented.',
    tags: ['Coding', 'Critical Review', 'AI Evaluation'],
    difficulty: 'beginner',
    timeMinutes: 30,
    pointsBase: 100,
    submissionFormat: 'Code review document',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Bugs found', weight: 50, description: 'Correctly identified the 5 planted bugs' },
        { name: 'Explanation quality', weight: 25, description: 'Clear description of impact and root cause' },
        { name: 'Fix quality', weight: 25, description: 'Proposed fixes are correct and complete' },
      ],
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Look at the filter condition in isAllowed — is it keeping the right timestamps?' },
      { level: 2, text: 'getRemainingRequests uses raw timestamps length without filtering expired ones.' },
      { level: 3, text: 'There\'s a memory leak — old client entries are never cleaned up.' },
    ],
    active: true,
  },
  {
    id: 'CH-14',
    title: 'AI-Assisted Copywriting',
    description: 'Write UI microcopy variants for interface elements, selecting and refining the best options.',
    instructions: '## Your Task\n\nWrite UI microcopy for the following 6 interface elements of a Nubank feature. For each, generate 3 variants using AI, then select the best one and explain why.\n\n### Interface Elements\n\n1. **Empty state** — User opens the investment tab but has no investments yet\n2. **Error message** — PIX transfer failed due to insufficient balance\n3. **Success message** — First credit card bill paid on time\n4. **Confirmation dialog** — User is about to close their savings account\n5. **Onboarding tooltip** — Explaining what the "Ultra Violet" card tier means\n6. **Loading state** — Processing a loan application\n\n### Requirements\n- Generate 3 variants per element using AI\n- Select the best variant for each\n- Write a brief rationale for your selection (tone, clarity, user empathy)\n- Ensure all copy follows these Nubank brand guidelines:\n  - Friendly but not childish\n  - Clear and direct, no jargon\n  - Empathetic to financial anxiety\n  - Portuguese-aware (even though writing in English, consider Brazilian cultural context)',
    tags: ['Prompt Engineering', 'Communication', 'Writing & Documentation'],
    difficulty: 'beginner',
    timeMinutes: 20,
    pointsBase: 80,
    submissionFormat: 'Microcopy document with variants and rationale',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Clarity', weight: 30, description: 'Copy is immediately understandable' },
        { name: 'Tone consistency', weight: 30, description: 'Matches Nubank brand voice throughout' },
        { name: 'User empathy', weight: 20, description: 'Acknowledges user context and emotions' },
        { name: 'Variant diversity', weight: 20, description: 'AI variants show range, not repetition' },
      ],
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'For the "insufficient balance" error, think about financial anxiety — avoid shame-inducing language.' },
      { level: 2, text: 'The savings account closure dialog needs to balance clarity about consequences with respect for user autonomy.' },
      { level: 3, text: 'Good microcopy for empty states turns a void into an invitation to act.' },
    ],
    active: true,
  },
  {
    id: 'CH-15',
    title: 'Accessibility Audit',
    description: 'Identify accessibility issues in a digital interface against WCAG 2.1 guidelines.',
    instructions: '## Your Task\n\nReview the following interface description and identify accessibility issues.\n\n### Interface Description\n\nA banking dashboard with:\n- Purple (#7C3AED) header on white background with navigation links\n- Account balance displayed in light gray (#9CA3AF) text on white background\n- Pie chart showing spending categories (only differentiated by color: red, blue, green, orange)\n- "Transfer Money" button: small (32x24px), green text on green background with slightly different shade\n- Transaction list with swipe-to-delete gesture (mobile)\n- Auto-playing video tutorial on first visit\n- Form with placeholder text as labels (no separate label elements)\n- Error messages shown only in red text with no icon or ARIA announcement\n- Modal popup that cannot be closed with keyboard (no focus trap, no Escape handler)\n- Infinite scroll on transaction history with no "load more" alternative\n\n### Deliverable\n1. Identify all accessibility issues\n2. For each: cite the relevant WCAG 2.1 guideline\n3. Rate severity: Critical, Major, Minor\n4. Propose a specific fix\n5. Prioritize your recommendations',
    tags: ['Accessibility', 'Critical Review', 'Design'],
    difficulty: 'beginner',
    timeMinutes: 30,
    pointsBase: 100,
    submissionFormat: 'Accessibility audit report',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Issues found', weight: 30, description: 'Number and accuracy of identified issues' },
        { name: 'WCAG references', weight: 25, description: 'Correct guideline citations' },
        { name: 'Fix quality', weight: 25, description: 'Practical, implementable fixes' },
        { name: 'Prioritization', weight: 20, description: 'Reasonable severity and priority ordering' },
      ],
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Start with color contrast — check the gray text on white background against WCAG AA ratios.' },
      { level: 2, text: 'The pie chart differentiated only by color violates WCAG 1.4.1 (Use of Color).' },
      { level: 3, text: 'The modal without keyboard support is a Critical issue — traps keyboard users.' },
    ],
    active: true,
  },
  {
    id: 'CH-17',
    title: 'Copilot Rollout — Pick the Right Call',
    description: 'Six real decisions from a Copilot rollout on a Nubank Clojure+React team. Pick the best answer for each. Auto-graded quiz.',
    instructions: '## Your Task\n\nYou are the tech lead of a Nubank engineering team of 8: **5 backend devs (Clojure), 2 frontend devs (React), 1 QA engineer**. Current velocity is ~45 story points/sprint. You are rolling out GitHub Copilot. Six decisions land on your desk. Pick the best answer for each.\n\n---\n\n**q1 — Language coverage reality.** Two backend devs tried Copilot for a week and complained that suggestions "don\'t follow our conventions." What is the **most likely root cause**?\n- `a` — The team\'s code style is objectively bad.\n- `b` — Copilot\'s Clojure training data is much thinner than its JavaScript/Python data, so suggestions regress to generic patterns.\n- `c` — Copilot was misconfigured.\n- `d` — The devs have not written enough prompts.\n\n**q2 — Where to trust it first.** You want to earn trust with a low-risk win. Which area of the codebase is the **safest** place to start relying on Copilot?\n- `a` — Core ledger business logic in Clojure.\n- `b` — Boilerplate React components, form scaffolding, and unit-test skeletons.\n- `c` — SQL migrations against production tables.\n- `d` — Authentication and authorization middleware.\n\n**q3 — QA role shift.** How should the QA engineer\'s role change when the team starts shipping Copilot-assisted code?\n- `a` — The QA engineer is now redundant — Copilot writes tests.\n- `b` — QA shifts more time toward exploratory testing, adversarial inputs, and reviewing AI-generated tests for coverage gaps and false confidence.\n- `c` — QA should only test code that was NOT touched by Copilot.\n- `d` — Nothing changes; QA keeps doing exactly what they did before.\n\n**q4 — Measurable metrics.** You want to track whether Copilot is actually helping. Which set of metrics is the **most meaningful** leading indicator?\n- `a` — Lines of code per developer per day.\n- `b` — Number of Copilot suggestions accepted.\n- `c` — PR cycle time, post-merge defect rate, and convention-violation rate flagged in review.\n- `d` — Developer self-reported happiness only.\n\n**q5 — Convention drift.** Copilot keeps suggesting idioms that violate the team\'s Clojure style guide. What is the **best** mitigation?\n- `a` — Ban Copilot for Clojure entirely.\n- `b` — Add a lint/format step in CI that catches the violations, and treat Copilot output like any other draft code that must pass review.\n- `c` — Ask every dev to manually rewrite every suggestion.\n- `d` — Switch the whole backend to TypeScript.\n\n**q6 — Business-logic risk.** A dev asks Copilot to generate the interest-calculation function for a new credit product. What should you require before that code ships?\n- `a` — Nothing — Copilot is reliable enough for finance code.\n- `b` — A human review plus a property-based or table-driven test suite that validates the calculation against the product spec, independent of whoever wrote it.\n- `c` — A second Copilot prompt that asks "is this correct?"\n- `d` — Ship it behind a feature flag and watch production.\n\n---\n\n### Submission shape\n\n```json\n{\n  "answers": {\n    "q1": "b",\n    "q2": "b",\n    "q3": "b",\n    "q4": "c",\n    "q5": "b",\n    "q6": "b"\n  }\n}\n```\n\n> The example above happens to be a valid-shaped submission; verify each answer for yourself before submitting.',
    tags: ['Critical Thinking', 'Strategy', 'AI Evaluation'],
    difficulty: 'beginner',
    timeMinutes: 15,
    pointsBase: 120,
    submissionFormat: 'JSON object of answers',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Decision quality', weight: 100, description: '% of rollout decisions correctly reasoned' },
      ],
      grader: {
        type: 'multi-choice',
        config: {
          questions: [
            { id: 'q1', correctAnswer: 'b', points: 1 },
            { id: 'q2', correctAnswer: 'b', points: 1 },
            { id: 'q3', correctAnswer: 'b', points: 1 },
            { id: 'q4', correctAnswer: 'c', points: 1 },
            { id: 'q5', correctAnswer: 'b', points: 1 },
            { id: 'q6', correctAnswer: 'b', points: 1 },
          ],
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: false,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Copilot\'s Clojure training data is much thinner than JS/Python — expect regressions to generic idioms.' },
      { level: 2, text: 'The safest wins for AI-assisted code are the boring ones: scaffolding, boilerplate, test skeletons. The riskiest are the ones that move money.' },
      { level: 3, text: 'Good leading indicators are cycle time, defect rate, and convention violations caught in review. Lines-of-code and acceptance rate are vanity metrics.' },
    ],
    active: true,
  },
  {
    id: 'CH-03',
    title: 'Prioritization Framework Battle',
    description: 'Apply three prioritization frameworks to the same backlog and compare their results.',
    instructions: '## Your Task\n\nGiven the user stories from CH-02, apply three prioritization frameworks and compare.\n\n### Frameworks\n1. **RICE** (Reach × Impact × Confidence / Effort)\n2. **MoSCoW** (Must have / Should have / Could have / Won\'t have)\n3. **Value-Effort Matrix** (2×2: High value + Low effort, etc.)\n\n### Steps\n1. Take 8 user stories (use the ones from CH-02 or create new ones for the expense tracker)\n2. Apply each framework independently\n3. Create a comparison table showing how each framework ranks the stories\n4. Analyze: Where do frameworks agree? Where do they diverge? Why?\n5. Make a final recommendation with your own priority order and reasoning\n\n### Submission\nComparative prioritization matrix with written analysis.',
    tags: ['Critical Thinking', 'Product Thinking', 'Strategy'],
    difficulty: 'intermediate',
    timeMinutes: 45,
    pointsBase: 250,
    submissionFormat: 'Prioritization matrix with analysis',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Framework application', weight: 30, description: 'Correct use of RICE, MoSCoW, and Value-Effort' },
        { name: 'Insight quality', weight: 40, description: 'Meaningful analysis of where frameworks agree and diverge' },
        { name: 'Recommendation strength', weight: 30, description: 'Final priority order is well-reasoned' },
      ],
    },
    antiCheatTier: 'T1',
    prerequisites: ['CH-02'],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'For RICE, you\'ll need to estimate reach and effort — use T-shirt sizes if exact numbers aren\'t available.' },
      { level: 2, text: 'Frameworks often disagree on low-reach, high-impact features. This tension is worth exploring.' },
      { level: 3, text: 'Your final recommendation doesn\'t have to match any single framework — explain your reasoning.' },
    ],
    active: true,
  },
  {
    id: 'CH-08',
    title: 'SQL Query Generation and Validation',
    description: 'Use AI to generate SQL queries, predict results, and identify logical errors.',
    instructions: '## Your Task\n\nUsing the data dictionary from CH-06, answer 5 business questions with SQL.\n\n### Business Questions\n1. What is the average transaction amount by category for the last 30 days?\n2. Which customers have more than 3 active cards?\n3. What percentage of transactions are made with virtual vs physical cards?\n4. Find customers who received more than 10 notifications in a single day but made 0 transactions\n5. Calculate the month-over-month growth rate of PIX transactions\n\n### Steps\n1. For each question, write a prompt to generate the SQL query\n2. BEFORE running, predict what the result structure will look like\n3. Review the AI-generated SQL for logical errors\n4. Correct any errors you find\n5. Document your corrections\n\n### Submission\n5 SQL queries with predicted results, error annotations, and corrections.',
    tags: ['Coding', 'Data Analysis', 'AI Evaluation'],
    difficulty: 'intermediate',
    timeMinutes: 40,
    pointsBase: 200,
    submissionFormat: 'SQL queries with annotations',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Query correctness', weight: 40, description: 'SQL is syntactically and logically correct' },
        { name: 'Prediction accuracy', weight: 30, description: 'Result structure predictions are reasonable' },
        { name: 'Error identification', weight: 30, description: 'AI errors caught and corrected' },
      ],
    },
    antiCheatTier: 'T1',
    prerequisites: ['CH-06'],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Watch for JOIN types — AI often uses INNER JOIN when LEFT JOIN is needed.' },
      { level: 2, text: 'Question 5 requires a window function (LAG). Verify the AI uses the right partitioning.' },
      { level: 3, text: 'The nullable card_id in transactions is a common source of AI errors in question 3.' },
    ],
    active: true,
  },
  {
    id: 'CH-12',
    title: 'Test-of-Tests: CPF Validator Suite',
    description: 'Write a test runner that discriminates a correct CPF validator from broken ones. Auto-graded via test-of-tests harness.',
    instructions: '## Your Task\n\nWrite a JavaScript function `runTests(validator)` that runs **your own test suite** against the supplied CPF validator and returns `{ total, passed, failed }`.\n\nThe grader calls `runTests` four times with different implementations and checks that your suite **discriminates** correct code from broken code:\n\n| Reference implementation | Your suite must report... |\n|---|---|\n| ✅ Correct CPF validator | `failed === 0` and `total >= 8` |\n| ❌ Always returns `true` | `failed > 0` |\n| ❌ Always returns `false` | `failed > 0` |\n| ❌ Length-only (returns `true` if cleaned length is 11) | `failed > 0` |\n\nIf your suite has too few tests, or fails to catch any of the 3 broken implementations, you lose a point per failing harness case.\n\n### CPF validation (quick recap)\nA CPF is an 11-digit Brazilian tax ID. A valid CPF:\n1. Has exactly 11 digits after stripping formatting (`.`, `-`, spaces).\n2. Is **not** all the same digit (`00000000000`, `11111111111`, … `99999999999` are invalid).\n3. Has a correct first check digit (weighted sum of the first 9 digits, modulo 11).\n4. Has a correct second check digit (weighted sum of the first 10 digits, modulo 11).\n\nKnown-good examples: `529.982.247-25`, `453.178.287-91`.\nKnown-bad examples: `000.000.000-00`, `123.456.789-00`, `529.982.247-26`.\n\n### Submission shape\n\n```javascript\nfunction runTests(validator) {\n  const cases = [\n    { input: "52998224725", expected: true,  label: "valid 1" },\n    { input: "45317828791", expected: true,  label: "valid 2" },\n    { input: "00000000000", expected: false, label: "all-zeros" },\n    { input: "11111111111", expected: false, label: "all-ones" },\n    { input: "12345678900", expected: false, label: "wrong check digit" },\n    { input: "",            expected: false, label: "empty" },\n    { input: "abc",         expected: false, label: "letters" },\n    { input: "5299822472",  expected: false, label: "too short" },\n    // add more — at least 8 total, the more discriminating the better\n  ];\n  let passed = 0, failed = 0;\n  for (const c of cases) {\n    try {\n      const actual = validator(c.input);\n      if (actual === c.expected) passed++; else failed++;\n    } catch { failed++; }\n  }\n  return { total: cases.length, passed, failed };\n}\n```\n\n### Rules\n- The function **must be named** `runTests` and accept a single `validator` argument.\n- The returned object must have numeric `total`, `passed`, `failed` fields.\n- No imports, no `require`, no `process`, no network, no dynamic code. The sandbox will reject them.\n- Your suite must have at least 8 test cases (the grader checks `total >= 8` when called with the correct impl).',
    tags: ['Coding', 'Testing & QA'],
    difficulty: 'intermediate',
    timeMinutes: 30,
    pointsBase: 200,
    submissionFormat: 'JavaScript runTests function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Suite discriminates', weight: 100, description: '% of harness checks that pass (correct impl accepted, broken impls caught)' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'runTests',
          timeoutMs: 2000,
          setup: `
            globalThis.__correctCpf = function(cpf) {
              var d = String(cpf == null ? '' : cpf).replace(/\\D/g, '');
              if (d.length !== 11) return false;
              if (/^(\\d)\\1{10}$/.test(d)) return false;
              var s = 0;
              for (var i = 0; i < 9; i++) s += parseInt(d.charAt(i), 10) * (10 - i);
              var r = (s * 10) % 11;
              if (r === 10) r = 0;
              if (r !== parseInt(d.charAt(9), 10)) return false;
              s = 0;
              for (var i2 = 0; i2 < 10; i2++) s += parseInt(d.charAt(i2), 10) * (11 - i2);
              r = (s * 10) % 11;
              if (r === 10) r = 0;
              return r === parseInt(d.charAt(10), 10);
            };
            globalThis.__alwaysTrue = function() { return true; };
            globalThis.__alwaysFalse = function() { return false; };
            globalThis.__lengthOnly = function(cpf) {
              return String(cpf == null ? '' : cpf).replace(/\\D/g, '').length === 11;
            };
          `,
          testCases: [
            {
              description: 'Suite accepts the correct CPF validator (failed === 0, total >= 8)',
              input: [],
              expected: true,
              harness: `
                try {
                  var r = globalThis.__entry(globalThis.__correctCpf);
                  globalThis.__result = !!(r && typeof r === 'object'
                    && typeof r.total === 'number' && typeof r.failed === 'number'
                    && r.total >= 8 && r.failed === 0);
                } catch (e) { globalThis.__result = false; }
              `,
            },
            {
              description: 'Suite catches an always-true validator (failed > 0)',
              input: [],
              expected: true,
              harness: `
                try {
                  var r = globalThis.__entry(globalThis.__alwaysTrue);
                  globalThis.__result = !!(r && typeof r === 'object' && r.failed > 0);
                } catch (e) { globalThis.__result = false; }
              `,
            },
            {
              description: 'Suite catches an always-false validator (failed > 0)',
              input: [],
              expected: true,
              harness: `
                try {
                  var r = globalThis.__entry(globalThis.__alwaysFalse);
                  globalThis.__result = !!(r && typeof r === 'object' && r.failed > 0);
                } catch (e) { globalThis.__result = false; }
              `,
            },
            {
              description: 'Suite catches a length-only validator (failed > 0)',
              input: [],
              expected: true,
              harness: `
                try {
                  var r = globalThis.__entry(globalThis.__lengthOnly);
                  globalThis.__result = !!(r && typeof r === 'object' && r.failed > 0);
                } catch (e) { globalThis.__result = false; }
              `,
            },
          ],
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Start with the 2 known-good CPFs and the 3 known-bad examples from the prompt. That is already 5 tests — add 3+ more edge cases.' },
      { level: 2, text: 'To catch the "always-true" impl you need at least one case where the expected result is `false`. To catch "always-false" you need at least one case where it is `true`.' },
      { level: 3, text: 'The length-only impl accepts `12345678900` as valid — that single wrong-check-digit case is enough to catch it.' },
    ],
    active: true,
  },
  {
    id: 'CH-16',
    title: 'User Research Synthesis',
    description: 'Synthesize findings from 5 user interview transcripts into themes and insights.',
    instructions: '## Your Task\n\nYou have 5 user interview transcripts about Nubank\'s savings feature. Synthesize them.\n\n### Transcript Summaries\n\n**User 1 (Maria, 28, teacher):** Loves the automatic savings feature. Saves R$200/month. Wishes she could set different goals. Doesn\'t understand the yield calculation. "I just trust it\'s better than my old bank."\n\n**User 2 (João, 45, small business owner):** Uses savings as a business reserve fund. Frustrated that he can\'t separate personal and business savings. Wants to see projected earnings. "I need to plan for tax season."\n\n**User 3 (Ana, 22, college student):** Just started saving. Only R$50/month. Motivated by the progress bar. Would like to save with friends (social savings). "My friends and I are saving for a trip."\n\n**User 4 (Carlos, 55, retired):** Has R$50K+ in savings. Primary concern is safety and inflation protection. Wants to compare with CDB rates. Doesn\'t trust automatic features. "I need to be in control of my money."\n\n**User 5 (Priya, 34, engineer):** Power user. Has 3 savings goals. Frustrated by the goal limit (max 5). Wants automation rules: "If my balance exceeds R$5K, move the excess to savings." Also wants better tax reporting.\n\n### Deliverable\n1. Identify 3-5 themes across all interviews\n2. Support each theme with quotes from multiple users\n3. Note contradictions (e.g., automation trust vs. control)\n4. Rank insights by impact and actionability\n5. Propose 3 product recommendations based on your synthesis',
    tags: ['Research', 'Critical Thinking', 'Writing & Documentation'],
    difficulty: 'intermediate',
    timeMinutes: 45,
    pointsBase: 250,
    submissionFormat: 'Research synthesis document',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Theme quality', weight: 30, description: 'Themes are insightful, not obvious' },
        { name: 'Evidence grounding', weight: 25, description: 'Themes supported by specific quotes' },
        { name: 'Nuance preservation', weight: 25, description: 'Contradictions acknowledged, not smoothed over' },
        { name: 'Actionability', weight: 20, description: 'Recommendations are specific and feasible' },
      ],
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Don\'t just list what each user said — look for patterns ACROSS users.' },
      { level: 2, text: 'The trust/control tension between Maria ("I just trust it") and Carlos ("I need control") is a key insight.' },
      { level: 3, text: 'The social savings request (Ana) might seem niche but connects to a broader theme of savings motivation.' },
    ],
    active: true,
  },
  {
    id: 'CH-18',
    title: 'AI-Assisted Work Review',
    description: 'Determine which work samples are AI-assisted vs human-generated and develop a quality rubric.',
    instructions: '## Your Task\n\nReview 5 work samples and classify them as AI-assisted or human-generated.\n\n### Sample 1: Bug Report\n"The login button on the iOS app becomes unresponsive after 3 failed attempts. Steps: 1) Open app 2) Enter wrong password 3 times 3) Try to tap login again. Expected: error message and retry. Actual: button doesn\'t respond. This only happens on iPhone 12 with iOS 17.2. I noticed it because I fat-fingered my password during a demo with the VP."\n\n### Sample 2: Code Comment\n"This function implements a binary search algorithm with O(log n) time complexity. It takes a sorted array and a target value as parameters, returning the index of the target if found, or -1 otherwise. The implementation uses iterative approach rather than recursive to avoid stack overflow issues with large arrays."\n\n### Sample 3: Product Recommendation\n"Based on the user research synthesis, I recommend we prioritize the multi-goal savings feature. While only 2 of 5 users explicitly requested it, the underlying need (financial compartmentalization) appeared in 4 of 5 interviews. João needs business/personal separation, Ana wants trip-specific saving, Carlos wants to compare investment types, and Priya already has 3 goals but wants more. The shared pattern is: money with PURPOSE saves better than money in a pile."\n\n### Sample 4: Meeting Summary\n"During today\'s standup, the team discussed the following: Sprint progress is on track with 34 of 45 story points completed. Two blockers were identified: the payment gateway integration is awaiting API credentials from the vendor, and the database migration script needs review from the DBA team. Action items include: follow up with vendor by EOD, schedule DBA review for tomorrow morning, and update the sprint board to reflect current status."\n\n### Sample 5: Error Handling Strategy\n"For the notification service, I propose a three-tier error handling approach. Network errors (timeouts, DNS failures) should retry with exponential backoff — but cap at 3 retries because if Slack is down for 30+ seconds, it\'s probably an outage and retrying just wastes compute. Validation errors should fail immediately and alert the dev channel, because they mean WE shipped bad code, not that an external service is flaky. Rate limit errors should use the Retry-After header value, and if that\'s missing, back off for 60 seconds because Slack\'s rate limits reset every minute (learned this the hard way during the Black Friday incident)."\n\n### Deliverable\n1. Classify each sample: AI-assisted, Fully Human, or Uncertain\n2. Explain your reasoning for each classification\n3. Assess quality regardless of origin (rate each 1-10)\n4. Develop a rubric for evaluating work quality in an AI-augmented workplace',
    tags: ['AI Evaluation', 'Critical Review', 'Leadership'],
    difficulty: 'intermediate',
    timeMinutes: 40,
    pointsBase: 200,
    submissionFormat: 'Review document with classifications and rubric',
    evaluationMethod: 'ai-judge',
    rubric: {
      criteria: [
        { name: 'Classification accuracy', weight: 25, description: 'Correct identification of AI vs human' },
        { name: 'Reasoning quality', weight: 25, description: 'Sound logic for classifications' },
        { name: 'Rubric usefulness', weight: 25, description: 'Quality rubric is practical and fair' },
        { name: 'Nuance', weight: 25, description: 'Avoids binary thinking, acknowledges quality regardless of origin' },
      ],
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Look for personal anecdotes, specific context, and informal language — these are harder for AI to fabricate convincingly.' },
      { level: 2, text: 'AI-generated text tends to be comprehensive but generic. Human text tends to be specific but incomplete.' },
      { level: 3, text: 'Some high-quality work IS AI-assisted. The goal isn\'t to penalize AI use but to evaluate output quality.' },
    ],
    active: true,
  },
  // ============================================
  // AUTO-GRADED CHALLENGES (Wave 1)
  // These use deterministic graders instead of AI judge.
  // The `rubric.grader` block holds the grader config.
  // See docs/plans/challenges-roadmap.md for the full plan.
  // ============================================
  {
    id: 'CH-09',
    title: 'Log Anomaly Regex',
    description: 'Write a regex that flags suspicious entries in a server log without producing false positives.',
    instructions: '## Your Task\n\nNubank\'s authentication service writes logs in this format:\n\n```\n2026-04-06T14:23:01Z [INFO] login_success user=u_4821 ip=192.168.1.42\n2026-04-06T14:23:04Z [WARN] login_failed user=u_4821 ip=10.0.0.7 reason=bad_password\n2026-04-06T14:23:09Z [ERROR] login_failed user=u_unknown ip=185.220.101.7 reason=user_not_found\n```\n\nWrite a **single regex** that matches every line where:\n- The level is `ERROR`\n- AND the IP address is **public** (not 10.x.x.x, 172.16-31.x.x, or 192.168.x.x)\n\n### Submission Format\n\nSubmit one regex on a single line. Either form works:\n\n```\n/pattern/flags\npattern\n```\n\n### Notes\n- Trivial wildcards (e.g. `.*` for the whole pattern) are penalized — be precise.\n- Your pattern length is capped at 200 characters.\n- The grader runs your regex against ~10 sample log lines (some matching, some rejecting).',
    tags: ['Coding', 'Critical Thinking', 'Security'],
    difficulty: 'beginner',
    timeMinutes: 20,
    pointsBase: 100,
    submissionFormat: 'A single regex literal',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Correctness', weight: 70, description: 'Pattern matches all required lines and rejects all others' },
        { name: 'Precision', weight: 30, description: 'Pattern is specific — no overly-broad wildcards' },
      ],
      grader: {
        type: 'regex',
        config: {
          mustMatch: [
            '2026-04-06T14:23:09Z [ERROR] login_failed user=u_unknown ip=185.220.101.7 reason=user_not_found',
            '2026-04-06T15:01:22Z [ERROR] db_timeout ip=8.8.8.8',
            '2026-04-06T15:14:55Z [ERROR] rate_limit_exceeded ip=203.0.113.42',
            '2026-04-06T16:02:11Z [ERROR] auth_replay ip=45.33.32.156',
          ],
          mustNotMatch: [
            '2026-04-06T14:23:01Z [INFO] login_success user=u_4821 ip=192.168.1.42',
            '2026-04-06T14:23:04Z [WARN] login_failed user=u_4821 ip=10.0.0.7 reason=bad_password',
            '2026-04-06T14:24:00Z [ERROR] internal_error ip=10.5.5.5',
            '2026-04-06T14:25:00Z [ERROR] internal_error ip=172.20.0.4',
            '2026-04-06T14:26:00Z [ERROR] internal_error ip=192.168.50.1',
            '2026-04-06T14:27:00Z [INFO] healthcheck ip=185.220.101.7',
          ],
          maxLength: 200,
          forbiddenTokens: ['.*'],
          violationPenalty: 25,
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: false,
    assetType: null,
    hints: [
      { level: 1, text: 'Anchor with `^` so partial matches don\'t sneak in. Use `[^\\n]*` instead of `.*` to avoid the trivial-wildcard penalty.' },
      { level: 2, text: 'A negative lookahead `(?!10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)` lets you express "not these private ranges".' },
      { level: 3, text: 'Match the IP as four dotted octets: `\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}`.' },
    ],
    active: true,
  },
  {
    id: 'CH-07',
    title: 'Spot the Hallucination — Structured Submission',
    description: 'Find the planted factual errors in an AI-generated brief and submit your findings. Auto-graded by keyword overlap — no AI scoring.',
    instructions: '## Your Task\n\nThe following brief was generated by an AI assistant. It contains **4 planted factual errors**. Find them all.\n\n### AI-Generated Brief\n\n**Nubank Tech Quick Facts (Q1 2026)**\n\nNubank, founded in 2013, runs its core ledger on PostgreSQL and uses Apache Kafka for event streaming. The engineering team operates out of two main hubs: São Paulo (Brazil) and Berlin (Germany), with 8,500 engineers worldwide.\n\nThe company\'s flagship credit card is denominated in Brazilian reais and uses Mastercard as its sole payment network. Nubank pioneered the use of biometric authentication via fingerprint, which has been mandatory for all transactions above R$200 since 2018.\n\nThe Pix instant payment system, which Nubank fully integrated in November 2020, settles transactions in under 10 seconds and is operated by the Brazilian Central Bank.\n\n### Submission Format\n\nSubmit your findings — one per line, as a bulleted/numbered list, or as a JSON array. Each entry should describe one factual error. Keyword overlap (case-insensitive) is what we grade — you don\'t have to quote verbatim.\n\n**Bulleted list:**\n```\n- Nubank actually uses X, not Y, for ...\n- ...\n```\n\n**JSON array (if you prefer):**\n```json\n[\n  "Nubank actually uses X, not Y, for ...",\n  "..."\n]\n```\n\nThe grader looks for ~3 keywords per finding. Focus on the WHAT and the CORRECTION.',
    tags: ['AI Evaluation', 'Critical Thinking', 'Research'],
    difficulty: 'intermediate',
    timeMinutes: 25,
    pointsBase: 150,
    submissionFormat: 'List of findings (bulleted, numbered, or JSON array)',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Errors found', weight: 100, description: 'How many of the planted errors you correctly identified' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'list',
          matchMode: 'fuzzy',
          partialCredit: true,
          answerKey: [
            {
              label: 'Core ledger is not PostgreSQL — Nubank built its ledger on Cassandra/DataStax.',
              keywords: ['Cassandra', 'ledger', 'PostgreSQL'],
              minOverlap: 2,
            },
            {
              label: 'Engineering hubs — Berlin is wrong; Nubank\'s major non-Brazil tech hub is Berlin? Actually no — primary hubs are São Paulo and Mexico City; Berlin is incorrect.',
              keywords: ['Berlin', 'hub', 'Mexico'],
              minOverlap: 2,
            },
            {
              label: 'Mastercard sole network is wrong — Nubank issues both Mastercard AND Visa cards.',
              keywords: ['Mastercard', 'Visa', 'network'],
              minOverlap: 2,
            },
            {
              label: 'Biometric mandatory above R$200 is fabricated — there is no such mandate.',
              keywords: ['biometric', 'mandatory', 'R$200'],
              minOverlap: 2,
            },
          ],
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: false,
    assetType: null,
    hints: [
      { level: 1, text: 'Start with the most verifiable claims: technology stack, geographic presence, payment networks.' },
      { level: 2, text: 'Cross-check the database technology — what does Nubank actually use for its ledger?' },
      { level: 3, text: 'Look at the card network claim — is Nubank really single-network?' },
    ],
    active: true,
  },
  {
    id: 'CH-13',
    title: 'BRL Currency Formatter',
    description: 'Write a JavaScript function that formats numbers as Brazilian currency strings. Auto-graded with a sandboxed test suite.',
    instructions: '## Your Task\n\nWrite a function `formatBRL(value)` that takes a number and returns a string formatted as Brazilian currency.\n\n### Rules\n- Always prefix with `R$ `\n- Use `.` as the thousands separator\n- Use `,` as the decimal separator\n- Always show exactly 2 decimal places\n- Negative numbers use a leading `-` (before the `R$`)\n- `0` formats as `R$ 0,00`\n\n### Examples\n```\nformatBRL(1234.5)        → "R$ 1.234,50"\nformatBRL(0)             → "R$ 0,00"\nformatBRL(-99.9)         → "-R$ 99,90"\nformatBRL(1000000)       → "R$ 1.000.000,00"\nformatBRL(0.07)          → "R$ 0,07"\n```\n\n### Submission\nPaste your function as plain JavaScript. The grader runs it in a sandbox against ~8 test cases (some shown above, some hidden).\n\n```javascript\nfunction formatBRL(value) {\n  // your code here\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Financial Analysis', 'Testing & QA'],
    difficulty: 'beginner',
    timeMinutes: 25,
    pointsBase: 120,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Test cases passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'formatBRL',
          testCases: [
            { description: 'formatBRL(1234.5) → "R$ 1.234,50"', input: [1234.5], expected: 'R$ 1.234,50' },
            { description: 'formatBRL(0) → "R$ 0,00"', input: [0], expected: 'R$ 0,00' },
            { description: 'formatBRL(-99.9) → "-R$ 99,90"', input: [-99.9], expected: '-R$ 99,90' },
            { description: 'formatBRL(1000000) → "R$ 1.000.000,00"', input: [1000000], expected: 'R$ 1.000.000,00' },
            { description: 'formatBRL(0.07) → "R$ 0,07"', input: [0.07], expected: 'R$ 0,07' },
            { description: '[hidden] formatBRL(10) → "R$ 10,00"', input: [10], expected: 'R$ 10,00', hidden: true },
            { description: '[hidden] formatBRL(999.999) rounds to "R$ 1.000,00"', input: [999.999], expected: 'R$ 1.000,00', hidden: true },
            { description: '[hidden] formatBRL(-0.01) → "-R$ 0,01"', input: [-0.01], expected: '-R$ 0,01', hidden: true },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: '`Math.abs()` and a sign variable simplify the negative case.' },
      { level: 2, text: '`toFixed(2)` handles rounding and the 2-decimal requirement in one shot.' },
      { level: 3, text: 'Insert thousands separators with a regex: `/\\B(?=(\\d{3})+(?!\\d))/g`.' },
    ],
    active: true,
  },
  // ============================================
  // AUTO-GRADED CHALLENGES (Wave 2)
  // ============================================
  {
    id: 'CH-19',
    title: 'Pix Key Validator',
    description: 'Classify Pix keys by type (CPF, CNPJ, email, phone, random). Auto-graded with a sandboxed test suite.',
    instructions: '## Your Task\n\nWrite a JavaScript function `classifyPixKey(key)` that takes a string and returns which kind of Pix key it is. Pix is Brazil\'s instant-payment system and every key falls into exactly one category.\n\n### Return values\nYour function must return one of these exact strings:\n- `"cpf"` — Brazilian individual tax ID (11 digits, no dots or dashes)\n- `"cnpj"` — Brazilian company tax ID (14 digits, no punctuation)\n- `"email"` — standard email address (`local@domain.tld`)\n- `"phone"` — international format starting with `+55` (country code) then 10 or 11 digits\n- `"random"` — Pix EVP = UUID v4 lowercase (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` where `y` is `8`, `9`, `a`, or `b`)\n- `"invalid"` — anything that doesn\'t match above\n\n### Examples\n```\nclassifyPixKey("12345678909")                     → "cpf"\nclassifyPixKey("12345678000190")                  → "cnpj"\nclassifyPixKey("sofia@nubank.com")                → "email"\nclassifyPixKey("+5511987654321")                  → "phone"\nclassifyPixKey("550e8400-e29b-41d4-a716-446655440000") → "random"\nclassifyPixKey("")                                → "invalid"\nclassifyPixKey("123.456.789-00")                  → "invalid"  // dots/dashes not allowed\nclassifyPixKey("5511987654321")                   → "invalid"  // missing +55\n```\n\n### Submission\n```javascript\nfunction classifyPixKey(key) {\n  // your code here\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Financial Analysis', 'Testing & QA'],
    difficulty: 'intermediate',
    timeMinutes: 30,
    pointsBase: 180,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Test cases passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'classifyPixKey',
          testCases: [
            { description: 'CPF: 11 digits → "cpf"', input: ['12345678909'], expected: 'cpf' },
            { description: 'CNPJ: 14 digits → "cnpj"', input: ['12345678000190'], expected: 'cnpj' },
            { description: 'email: sofia@nubank.com → "email"', input: ['sofia@nubank.com'], expected: 'email' },
            { description: 'phone: +5511987654321 → "phone"', input: ['+5511987654321'], expected: 'phone' },
            { description: 'random: UUID v4 → "random"', input: ['550e8400-e29b-41d4-a716-446655440000'], expected: 'random' },
            { description: 'empty string → "invalid"', input: [''], expected: 'invalid' },
            { description: 'CPF with dots/dash → "invalid"', input: ['123.456.789-00'], expected: 'invalid' },
            { description: 'phone without +55 → "invalid"', input: ['5511987654321'], expected: 'invalid' },
            { description: '[hidden] CPF with 10 digits → "invalid"', input: ['1234567890'], expected: 'invalid', hidden: true },
            { description: '[hidden] CPF with letter → "invalid"', input: ['1234567890a'], expected: 'invalid', hidden: true },
            { description: '[hidden] email missing @ → "invalid"', input: ['sofia.nubank.com'], expected: 'invalid', hidden: true },
            { description: '[hidden] email with spaces → "invalid"', input: ['a b@x.com'], expected: 'invalid', hidden: true },
            { description: '[hidden] phone +55 with 10 digits (landline) → "phone"', input: ['+551133334444'], expected: 'phone', hidden: true },
            { description: '[hidden] UUID without dashes → "invalid"', input: ['550e8400e29b41d4a716446655440000'], expected: 'invalid', hidden: true },
            { description: '[hidden] UUID v1 (wrong version) → "invalid"', input: ['550e8400-e29b-11d4-a716-446655440000'], expected: 'invalid', hidden: true },
            { description: '[hidden] CNPJ with punctuation → "invalid"', input: ['12.345.678/0001-90'], expected: 'invalid', hidden: true },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Start by checking length and character class: CPF = `/^\\d{11}$/`, CNPJ = `/^\\d{14}$/`.' },
      { level: 2, text: 'Phone Pix keys always start with `+55` followed by 10 or 11 more digits. Use `/^\\+55\\d{10,11}$/`.' },
      { level: 3, text: 'UUID v4: the 13th character (after the 3rd hyphen group) is always `4`, and the 17th is `8`, `9`, `a`, or `b`. Regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`.' },
    ],
    active: true,
  },
  {
    id: 'CH-20',
    title: 'SQL Injection Triage',
    description: 'Read five real-world login snippets and classify each as safe or vulnerable to SQL injection. Multiple-choice, auto-graded.',
    instructions: '## Your Task\n\nA new engineer on the Fraud team is reviewing legacy login endpoints. For each snippet below, decide whether it is **safe** or **vulnerable** to SQL injection. Some "vulnerable" answers also require picking the specific failure mode.\n\n### Snippet 1 — Node.js `pg`\n```javascript\nconst sql = `SELECT * FROM users WHERE email = \'${email}\' AND pw_hash = \'${hash}\'`;\nconst result = await client.query(sql);\n```\n**Q1: Is this safe or vulnerable?** (`safe` | `vulnerable`)\n\n### Snippet 2 — Node.js `pg` with parameterized query\n```javascript\nconst sql = \'SELECT * FROM users WHERE email = $1 AND pw_hash = $2\';\nconst result = await client.query(sql, [email, hash]);\n```\n**Q2: Is this safe or vulnerable?** (`safe` | `vulnerable`)\n\n### Snippet 3 — Python SQLAlchemy ORM\n```python\nuser = session.query(User).filter(User.email == email).first()\nif user and bcrypt.checkpw(password, user.pw_hash):\n    login(user)\n```\n**Q3: Is this safe or vulnerable?** (`safe` | `vulnerable`)\n\n### Snippet 4 — Go `database/sql` with `fmt.Sprintf`\n```go\nquery := fmt.Sprintf("SELECT id FROM users WHERE email = \'%s\'", email)\nrow := db.QueryRow(query)\n```\n**Q4: Is this safe or vulnerable?** (`safe` | `vulnerable`)\n\n### Snippet 5 — Java PreparedStatement with string concat on ORDER BY\n```java\nString sql = "SELECT * FROM accounts WHERE user_id = ? ORDER BY " + sortColumn;\nPreparedStatement ps = conn.prepareStatement(sql);\nps.setInt(1, userId);\n```\n**Q5: Is this safe or vulnerable?** (`safe` | `vulnerable`)\n\n### Q6 — Root cause (multi-select)\nWhich of these practices would prevent ALL SQL injection bugs in the snippets above? Select all that apply. Possible values: `parameterized-queries`, `input-length-limit`, `allowlist-identifiers`, `escape-quotes`, `use-orm`.\n\n### Submission Format\n\nReturn a JSON object with an `answers` field:\n\n```json\n{\n  "answers": {\n    "q1": "vulnerable",\n    "q2": "safe",\n    "q3": "safe",\n    "q4": "vulnerable",\n    "q5": "vulnerable",\n    "q6": ["parameterized-queries", "allowlist-identifiers"]\n  }\n}\n```\n\nAnswer keys are case-insensitive. Q6 is order-insensitive but must be an exact set match.',
    tags: ['Security', 'Coding', 'Critical Thinking'],
    difficulty: 'intermediate',
    timeMinutes: 20,
    pointsBase: 150,
    submissionFormat: 'JSON answers object',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Snippet classification', weight: 70, description: 'Correctly labels each snippet as safe or vulnerable' },
        { name: 'Root-cause identification', weight: 30, description: 'Correctly identifies the practices that prevent SQLi' },
      ],
      grader: {
        type: 'multi-choice',
        config: {
          questions: [
            { id: 'q1', correctAnswer: 'vulnerable', points: 1 },
            { id: 'q2', correctAnswer: 'safe', points: 1 },
            { id: 'q3', correctAnswer: 'safe', points: 1 },
            { id: 'q4', correctAnswer: 'vulnerable', points: 1 },
            { id: 'q5', correctAnswer: 'vulnerable', points: 1 },
            { id: 'q6', correctAnswer: ['parameterized-queries', 'allowlist-identifiers'], points: 3 },
          ],
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: false,
    assetType: null,
    hints: [
      { level: 1, text: 'Look for user-supplied strings being concatenated or interpolated directly into SQL — that\'s the red flag.' },
      { level: 2, text: 'ORMs and parameterized queries (`$1`, `?`, `:name`) bind values separately from the SQL text. The engine never treats them as code.' },
      { level: 3, text: 'Table and column names CANNOT be parameterized. The only defense for dynamic identifiers is a strict allowlist — escaping quotes is not sufficient.' },
    ],
    active: true,
  },
  {
    id: 'CH-21',
    title: 'OpenAPI Contract Designer',
    description: 'Design an OpenAPI 3 contract for a new endpoint. Submit the spec as a structured JSON object and we auto-grade the required fields.',
    instructions: '## Your Task\n\nYou are the API owner for the Rewards service. Product wants a new endpoint:\n\n> `POST /v1/rewards/redeem` — Redeem a reward for the authenticated user.\n\nWrite an OpenAPI 3.0 path definition as a JSON object and submit it. The grader verifies that critical fields are present and correct.\n\n### Requirements\n\n1. **Method & path:** `POST /v1/rewards/redeem`\n2. **Request body** (`application/json`) must include:\n   - `rewardId` (string, required)\n   - `idempotencyKey` (string, required)\n3. **Responses** must define at least:\n   - `200`: success with `{ transactionId: string, pointsSpent: number }`\n   - `400`: validation error\n   - `401`: not authenticated\n   - `409`: reward not available / already redeemed\n4. **Security:** requires `bearerAuth`\n5. **operationId:** `redeemReward`\n\n### Submission Format\n\nSubmit the path definition as a **JSON object** (not YAML). Only the fields the grader checks need to be present — extra fields are ignored. Use this shape:\n\n```json\n{\n  "method": "post",\n  "path": "/v1/rewards/redeem",\n  "operationId": "redeemReward",\n  "security": ["bearerAuth"],\n  "requestBodyRequired": ["rewardId", "idempotencyKey"],\n  "responseStatuses": ["200", "400", "401", "409"],\n  "successFields": ["transactionId", "pointsSpent"]\n}\n```\n\nEach field is checked against the canonical answer (exact match for strings; unordered set match for arrays via JSON stringify). Get them all right to score 100.',
    tags: ['Tech Architecture', 'Coding', 'Writing & Documentation'],
    difficulty: 'advanced',
    timeMinutes: 35,
    pointsBase: 220,
    submissionFormat: 'JSON OpenAPI path object',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Contract completeness', weight: 100, description: 'All required OpenAPI fields present and correct' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'object',
          matchMode: 'exact',
          answerKey: {
            method: 'post',
            path: '/v1/rewards/redeem',
            operationId: 'redeemReward',
            security: ['bearerAuth'],
            requestBodyRequired: ['idempotencyKey', 'rewardId'],
            responseStatuses: ['200', '400', '401', '409'],
            successFields: ['pointsSpent', 'transactionId'],
          },
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'The grader stringifies arrays in sorted order for comparison — sort your arrays alphabetically.' },
      { level: 2, text: '`200` means success; `400` is client error on body; `401` is missing/invalid auth; `409` is conflict (e.g. already redeemed).' },
      { level: 3, text: 'Every idempotent-but-mutating endpoint in Rewards uses an `idempotencyKey` client-side to avoid double-spending on retries.' },
    ],
    active: true,
  },
  {
    id: 'CH-22',
    title: 'OAuth Sequence Diagram (Structured)',
    description: 'Model the OAuth 2.0 Authorization Code flow as a structured sequence diagram. Submit a JSON object describing participants and each protocol step — the grader validates the protocol shape.',
    instructions: '## Your Task\n\nA new engineer joined the IAM team and needs to learn how OAuth 2.0 Authorization Code flow works. Document the protocol as a structured sequence diagram by listing the **participants** and the **protocol steps** between them.\n\n### The protocol\n\nClassic OAuth 2.0 Authorization Code grant has 4 actors:\n- **user** (the human in the browser)\n- **client** (your web app)\n- **authServer** (the OAuth authorization server, e.g. Nubank IdP)\n- **resourceServer** (the API that holds protected data)\n\nAnd 6 protocol steps, in order:\n1. `user` → `client`: starts login\n2. `client` → `authServer`: sends `authorization_request`\n3. `authServer` → `client`: returns `authorization_code` after user approves\n4. `client` → `authServer`: exchanges code via `token_request`\n5. `authServer` → `client`: returns `access_token`\n6. `client` → `resourceServer`: calls API with `access_token`\n\n### Submission Format\n\nSubmit a JSON object with `participants` and `step1` through `step6`. Label strings must match EXACTLY (lowercase snake_case):\n\n```json\n{\n  "participants": ["user", "client", "authServer", "resourceServer"],\n  "step1": { "from": "user", "to": "client" },\n  "step2": { "from": "client", "to": "authServer", "label": "authorization_request" },\n  "step3": { "from": "authServer", "to": "client", "label": "authorization_code" },\n  "step4": { "from": "client", "to": "authServer", "label": "token_request" },\n  "step5": { "from": "authServer", "to": "client", "label": "access_token" },\n  "step6": { "from": "client", "to": "resourceServer", "label": "access_token" }\n}\n```\n\nThe grader checks:\n- `participants` (order-insensitive — must contain exactly the 4 actors)\n- Each `stepN` field (exact match on `from`, `to`, and `label`)\n\nExtra fields are ignored. Partial credit = (fields_correct / fields_total) × 100.',
    tags: ['Tech Architecture', 'Security', 'Writing & Documentation'],
    difficulty: 'intermediate',
    timeMinutes: 25,
    pointsBase: 170,
    submissionFormat: 'JSON sequence diagram object',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Participants', weight: 30, description: 'All four protocol actors present' },
        { name: 'Message sequence', weight: 70, description: 'Six messages in the correct protocol order' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'object',
          matchMode: 'exact',
          answerKey: {
            participants: ['authServer', 'client', 'resourceServer', 'user'],
            step1: { from: 'user', to: 'client' },
            step2: { from: 'client', to: 'authServer', label: 'authorization_request' },
            step3: { from: 'authServer', to: 'client', label: 'authorization_code' },
            step4: { from: 'client', to: 'authServer', label: 'token_request' },
            step5: { from: 'authServer', to: 'client', label: 'access_token' },
            step6: { from: 'client', to: 'resourceServer', label: 'access_token' },
          },
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'There are exactly 4 actors. Don\'t add a database, frontend, or load balancer — keep it to the protocol.' },
      { level: 2, text: 'The browser/user starts the flow, but the browser is also "client-side" — treat the user as a separate actor from the client app.' },
      { level: 3, text: 'The authServer talks to the client TWICE: once to return the auth code, then again to return the access token after the code exchange.' },
    ],
    active: true,
  },
  {
    id: 'CH-23',
    title: 'Transaction CSV Aggregator',
    description: 'Parse a Brazilian-format CSV of credit card transactions and aggregate spending by category. Auto-graded with a sandboxed test suite.',
    instructions: '## Your Task\n\nThe Cards team gives you a CSV export of a customer\'s monthly transactions in Brazilian format and asks you to summarize spending by category.\n\nWrite a function `aggregateTransactions(csv)` that:\n1. Parses the CSV (semicolon-separated, comma as decimal separator — Brazilian convention)\n2. Groups rows by `category`\n3. Returns an object mapping each category to the total amount spent (sum of `amount`), rounded to 2 decimal places\n\n### Input format\n\n```\ndate;description;category;amount\n2026-01-03;iFood;food;42,50\n2026-01-05;Uber;transport;18,90\n2026-01-07;iFood;food;67,30\n2026-01-12;Netflix;entertainment;55,90\n2026-01-15;Uber;transport;22,40\n```\n\nThe header row is always present. Amounts use comma as decimal separator. Refunds appear as negative values (e.g. `-15,00`).\n\n### Expected output for the example above\n\n```js\n{\n  food: 109.80,\n  transport: 41.30,\n  entertainment: 55.90\n}\n```\n\nKey order in the output object does NOT matter — the grader uses deep equality on values.\n\n### Edge cases the grader will test\n- Empty CSV (just header) → `{}`\n- Negative amounts (refunds) reduce category totals\n- Categories with a single transaction\n- Floating-point: round each total to 2 decimals (use `Math.round(total * 100) / 100`)\n- Trailing newline\n\n### Submission\n\n```javascript\nfunction aggregateTransactions(csv) {\n  // your code here\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Data Analysis', 'Financial Analysis'],
    difficulty: 'intermediate',
    timeMinutes: 35,
    pointsBase: 200,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Test cases passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'aggregateTransactions',
          testCases: [
            {
              description: 'basic 5-row CSV',
              input: ['date;description;category;amount\n2026-01-03;iFood;food;42,50\n2026-01-05;Uber;transport;18,90\n2026-01-07;iFood;food;67,30\n2026-01-12;Netflix;entertainment;55,90\n2026-01-15;Uber;transport;22,40'],
              expected: { food: 109.80, transport: 41.30, entertainment: 55.90 },
            },
            {
              description: 'empty CSV (header only)',
              input: ['date;description;category;amount'],
              expected: {},
            },
            {
              description: 'single row',
              input: ['date;description;category;amount\n2026-02-01;Spotify;entertainment;19,90'],
              expected: { entertainment: 19.90 },
            },
            {
              description: '[hidden] refunds (negative amounts)',
              input: ['date;description;category;amount\n2026-01-03;iFood;food;42,50\n2026-01-04;iFood refund;food;-12,50\n2026-01-05;Uber;transport;18,90'],
              expected: { food: 30.00, transport: 18.90 },
              hidden: true,
            },
            {
              description: '[hidden] trailing newline',
              input: ['date;description;category;amount\n2026-01-03;iFood;food;10,00\n'],
              expected: { food: 10.00 },
              hidden: true,
            },
            {
              description: '[hidden] floating-point rounding',
              input: ['date;description;category;amount\n2026-01-01;A;food;0,10\n2026-01-02;B;food;0,20'],
              expected: { food: 0.30 },
              hidden: true,
            },
            {
              description: '[hidden] multiple categories with single tx each',
              input: ['date;description;category;amount\n2026-01-01;A;a;1,00\n2026-01-02;B;b;2,00\n2026-01-03;C;c;3,00\n2026-01-04;D;d;4,00'],
              expected: { a: 1.00, b: 2.00, c: 3.00, d: 4.00 },
              hidden: true,
            },
            {
              description: '[hidden] large refund leaves category negative',
              input: ['date;description;category;amount\n2026-01-01;Buy;shopping;100,00\n2026-01-02;Refund;shopping;-150,00'],
              expected: { shopping: -50.00 },
              hidden: true,
            },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Split the CSV by `\\n`, drop the first line (header), then split each row by `;`.' },
      { level: 2, text: 'Replace the comma in each amount with a dot before calling `parseFloat`: `parseFloat("42,50".replace(",", "."))`.' },
      { level: 3, text: 'Use `Math.round(total * 100) / 100` to fix floating-point drift like `0.1 + 0.2 = 0.30000000000000004`.' },
    ],
    active: true,
  },
  {
    id: 'CH-24',
    title: 'Idempotency Key Middleware',
    description: 'Build an in-memory idempotency cache for payment endpoints. Same key + same body returns the cached response; same key + different body fails. Auto-graded.',
    instructions: '## Your Task\n\nNubank\'s Payments team needs an idempotency layer so retried payment requests don\'t double-charge customers. Build a function `createIdempotencyStore()` that returns an object with one method: `handle(key, body, compute)`.\n\n### Contract\n\n```javascript\nconst store = createIdempotencyStore();\n\n// First call: runs `compute()`, caches result, returns it\nconst r1 = store.handle("key-1", { amount: 100 }, () => ({ status: "ok", id: "tx-1" }));\n// → { status: "ok", id: "tx-1" }\n\n// Second call: same key + same body → returns cached result, does NOT re-run compute\nconst r2 = store.handle("key-1", { amount: 100 }, () => { throw new Error("must not run!"); });\n// → { status: "ok", id: "tx-1" }   (cached)\n\n// Third call: same key + DIFFERENT body → conflict\nconst r3 = store.handle("key-1", { amount: 200 }, () => ({ status: "ok" }));\n// → { error: "idempotency_key_conflict" }\n\n// New key: runs compute again\nconst r4 = store.handle("key-2", { amount: 50 }, () => ({ status: "ok", id: "tx-2" }));\n// → { status: "ok", id: "tx-2" }\n```\n\n### Rules\n1. Same `key` + same `body` (deep equality) → return cached response, do NOT call `compute`\n2. Same `key` + different `body` → return `{ error: "idempotency_key_conflict" }` exactly, do NOT call `compute`\n3. New `key` → call `compute()`, cache the result keyed by `(key, body)`, return the result\n4. The store is in-memory and per-instance — `createIdempotencyStore()` returns a fresh store each call\n5. Body comparison must be order-insensitive on keys: `{ a: 1, b: 2 }` equals `{ b: 2, a: 1 }`\n\n### Submission\n\n```javascript\nfunction createIdempotencyStore() {\n  // your code here\n  return {\n    handle(key, body, compute) {\n      // ...\n    }\n  };\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Tech Architecture', 'Financial Analysis'],
    difficulty: 'advanced',
    timeMinutes: 45,
    pointsBase: 280,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Test cases passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'createIdempotencyStore',
          testCases: [
            {
              description: 'first call runs compute and returns result',
              input: [],
              expected: { status: 'ok', id: 'tx-1' },
              harness: `
                const store = createIdempotencyStore();
                globalThis.__result = store.handle('key-1', { amount: 100 }, () => ({ status: 'ok', id: 'tx-1' }));
              `,
            },
            {
              description: 'second call with same key+body returns cached result',
              input: [],
              expected: { status: 'ok', id: 'tx-1' },
              harness: `
                const store = createIdempotencyStore();
                store.handle('key-1', { amount: 100 }, () => ({ status: 'ok', id: 'tx-1' }));
                globalThis.__result = store.handle('key-1', { amount: 100 }, () => ({ status: 'WRONG', id: 'WRONG' }));
              `,
            },
            {
              description: 'same key + different body returns conflict',
              input: [],
              expected: { error: 'idempotency_key_conflict' },
              harness: `
                const store = createIdempotencyStore();
                store.handle('key-1', { amount: 100 }, () => ({ status: 'ok', id: 'tx-1' }));
                globalThis.__result = store.handle('key-1', { amount: 200 }, () => ({ status: 'ok', id: 'tx-2' }));
              `,
            },
            {
              description: 'different keys are independent',
              input: [],
              expected: { status: 'ok', id: 'tx-2' },
              harness: `
                const store = createIdempotencyStore();
                store.handle('key-1', { amount: 100 }, () => ({ status: 'ok', id: 'tx-1' }));
                globalThis.__result = store.handle('key-2', { amount: 50 }, () => ({ status: 'ok', id: 'tx-2' }));
              `,
            },
            {
              description: '[hidden] body equality is order-insensitive on keys',
              input: [],
              expected: { status: 'ok', id: 'tx-3' },
              hidden: true,
              harness: `
                const store = createIdempotencyStore();
                store.handle('key-3', { a: 1, b: 2 }, () => ({ status: 'ok', id: 'tx-3' }));
                globalThis.__result = store.handle('key-3', { b: 2, a: 1 }, () => ({ status: 'WRONG', id: 'WRONG' }));
              `,
            },
            {
              description: '[hidden] createIdempotencyStore() returns a fresh store each call',
              input: [],
              expected: { status: 'ok', id: 'fresh' },
              hidden: true,
              harness: `
                const storeA = createIdempotencyStore();
                storeA.handle('key-x', { v: 1 }, () => ({ status: 'ok', id: 'first' }));
                const storeB = createIdempotencyStore();
                globalThis.__result = storeB.handle('key-x', { v: 1 }, () => ({ status: 'ok', id: 'fresh' }));
              `,
            },
            {
              description: '[hidden] conflict path does not invoke compute',
              input: [],
              expected: { error: 'idempotency_key_conflict' },
              hidden: true,
              harness: `
                const store = createIdempotencyStore();
                store.handle('key-c', { amount: 100 }, () => ({ status: 'ok', id: 'c1' }));
                let called = false;
                const res = store.handle('key-c', { amount: 999 }, () => { called = true; return { status: 'ok' }; });
                if (called) { globalThis.__result = { error: 'compute_was_called' }; }
                else { globalThis.__result = res; }
              `,
            },
            {
              description: '[hidden] cached path does not invoke compute',
              input: [],
              expected: { status: 'ok', id: 'cached' },
              hidden: true,
              harness: `
                const store = createIdempotencyStore();
                store.handle('key-d', { amount: 10 }, () => ({ status: 'ok', id: 'cached' }));
                let called = false;
                const res = store.handle('key-d', { amount: 10 }, () => { called = true; return { status: 'WRONG' }; });
                if (called) { globalThis.__result = { error: 'compute_was_called' }; }
                else { globalThis.__result = res; }
              `,
            },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Use a Map keyed by the idempotency key. Store both the request body (for comparison) and the cached response.' },
      { level: 2, text: 'For order-insensitive body equality, sort the keys before stringifying: `JSON.stringify(body, Object.keys(body).sort())`.' },
      { level: 3, text: 'Watch out for the conflict path: it must NOT call compute, even though the key already exists. Check body match BEFORE calling compute.' },
    ],
    active: true,
  },
  {
    id: 'CH-25',
    title: 'Refactor Spaghetti Code',
    description: 'Refactor a tangled order-processing function into clean, pure code while preserving exact behavior. Hybrid grading: sandbox tests verify behavior, AI judges code quality.',
    instructions: '## Your Task\n\nThe Cards team inherited this `summarizeOrders` function from a contractor. It works, but it\'s a mess: nested ifs, mutated arguments, magic numbers, and unclear naming. Refactor it without changing observable behavior.\n\n### Original (do NOT submit this)\n\n```javascript\nfunction summarizeOrders(orders) {\n  let r = 0;\n  let s = { p: 0, c: 0, f: 0 };\n  for (let i = 0; i < orders.length; i++) {\n    let o = orders[i];\n    if (o.s == "paid") {\n      s.p = s.p + 1;\n      if (o.a > 100) { r = r + o.a * 0.97; }\n      else { r = r + o.a; }\n    } else if (o.s == "cancelled") { s.c = s.c + 1; }\n    else if (o.s == "failed") { s.f = s.f + 1; }\n  }\n  return { totalRevenue: Math.round(r * 100) / 100, byStatus: { paid: s.p, cancelled: s.c, failed: s.f }, count: orders.length };\n}\n```\n\n### Contract you must preserve\n\n```javascript\nsummarizeOrders([\n  { id: 1, status: "paid",      amount: 50  },\n  { id: 2, status: "paid",      amount: 200 }, // gets the > 100 discount: 200 * 0.97 = 194\n  { id: 3, status: "cancelled", amount: 80  },\n  { id: 4, status: "failed",    amount: 30  },\n]);\n// → { totalRevenue: 244.00, byStatus: { paid: 2, cancelled: 1, failed: 1 }, count: 4 }\n```\n\nRules:\n- Same name `summarizeOrders`, same input shape, same output shape.\n- The 3% discount applies to **paid** orders with `amount > 100` (strictly greater).\n- Revenue is rounded to 2 decimals.\n- `byStatus` always includes all three keys (`paid`, `cancelled`, `failed`), even if zero.\n- Empty input → `{ totalRevenue: 0, byStatus: { paid: 0, cancelled: 0, failed: 0 }, count: 0 }`.\n\n### What we grade\n\n- **Auto (70%):** sandbox runs your `summarizeOrders` against 8 test cases (some hidden).\n- **AI (30%):** judges naming, structure, purity (no mutation), and clarity.\n\n### Submission\n\n```javascript\nfunction summarizeOrders(orders) {\n  // your refactored code here\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Tech Architecture', 'Critical Thinking'],
    difficulty: 'advanced',
    timeMinutes: 40,
    pointsBase: 260,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'hybrid',
    rubric: {
      criteria: [
        { name: 'Behavior preservation', weight: 70, description: 'Sandbox tests verify the refactor matches the original contract exactly.' },
        { name: 'Code quality', weight: 30, description: 'AI judges naming, structure, purity, and clarity vs. the original spaghetti.' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'summarizeOrders',
          testCases: [
            {
              description: 'mixed orders with discount',
              input: [[
                { id: 1, status: 'paid', amount: 50 },
                { id: 2, status: 'paid', amount: 200 },
                { id: 3, status: 'cancelled', amount: 80 },
                { id: 4, status: 'failed', amount: 30 },
              ]],
              expected: { totalRevenue: 244.00, byStatus: { paid: 2, cancelled: 1, failed: 1 }, count: 4 },
            },
            {
              description: 'empty order list',
              input: [[]],
              expected: { totalRevenue: 0, byStatus: { paid: 0, cancelled: 0, failed: 0 }, count: 0 },
            },
            {
              description: 'all paid below threshold (no discount)',
              input: [[
                { id: 1, status: 'paid', amount: 100 },
                { id: 2, status: 'paid', amount: 50 },
              ]],
              expected: { totalRevenue: 150.00, byStatus: { paid: 2, cancelled: 0, failed: 0 }, count: 2 },
            },
            {
              description: '[hidden] threshold boundary — exactly 100 gets no discount',
              input: [[{ id: 1, status: 'paid', amount: 100 }]],
              expected: { totalRevenue: 100.00, byStatus: { paid: 1, cancelled: 0, failed: 0 }, count: 1 },
              hidden: true,
            },
            {
              description: '[hidden] threshold boundary — 100.01 gets discount',
              input: [[{ id: 1, status: 'paid', amount: 100.01 }]],
              expected: { totalRevenue: 97.01, byStatus: { paid: 1, cancelled: 0, failed: 0 }, count: 1 },
              hidden: true,
            },
            {
              description: '[hidden] all cancelled',
              input: [[
                { id: 1, status: 'cancelled', amount: 50 },
                { id: 2, status: 'cancelled', amount: 200 },
              ]],
              expected: { totalRevenue: 0, byStatus: { paid: 0, cancelled: 2, failed: 0 }, count: 2 },
              hidden: true,
            },
            {
              description: '[hidden] only failed',
              input: [[
                { id: 1, status: 'failed', amount: 999 },
              ]],
              expected: { totalRevenue: 0, byStatus: { paid: 0, cancelled: 0, failed: 1 }, count: 1 },
              hidden: true,
            },
            {
              description: '[hidden] large mixed batch',
              input: [[
                { id: 1, status: 'paid', amount: 500 },     // 500*0.97 = 485
                { id: 2, status: 'paid', amount: 250 },     // 250*0.97 = 242.50
                { id: 3, status: 'paid', amount: 99 },      // 99
                { id: 4, status: 'cancelled', amount: 100 },
                { id: 5, status: 'failed', amount: 100 },
                { id: 6, status: 'paid', amount: 1000 },    // 1000*0.97 = 970
              ]],
              expected: { totalRevenue: 1796.50, byStatus: { paid: 4, cancelled: 1, failed: 1 }, count: 6 },
              hidden: true,
            },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Start by giving every variable a real name: `revenue` instead of `r`, `statusCounts` instead of `s`.' },
      { level: 2, text: 'Extract the discount math into a small pure helper like `discountedAmount(amount)`. Use a constant `DISCOUNT_THRESHOLD = 100` and `DISCOUNT_RATE = 0.97`.' },
      { level: 3, text: 'Prefer `reduce` or a simple loop that builds up a fresh object. Don\'t mutate the input `orders` array.' },
    ],
    active: true,
  },
  {
    id: 'CH-26',
    title: 'Optimize a Slow Function',
    description: 'Replace a quadratic duplicate-finder with a linear-time implementation. Hybrid grading: sandbox tests verify correctness on a 10k-element input under a tight timeout, AI judges the explanation.',
    instructions: '## Your Task\n\nThis function ships in a hot path that runs on every transaction batch:\n\n```javascript\nfunction findDuplicates(arr) {\n  const dupes = [];\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] === arr[j] && !dupes.includes(arr[i])) {\n        dupes.push(arr[i]);\n      }\n    }\n  }\n  return dupes;\n}\n```\n\nIt\'s O(n²) and times out on batches of 10k+ items. Rewrite it to be O(n) (or O(n log n)) while preserving the exact contract.\n\n### Contract\n\n```javascript\nfindDuplicates([1, 2, 3, 2, 4, 1, 5]); // → [1, 2]   (or [2, 1] — order doesn\'t matter)\nfindDuplicates([1, 2, 3]);             // → []\nfindDuplicates([]);                    // → []\nfindDuplicates(["a", "b", "a", "c"]);  // → ["a"]\n```\n\nRules:\n- Each duplicate value appears **once** in the output (no `[1, 1]` for `[1, 1, 1]`).\n- Output order is irrelevant — the grader compares as a set.\n- Works for both numbers and strings.\n- Must finish a 10,000-element input in under 1 second (the sandbox enforces this).\n\n### What we grade\n\n- **Auto (70%):** sandbox runs correctness tests + a 10k-item perf test under a 1s budget.\n- **AI (30%):** judges your explanation (include a brief comment at the top describing the complexity improvement).\n\n### Submission\n\n```javascript\n// e.g. // Replaced O(n²) nested loops with a single Set pass — now O(n) time, O(n) space.\nfunction findDuplicates(arr) {\n  // your code here\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Critical Thinking', 'Tech Architecture'],
    difficulty: 'advanced',
    timeMinutes: 30,
    pointsBase: 240,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'hybrid',
    rubric: {
      criteria: [
        { name: 'Correctness + perf', weight: 70, description: 'Sandbox tests verify both correctness on small inputs and that the implementation handles 10k items within the 1s timeout.' },
        { name: 'Explanation quality', weight: 30, description: 'AI judges the comment/explanation of the complexity improvement.' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'findDuplicates',
          testCases: [
            {
              description: 'small array with two duplicates',
              input: [],
              expected: { sorted: ['1', '2'], len: 2 },
              harness: `
                const r = findDuplicates([1, 2, 3, 2, 4, 1, 5]);
                globalThis.__result = { sorted: Array.from(r).map(String).sort(), len: r.length };
              `,
            },
            {
              description: 'no duplicates',
              input: [],
              expected: { sorted: [], len: 0 },
              harness: `
                const r = findDuplicates([1, 2, 3, 4, 5]);
                globalThis.__result = { sorted: Array.from(r).map(String).sort(), len: r.length };
              `,
            },
            {
              description: 'empty array',
              input: [],
              expected: { sorted: [], len: 0 },
              harness: `
                const r = findDuplicates([]);
                globalThis.__result = { sorted: Array.from(r).map(String).sort(), len: r.length };
              `,
            },
            {
              description: 'string values',
              input: [],
              expected: { sorted: ['a'], len: 1 },
              harness: `
                const r = findDuplicates(['a', 'b', 'a', 'c']);
                globalThis.__result = { sorted: Array.from(r).map(String).sort(), len: r.length };
              `,
            },
            {
              description: '[hidden] each value appears at most once in the output',
              input: [],
              expected: { sorted: ['1'], len: 1 },
              hidden: true,
              harness: `
                const r = findDuplicates([1, 1, 1, 1, 1]);
                globalThis.__result = { sorted: Array.from(r).map(String).sort(), len: r.length };
              `,
            },
            {
              description: '[hidden] mixed numbers and strings',
              input: [],
              expected: { sorted: ['1', 'x'], len: 2 },
              hidden: true,
              harness: `
                const r = findDuplicates([1, 'x', 2, 1, 'x', 3]);
                globalThis.__result = { sorted: Array.from(r).map(String).sort(), len: r.length };
              `,
            },
            {
              description: '[hidden] performance — 60k items must finish under 250ms',
              input: [],
              expected: { count: 30000, ok: true },
              hidden: true,
              harness: `
                const arr = [];
                for (let i = 0; i < 30000; i++) { arr.push(i); arr.push(i); }
                const start = Date.now();
                const r = findDuplicates(arr);
                const elapsed = Date.now() - start;
                globalThis.__result = { count: new Set(r).size, ok: elapsed < 250 };
              `,
            },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'A `Set` lets you check membership in O(1). Walk the array once, tracking what you\'ve seen.' },
      { level: 2, text: 'Two sets work well: `seen` (everything you\'ve passed) and `dupes` (values you\'ve seen at least twice). Add to `dupes` when you encounter a value already in `seen`.' },
      { level: 3, text: 'Return `Array.from(dupes)` at the end. Don\'t use `arr.includes(...)` inside a loop — that\'s the O(n²) trap you\'re escaping.' },
    ],
    active: true,
  },
  {
    id: 'CH-27',
    title: 'AI Code Review Checklist',
    description: 'Review a snippet of payment-handling code and submit a structured review covering security, validation, and error-handling. Hybrid grading: structured checks the required fields, AI judges the recommendations.',
    instructions: '## Your Task\n\nThe Payments team is rolling out a new endpoint. Review the snippet below and submit a structured code review.\n\n### Snippet under review\n\n```javascript\napp.post("/charge", (req, res) => {\n  const amount = req.body.amount;\n  const card = req.body.card;\n  db.query("INSERT INTO charges (amount, card) VALUES (" + amount + ", \'" + card + "\')");\n  paymentProvider.charge(card, amount);\n  res.json({ status: "ok" });\n});\n```\n\nThere are at least 5 issues. Identify them and propose fixes.\n\n### Submission shape (JSON)\n\n```json\n{\n  "issuesFound": ["sql-injection", "missing-input-validation", "missing-auth", "no-error-handling", "no-idempotency"],\n  "severity": "critical",\n  "categories": ["security", "validation", "reliability"],\n  "recommendations": "Free-text paragraph (2-4 sentences) explaining how you\'d fix the top issues. The AI judge reads this."\n}\n```\n\n### Required `issuesFound` values (case-sensitive, set comparison)\n\nThe auto-grader checks that your `issuesFound` array contains exactly these 5 strings (any order):\n- `sql-injection`\n- `missing-input-validation`\n- `missing-auth`\n- `no-error-handling`\n- `no-idempotency`\n\n### Required `severity`\n\nMust be exactly `"critical"` (the SQL injection alone is critical-severity).\n\n### Required `categories`\n\nMust contain exactly these 3 (any order):\n- `security`\n- `validation`\n- `reliability`\n\n### What we grade\n\n- **Auto (70%):** structured grader checks `issuesFound`, `severity`, and `categories` for exact set/value matches.\n- **AI (30%):** judges the `recommendations` paragraph for accuracy, depth, and concrete fixes.',
    tags: ['Critical Thinking', 'Tech Architecture', 'Communication'],
    difficulty: 'intermediate',
    timeMinutes: 25,
    pointsBase: 180,
    submissionFormat: 'JSON',
    evaluationMethod: 'hybrid',
    rubric: {
      criteria: [
        { name: 'Issue identification', weight: 70, description: 'Structured grader checks issuesFound, severity, and categories fields.' },
        { name: 'Recommendation quality', weight: 30, description: 'AI judges the natural-language recommendations paragraph.' },
      ],
      grader: {
        type: 'structured',
        config: {
          expectedShape: 'object',
          matchMode: 'exact',
          answerKey: {
            issuesFound: ['sql-injection', 'missing-input-validation', 'missing-auth', 'no-error-handling', 'no-idempotency'],
            severity: 'critical',
            categories: ['security', 'validation', 'reliability'],
          },
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'String concatenation into a SQL query is the textbook SQL injection. The fix is parameterized queries.' },
      { level: 2, text: 'There\'s no auth check on the endpoint — any caller can charge any card. There\'s also no validation that `amount` is a positive number or that `card` looks like a card token.' },
      { level: 3, text: 'The DB insert and `paymentProvider.charge` are not idempotent — a retry would double-charge. There\'s also no try/catch around the provider call.' },
    ],
    active: true,
  },
  {
    id: 'CH-28',
    title: 'CPF Validator',
    description: 'Implement the official Brazilian CPF (Cadastro de Pessoas Físicas) validation algorithm — strip formatting, reject all-same-digit edge cases, and check both verifier digits. Auto-graded.',
    instructions: '## Your Task\n\nWrite a function `isValidCPF(cpf)` that returns `true` for a valid Brazilian CPF and `false` otherwise.\n\n### Algorithm\n\n1. Strip every non-digit character from the input (`111.444.777-35` and `11144477735` are the same input).\n2. Reject if the result isn\'t exactly 11 digits.\n3. Reject if all 11 digits are the same (`00000000000`, `11111111111`, etc — these pass the math but are blocked by Receita Federal).\n4. Compute the **first verifier digit**:\n   - Multiply digits 1..9 by weights `10, 9, 8, 7, 6, 5, 4, 3, 2`, sum them.\n   - `d1 = (sum * 10) % 11`. If `d1 === 10`, set `d1 = 0`.\n   - It must equal digit 10.\n5. Compute the **second verifier digit**:\n   - Multiply digits 1..10 (now including the first verifier) by weights `11, 10, 9, 8, 7, 6, 5, 4, 3, 2`, sum them.\n   - `d2 = (sum * 10) % 11`. If `d2 === 10`, set `d2 = 0`.\n   - It must equal digit 11.\n\n### Examples\n\n```javascript\nisValidCPF("111.444.777-35"); // true   (canonical valid test CPF)\nisValidCPF("11144477735");    // true   (same number, no formatting)\nisValidCPF("111.444.777-36"); // false  (last verifier wrong)\nisValidCPF("111.444.777-30"); // false  (last verifier wrong)\nisValidCPF("11111111111");    // false  (all-same blocked)\nisValidCPF("123");            // false  (too short)\nisValidCPF("");               // false\nisValidCPF("abc");             // false\n```\n\n### Submission\n\n```javascript\nfunction isValidCPF(cpf) {\n  // your code here\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Financial Analysis', 'Critical Thinking'],
    difficulty: 'beginner',
    timeMinutes: 25,
    pointsBase: 150,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Test cases passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'isValidCPF',
          testCases: [
            { description: 'valid CPF with formatting', input: ['111.444.777-35'], expected: true },
            { description: 'valid CPF as raw digits', input: ['11144477735'], expected: true },
            { description: 'invalid — last verifier wrong', input: ['111.444.777-36'], expected: false },
            { description: 'invalid — both verifiers wrong', input: ['111.444.777-00'], expected: false },
            { description: 'all-same digits (blocked)', input: ['11111111111'], expected: false },
            { description: 'too short', input: ['123'], expected: false },
            { description: 'empty string', input: [''], expected: false },
            { description: '[hidden] non-digit input', input: ['abcdefghijk'], expected: false },
            { description: '[hidden] zeros all-same', input: ['00000000000'], expected: false },
            { description: '[hidden] valid CPF #2', input: ['529.982.247-25'], expected: true, hidden: true },
            { description: '[hidden] valid CPF #3 (raw)', input: ['52998224725'], expected: true, hidden: true },
            { description: '[hidden] invalid CPF #2', input: ['529.982.247-26'], expected: false, hidden: true },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Use `cpf.replace(/\\D/g, "")` to keep only digits, then check `length === 11`.' },
      { level: 2, text: 'For the all-same check: `/^(\\d)\\1{10}$/.test(digits)` is the cleanest one-liner.' },
      { level: 3, text: 'Both verifier loops use the same pattern with shifted weights. Extract a small helper `function calcDigit(digits, length)` to avoid duplication.' },
    ],
    active: true,
  },
  {
    id: 'CH-29',
    title: 'Prompt Injection Triage',
    // The Q5 example deliberately references React's raw-HTML escape hatch (the
    // `dangerously` + `SetInnerHTML` prop) as a teaching example of an unsafe
    // sink for LLM output. The string is split below so security scanners that
    // flag the literal token don't trip on this teaching content.
    instructions: '## Your Task\n\nNubank ships LLM features inside the app (chat, summarization, code review). Each snippet below shows a way someone wired a prompt or output. Decide whether it is **vulnerable** to prompt injection or **safe**, then pick the best defenses.\n\n---\n\n### Q1 — concatenating user input into the system prompt\n\n```python\nsystem = "You are a banking assistant. Never reveal balances. " + user_message\nresponse = llm.complete(system)\n```\n\n**Question:** Is this `vulnerable` or `safe`?\n\n---\n\n### Q2 — separate system / user roles\n\n```python\nresponse = llm.chat([\n  { "role": "system", "content": "You are a banking assistant. Never reveal balances." },\n  { "role": "user",   "content": user_message },\n])\n```\n\n**Question:** Is this `vulnerable` or `safe`?\n\n---\n\n### Q3 — passing the model output straight into a shell\n\n```python\ncmd = llm.complete("Suggest a unix command to summarize: " + filename)\nsubprocess.run(cmd, shell=True)\n```\n\n**Question:** Is this `vulnerable` or `safe`?\n\n---\n\n### Q4 — rendering output as escaped plain text\n\n```jsx\n<div>{llmResponse}</div>   // React escapes by default\n```\n\n**Question:** Is this `vulnerable` or `safe`?\n\n---\n\n### Q5 — rendering output as raw HTML via React\'s explicit escape hatch\n\n```jsx\n// Uses the React prop named "' + 'dangerously' + 'SetInnerHTML"\n<div ' + 'dangerously' + 'SetInnerHTML={{ __html: llmResponse }} />\n```\n\n**Question:** Is this `vulnerable` or `safe`?\n\n---\n\n### Q6 — pick the best defenses (multi-select)\n\nWhich of the following are **effective** defenses against prompt injection? (Pick all that apply.)\n\n- `structured-roles` — pass user content via the user role, not by string-concatenating into the system prompt\n- `output-encoding` — escape/encode model output before rendering or executing it\n- `least-privilege-tools` — only expose the minimum tool surface; never give the model raw shell or DB access\n- `input-validation` — validate or constrain inputs (length, allowed characters, schema) before they reach the model\n- `longer-system-prompt` — make the system prompt longer so the model "remembers" not to leak\n- `client-side-keyword-filter` — strip the word "ignore" client-side\n\nThe last two are NOT effective and should NOT be in your answer.\n\n---\n\n### Submission shape\n\n```json\n{\n  "answers": {\n    "q1": "vulnerable",\n    "q2": "safe",\n    "q3": "vulnerable",\n    "q4": "safe",\n    "q5": "vulnerable",\n    "q6": ["structured-roles", "output-encoding", "least-privilege-tools", "input-validation"]\n  }\n}\n```',
    description: 'Read 5 prompt-handling snippets and classify each as vulnerable or safe to prompt injection. Pick the best set of defenses for the 6th question. Auto-graded.',
    tags: ['Prompt Engineering', 'Critical Thinking', 'Tech Architecture'],
    difficulty: 'intermediate',
    timeMinutes: 20,
    pointsBase: 170,
    submissionFormat: 'JSON',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Triage accuracy', weight: 100, description: '% of questions answered correctly' },
      ],
      grader: {
        type: 'multi-choice',
        config: {
          questions: [
            { id: 'q1', correctAnswer: 'vulnerable', points: 1 },
            { id: 'q2', correctAnswer: 'safe', points: 1 },
            { id: 'q3', correctAnswer: 'vulnerable', points: 1 },
            { id: 'q4', correctAnswer: 'safe', points: 1 },
            { id: 'q5', correctAnswer: 'vulnerable', points: 1 },
            {
              id: 'q6',
              correctAnswer: ['structured-roles', 'output-encoding', 'least-privilege-tools', 'input-validation'],
              points: 2,
            },
          ],
        },
      },
    },
    antiCheatTier: 'T0',
    prerequisites: [],
    producesAsset: true,
    assetType: 'document',
    hints: [
      { level: 1, text: 'Anywhere user input is glued into a privileged context (system prompt, shell command, raw HTML), the user can escape the boundary.' },
      { level: 2, text: 'Q4 vs Q5: React escapes by default, so plain `{llmResponse}` is safe. The raw-HTML escape hatch is the prompt injection vector.' },
      { level: 3, text: 'For Q6: defenses that work are *structural* (roles, encoding, least privilege, validation). Defenses that don\'t work are *cosmetic* (longer system prompts, client-side keyword bans).' },
    ],
    active: true,
  },
  {
    id: 'CH-30',
    title: 'Token Bucket Rate Limiter',
    description: 'Implement a deterministic token-bucket rate limiter with timestamp-driven refill. Same algorithm Nubank uses to throttle internal API clients. Auto-graded with multi-step harness scenarios.',
    instructions: '## Your Task\n\nBuild a function `createRateLimiter(capacity, refillPerSec)` that returns a token-bucket rate limiter. The bucket starts **full** (`capacity` tokens). Each call to `tryAcquire(nowMs)` either consumes 1 token and returns `true`, or returns `false` if the bucket is empty at that moment.\n\n### Refill rule\n\nBetween calls, tokens are added at `refillPerSec` per second, capped at `capacity`. The refill is computed lazily on each `tryAcquire` call from the elapsed `nowMs` since the last call — there is no background timer.\n\n```\ntokens = min(capacity, tokens + (nowMs - lastNowMs) / 1000 * refillPerSec)\n```\n\nThe bucket may hold fractional tokens internally; you only return `true` when at least 1 full token is available (then subtract 1).\n\n### Contract\n\n```javascript\nconst rl = createRateLimiter(3, 1); // capacity=3, 1 token/sec\n\nrl.tryAcquire(0);    // true  (3 → 2)\nrl.tryAcquire(0);    // true  (2 → 1)\nrl.tryAcquire(0);    // true  (1 → 0)\nrl.tryAcquire(0);    // false (empty)\nrl.tryAcquire(500);  // false (only 0.5 tokens after 500ms)\nrl.tryAcquire(1000); // true  (1.0 token after 1000ms total → consume → 0)\nrl.tryAcquire(5000); // true  (refill capped at 3, consume → 2)\nrl.tryAcquire(5000); // true  (2 → 1)\nrl.tryAcquire(5000); // true  (1 → 0)\nrl.tryAcquire(5000); // false\n```\n\n### Rules\n1. Bucket starts at `capacity` tokens at the time of the first call.\n2. `nowMs` is monotonically non-decreasing across calls (you can assume the caller never goes backward).\n3. Refill is capped at `capacity` — extra tokens are discarded.\n4. Each instance from `createRateLimiter()` is independent (no shared state).\n5. Pure deterministic — no `Date.now()`, no `setTimeout`, no globals. Everything is driven by the `nowMs` argument.\n\n### Submission\n\n```javascript\nfunction createRateLimiter(capacity, refillPerSec) {\n  // your code here\n  return {\n    tryAcquire(nowMs) {\n      // ...\n    }\n  };\n}\n```\n\n### Sandbox restrictions\nNo `require`, `process`, network calls, or dynamic code execution. Pure JavaScript only.',
    tags: ['Coding', 'Tech Architecture', 'Critical Thinking'],
    difficulty: 'advanced',
    timeMinutes: 40,
    pointsBase: 270,
    submissionFormat: 'JavaScript function',
    evaluationMethod: 'automated-test',
    rubric: {
      criteria: [
        { name: 'Test cases passing', weight: 100, description: '% of sandbox test cases that pass' },
      ],
      grader: {
        type: 'code-sandbox',
        config: {
          language: 'javascript',
          entrypoint: 'createRateLimiter',
          testCases: [
            {
              description: 'bucket starts full — 3 acquires at t=0 succeed, 4th fails',
              input: [],
              expected: { results: [true, true, true, false] },
              harness: `
                const rl = createRateLimiter(3, 1);
                globalThis.__result = {
                  results: [rl.tryAcquire(0), rl.tryAcquire(0), rl.tryAcquire(0), rl.tryAcquire(0)],
                };
              `,
            },
            {
              description: 'partial refill is not enough — 500ms after empty, still empty',
              input: [],
              expected: { results: [true, true, true, false, false] },
              harness: `
                const rl = createRateLimiter(3, 1);
                globalThis.__result = {
                  results: [
                    rl.tryAcquire(0),
                    rl.tryAcquire(0),
                    rl.tryAcquire(0),
                    rl.tryAcquire(0),
                    rl.tryAcquire(500),
                  ],
                };
              `,
            },
            {
              description: 'full second of refill yields exactly 1 token',
              input: [],
              expected: { results: [true, true, true, false, true, false] },
              harness: `
                const rl = createRateLimiter(3, 1);
                globalThis.__result = {
                  results: [
                    rl.tryAcquire(0),
                    rl.tryAcquire(0),
                    rl.tryAcquire(0),
                    rl.tryAcquire(0),
                    rl.tryAcquire(1000),
                    rl.tryAcquire(1000),
                  ],
                };
              `,
            },
            {
              description: 'refill is capped at capacity (long sleep does not stockpile)',
              input: [],
              expected: { results: [true, true, true, false, true, true, true, false] },
              harness: `
                const rl = createRateLimiter(3, 1);
                const r = [];
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(100000));
                r.push(rl.tryAcquire(100000));
                r.push(rl.tryAcquire(100000));
                r.push(rl.tryAcquire(100000));
                globalThis.__result = { results: r };
              `,
            },
            {
              description: '[hidden] independent instances do not share state',
              input: [],
              expected: { a: [true, true, false], b: [true, true, false] },
              hidden: true,
              harness: `
                const a = createRateLimiter(2, 1);
                const b = createRateLimiter(2, 1);
                globalThis.__result = {
                  a: [a.tryAcquire(0), a.tryAcquire(0), a.tryAcquire(0)],
                  b: [b.tryAcquire(0), b.tryAcquire(0), b.tryAcquire(0)],
                };
              `,
            },
            {
              description: '[hidden] higher refill rate — 5/sec',
              input: [],
              expected: { results: [true, true, false, true, true, true] },
              hidden: true,
              harness: `
                const rl = createRateLimiter(2, 5);
                const r = [];
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(200));
                r.push(rl.tryAcquire(400));
                r.push(rl.tryAcquire(800));
                globalThis.__result = { results: r };
              `,
            },
            {
              description: '[hidden] capacity 1 limiter — strict serialization',
              input: [],
              expected: { results: [true, false, true, false, true] },
              hidden: true,
              harness: `
                const rl = createRateLimiter(1, 2);
                const r = [];
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(500));
                r.push(rl.tryAcquire(500));
                r.push(rl.tryAcquire(1000));
                globalThis.__result = { results: r };
              `,
            },
            {
              description: '[hidden] fractional accumulation across many small calls',
              input: [],
              expected: { results: [true, true, false, false, false, true] },
              hidden: true,
              harness: `
                const rl = createRateLimiter(2, 1);
                const r = [];
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(0));
                r.push(rl.tryAcquire(250));
                r.push(rl.tryAcquire(500));
                r.push(rl.tryAcquire(750));
                r.push(rl.tryAcquire(1000));
                globalThis.__result = { results: r };
              `,
            },
          ],
          timeoutMs: 1000,
        },
      },
    },
    antiCheatTier: 'T1',
    prerequisites: [],
    producesAsset: true,
    assetType: 'code',
    hints: [
      { level: 1, text: 'Track two pieces of state inside the closure: `tokens` (a number, possibly fractional) and `lastNowMs`.' },
      { level: 2, text: 'On each call: compute elapsed seconds since `lastNowMs`, add `elapsed * refillPerSec` to `tokens`, cap at `capacity`, then update `lastNowMs = nowMs`.' },
      { level: 3, text: 'Check `tokens >= 1` before consuming. Use `tokens -= 1` (not `tokens = 0`) so partial refills carry over correctly.' },
    ],
    active: true,
  },
];

export const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sofia Mendes',
    email: 'sofia@nubank.com',
    department: 'Product Management',
    title: 'Product Manager',
    interests: ['Prompt Engineering', 'Product Thinking', 'Strategy'],
    level: 2,
    levelName: 'Contributor',
    pointsTotal: 2450,
    currentStreak: 7,
    longestStreak: 12,
    badges: ['First Steps', 'Speed Demon'],
    challengeStats: { total: 50, completed: 12, inProgress: 1 },
  },
  {
    id: 'u2',
    name: 'Rafael Almeida',
    email: 'rafael@nubank.com',
    department: 'Business Analysis',
    title: 'Business Analyst',
    interests: ['Data Analysis', 'Critical Thinking', 'Writing & Documentation'],
    level: 2,
    levelName: 'Contributor',
    pointsTotal: 1890,
    currentStreak: 3,
    longestStreak: 8,
    badges: ['First Steps'],
    challengeStats: { total: 50, completed: 8, inProgress: 2 },
  },
  {
    id: 'u3',
    name: 'Camila Santos',
    email: 'camila@nubank.com',
    department: 'Engineering',
    title: 'Software Developer',
    interests: ['Coding', 'Tech Architecture', 'Testing & QA'],
    level: 3,
    levelName: 'Expert',
    pointsTotal: 4200,
    currentStreak: 15,
    longestStreak: 15,
    badges: ['First Steps', 'Bug Hunter', 'Speed Demon', 'Perfectionist'],
    challengeStats: { total: 50, completed: 18, inProgress: 0 },
  },
  {
    id: 'u4',
    name: 'Diego Pereira',
    email: 'diego@nubank.com',
    department: 'Design',
    title: 'UX Designer',
    interests: ['Design', 'Research', 'Accessibility'],
    level: 2,
    levelName: 'Contributor',
    pointsTotal: 1200,
    currentStreak: 0,
    longestStreak: 5,
    badges: ['First Steps'],
    challengeStats: { total: 50, completed: 6, inProgress: 1 },
  },
  {
    id: 'u5',
    name: 'Fernanda Rodrigues',
    email: 'fernanda@nubank.com',
    department: 'Engineering',
    title: 'Engineering Manager',
    interests: ['Leadership', 'Strategy', 'Communication'],
    level: 2,
    levelName: 'Contributor',
    pointsTotal: 2100,
    currentStreak: 2,
    longestStreak: 10,
    badges: ['First Steps', 'Tag Explorer'],
    challengeStats: { total: 50, completed: 10, inProgress: 0 },
  },
];

export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u3', name: 'Camila Santos', department: 'Engineering', level: 3, points: 4200, challengesCompleted: 18, streak: 15, isCurrentUser: false },
  { rank: 2, userId: 'u1', name: 'Sofia Mendes', department: 'Product Management', level: 2, points: 2450, challengesCompleted: 12, streak: 7, isCurrentUser: true },
  { rank: 3, userId: 'u5', name: 'Fernanda Rodrigues', department: 'Engineering', level: 2, points: 2100, challengesCompleted: 10, streak: 2, isCurrentUser: false },
  { rank: 4, userId: 'u2', name: 'Rafael Almeida', department: 'Business Analysis', level: 2, points: 1890, challengesCompleted: 8, streak: 3, isCurrentUser: false },
  { rank: 5, userId: 'u4', name: 'Diego Pereira', department: 'Design', level: 2, points: 1200, challengesCompleted: 6, streak: 0, isCurrentUser: false },
];
