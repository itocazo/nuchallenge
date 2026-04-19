export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type EvaluationMethod = 'ai-judge' | 'automated-test' | 'human-review' | 'hybrid';
export type AntiCheatTier = 'T0' | 'T1' | 'T2' | 'T3';
export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluating' | 'completed' | 'failed';
export type ChallengeUserStatus = 'available' | 'in_progress' | 'completed' | 'locked';

export interface RubricCriterion {
  name: string;
  weight: number;
  description: string;
}

/**
 * Optional auto-grader config attached to a challenge's rubric.
 * When present, the dispatcher uses it instead of (or alongside) the AI judge.
 * The shape is intentionally loose here — the grader-specific config is
 * validated at runtime by each grader module.
 */
export interface ChallengeGraderConfig {
  type: 'regex' | 'structured' | 'code-sandbox' | 'multi-choice';
  config: Record<string, unknown>;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  instructions: string;
  tags: string[];
  difficulty: Difficulty;
  timeMinutes: number;
  pointsBase: number;
  submissionFormat: string;
  evaluationMethod: EvaluationMethod;
  rubric: {
    criteria: RubricCriterion[];
    grader?: ChallengeGraderConfig;
    /** Optional override for hybrid evaluation weights. Defaults to 0.7 auto / 0.3 AI. Values should sum to 1. */
    hybridWeights?: { auto: number; ai: number };
  };
  antiCheatTier: AntiCheatTier;
  prerequisites: string[];
  producesAsset: boolean;
  assetType: string | null;
  hints: { level: number; text: string }[];
  active: boolean;
}

export interface ChallengeWithStatus extends Challenge {
  userStatus: ChallengeUserStatus;
  bestScore: number | null;
  prerequisitesMet: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  interests: string[];
  level: number;
  levelName: string;
  pointsTotal: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  challengeStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export interface Attempt {
  id: string;
  userId: string;
  challengeId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  submissionText: string | null;
  draftText: string | null;
  evaluationResult: EvaluationResult | null;
  pointsAwarded: number | null;
  qualityScore: number | null;
}

export interface EvaluationResult {
  criteria: {
    name: string;
    weight: number;
    score: number;
    justification: string;
  }[];
  overallScore: number;
  confidence: number;
  feedback: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  department: string;
  level: number;
  points: number;
  challengesCompleted: number;
  streak: number;
  isCurrentUser: boolean;
}

export const ALL_TAGS = [
  'Prompt Engineering', 'AI Evaluation', 'Coding', 'Data Analysis',
  'Writing & Documentation', 'Communication', 'Critical Thinking', 'Research',
  'Product Thinking', 'Strategy', 'Design', 'Process Design',
  'Financial Analysis', 'Tech Architecture', 'Security', 'Testing & QA',
  'Leadership', 'Collaboration', 'Teaching', 'Accessibility',
  'Problem Solving', 'Critical Review',
] as const;

export type Tag = typeof ALL_TAGS[number];

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bgColor: string }> = {
  beginner: { label: 'Beginner', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  intermediate: { label: 'Intermediate', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  advanced: { label: 'Advanced', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  expert: { label: 'Expert', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
};

export const TAG_ICONS: Record<string, string> = {
  'Prompt Engineering': 'Sparkles',
  'AI Evaluation': 'ScanSearch',
  'Coding': 'Code',
  'Data Analysis': 'BarChart3',
  'Writing & Documentation': 'FileText',
  'Communication': 'MessageSquare',
  'Critical Thinking': 'Brain',
  'Research': 'Search',
  'Product Thinking': 'Lightbulb',
  'Strategy': 'Target',
  'Design': 'Palette',
  'Process Design': 'GitBranch',
  'Financial Analysis': 'DollarSign',
  'Tech Architecture': 'Server',
  'Security': 'Shield',
  'Testing & QA': 'CheckCircle',
  'Leadership': 'Users',
  'Collaboration': 'Handshake',
  'Teaching': 'GraduationCap',
  'Accessibility': 'Eye',
  'Problem Solving': 'Puzzle',
  'Critical Review': 'ClipboardCheck',
};
