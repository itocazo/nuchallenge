# NuChallenge: AI Learning & Onboarding Challenge Platform

## Comprehensive Product Requirements Document (PRD)

**Version:** 2.0
**Date:** March 29, 2026
**Status:** Final Draft — Ready for Engineering
**Codename:** NuChallenge
**Parent Project:** Mission Marketplace (Operon Whitepaper)

---

## Table of Contents

1. [Product Overview](#section-1-product-overview)
2. [Challenge Design](#section-2-challenge-design-the-core)
3. [Evaluation Engine](#section-3-evaluation-engine-design)
4. [Navigation, Discovery & Progression](#section-4-navigation-discovery--progression)
5. [Points & Gamification](#section-5-points--gamification)
6. [User Roles & Permissions](#section-6-user-roles--permissions)
7. [Technical Architecture](#section-7-technical-architecture)
8. [UI/UX Design Direction](#section-8-uiux-design-direction)
9. [Implementation Roadmap](#section-9-implementation-roadmap)
10. [Risk Assessment](#section-10-risk-assessment)

---

## SECTION 1: Product Overview

### 1.1 Vision

NuChallenge transforms AI tool onboarding at Nubank from passive training into active, measured skill-building through structured challenges. Instead of watching videos or reading docs, employees prove competence by doing real work -- writing prompts, analyzing data, reviewing AI outputs, building automations -- and receiving immediate, rigorous evaluation.

### 1.2 Mission

Ensure every Nubank employee across PM, BA, Dev, Designer, and Manager roles can effectively use AI tools within 30 days of onboarding, and continuously deepen those skills over time, with verifiable proof of competence.

### 1.3 Problem Statement

Nubank has invested in AI tooling (GitHub Copilot, internal LLM access, analytics copilots) but adoption is uneven. Current onboarding consists of documentation and optional workshops. There is no way to measure whether employees can actually use AI effectively in their role-specific contexts. The gap between "has access to AI tools" and "uses AI tools productively" is the coordination problem NuChallenge solves.

### 1.4 Target Users and Personas

| Persona | Role | Archetype | Primary Goal |
|---------|------|-----------|-------------|
| **Sofia** | Product Manager (2 yrs) | AI-curious PM | Learn to use AI for PRDs, research synthesis, prioritization frameworks |
| **Rafael** | Business Analyst (new hire) | Data-fluent BA | Quickly prove competence with AI-assisted data analysis and requirement writing |
| **Camila** | Software Developer (3 yrs) | Copilot skeptic | Understand where AI coding assistants help and where they hallucinate |
| **Diego** | UX Designer (1 yr) | Creative explorer | Use AI for design research, copy generation, accessibility audits |
| **Fernanda** | Engineering Manager (5 yrs) | Efficiency leader | Evaluate AI impact on team velocity, learn to review AI-assisted work |

### 1.5 Success Metrics and KPIs

**Primary KPIs (first 6 months):**
- 80% of new hires complete their role-specific beginner track within first 2 weeks
- 60% of all employees attempt at least one challenge within first quarter
- Average challenge quality score (AI-evaluated) above 70/100
- Less than 5% successful cheating rate on medium+ challenges (measured via statistical analysis of submission patterns)

**Secondary KPIs:**
- Time-to-first-challenge-completion under 25 minutes for beginners
- 40% of employees progress beyond beginner track within 60 days
- Net Promoter Score for the platform above 40
- 90% uptime for evaluation services

**Lagging KPIs:**
- Measurable increase in AI tool usage across the organization (Copilot acceptance rates, LLM API usage per employee)
- Reduction in "AI support tickets" as employees self-serve through challenge-learned skills
- Manager-reported improvement in AI-assisted work quality

---

---

## SECTION 2: Challenge Design (THE CORE)

### 2.1 Design Philosophy

Every challenge follows three principles:

1. **Practical over theoretical.** Challenges simulate real work scenarios, not abstract exercises.
2. **Progressive scaffolding.** Each challenge builds on assets or skills from a prior challenge, creating a portfolio of real work products.
3. **Anti-copypaste by design.** Medium+ challenges are structurally resistant to "paste the instructions into ChatGPT and submit the output." They require iteration, contextual judgment, or work on artifacts the challenger previously created.

### 2.2 Tag-Based Classification (Not Role-Based)

**Key design decision:** Challenges are NOT organized by job family (PM, Dev, Designer, etc.). Instead, each challenge is tagged with 2-4 skill tags that describe the TYPE OF WORK involved. Any employee from any area can take any challenge based on their interest and growth goals.

This means:
- A developer interested in strategy can take strategy-tagged challenges
- A PM who wants to learn coding can take coding-tagged challenges  
- A designer curious about data analysis can filter for those challenges
- There are no gatekeepers — the user decides what is valuable to them

## PART 1: FINAL TAG TAXONOMY (22 Tags)

Each tag describes the **type of work** involved, not who should do it. Any employee selects challenges based on interest.

| # | Tag Name | Icon Suggestion | Description |
|---|----------|----------------|-------------|
| 1 | **Prompt Engineering** | `Sparkles` | Crafting, iterating, and optimizing prompts to get high-quality AI outputs |
| 2 | **AI Evaluation** | `ScanSearch` | Assessing AI-generated content for accuracy, bias, hallucinations, and quality |
| 3 | **Coding** | `Code` | Writing, reviewing, debugging, or refactoring software code |
| 4 | **Data Analysis** | `BarChart3` | Analyzing datasets, querying databases, interpreting quantitative results |
| 5 | **Writing & Documentation** | `FileText` | Producing structured documents -- specs, reports, memos, guides |
| 6 | **Communication** | `MessageSquare` | Crafting audience-specific messages, presentations, and stakeholder updates |
| 7 | **Critical Thinking** | `Brain` | Evaluating arguments, spotting flaws, reasoning through ambiguous problems |
| 8 | **Research** | `Search` | Gathering, synthesizing, and summarizing information from multiple sources |
| 9 | **Product Thinking** | `Lightbulb` | Defining user needs, prioritizing features, shaping product direction |
| 10 | **Strategy** | `Target` | Setting goals, making trade-offs, building long-term plans |
| 11 | **Design** | `Palette` | Creating visual layouts, interaction patterns, and user experience solutions |
| 12 | **Process Design** | `GitBranch` | Mapping workflows, designing processes, optimizing operational sequences |
| 13 | **Financial Analysis** | `DollarSign` | Building business cases, ROI models, cost-benefit analyses |
| 14 | **Tech Architecture** | `Server` | Designing system components, APIs, infrastructure, and technical blueprints |
| 15 | **Security** | `Shield` | Identifying vulnerabilities, assessing risks, applying security best practices |
| 16 | **Testing & QA** | `CheckCircle` | Writing tests, validating quality, ensuring acceptance criteria are met |
| 17 | **Leadership** | `Users` | Planning capacity, managing change, guiding teams, making decisions |
| 18 | **Collaboration** | `Handshake` | Working across disciplines, giving and receiving feedback, co-creating |
| 19 | **Teaching** | `GraduationCap` | Explaining concepts, creating learning materials, mentoring others |
| 20 | **Accessibility** | `Eye` | Evaluating and improving inclusivity and accessibility of digital products |
| 21 | **Problem Solving** | `Puzzle` | Structuring ambiguous problems, generating options, proposing solutions |
| 22 | **Critical Review** | `ClipboardCheck` | Systematically reviewing artifacts for completeness, correctness, and quality |

**Design rationale**: 22 tags provides enough granularity to differentiate challenges meaningfully (2-4 tags per challenge creates 7,000+ possible combinations) without overwhelming users. Tags describe *activities* not *roles*, so a designer who likes data can filter by Data Analysis, and an engineer who likes strategy can filter by Strategy.

---

### 2.3 Anti-Cheating Framework

Four tiers of anti-cheating, applied based on difficulty:

| Tier | Mechanism | Applied To |
|------|-----------|-----------|
| **T0 - None** | Challenge is intentionally solvable with AI. The point is learning to use AI effectively. | Beginner |
| **T1 - Context-dependent** | Challenge references the user's own prior submissions, team data, or randomized scenario variants. Copy-pasting instructions produces generic output that fails evaluation. | Intermediate |
| **T2 - Iterative** | Challenge requires multiple rounds of refinement based on AI-generated feedback. Single-shot submissions are rejected. The evaluator checks for meaningful evolution across iterations. | Advanced |
| **T3 - Adversarial** | Challenge includes planted errors, hallucinations, or traps. Success requires catching them. AI tools would reproduce or miss the same errors. | Expert |

### 2.4 The 50 Challenges

## PART 2: ALL 50 CHALLENGES (Redesigned)

### CH-01: Your First AI-Assisted PRD
- **Difficulty:** Beginner | **Time:** 30 min | **Points:** 100
- **Tags:** `Prompt Engineering` `Writing & Documentation` `Product Thinking`
- **Prerequisites:** None
- **Description:** Write a 1-page product requirements document for a given feature using AI assistance. You will receive a feature brief and must produce a structured PRD that includes problem statement, user stories, success metrics, and scope boundaries. The AI helps draft -- you edit, refine, and own the final output.
- **Submission:** PDF or Markdown PRD (max 1 page)
- **Evaluation:** Rubric: Completeness (25%), Clarity (25%), Feasibility (25%), Original thinking beyond AI output (25%)
- **Anti-cheating:** Prompt log required; evaluators compare raw AI output vs final submission to verify human refinement
- **Asset produced:** PRD document (used in CH-03, CH-07)

### CH-02: User Story Decomposition
- **Difficulty:** Beginner | **Time:** 25 min | **Points:** 80
- **Tags:** `Prompt Engineering` `Product Thinking` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Given a feature brief, use AI to generate a set of user stories, then edit them for clarity, completeness, and proper INVEST criteria. The challenge tests your ability to critically evaluate AI-generated user stories and improve them with domain knowledge.
- **Submission:** Edited user story set with annotations explaining each change
- **Evaluation:** Story quality (INVEST compliance), edit quality, rationale depth
- **Anti-cheating:** Change-tracking required showing original vs edited versions
- **Asset produced:** User story set (used in CH-04, CH-06)

### CH-03: PRD Peer Review with AI
- **Difficulty:** Intermediate | **Time:** 40 min | **Points:** 200
- **Tags:** `Critical Review` `AI Evaluation` `Writing & Documentation`
- **Prerequisites:** CH-01 (uses another challenger's PRD)
- **Description:** Review a PRD submitted by another challenger. Use AI to help identify gaps, but provide your own judgment on quality, feasibility, and completeness. Produce a structured review with actionable feedback.
- **Submission:** Review document with scored rubric and written feedback
- **Evaluation:** Feedback quality, identification of real issues, constructiveness
- **Anti-cheating:** Cross-referenced with reviewed PRD; evaluators check that feedback is specific and contextual, not generic AI boilerplate
- **Asset produced:** Review document

### CH-04: Prioritization Framework Battle
- **Difficulty:** Intermediate | **Time:** 45 min | **Points:** 250
- **Tags:** `Critical Thinking` `Product Thinking` `Strategy`
- **Prerequisites:** CH-02 (uses user stories as input)
- **Description:** Given a set of user stories, apply three prioritization frameworks (RICE, MoSCoW, and Value-Effort) and compare results. Explain where frameworks agree, where they diverge, and recommend a final priority order with reasoning.
- **Submission:** Comparative prioritization matrix with written analysis
- **Evaluation:** Correct framework application (30%), insight quality (40%), recommendation strength (30%)
- **Anti-cheating:** Must reference specific user stories by ID; evaluators verify reasoning chain is internally consistent
- **Asset produced:** Prioritized backlog

### CH-05: Spot the Hallucination -- Market Analysis
- **Difficulty:** Intermediate | **Time:** 35 min | **Points:** 200
- **Tags:** `AI Evaluation` `Critical Thinking` `Research`
- **Prerequisites:** None
- **Description:** You receive an AI-generated market analysis with 5 planted factual errors (hallucinations). Find all 5, explain why each is wrong, and provide the correct information with sources.
- **Submission:** Annotated document with corrections and source citations
- **Evaluation:** Errors found (50%), quality of corrections (30%), source reliability (20%)
- **Anti-cheating:** Errors are unique per challenge instance (randomized from a pool); time-stamped submission prevents sharing answers
- **Asset produced:** Corrected analysis

### CH-06: Sprint Planning Simulation
- **Difficulty:** Advanced | **Time:** 60 min | **Points:** 350
- **Tags:** `Process Design` `Problem Solving` `Product Thinking` `Strategy`
- **Prerequisites:** CH-02 (uses user stories), CH-04 (uses prioritized backlog)
- **Description:** Given a prioritized backlog, team capacity constraints, and technical dependencies, plan a 2-week sprint. Balance velocity, risk, and stakeholder expectations. Justify inclusion/exclusion of each story.
- **Submission:** Sprint plan with capacity allocation, risk assessment, and justification document
- **Evaluation:** Feasibility (30%), constraint handling (30%), communication clarity (20%), trade-off reasoning (20%)
- **Anti-cheating:** Capacity constraints are randomized per instance; evaluators verify math consistency
- **Asset produced:** Sprint plan

### CH-07: Stakeholder Communication Generator
- **Difficulty:** Advanced | **Time:** 45 min | **Points:** 300
- **Tags:** `Communication` `Prompt Engineering` `Writing & Documentation`
- **Prerequisites:** CH-01 (uses PRD as source material)
- **Description:** Take a PRD and create 3 audience-specific communications: (1) executive summary for leadership, (2) technical brief for engineering teams, (3) customer-facing announcement draft. Use AI to help draft, then tailor each for tone, detail level, and purpose.
- **Submission:** Three communication documents with a brief note on adaptation strategy
- **Evaluation:** Audience appropriateness (40%), content accuracy (30%), tone and clarity (30%)
- **Anti-cheating:** Prompt log required; evaluators compare AI drafts vs final to verify human adaptation
- **Asset produced:** Communication package

### CH-08: AI-Assisted Retrospective Analysis
- **Difficulty:** Advanced | **Time:** 50 min | **Points:** 300
- **Tags:** `AI Evaluation` `Critical Thinking` `Data Analysis`
- **Prerequisites:** None
- **Description:** Analyze sprint results data using AI assistance, but identify and correct where the AI introduces confirmation bias or misinterprets metrics. Produce an unbiased retrospective with actionable improvements.
- **Submission:** Retrospective document with flagged AI biases and corrected analysis
- **Evaluation:** Bias identification (30%), analysis depth (30%), actionability of improvements (40%)
- **Anti-cheating:** Dataset contains known bias traps; evaluators check whether specific traps were identified
- **Asset produced:** Retrospective analysis

### CH-09: OKR Drafting with AI Critique
- **Difficulty:** Expert | **Time:** 60 min | **Points:** 450
- **Tags:** `Strategy` `Prompt Engineering` `Critical Thinking` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Draft a set of OKRs for a given business scenario, then use AI as a critic to stress-test them. Iterate at least 3 times based on AI feedback, documenting how you improved each round. Final OKRs must be measurable, ambitious, and aligned to the scenario.
- **Submission:** Final OKRs plus iteration log showing all 3 rounds of refinement
- **Evaluation:** OKR quality (30%), iteration depth (30%), critical engagement with AI feedback (40%)
- **Anti-cheating:** Iteration logs must show substantive changes (not just cosmetic); evaluators verify progression
- **Asset produced:** OKR set

### CH-10: Product Strategy Memo
- **Difficulty:** Expert | **Time:** 90 min | **Points:** 600
- **Tags:** `Strategy` `Writing & Documentation` `Research` `Product Thinking`
- **Prerequisites:** CH-01, CH-09 (capstone -- uses PRD and OKRs)
- **Description:** Write a comprehensive product strategy memo for a new initiative. Incorporate market research, competitive analysis, OKRs, and a go-to-market outline. This is a capstone challenge that synthesizes skills from earlier challenges.
- **Submission:** Strategy memo (3-5 pages) with supporting data
- **Evaluation:** Strategic coherence (25%), evidence quality (25%), originality (25%), actionability (25%)
- **Anti-cheating:** Must reference specific outputs from prerequisite challenges; evaluators verify cross-document consistency
- **Asset produced:** Strategy memo (capstone artifact)

### CH-11: Requirements Elicitation from Transcript
- **Difficulty:** Beginner | **Time:** 25 min | **Points:** 80
- **Tags:** `Critical Thinking` `Writing & Documentation` `Problem Solving`
- **Prerequisites:** None
- **Description:** Given a simulated stakeholder interview transcript, extract and organize functional and non-functional requirements. Distinguish between stated needs, implied needs, and contradictions.
- **Submission:** Structured requirements document with categorization and conflict flags
- **Evaluation:** Completeness (30%), correct categorization (30%), contradiction identification (40%)
- **Anti-cheating:** Transcripts contain deliberate contradictions that must be flagged, not silently resolved
- **Asset produced:** Requirements document (used in CH-13, CH-19)

### CH-12: Data Dictionary Builder
- **Difficulty:** Beginner | **Time:** 30 min | **Points:** 100
- **Tags:** `Data Analysis` `Writing & Documentation` `Prompt Engineering`
- **Prerequisites:** None
- **Description:** Given an entity-relationship diagram, use AI to generate a data dictionary, then validate and enrich it with business context, constraints, and relationships that the AI may have missed or gotten wrong.
- **Submission:** Complete data dictionary with validation notes
- **Evaluation:** Completeness (30%), accuracy (30%), business context additions (40%)
- **Anti-cheating:** ERD contains intentional ambiguities; evaluators check whether they were resolved with reasoning, not guessing
- **Asset produced:** Data dictionary (used in CH-14)

### CH-13: Process Flow Mapping
- **Difficulty:** Intermediate | **Time:** 45 min | **Points:** 250
- **Tags:** `Process Design` `Writing & Documentation` `Problem Solving`
- **Prerequisites:** CH-11 (uses requirements document)
- **Description:** Transform a set of requirements into a BPMN process flow diagram. Identify decision points, exception paths, and integration touchpoints. Document assumptions made during mapping.
- **Submission:** BPMN diagram (image or standard notation) plus assumptions document
- **Evaluation:** Completeness (30%), correctness (30%), exception handling (20%), assumptions quality (20%)
- **Anti-cheating:** Requirements contain implicit branches that must be modeled; evaluators check for superficial vs thorough mapping
- **Asset produced:** Process flow (used in CH-16)

### CH-14: SQL Query Generation and Validation
- **Difficulty:** Intermediate | **Time:** 40 min | **Points:** 200
- **Tags:** `Coding` `Data Analysis` `AI Evaluation`
- **Prerequisites:** CH-12 (uses data dictionary)
- **Description:** Given a data dictionary and 5 business questions, use AI to generate SQL queries, then predict the results before running them. Identify any queries where the AI made logical errors and correct them.
- **Submission:** 5 SQL queries with predicted results, error annotations, and corrections
- **Evaluation:** Query correctness (40%), prediction accuracy (30%), error identification (30%)
- **Anti-cheating:** Business questions are designed to produce counterintuitive results; AI-generated queries contain subtle join errors
- **Asset produced:** Validated query set (used in CH-17)

### CH-15: Data Quality Assessment
- **Difficulty:** Intermediate | **Time:** 50 min | **Points:** 250
- **Tags:** `Data Analysis` `Critical Thinking` `Problem Solving`
- **Prerequisites:** None
- **Description:** Examine a messy dataset and identify quality issues: missing values, duplicates, outliers, inconsistencies, and format problems. Propose a data cleaning strategy and prioritize which issues matter most for downstream analysis.
- **Submission:** Data quality report with issue inventory, severity ratings, and cleaning plan
- **Evaluation:** Issues found (30%), severity assessment (30%), cleaning strategy quality (40%)
- **Anti-cheating:** Dataset has a known count of planted issues; scoring adjusts for false positives
- **Asset produced:** Data quality report

### CH-16: User Journey Mapping
- **Difficulty:** Advanced | **Time:** 55 min | **Points:** 350
- **Tags:** `Design` `Process Design` `Critical Thinking` `Research`
- **Prerequisites:** CH-13 (uses process flow)
- **Description:** Convert a technical process flow into a user journey map that captures emotional states, pain points, and opportunities for improvement. Bridge the gap between system logic and human experience.
- **Submission:** User journey map with emotion curve, pain point annotations, and opportunity areas
- **Evaluation:** Empathy depth (30%), insight quality (30%), opportunity relevance (20%), visual clarity (20%)
- **Anti-cheating:** Process flow contains steps that are technically correct but user-hostile; evaluators check if these are flagged
- **Asset produced:** Journey map (used in CH-26)

### CH-17: Dashboard Requirements Specification
- **Difficulty:** Advanced | **Time:** 50 min | **Points:** 300
- **Tags:** `Data Analysis` `Writing & Documentation` `Product Thinking`
- **Prerequisites:** CH-14 (uses validated SQL queries)
- **Description:** Write a complete dashboard specification that defines metrics, visualizations, data sources, refresh rates, and user permissions. Translate SQL queries into meaningful dashboard components.
- **Submission:** Dashboard spec document with wireframe sketches
- **Evaluation:** Metric relevance (25%), spec completeness (25%), usability considerations (25%), technical feasibility (25%)
- **Anti-cheating:** Spec must reference specific queries from CH-14; evaluators cross-check data consistency
- **Asset produced:** Dashboard spec

### CH-18: Impact Analysis
- **Difficulty:** Advanced | **Time:** 60 min | **Points:** 350
- **Tags:** `Critical Thinking` `Tech Architecture` `Problem Solving` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Given a proposed system change, assess its impact across data, processes, integrations, and users. Identify risks, dependencies, and required communication. Produce a structured impact assessment document.
- **Submission:** Impact analysis document with risk matrix and mitigation plan
- **Evaluation:** Thoroughness (30%), risk identification (30%), mitigation quality (20%), communication plan (20%)
- **Anti-cheating:** Change scenario has hidden cross-system dependencies; evaluators check for depth of analysis beyond surface-level
- **Asset produced:** Impact analysis

### CH-19: Acceptance Criteria Workshop
- **Difficulty:** Expert | **Time:** 50 min | **Points:** 450
- **Tags:** `Testing & QA` `Writing & Documentation` `Critical Thinking`
- **Prerequisites:** CH-11 (uses requirements document)
- **Description:** Transform requirements into Gherkin-format acceptance criteria (Given/When/Then). Cover happy paths, edge cases, and error scenarios. Ensure testability and completeness.
- **Submission:** Full set of acceptance criteria in Gherkin format with coverage analysis
- **Evaluation:** Gherkin correctness (25%), edge case coverage (25%), testability (25%), requirements traceability (25%)
- **Anti-cheating:** Requirements contain ambiguities that must be resolved in criteria; evaluators check for assumptions documentation
- **Asset produced:** Acceptance criteria set

### CH-20: Requirements Traceability Matrix
- **Difficulty:** Expert | **Time:** 75 min | **Points:** 500
- **Tags:** `Writing & Documentation` `Critical Thinking` `Process Design` `Problem Solving`
- **Prerequisites:** CH-11, CH-13, CH-19 (capstone -- uses requirements, process flows, acceptance criteria)
- **Description:** Build a complete requirements traceability matrix linking stakeholder needs to requirements, to process flows, to acceptance criteria. Identify coverage gaps and orphaned requirements.
- **Submission:** Traceability matrix (spreadsheet or structured document) with gap analysis
- **Evaluation:** Completeness (30%), gap identification (30%), matrix quality (20%), recommendations (20%)
- **Anti-cheating:** Must reference specific artifacts from prerequisite challenges; evaluators verify cross-document traceability IDs
- **Asset produced:** Traceability matrix (capstone artifact)

### CH-21: Prompt-to-Code Basics
- **Difficulty:** Beginner | **Time:** 20 min | **Points:** 80
- **Tags:** `Coding` `Prompt Engineering`
- **Prerequisites:** None
- **Description:** Write prompts to generate a CPF validator function in a programming language of your choice. Evaluate the AI output for correctness, edge cases, and code quality. Make targeted edits to fix any issues.
- **Submission:** Working code file with prompt log and edit annotations
- **Evaluation:** Code correctness (40%), prompt quality (30%), edit rationale (30%)
- **Anti-cheating:** Must handle specific edge cases (known invalid CPFs); automated test suite validates output
- **Asset produced:** Validated code module

### CH-22: Code Review of AI Output
- **Difficulty:** Beginner | **Time:** 30 min | **Points:** 100
- **Tags:** `Coding` `Critical Review` `AI Evaluation`
- **Prerequisites:** None
- **Description:** Review an AI-generated code module and find 5 planted bugs (logic errors, off-by-one, null handling, race conditions, security issues). Document each bug with explanation and fix.
- **Submission:** Code review document with bug descriptions, severity ratings, and proposed fixes
- **Evaluation:** Bugs found (50%), explanation quality (25%), fix quality (25%)
- **Anti-cheating:** Bugs are unique per challenge instance; some are subtle enough that re-running AI won't find them
- **Asset produced:** Code review document

### CH-23: Test Generation with AI
- **Difficulty:** Intermediate | **Time:** 35 min | **Points:** 200
- **Tags:** `Coding` `Testing & QA` `Prompt Engineering`
- **Prerequisites:** CH-21 (uses code module)
- **Description:** Use AI to generate a test suite for a code module, targeting 90%+ coverage. Review generated tests for meaningfulness -- remove redundant tests, add missing edge cases, and ensure tests actually validate behavior (not just exercise code paths).
- **Submission:** Test suite with coverage report and annotation of changes made to AI output
- **Evaluation:** Coverage achieved (30%), test meaningfulness (30%), edge case coverage (20%), annotation quality (20%)
- **Anti-cheating:** Code module has known edge cases that basic coverage tools miss; evaluators check for semantic test quality
- **Asset produced:** Test suite (used in CH-25)

### CH-24: API Design with AI
- **Difficulty:** Intermediate | **Time:** 45 min | **Points:** 250
- **Tags:** `Tech Architecture` `Coding` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Design a REST API for a given feature, following a provided style guide. Use AI to generate the initial spec, then refine for consistency, error handling, pagination, versioning, and security headers.
- **Submission:** OpenAPI spec (YAML/JSON) with design decision document
- **Evaluation:** Style guide compliance (25%), completeness (25%), error handling (25%), design rationale (25%)
- **Anti-cheating:** Style guide has specific conventions that generic AI output typically violates; evaluators check for manual corrections
- **Asset produced:** API spec (used in CH-27)

### CH-25: Refactoring AI-Generated Code
- **Difficulty:** Intermediate | **Time:** 40 min | **Points:** 250
- **Tags:** `Coding` `Critical Thinking` `Testing & QA`
- **Prerequisites:** CH-23 (uses test suite as safety net)
- **Description:** Refactor a working but messy AI-generated code module while keeping all tests green. Improve readability, performance, and maintainability without changing behavior.
- **Submission:** Refactored code with test results and refactoring rationale document
- **Evaluation:** Code quality improvement (30%), tests still passing (20%), rationale depth (25%), performance gains (25%)
- **Anti-cheating:** Test suite from CH-23 serves as regression check; automated validation confirms behavior preservation
- **Asset produced:** Refactored code module

### CH-26: Performance Debugging
- **Difficulty:** Advanced | **Time:** 55 min | **Points:** 350
- **Tags:** `Coding` `Problem Solving` `AI Evaluation`
- **Prerequisites:** None
- **Description:** Given a code module with a performance regression, diagnose and fix the issue. An AI assistant provides suggestions -- but some are red herrings that would make performance worse. Identify the correct fix and explain why the AI's misdirections are wrong.
- **Submission:** Fixed code, performance benchmarks (before/after), and analysis of AI misdirections
- **Evaluation:** Correct fix (30%), performance improvement (20%), misdirection analysis (30%), explanation clarity (20%)
- **Anti-cheating:** Performance regression is multi-causal; AI deliberately suggests a plausible but wrong root cause
- **Asset produced:** Performance analysis document

### CH-27: Microservice Implementation
- **Difficulty:** Advanced | **Time:** 90 min | **Points:** 400
- **Tags:** `Coding` `Tech Architecture` `Testing & QA`
- **Prerequisites:** CH-24 (uses API spec)
- **Description:** Implement a complete microservice from an API specification. Include request validation, business logic, error handling, logging, and health checks. Write integration tests.
- **Submission:** Complete service code, Dockerfile, integration tests, and README
- **Evaluation:** Spec compliance (25%), code quality (25%), test coverage (25%), production readiness (25%)
- **Anti-cheating:** API spec has edge cases that require interpretation; automated tests validate against spec
- **Asset produced:** Working microservice

### CH-28: Security Review with AI
- **Difficulty:** Advanced | **Time:** 50 min | **Points:** 350
- **Tags:** `Security` `Coding` `Critical Review`
- **Prerequisites:** None
- **Description:** Review a code module for security vulnerabilities. Find at least 4 planted vulnerabilities (SQL injection, XSS, auth bypass, insecure deserialization, etc.). Use AI to help scan, but verify findings independently.
- **Submission:** Security report with vulnerability descriptions, severity ratings (CVSS), and remediation code
- **Evaluation:** Vulnerabilities found (40%), severity accuracy (20%), remediation quality (20%), false positive rate (20%)
- **Anti-cheating:** Vulnerabilities are context-dependent; generic scanner output won't find all of them
- **Asset produced:** Security report

### CH-29: CI/CD Pipeline Design
- **Difficulty:** Expert | **Time:** 60 min | **Points:** 450
- **Tags:** `Tech Architecture` `Coding` `Process Design` `Security`
- **Prerequisites:** None
- **Description:** Design a complete CI/CD pipeline (using GitHub Actions or equivalent) for a microservice. Include build, test, security scan, staging deploy, approval gate, and production deploy stages. Handle rollback scenarios.
- **Submission:** Pipeline configuration files, architecture diagram, and rollback procedure document
- **Evaluation:** Completeness (25%), security integration (25%), rollback handling (25%), documentation quality (25%)
- **Anti-cheating:** Must handle specific deployment scenarios (canary, blue-green); evaluators test pipeline logic mentally for correctness
- **Asset produced:** CI/CD pipeline design

### CH-30: System Design Document
- **Difficulty:** Expert | **Time:** 90 min | **Points:** 600
- **Tags:** `Tech Architecture` `Writing & Documentation` `Strategy` `Problem Solving`
- **Prerequisites:** CH-24, CH-29 (capstone -- uses API spec and pipeline design)
- **Description:** Write a comprehensive system design document for a distributed system. Include architecture diagrams, component interactions, data flow, scalability plan, failure modes, and monitoring strategy. This capstone integrates technical architecture skills from earlier challenges.
- **Submission:** System design document (5-8 pages) with diagrams
- **Evaluation:** Architecture soundness (25%), scalability analysis (25%), failure mode coverage (25%), documentation quality (25%)
- **Anti-cheating:** Must reference specific components from prerequisite challenges; evaluators verify architectural consistency
- **Asset produced:** System design document (capstone artifact)

### CH-31: AI-Assisted Copywriting
- **Difficulty:** Beginner | **Time:** 20 min | **Points:** 80
- **Tags:** `Prompt Engineering` `Communication` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Write UI microcopy variants for a given set of interface elements (error messages, empty states, confirmation dialogs, onboarding tooltips). Use AI to generate options, then select and refine the best variants with rationale.
- **Submission:** Microcopy document with variants, selection rationale, and tone guidelines
- **Evaluation:** Clarity (30%), tone consistency (30%), user empathy (20%), variant diversity (20%)
- **Anti-cheating:** Interface elements include culturally sensitive contexts; evaluators check for thoughtful adaptation
- **Asset produced:** Microcopy guide

### CH-32: Accessibility Audit
- **Difficulty:** Beginner | **Time:** 30 min | **Points:** 100
- **Tags:** `Accessibility` `Critical Review` `Design`
- **Prerequisites:** None
- **Description:** Given a screenshot/mockup of a digital interface, identify accessibility issues against WCAG 2.1 guidelines. Categorize by severity and propose specific fixes for each issue.
- **Submission:** Accessibility audit report with annotated screenshot and fix recommendations
- **Evaluation:** Issues found (30%), correct WCAG references (25%), fix quality (25%), prioritization (20%)
- **Anti-cheating:** Screenshot contains both obvious and subtle a11y issues; some require understanding of assistive technology behavior
- **Asset produced:** Accessibility audit report

### CH-33: User Research Synthesis
- **Difficulty:** Intermediate | **Time:** 45 min | **Points:** 250
- **Tags:** `Research` `Critical Thinking` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Given 5 user interview transcripts, synthesize findings into themes, patterns, and insights. Use AI to help organize data, but ensure that your synthesis captures nuance that automated analysis tends to flatten.
- **Submission:** Research synthesis document with themes, supporting quotes, and insight hierarchy
- **Evaluation:** Theme quality (30%), evidence grounding (25%), nuance preservation (25%), actionability (20%)
- **Anti-cheating:** Transcripts contain contradictory user opinions that must be acknowledged, not smoothed over
- **Asset produced:** Research synthesis (used in CH-36)

### CH-34: Design System Component Spec
- **Difficulty:** Intermediate | **Time:** 40 min | **Points:** 200
- **Tags:** `Design` `Writing & Documentation` `Tech Architecture`
- **Prerequisites:** None
- **Description:** Write a complete component specification for a UI component (button, modal, card, or similar). Define states, variants, properties, spacing, responsive behavior, and accessibility requirements.
- **Submission:** Component spec document with state diagrams and property tables
- **Evaluation:** Completeness (30%), technical accuracy (25%), accessibility coverage (25%), clarity (20%)
- **Anti-cheating:** Component must handle specific edge cases (long text, RTL, high contrast); evaluators check for depth vs boilerplate
- **Asset produced:** Component spec (used in CH-37)

### CH-35: Heuristic Evaluation
- **Difficulty:** Intermediate | **Time:** 45 min | **Points:** 250
- **Tags:** `Critical Review` `Design` `Critical Thinking`
- **Prerequisites:** None
- **Description:** Apply Nielsen's 10 usability heuristics to evaluate a prototype interface. Score each heuristic, provide specific examples of violations and good practices, and prioritize recommendations.
- **Submission:** Heuristic evaluation report with scores, examples, and prioritized recommendations
- **Evaluation:** Heuristic application accuracy (30%), example specificity (25%), recommendation quality (25%), prioritization (20%)
- **Anti-cheating:** Prototype has intentional violations across all 10 heuristics; evaluators check for completeness of coverage
- **Asset produced:** Heuristic evaluation report

### CH-36: Persona Development
- **Difficulty:** Advanced | **Time:** 50 min | **Points:** 300
- **Tags:** `Research` `Design` `Critical Thinking` `Writing & Documentation`
- **Prerequisites:** CH-33 (uses research synthesis)
- **Description:** Create 3 user personas from research synthesis data. Each persona must have demographic context, goals, frustrations, technology comfort level, and a day-in-the-life scenario. Avoid stereotypes and ensure personas are grounded in research evidence.
- **Submission:** 3 persona documents with evidence mapping back to research data
- **Evaluation:** Research grounding (30%), distinctiveness (25%), usefulness for design decisions (25%), stereotype avoidance (20%)
- **Anti-cheating:** Evaluators cross-check persona claims against research synthesis; generic personas score poorly
- **Asset produced:** Persona set

### CH-37: Interactive Prototype Specification
- **Difficulty:** Advanced | **Time:** 55 min | **Points:** 350
- **Tags:** `Design` `Writing & Documentation` `Process Design`
- **Prerequisites:** CH-34 (uses component spec)
- **Description:** Write a detailed interaction specification for a multi-step user flow. Define transitions, animations, loading states, error recovery, and gesture/keyboard interactions. Reference component specs for consistency.
- **Submission:** Interaction spec document with flow diagrams and state descriptions
- **Evaluation:** Completeness (25%), consistency with component spec (25%), edge case handling (25%), clarity (25%)
- **Anti-cheating:** Flow includes branching paths and error states that must all be specified; evaluators check for exhaustiveness
- **Asset produced:** Interaction spec (used in CH-39)

### CH-38: Design Critique Facilitation
- **Difficulty:** Advanced | **Time:** 45 min | **Points:** 300
- **Tags:** `Critical Review` `Communication` `Collaboration` `Design`
- **Prerequisites:** None
- **Description:** Given 3 design proposals for the same problem, write a structured critique of each. For each proposal, identify strengths, weaknesses, and risks. Then synthesize a recommendation with reasoning.
- **Submission:** Critique document with comparative analysis and recommendation
- **Evaluation:** Critique depth (30%), balance of perspectives (25%), synthesis quality (25%), recommendation clarity (20%)
- **Anti-cheating:** Proposals have non-obvious trade-offs; evaluators check whether critique addresses real design tensions, not surface aesthetics
- **Asset produced:** Design critique document

### CH-39: Design Handoff Documentation
- **Difficulty:** Expert | **Time:** 60 min | **Points:** 450
- **Tags:** `Design` `Writing & Documentation` `Collaboration` `Tech Architecture`
- **Prerequisites:** CH-37 (uses interaction spec)
- **Description:** Create a complete design handoff document that an engineering team could use to implement a feature. Include component inventory, spacing and layout specs, responsive breakpoints, animation timing, accessibility notes, and edge case documentation.
- **Submission:** Handoff document with annotated mockups and implementation notes
- **Evaluation:** Completeness (25%), implementability (25%), accessibility notes (25%), edge case coverage (25%)
- **Anti-cheating:** Must reference specific components from CH-34 and interactions from CH-37; evaluators check cross-document consistency
- **Asset produced:** Handoff document

### CH-40: Design Strategy Presentation
- **Difficulty:** Expert | **Time:** 75 min | **Points:** 500
- **Tags:** `Strategy` `Communication` `Design` `Research`
- **Prerequisites:** CH-33, CH-36 (capstone -- uses research synthesis and personas)
- **Description:** Create a design strategy presentation that tells a compelling story from research insights to design direction. Include problem framing, user evidence, design principles, proposed solutions, and success metrics. Present complex design decisions to a non-design audience.
- **Submission:** Presentation deck (10-15 slides) with speaker notes
- **Evaluation:** Narrative coherence (25%), evidence integration (25%), design quality (25%), persuasiveness (25%)
- **Anti-cheating:** Must trace design decisions back to specific research findings; evaluators verify evidence chain
- **Asset produced:** Strategy presentation (capstone artifact)

### CH-41: AI Impact Assessment
- **Difficulty:** Beginner | **Time:** 30 min | **Points:** 100
- **Tags:** `Critical Thinking` `Strategy` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Given a scenario where an AI tool is being adopted by a team, assess its potential impact on workflows, skills, team dynamics, and output quality. Identify both opportunities and risks.
- **Submission:** Impact assessment document with opportunity/risk matrix
- **Evaluation:** Thoroughness (30%), balance of optimism and realism (30%), actionability (40%)
- **Anti-cheating:** Scenario includes nuances where AI improves some workflows but disrupts others; one-sided assessments score poorly
- **Asset produced:** AI impact assessment

### CH-42: AI-Assisted Work Review
- **Difficulty:** Intermediate | **Time:** 40 min | **Points:** 200
- **Tags:** `AI Evaluation` `Critical Review` `Leadership`
- **Prerequisites:** None
- **Description:** Review 5 work samples and determine which were AI-assisted vs. fully human-generated. For each, explain your reasoning and assess quality regardless of origin. Develop a rubric for evaluating work quality in an AI-augmented workplace.
- **Submission:** Review document with classifications, reasoning, and quality rubric
- **Evaluation:** Classification accuracy (25%), reasoning quality (25%), rubric usefulness (25%), nuance in quality assessment (25%)
- **Anti-cheating:** Samples are carefully curated to include high-quality AI output and low-quality human output; binary thinking fails
- **Asset produced:** AI work review rubric

### CH-43: Team Capacity Planning
- **Difficulty:** Advanced | **Time:** 55 min | **Points:** 350
- **Tags:** `Leadership` `Strategy` `Data Analysis` `Problem Solving`
- **Prerequisites:** None
- **Description:** Create a 3-month capacity plan for a team of 8, accounting for planned leave, skill gaps, project dependencies, and AI-augmented productivity gains. Use AI to model scenarios, but validate assumptions critically.
- **Submission:** Capacity plan spreadsheet/document with scenario analysis and risk mitigation
- **Evaluation:** Realism (25%), scenario depth (25%), risk handling (25%), presentation clarity (25%)
- **Anti-cheating:** Constraints create mathematical conflicts that cannot be resolved without trade-offs; evaluators check for honest constraint acknowledgment
- **Asset produced:** Capacity plan

### CH-44: Change Management Communication
- **Difficulty:** Advanced | **Time:** 50 min | **Points:** 300
- **Tags:** `Communication` `Leadership` `Strategy` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Design a change management communication plan for rolling out a new AI tool across an organization. Create a timeline, stakeholder map, messaging framework, resistance mitigation strategy, and FAQ document.
- **Submission:** Change management plan with all components
- **Evaluation:** Stakeholder coverage (25%), messaging quality (25%), resistance strategy (25%), timeline realism (25%)
- **Anti-cheating:** Scenario includes stakeholder personas with conflicting interests; generic plans score poorly
- **Asset produced:** Change management plan

### CH-45: ROI Business Case
- **Difficulty:** Expert | **Time:** 70 min | **Points:** 500
- **Tags:** `Financial Analysis` `Strategy` `Writing & Documentation` `Data Analysis`
- **Prerequisites:** CH-41 (uses AI impact assessment)
- **Description:** Build a complete business case for an AI investment, including cost analysis, projected benefits, risk-adjusted NPV, payback period, and sensitivity analysis. Ground estimates in realistic assumptions and cite comparable implementations.
- **Submission:** Business case document with financial model and executive summary
- **Evaluation:** Financial rigor (30%), assumption quality (25%), risk analysis (25%), executive summary clarity (20%)
- **Anti-cheating:** Must show calculation methodology; evaluators verify math consistency and assumption reasonableness
- **Asset produced:** Business case (capstone-level artifact)

### CH-46: AI Ethics Case Study
- **Difficulty:** Intermediate | **Time:** 40 min | **Points:** 200
- **Tags:** `Critical Thinking` `AI Evaluation` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Analyze a real-world AI bias scenario in financial services. Identify the sources of bias, affected populations, potential harms, and propose mitigation strategies. Consider both technical and organizational interventions.
- **Submission:** Case study analysis with bias identification, harm assessment, and mitigation plan
- **Evaluation:** Bias identification depth (25%), harm assessment (25%), mitigation feasibility (25%), ethical reasoning (25%)
- **Anti-cheating:** Scenario has multiple interacting biases; single-cause analyses score poorly
- **Asset produced:** Ethics case study

### CH-47: Cross-Discipline Collaboration
- **Difficulty:** Intermediate | **Time:** 60 min | **Points:** 250
- **Tags:** `Collaboration` `Problem Solving` `Communication`
- **Prerequisites:** None
- **Description:** A paired challenge where two participants with different skill backgrounds work together to solve a problem that requires both perspectives. Each participant submits their contribution plus a reflection on the collaboration process.
- **Submission:** Joint deliverable plus individual collaboration reflection
- **Evaluation:** Deliverable quality (30%), integration of perspectives (30%), reflection depth (20%), communication effectiveness (20%)
- **Anti-cheating:** Both participants must submit independently; evaluators compare accounts for consistency
- **Asset produced:** Collaborative solution document

### CH-48: AI Tool Comparison Report
- **Difficulty:** Advanced | **Time:** 50 min | **Points:** 300
- **Tags:** `Research` `Critical Thinking` `AI Evaluation` `Writing & Documentation`
- **Prerequisites:** None
- **Description:** Hands-on compare 3 AI tools for a specific use case (e.g., code generation, content writing, data analysis). Run the same task through all three, document results, and produce a recommendation report with scoring criteria.
- **Submission:** Comparison report with methodology, raw results, scoring matrix, and recommendation
- **Evaluation:** Methodology rigor (25%), test fairness (25%), analysis depth (25%), recommendation quality (25%)
- **Anti-cheating:** Must include actual AI outputs (screenshots/exports) as evidence; evaluators verify hands-on testing occurred
- **Asset produced:** AI tool comparison report

### CH-49: Teach-Back Challenge
- **Difficulty:** Advanced | **Time:** 45 min | **Points:** 300
- **Tags:** `Teaching` `Communication` `Writing & Documentation`
- **Prerequisites:** Completion of any 5 challenges
- **Description:** Create a teaching guide that explains a skill or concept you learned during earlier challenges. The guide should be usable by a colleague with no prior experience. Include examples, common pitfalls, and practice exercises.
- **Submission:** Teaching guide (3-5 pages) with examples and exercises
- **Evaluation:** Clarity for beginners (30%), accuracy (25%), practical examples (25%), exercise quality (20%)
- **Anti-cheating:** Guide is tested against comprehension rubric; vague or overly abstract content scores poorly
- **Asset produced:** Teaching guide

### CH-50: Platform Improvement Proposal
- **Difficulty:** Expert | **Time:** 60 min | **Points:** 500
- **Tags:** `Product Thinking` `Strategy` `Problem Solving` `Writing & Documentation`
- **Prerequisites:** Completion of any 10 challenges
- **Description:** Based on your experience as a NuChallenge user, propose a meaningful improvement to the platform. Include problem identification, proposed solution, expected impact, implementation considerations, and success metrics. This meta-challenge rewards deep platform engagement.
- **Submission:** Improvement proposal document (2-4 pages)
- **Evaluation:** Problem identification (25%), solution creativity (25%), feasibility (25%), impact assessment (25%)
- **Anti-cheating:** Proposal must reference specific experiences from completed challenges; generic suggestions score poorly
- **Asset produced:** Platform improvement proposal (meta-capstone artifact)

---

---

## SECTION 3: Evaluation Engine Design

### 3.1 Three Evaluation Methods

**AI-Judge (used for 30 of 50 challenges)**

The AI evaluation service uses a structured rubric approach:
- Each challenge defines a rubric with 3-8 criteria, each weighted
- The AI (Claude or GPT-4 class model) receives: the rubric, the challenge description, any context/reference material, and the submission
- The AI scores each criterion on a 0-10 scale with written justification
- A confidence score (0-1) is computed based on rubric clarity and submission quality
- If confidence < 0.7, the submission is flagged for human review

Rubric example (PM-01):
```
1. Structure completeness (25%) - Has all PRD sections: problem, users, requirements, success metrics, constraints
2. Specificity (25%) - Uses concrete metrics, not vague language
3. Context accuracy (20%) - References provided feature brief correctly
4. Feasibility (15%) - Requirements are technically achievable
5. Clarity (15%) - Readable by engineering team
```

Cost optimization: AI-judging costs approximately $0.05-0.15 per evaluation (depending on submission length). For 1000 employees doing 10 challenges each, total evaluation cost is $500-$1,500. This is dramatically cheaper than human review.

**Automated Tests (used for 12 of 50 challenges, all Dev + some BA)**

- Code challenges: Clojure test suites run in a sandboxed environment (Docker containers with resource limits)
- SQL challenges: queries executed against a test database with known correct results
- Data challenges: automated comparison of identified issues against planted issue catalog
- Test execution timeout: 30 seconds per test suite
- Results are binary (pass/fail per test) with aggregate scoring

**Human Review (used for 8 of 50 challenges, primarily Expert level)**

- Triggered for capstone challenges and high-stakes evaluations
- Uses a structured rubric (same format as AI-judge) for consistency
- Reviewers are senior Nubank employees trained as evaluators
- Review SLA: 48 hours for initial feedback
- Reviewer pool: 20 trained evaluators, each handling max 10 reviews per week

### 3.2 Hybrid Evaluation Pipeline

For challenges marked "hybrid" (approximately 15 challenges):

```
Submission --> AI Pre-Score --> Confidence Check
                                    |
                         >= 0.7 --> Final Score (AI only)
                         < 0.7  --> Human Review Queue
                                    |
                                 Human Score (final)
```

Additionally, 10% of all AI-scored submissions are randomly sampled for human review to calibrate AI accuracy over time. Disagreements > 20% between AI and human scores trigger rubric refinement.

### 3.3 Appeal and Retry Mechanics

- **Retry**: Each challenge allows 2 retries. Points awarded are: 100% (first attempt), 80% (second), 60% (third). After 3 failed attempts, the challenger must complete a prerequisite review before retrying.
- **Appeal**: Challengers can appeal any evaluation within 7 days. Appeals go to a different evaluator (AI or human). If the appeal changes the score by > 15%, the original evaluator's calibration is flagged.
- **Partial Credit**: For automated tests, partial credit is awarded proportionally (7/10 tests passing = 70% of points). For AI-judged, the rubric naturally provides partial credit through individual criteria scores.

---

---

## SECTION 4: Navigation, Discovery & Progression

### 4.1 Tag-Based Navigation (Replaces Role Tracks)

Instead of assigning users to a track based on their job title, the platform lets users discover challenges through tags. The challenge explorer page is the primary navigation surface.

## PART 4: NAVIGATION & DISCOVERY REDESIGN

### 4.1 Challenge Explorer (replaces Track Selector)

**Old model:** User selects a track (PM, BA, Dev, etc.) and sees only those challenges.

**New model:** A single Challenge Explorer page with multi-faceted filtering.

**Filter Dimensions:**
- **Tags** (multi-select): Filter by 1+ tags. Shows challenges matching ANY selected tag. Badge count shows how many challenges match.
- **Difficulty** (single or multi-select): Beginner / Intermediate / Advanced / Expert
- **Time** (range slider): 20 min to 90 min
- **Status** (personal): Available / In Progress / Completed / Locked (prerequisites not met)
- **Suggested Paths** (quick filter): One-click to load a curated path's challenge list

**Sort Options:**
- Recommended (personalized based on completed challenges and tag affinity)
- Difficulty (ascending or descending)
- Points (highest first)
- Time (shortest first)
- Newest / Most popular

**Challenge Card Display:**
Each card shows: Title, Difficulty badge, Time estimate, Points, 2-4 Tag pills, Prerequisite status (unlocked/locked), Completion checkmark if done.

### 4.2 Prerequisite Chains (Enforced)

Prerequisites remain enforced for asset chaining. The dependency graph is:

```
CH-01 (PRD) ──────> CH-03 (PRD Peer Review)
  │                 
  └──> CH-07 (Stakeholder Comms)
  └──> CH-10 (Product Strategy Memo) <── CH-09 (OKRs)

CH-02 (User Stories) ──> CH-04 (Prioritization) ──> CH-06 (Sprint Planning)

CH-11 (Requirements) ──> CH-13 (Process Flow) ──> CH-16 (Journey Map)
  │                        │
  └──> CH-19 (Acceptance Criteria)
  └──> CH-20 (Traceability Matrix) <── CH-13, CH-19

CH-12 (Data Dict) ──> CH-14 (SQL) ──> CH-17 (Dashboard Spec)

CH-21 (Prompt-to-Code) ──> CH-23 (Test Gen) ──> CH-25 (Refactoring)

CH-24 (API Design) ──> CH-27 (Microservice)
  └──> CH-30 (System Design) <── CH-29 (CI/CD)

CH-33 (Research Synthesis) ──> CH-36 (Personas) ──> CH-40 (Design Strategy Pres)

CH-34 (Component Spec) ──> CH-37 (Interaction Spec) ──> CH-39 (Design Handoff)

CH-41 (AI Impact) ──> CH-45 (ROI Business Case)

CH-49 (Teach-Back): requires any 5 completed challenges
CH-50 (Platform Improvement): requires any 10 completed challenges
```

Locked challenges show their prerequisite chain clearly, with direct links to the required challenges.

### 4.3 Discovery Mechanics

**Tag Affinity Profile:** As users complete challenges, the system builds a tag affinity profile (which tags they gravitate toward). This powers the "Recommended" sort.

**"You Might Enjoy" Section:** On the dashboard, show 3 recommended next challenges based on:
1. Tags from completed challenges (suggest similar)
2. Tags NOT yet attempted (suggest exploration)
3. Prerequisites just unlocked (suggest newly available challenges)

**Path Progress Indicators:** If a user's completed challenges align with a suggested path, show path progress (e.g., "You've completed 4/7 challenges in the Think & Analyze path").

**Tag Heat Map:** A visual showing all 22 tags as bubbles, sized by how many challenges use each tag, colored by the user's completion percentage for that tag. Encourages exploration of underrepresented areas.

**Weekly Spotlight:** Feature 1-2 challenges each week with a brief editorial note explaining why they are interesting or timely.

### 4.4 Profile & Progress (replaces Track Progress)

**Old model:** Progress bar per track (PM: 3/10, Dev: 0/10, etc.)

**New model:**
- **Overall progress:** 12/50 challenges completed (progress bar)
- **Tag radar chart:** A spider/radar chart showing competency across all 22 tags based on completed challenges and scores
- **Difficulty distribution:** How many Beginner/Intermediate/Advanced/Expert challenges completed
- **Path progress:** For each suggested path the user has started, show completion percentage
- **Points and rank:** Total points earned, leaderboard position
- **Badge wall:** Earned badges for milestones (first challenge, first expert, all tags attempted, path completions, etc.)

### 4.5 Badges (Tag-Aligned)

| Badge | Condition |
|-------|-----------|
| First Steps | Complete first challenge |
| Tag Explorer | Complete challenges with 10+ different tags |
| Tag Master: [Tag Name] | Complete 5+ challenges containing a specific tag |
| Path Finder | Complete all challenges in any suggested path |
| Polymath | Complete challenges across all difficulty levels |
| Speed Demon | Complete a challenge in under half the estimated time |
| Perfect Score | Achieve maximum evaluation score on any challenge |
| Collaborator | Complete CH-47 (Cross-Discipline Collaboration) |
| Teacher | Complete CH-49 (Teach-Back Challenge) |
| Platform Shaper | Complete CH-50 (Platform Improvement Proposal) |
| Capstone Collector | Complete all 5 capstone challenges (CH-10, CH-20, CH-30, CH-40, CH-45) |
| The Completionist | Complete all 50 challenges |

---

## SUMMARY OF CHANGES FROM ORIGINAL

| Aspect | Before | After |
|--------|--------|-------|
| Organization | 6 role-based tracks | 22 skill tags |
| Challenge IDs | PM-01, BA-01, etc. | CH-01 through CH-50 |
| Navigation | Select your track | Filter by tags, difficulty, time |
| Progression | Linear per track | Free exploration + suggested paths |
| Prerequisites | Within-track chaining | Cross-challenge asset chaining (unchanged logic) |
| Who can take what | Role determines track | Anyone takes any challenge |
| Descriptions | Role-specific language | Role-neutral activity language |
| Discovery | Browse your track | Recommendations, tag affinity, spotlight |
| Profile | Track completion bars | Tag radar chart, path progress, badge wall |

**What is preserved:** All 50 challenge concepts, creative anti-cheating mechanisms, evaluation rubrics, asset chaining dependencies, difficulty levels, time estimates, and point values remain identical to the original design. Only the organizational frame and language changed.

---

### Critical Files for Implementation

Based on the codebase exploration, the NuChallenge PRD does not yet exist as a standalone file in the repository. The implementation of this redesign would need to create or modify these critical files:

- `/Users/jardel/Library/Mobile Documents/com~apple~CloudDocs/Dev/Operon/mission_marketplace_whitepaper/docs/superpowers/specs/2026-03-28-mission-marketplace-mvp-design.md` -- The existing MVP design spec that established architectural patterns for the Operon project. The tag-based challenge system should follow the same data modeling conventions.
- `/Users/jardel/Library/Mobile Documents/com~apple~CloudDocs/Dev/Operon/mission-marketplace-mvp/docs/MVP-PRODUCT-DOCUMENT.md` -- The MVP product document that defines the type system and data models. The Challenge type, Tag type, and SkillPath type would need to be added here or in a companion document.
- `/Users/jardel/Library/Mobile Documents/com~apple~CloudDocs/Dev/Operon/mission_marketplace_whitepaper/04_design.md` -- The whitepaper's marketplace design chapter, which establishes the theoretical framework for task categorization and matching. The tag taxonomy should align with concepts defined here.
- `/Users/jardel/Library/Mobile Documents/com~apple~CloudDocs/Dev/Operon/mission_marketplace_whitepaper/02_reputation.md` -- The reputation and incentives chapter, relevant because the tag affinity profile and badge system extend the reputation model defined in this document.

### 4.2 Suggested Skill Paths

While challenges are not locked to role-based tracks, the platform offers curated "Skill Paths" — suggested sequences for common learning goals. These are recommendations, not requirements.

## PART 3: SKILL PATHS (Suggested Sequences)

Paths are curated sequences, not enforced tracks. Users can follow them or pick challenges freely. Each path groups challenges by common interest themes.

### Path 1: AI Prompt Mastery
**Focus:** Learn to craft, iterate, and evaluate AI-assisted work
**Tags emphasized:** `Prompt Engineering` `AI Evaluation`

| Order | Challenge | Difficulty | Why it's here |
|-------|-----------|-----------|---------------|
| 1 | CH-21 Prompt-to-Code Basics | Beginner | Start with concrete prompt-to-output |
| 2 | CH-01 Your First AI-Assisted PRD | Beginner | Apply prompting to document creation |
| 3 | CH-31 AI-Assisted Copywriting | Beginner | Explore creative prompting |
| 4 | CH-12 Data Dictionary Builder | Beginner | Prompt for structured data output |
| 5 | CH-05 Spot the Hallucination | Intermediate | Learn to catch AI mistakes |
| 6 | CH-23 Test Generation with AI | Intermediate | Advanced prompting for code |
| 7 | CH-09 OKR Drafting with AI Critique | Expert | Master iterative AI dialogue |

### Path 2: Code & Ship
**Focus:** Write, review, test, and deploy code with AI assistance
**Tags emphasized:** `Coding` `Tech Architecture` `Testing & QA`

| Order | Challenge | Difficulty | Why it's here |
|-------|-----------|-----------|---------------|
| 1 | CH-21 Prompt-to-Code Basics | Beginner | Generate your first code |
| 2 | CH-22 Code Review of AI Output | Beginner | Learn to spot bugs in AI code |
| 3 | CH-23 Test Generation with AI | Intermediate | Build safety nets |
| 4 | CH-25 Refactoring AI-Generated Code | Intermediate | Improve code quality |
| 5 | CH-24 API Design with AI | Intermediate | Design before building |
| 6 | CH-26 Performance Debugging | Advanced | Diagnose under pressure |
| 7 | CH-28 Security Review with AI | Advanced | Find vulnerabilities |
| 8 | CH-27 Microservice Implementation | Advanced | Build a complete service |
| 9 | CH-29 CI/CD Pipeline Design | Expert | Ship it to production |
| 10 | CH-30 System Design Document | Expert | Architect the whole system |

### Path 3: Think & Analyze
**Focus:** Data analysis, critical reasoning, and evidence-based decisions
**Tags emphasized:** `Data Analysis` `Critical Thinking` `Research`

| Order | Challenge | Difficulty | Why it's here |
|-------|-----------|-----------|---------------|
| 1 | CH-12 Data Dictionary Builder | Beginner | Understand data structures |
| 2 | CH-11 Requirements Elicitation | Beginner | Extract meaning from ambiguity |
| 3 | CH-15 Data Quality Assessment | Intermediate | Work with messy real-world data |
| 4 | CH-14 SQL Query Generation | Intermediate | Query and validate data |
| 5 | CH-05 Spot the Hallucination | Intermediate | Critical evaluation of AI claims |
| 6 | CH-46 AI Ethics Case Study | Intermediate | Reason through ethical complexity |
| 7 | CH-08 AI-Assisted Retrospective | Advanced | Unbiased analytical thinking |
| 8 | CH-18 Impact Analysis | Advanced | Assess complex system changes |
| 9 | CH-45 ROI Business Case | Expert | Financial reasoning at scale |

### Path 4: Lead & Communicate
**Focus:** Strategy, leadership, and stakeholder communication
**Tags emphasized:** `Strategy` `Communication` `Leadership`

| Order | Challenge | Difficulty | Why it's here |
|-------|-----------|-----------|---------------|
| 1 | CH-41 AI Impact Assessment | Beginner | Think strategically about AI |
| 2 | CH-31 AI-Assisted Copywriting | Beginner | Craft clear messages |
| 3 | CH-07 Stakeholder Communication | Advanced | Adapt messages to audiences |
| 4 | CH-42 AI-Assisted Work Review | Intermediate | Evaluate work quality fairly |
| 5 | CH-44 Change Management Communication | Advanced | Lead through change |
| 6 | CH-43 Team Capacity Planning | Advanced | Plan for real constraints |
| 7 | CH-09 OKR Drafting with AI Critique | Expert | Set strategic direction |
| 8 | CH-10 Product Strategy Memo | Expert | Synthesize strategy at scale |
| 9 | CH-45 ROI Business Case | Expert | Make the business argument |

### Path 5: Design & Research
**Focus:** User-centered design, research synthesis, and experience craft
**Tags emphasized:** `Design` `Research` `Accessibility`

| Order | Challenge | Difficulty | Why it's here |
|-------|-----------|-----------|---------------|
| 1 | CH-32 Accessibility Audit | Beginner | Start with inclusive design |
| 2 | CH-31 AI-Assisted Copywriting | Beginner | Words are design |
| 3 | CH-33 User Research Synthesis | Intermediate | Ground design in evidence |
| 4 | CH-34 Design System Component Spec | Intermediate | Build systematic foundations |
| 5 | CH-35 Heuristic Evaluation | Intermediate | Evaluate design quality |
| 6 | CH-36 Persona Development | Advanced | From data to humans |
| 7 | CH-16 User Journey Mapping | Advanced | Map the full experience |
| 8 | CH-37 Interactive Prototype Spec | Advanced | Specify interactions precisely |
| 9 | CH-38 Design Critique Facilitation | Advanced | Give and receive feedback |
| 10 | CH-39 Design Handoff Documentation | Expert | Bridge design and engineering |
| 11 | CH-40 Design Strategy Presentation | Expert | Present the big picture |

### Path 6: The Completionist
**Focus:** For those who want to do it all -- the capstone path
**Tags emphasized:** All tags

| Order | Challenge | Difficulty | Why it's here |
|-------|-----------|-----------|---------------|
| 1 | Complete any 10 challenges | Mixed | Build breadth |
| 2 | CH-47 Cross-Discipline Collaboration | Intermediate | Work with someone different |
| 3 | CH-48 AI Tool Comparison | Advanced | Become an AI power user |
| 4 | CH-49 Teach-Back Challenge | Advanced | Solidify by teaching |
| 5 | CH-50 Platform Improvement Proposal | Expert | Shape the future |

---

### 4.3 Prerequisite Chains (Asset Chaining)

Some challenges produce assets (documents, code, specs) that are required by later challenges. These prerequisites are enforced:

- A challenge with prerequisites cannot be started until all prerequisites are completed
- The system automatically provides your prior assets as input to dependent challenges
- This creates natural anti-cheating (your context is unique) and portfolio building (work compounds)

### 4.4 Difficulty Curve

Across the 50 challenges, difficulty follows a designed distribution:
- **Beginner (9 challenges)**: Completable in one sitting. Low stakes. Teaches AI tool basics. Anti-cheat tier T0.
- **Intermediate (15 challenges)**: Requires iteration and domain knowledge. First anti-cheating mechanisms (T1). 
- **Advanced (16 challenges)**: Builds on prior work products. Requires critical evaluation of AI output. T2/T3.
- **Expert (10 challenges)**: Synthesis and capstone. Human evaluation. Portfolio-grade work. T2/T3.


---

## SECTION 5: Points & Gamification

### 5.1 Points Model (Adapted from Whitepaper)

NuChallenge simplifies the whitepaper's dynamic pricing formula for a learning context:

```
Points_awarded = Base_points x Difficulty_multiplier x Speed_bonus x Quality_bonus
```

Where:
- **Base_points**: Fixed per challenge (50-300, as defined in Section 2)
- **Difficulty_multiplier**: 1.0 (Beginner), 1.2 (Intermediate), 1.5 (Advanced), 2.0 (Expert) -- already baked into base points
- **Speed_bonus**: 1.0 (on time), 1.1 (25%+ faster than median), 0.9 (very slow but still within limit). No penalty for slow completion, just reduced bonus.
- **Quality_bonus**: 0.8-1.2 based on evaluation score (below 70% = 0.8, 70-85% = 1.0, 85-95% = 1.1, 95%+ = 1.2)

### 5.2 Level Progression (from Whitepaper)

| Level | Name | Points Threshold | Unlocks |
|-------|------|-----------------|---------|
| 1 | Novice | 0 | Beginner challenges only |
| 2 | Contributor | 500 | Intermediate challenges, can access Cross-Functional track |
| 3 | Expert | 2,000 | Advanced challenges, can participate in peer review (XF-02, XF-04) |
| 4 | Master | 5,000 | Expert challenges, can become an evaluator |
| 5 | Architect | 10,000 | Can propose new challenges (Builder role), platform governance |

### 5.3 Badges and Achievements

**Track Completion Badges** (5):
- PM Champion, BA Champion, Dev Champion, Design Champion, Manager Champion -- complete all challenges in a track

**Skill Badges** (8):
- Prompt Engineer (complete 5 challenges scoring 90%+ on prompt-based tasks)
- Bug Hunter (find all planted errors in 3+ review challenges)
- Speed Demon (complete 5 challenges 25%+ faster than median)
- Perfectionist (score 95%+ on 5 challenges)
- Collaborator (complete XF-02 and XF-04 with 4+ peer ratings)
- Polymath (complete challenges in 3+ tracks)
- Mentor (have your XF-04 teaching guide rated 4+ by follower)
- Meta-contributor (have XF-05 proposal accepted for implementation)

**Streak Badges** (3):
- 3-Day Streak (complete a challenge 3 consecutive days)
- 7-Day Streak
- 30-Day Streak

### 5.4 Leaderboard Design

Three leaderboard views:
1. **Overall** -- total points across all tracks
2. **By Tag** -- points within skill tag categories
3. **By Team** -- aggregate team performance (encourages managers to support participation)

Leaderboards reset quarterly to prevent permanent dominance. All-time records are preserved in profile but active leaderboard shows current quarter only.

Anti-gaming: leaderboard position is weighted by challenge diversity (someone who completed 20 beginner challenges ranks lower than someone who completed 10 diverse challenges with similar total points).

### 5.5 Streak Mechanics

- A "day" counts if the challenger completes any challenge or makes a submission (even if not yet evaluated)
- Streaks are visible on profile and leaderboard
- Streak freezes: 2 per month (for vacation/illness), configurable by admin
- No negative consequences for breaking a streak beyond losing the streak counter

---

---

## SECTION 6: User Roles & Permissions

### 6.1 Role Definitions

| Role | Description | Access Level | MVP Phase |
|------|-------------|-------------|-----------|
| **Challenger** | Completes challenges, earns points, builds portfolio | Read challenges, submit work, view leaderboard, view own profile | Phase 1 |
| **Admin** | Manages platform configuration, user accounts, challenge catalog | Full CRUD on all entities, user management, analytics | Phase 1 |
| **Evaluator** | Reviews submissions, provides feedback (human review) | View assigned submissions, score rubrics, provide feedback | Phase 2 |
| **Builder** | Creates new challenges, defines rubrics, manages tracks | Challenge CRUD, rubric editing, track management | Phase 3 |

### 6.2 Permission Matrix

| Action | Challenger | Evaluator | Admin | Builder |
|--------|-----------|-----------|-------|---------|
| View challenge catalog | Yes | Yes | Yes | Yes |
| Start a challenge | Yes | Yes | Yes | Yes |
| Submit work | Yes | Yes | Yes | Yes |
| View own results | Yes | Yes | Yes | Yes |
| View all results | No | Assigned only | Yes | Track only |
| Score submissions | No | Yes | Yes | No |
| Override AI evaluation | No | Yes | Yes | No |
| Manage users | No | No | Yes | No |
| Create challenges | No | No | Yes | Yes |
| Edit rubrics | No | No | Yes | Yes |
| View analytics | No | Limited | Yes | Track only |
| Configure platform | No | No | Yes | No |

### 6.3 SSO Integration Plan

**Phase 1 (MVP)**: Email/password authentication with JWT tokens. Auth abstracted behind an interface.

**Phase 2**: Okta SAML 2.0 / OIDC integration. Architecture:
```
Browser --> NextJS BFF --> /api/auth/callback --> Okta
                                                    |
                                          JWT issued with:
                                          - user_id
                                          - email
                                          - groups (role mapping)
                                          - department
```

Okta groups map to NuChallenge roles:
- `nuchallenge-users` --> Challenger
- `nuchallenge-evaluators` --> Evaluator
- `nuchallenge-admins` --> Admin
- `nuchallenge-builders` --> Builder

**Phase 3**: SCIM provisioning for automatic user lifecycle management (onboarding/offboarding sync).

---

---

## SECTION 7: Technical Architecture

### 7.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  Next.js App (React 19, TypeScript, Tailwind)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │Challenge │ │Portfolio │ │Leader-   │ │Admin     │              │
│  │Explorer  │ │/Profile  │ │board     │ │Dashboard │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                     Next.js Route Handlers (BFF)
                     /api/challenges/*
                     /api/submissions/*
                     /api/users/*
                     /api/admin/*
                     /api/auth/*
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOJURE SERVICES LAYER                            │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Challenge    │  │ Submission   │  │ User         │              │
│  │ Service      │  │ Service      │  │ Service      │              │
│  │ - catalog    │  │ - submit     │  │ - profile    │              │
│  │ - unlock     │  │ - evaluate   │  │ - points     │              │
│  │ - progress   │  │ - retry      │  │ - reputation │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Evaluation   │  │ Sandbox      │  │ Gamification │              │
│  │ Service      │  │ Service      │  │ Service      │              │
│  │ - AI judge   │  │ - code exec  │  │ - badges     │              │
│  │ - test run   │  │ - SQL exec   │  │ - streaks    │              │
│  │ - human Q    │  │ - timeout    │  │ - leaderboard│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ PostgreSQL   │  │ Redis        │  │ S3 / Blob    │              │
│  │ - users      │  │ - sessions   │  │ - submissions│              │
│  │ - challenges │  │ - cache      │  │ - assets     │              │
│  │ - submissions│  │ - leaderboard│  │ - rubrics    │              │
│  │ - points     │  │ - streaks    │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Database Choice: PostgreSQL over Datomic

**Decision: PostgreSQL** for NuChallenge, despite Nubank's Datomic expertise.

Rationale:
- NuChallenge is a learning platform, not a financial transaction system. The immutability and temporal query advantages of Datomic are less critical here.
- PostgreSQL has superior tooling for the types of queries NuChallenge needs (leaderboard rankings, point aggregations, submission search).
- The team building NuChallenge includes engineers who may not have deep Datomic experience; PostgreSQL's ubiquity reduces onboarding friction.
- PostgreSQL JSONB columns provide flexibility for challenge-specific metadata that varies across 50 different challenge types.
- Event sourcing for audit trails (point transactions, evaluation history) can be implemented in PostgreSQL with an append-only events table.

Datomic remains available as an integration target if NuChallenge later needs to reference Nubank organizational data stored in Datomic.

### 7.3 Data Model

**Core Entities:**

```sql
-- Users
users (
  id UUID PK,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  interests TEXT[], -- user-selected skill tags they're interested in
  platform_role TEXT[], -- ['challenger', 'evaluator', 'admin', 'builder']
  points_total INTEGER DEFAULT 0,
  reputation_total INTEGER DEFAULT 0,
  reputation_impact DECIMAL DEFAULT 0,
  reputation_execution DECIMAL DEFAULT 0,
  reputation_collaboration DECIMAL DEFAULT 0,
  reputation_growth DECIMAL DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  badges TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Challenges (the 50 challenge definitions)
challenges (
  id TEXT PK, -- 'PM-01', 'DEV-05', etc.
  title TEXT NOT NULL,
  tags TEXT[] NOT NULL, -- skill tags like 'coding', 'strategy', 'data-analysis'
  difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  time_minutes INTEGER NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL, -- full challenge instructions (markdown)
  submission_format TEXT NOT NULL, -- what to submit
  evaluation_method TEXT NOT NULL, -- 'ai-judge', 'automated-test', 'human-review', 'hybrid'
  rubric JSONB, -- evaluation rubric (criteria, weights)
  test_suite_id TEXT, -- reference to test suite for automated challenges
  anti_cheat_tier TEXT, -- 'T0', 'T1', 'T2', 'T3'
  points_base INTEGER NOT NULL,
  prerequisites TEXT[], -- challenge IDs that must be completed first
  produces_asset BOOLEAN DEFAULT FALSE,
  asset_type TEXT, -- 'document', 'code', 'spec', etc.
  context_template JSONB, -- template for randomized context per challenger
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ
)

-- Challenge Attempts (a user working on a challenge)
attempts (
  id UUID PK,
  user_id UUID FK -> users,
  challenge_id TEXT FK -> challenges,
  attempt_number INTEGER DEFAULT 1, -- 1, 2, or 3
  status TEXT NOT NULL, -- 'in_progress', 'submitted', 'evaluating', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  context_data JSONB, -- randomized context for this attempt
  submission_url TEXT, -- S3 reference
  submission_text TEXT, -- inline submission
  iterations JSONB[], -- for T2 challenges: array of iteration snapshots
  evaluation_result JSONB, -- scores, feedback, confidence
  evaluator_type TEXT, -- 'ai', 'human', 'automated', 'hybrid'
  evaluator_id UUID, -- human evaluator if applicable
  points_awarded INTEGER,
  quality_score DECIMAL, -- 0-100
  appeal_status TEXT, -- null, 'pending', 'reviewed', 'upheld', 'overturned'
  created_at TIMESTAMPTZ
)

-- Point Transactions
point_transactions (
  id UUID PK,
  user_id UUID FK -> users,
  attempt_id UUID FK -> attempts,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'challenge_complete', 'quality_bonus', 'speed_bonus', 'streak_bonus', 'appeal_adjustment'
  description TEXT,
  created_at TIMESTAMPTZ
)

-- Assets (work products from challenges that feed into later challenges)
assets (
  id UUID PK,
  user_id UUID FK -> users,
  attempt_id UUID FK -> attempts,
  challenge_id TEXT FK -> challenges,
  asset_type TEXT NOT NULL,
  content_url TEXT, -- S3 reference
  content_text TEXT, -- inline content
  metadata JSONB,
  created_at TIMESTAMPTZ
)

-- Evaluation Queue (for human reviewers)
evaluation_queue (
  id UUID PK,
  attempt_id UUID FK -> attempts,
  evaluator_id UUID FK -> users,
  priority INTEGER DEFAULT 0,
  assigned_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT -- 'pending', 'in_review', 'completed'
)

-- Streaks
streak_events (
  id UUID PK,
  user_id UUID FK -> users,
  event_date DATE NOT NULL,
  event_type TEXT -- 'challenge_started', 'submission', 'completion'
)
```

### 7.4 Key API Endpoints

**Challenge Catalog:**
- `GET /api/challenges` -- list all challenges with unlock status for current user
- `GET /api/challenges/:id` -- challenge detail with instructions and context
- `GET /api/challenges/:id/context` -- generate randomized context for this user

**Submissions:**
- `POST /api/challenges/:id/start` -- begin an attempt, lock context
- `POST /api/challenges/:id/submit` -- submit work for evaluation
- `POST /api/challenges/:id/iterate` -- submit iteration (T2 challenges)
- `GET /api/submissions/:id/result` -- get evaluation results
- `POST /api/submissions/:id/appeal` -- file an appeal

**User/Profile:**
- `GET /api/users/me` -- current user profile with points, level, badges, progress
- `GET /api/users/me/portfolio` -- all completed challenges and assets
- `GET /api/users/me/progress` -- track progress with unlock visualization

**Leaderboard:**
- `GET /api/leaderboard?view=overall|track|team&period=quarter|alltime`

**Admin:**
- `GET /api/admin/analytics` -- platform usage metrics
- `GET /api/admin/evaluation-queue` -- pending human reviews
- `POST /api/admin/challenges` -- create/update challenges
- `GET /api/admin/submissions?status=pending|flagged` -- review queue

### 7.5 Code Execution Sandbox

For Dev track challenges requiring code execution:

**Architecture:**
- Docker containers with Clojure runtime pre-installed
- Containers are ephemeral (created per test run, destroyed after)
- Resource limits: 512MB RAM, 1 CPU, 30-second timeout
- No network access inside container
- Read-only filesystem except for /tmp
- Test suite injected at runtime alongside submission code

**Flow:**
```
Submission --> Sandbox Orchestrator --> Create Container
                                           |
                                    Copy: test suite + submission code
                                           |
                                    Execute: lein test
                                           |
                                    Capture: stdout, stderr, exit code
                                           |
                                    Parse: test results (pass/fail per test)
                                           |
                                    Destroy container
                                           |
                                    Return: structured results
```

**Implementation:** Kubernetes Jobs with a custom controller. Each job:
- Uses a pre-built Clojure base image
- Mounts the submission as a ConfigMap
- Runs tests with a wrapper that outputs structured JSON
- Controller watches for job completion and extracts results

### 7.6 AI Evaluation Service

**Architecture:**
- Clojure service wrapping LLM API calls (Claude API preferred, OpenAI as fallback)
- Rubric-based prompting: the system prompt contains the rubric, the user message contains the submission
- Structured output parsing: LLM returns JSON with per-criterion scores
- Confidence calculation: based on response consistency (run twice if confidence < 0.7)
- Cost tracking: every evaluation logged with token count and cost

**Prompt Template:**
```
You are evaluating a submission for the challenge "{challenge_title}".

## Rubric
{rubric_criteria_with_weights}

## Challenge Context
{challenge_description}
{reference_materials}

## Submission
{submission_content}

Score each criterion on a 0-10 scale. Provide a brief justification for each score.
Return JSON: {"criteria": [{"name": "...", "score": N, "justification": "..."}], "overall_score": N, "confidence": 0.0-1.0, "feedback": "..."}
```

### 7.7 SSO Abstraction Layer

Auth is abstracted behind an interface from day 1:

```clojure
(defprotocol AuthProvider
  (authenticate [this credentials] "Returns user info or nil")
  (validate-token [this token] "Returns claims or nil")
  (get-user-roles [this user-id] "Returns role set"))

;; Phase 1: Local auth
(defrecord LocalAuthProvider [db]
  AuthProvider
  (authenticate [this {:keys [email password]}]
    (verify-password db email password))
  ...)

;; Phase 2: Okta
(defrecord OktaAuthProvider [okta-config]
  AuthProvider
  (authenticate [this {:keys [saml-response]}]
    (parse-saml-assertion okta-config saml-response))
  ...)
```

Next.js BFF uses middleware to validate JWT on every request:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  const claims = await validateToken(token) // calls Clojure auth service
  if (!claims) return redirect('/login')
  // Inject user context into request headers for downstream handlers
}
```

---

---

## SECTION 8: UI/UX Design Direction

### 8.1 Key Screens

1. **Challenge Explorer** (home): Card grid of available challenges, filtered by track and difficulty. Locked challenges show as dimmed with prerequisite indicator. Current track progress shown as a path visualization.

2. **Challenge Detail**: Full instructions, timer, submission area, iteration history (for T2 challenges). Right sidebar shows: points, time estimate, difficulty, prerequisites, evaluation method. Asset references from prior challenges displayed inline.

3. **Active Challenge Workspace**: Split-pane view: instructions on left, submission editor on right. For code challenges: Monaco editor with Clojure syntax highlighting. Iteration panel at bottom for T2 challenges showing version history.

4. **Results Screen**: Per-criterion scores with AI feedback. Overall score visualization. Points awarded with breakdown. "Next challenge" recommendation. Appeal button if applicable.

5. **Profile/Portfolio**: Track progress visualization (path with completed nodes). Badge collection. Point history graph. Portfolio of completed work products organized by track.

6. **Leaderboard**: Podium for top 3, table for rest. Tabs for overall/track/team. Quarter selector. Sortable columns.

7. **Admin Dashboard**: Submission queue, evaluation metrics, platform analytics (completion rates, avg scores, active users), challenge management.

### 8.2 Design Principles

1. **Progress is always visible.** Every screen shows how far the user has come and what is next.
2. **Evaluation is transparent.** Users see exactly how they were scored, on which criteria, with AI justification.
3. **One action per screen.** The active challenge workspace focuses entirely on the current challenge. No distractions.
4. **Celebration moments.** Completing a challenge triggers a satisfying animation, points counter incrementing, and badge reveal if earned.
5. **Mobile-aware, desktop-first.** Challenge completion requires focused work -- mobile is for checking progress and leaderboard, not for doing challenges.

### 8.3 Interaction Patterns

- **Progressive disclosure**: Challenge instructions are revealed in sections as the user scrolls, preventing overwhelm.
- **Autosave**: Submission drafts are saved every 30 seconds. Users can leave and return.
- **Timer**: Non-punitive. Shows elapsed time for personal awareness but does not auto-submit. Speed bonus is calculated but no hard cutoff.
- **Hint system**: Each challenge has 3 hints, progressively more specific. Hints encourage using AI tools creatively, not giving answers. Example hint for PM-05: "Try asking an AI to fact-check the revenue figures against public financial reports." Using hints does not reduce points.

### 8.4 Mobile Considerations

- Responsive layout that stacks sidebar below content on mobile
- Code editor falls back to textarea on mobile (Monaco is desktop-only)
- Push notifications for evaluation results
- Leaderboard and profile are fully mobile-optimized
- Challenge completion is desktop-recommended but not desktop-required

---

---

## SECTION 9: Implementation Roadmap

### Phase 1: MVP (Weeks 1-8)

**Scope:**
- 15 challenges (3 per role track, Beginner + Intermediate only)
- AI-judge evaluation for all 15
- Local authentication (email/password)
- Challenge explorer, workspace, results, profile, leaderboard
- Points and level system
- No human review, no sandbox execution, no collaborative challenges

**Engineering Effort:**
- Next.js BFF: 2 engineers, 4 weeks
- Clojure services (challenge, submission, user, evaluation): 2 engineers, 6 weeks
- AI evaluation integration: 1 engineer, 3 weeks
- Database schema + data seeding: 1 engineer, 2 weeks
- Frontend (React): 2 engineers, 5 weeks

**Total: ~4 engineers, 8 weeks (with overlap)**

### Phase 2: Full Catalog + Code Sandbox (Weeks 9-16)

**Scope:**
- Remaining 35 challenges (all 50 live)
- Docker sandbox for Dev track code execution
- Automated test runner for SQL/data challenges
- Human evaluation queue + evaluator UI
- Hybrid evaluation pipeline
- Streak mechanics and badges
- Appeal system

**Engineering Effort:**
- Sandbox service: 1 engineer, 4 weeks
- Remaining challenge content + rubrics: 2 content engineers, 6 weeks
- Human review UI + queue: 1 engineer, 3 weeks
- Gamification features: 1 engineer, 3 weeks

**Total: ~3-4 engineers, 8 weeks**

### Phase 3: Enterprise Platform (Weeks 17-26)

**Scope:**
- Okta SSO integration
- Builder role: challenge creation UI
- Analytics dashboard for admins
- Collaborative challenges (XF-02, XF-04) requiring real-time pairing
- Team leaderboards with department integration
- Asset chaining verification (automated cross-reference checks)
- Performance optimization (caching, CDN, read replicas)

**Engineering Effort:**
- SSO: 1 engineer, 3 weeks
- Builder tools: 2 engineers, 5 weeks
- Analytics: 1 engineer, 4 weeks
- Collaborative features: 1 engineer, 4 weeks
- Infrastructure: 1 engineer, ongoing

**Total: ~4 engineers, 10 weeks**

### Estimated Timeline Summary

| Phase | Duration | Cumulative | Challenges Live | Key Milestone |
|-------|----------|-----------|----------------|---------------|
| Phase 1 | 8 weeks | Week 8 | 15 | Internal beta with 50 users |
| Phase 2 | 8 weeks | Week 16 | 50 | Full catalog, open to all employees |
| Phase 3 | 10 weeks | Week 26 | 50+ (user-created) | Enterprise-grade with SSO and analytics |

---

---

## SECTION 10: Risk Assessment

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI evaluation inconsistency (same submission gets different scores on re-evaluation) | High | Medium | Run evaluation twice and average. Cache results. 10% human audit sample. Rubric refinement based on disagreements. |
| Code sandbox escape (malicious code breaks out of Docker container) | Low | High | No network access, read-only filesystem, resource limits, run as non-root, gVisor runtime for additional isolation. |
| LLM API cost overrun | Medium | Medium | Budget alerts, per-challenge cost tracking, fallback to cheaper models for beginner challenges, batch evaluation during off-peak. |
| Submission storage growth | Medium | Low | S3 lifecycle policies (archive after 1 year), text compression, limit submission size (10MB). |
| Context generation complexity (creating unique contexts for 50 challenges x N users) | Medium | Medium | Template-based context generation with parameterized variables. Pre-generate context pools rather than real-time generation. |

### 10.2 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low adoption: employees view as "homework" | High | High | Manager endorsement program. Link completion to onboarding checklist. Make beginner track genuinely quick (< 1 hour for first 2 challenges). Celebrate completions publicly. |
| Anti-cheating false positives (legitimate AI use flagged as cheating) | Medium | High | T0 and T1 are explicitly AI-friendly. Clear messaging that AI use is encouraged. Anti-cheating targets submission quality, not AI usage. Appeal process. |
| Challenge staleness (challenges become "known" and solutions circulate) | Medium | Medium | Context randomization per user. Quarterly challenge refresh cycle. New challenges added continuously. Version challenges with different planted errors/contexts. |
| Evaluation quality drift (AI scores diverge from human expectations over time) | Medium | Medium | Continuous calibration via human audit sample. Monthly rubric review. Evaluator training for human reviewers. |
| Scope creep in challenge design (50 challenges is a lot of content to maintain) | High | Medium | Challenge content is markdown/JSON, not code. Invest in a challenge authoring tool (Phase 3 Builder role). Template-based challenge creation for similar patterns. |

### 10.3 Organizational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Manager resistance (seen as time away from "real work") | Medium | High | Frame as onboarding requirement, not optional training. Show correlation between challenge completion and AI tool productivity metrics. Get executive sponsorship. |
| Cross-team comparison anxiety (leaderboard creates unhealthy competition) | Medium | Medium | Make leaderboard opt-in for public display. Focus team leaderboards on collective progress, not individual ranking. No punitive consequences for low scores. |
| Content maintenance burden | High | Medium | Establish a challenge content rotation. Empower Builders (Phase 3) to create and maintain challenges. Automate context generation. |

---

---

*This PRD was generated on March 29, 2026, for NuChallenge v2.0.*
*Parent project: Mission Marketplace (Operon Whitepaper)*
