import type { EvaluationOutput } from './ai-judge';

interface ScoringInput {
  evaluation: EvaluationOutput;
  challengePointsBase: number;
  timeMinutes: number;
  actualMinutes: number;
  currentStreak: number;
  hintsUsed: number;
}

interface ScoringOutput {
  basePoints: number;
  qualityBonus: number;
  speedBonus: number;
  streakBonus: number;
  hintPenalty: number;
  totalPoints: number;
  qualityScore: number;
}

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Novice', minPoints: 0 },
  { level: 2, name: 'Contributor', minPoints: 500 },
  { level: 3, name: 'Expert', minPoints: 2000 },
  { level: 4, name: 'Master', minPoints: 5000 },
  { level: 5, name: 'Champion', minPoints: 10000 },
];

export function calculateScore(input: ScoringInput): ScoringOutput {
  const { evaluation, challengePointsBase, timeMinutes, actualMinutes, currentStreak, hintsUsed } = input;

  // Base points: proportional to quality score
  const qualityScore = evaluation.overallScore;
  const basePoints = Math.round(challengePointsBase * (qualityScore / 100));

  // Quality bonus: extra 20% for scores >= 90
  const qualityBonus = qualityScore >= 90
    ? Math.round(challengePointsBase * 0.2)
    : qualityScore >= 80
      ? Math.round(challengePointsBase * 0.1)
      : 0;

  // Speed bonus: 15% if completed in under 60% of estimated time
  const timeRatio = actualMinutes / timeMinutes;
  const speedBonus = timeRatio <= 0.6
    ? Math.round(challengePointsBase * 0.15)
    : timeRatio <= 0.8
      ? Math.round(challengePointsBase * 0.05)
      : 0;

  // Streak bonus: 5% per day of streak, max 25%
  const streakMultiplier = Math.min(currentStreak * 0.05, 0.25);
  const streakBonus = Math.round(challengePointsBase * streakMultiplier);

  // Hint penalty: -5% per hint used
  const hintPenalty = Math.round(challengePointsBase * hintsUsed * 0.05);

  const totalPoints = Math.max(0, basePoints + qualityBonus + speedBonus + streakBonus - hintPenalty);

  return {
    basePoints,
    qualityBonus,
    speedBonus,
    streakBonus,
    hintPenalty,
    totalPoints,
    qualityScore,
  };
}

export function getLevelForPoints(points: number): { level: number; name: string } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      return { level: LEVEL_THRESHOLDS[i].level, name: LEVEL_THRESHOLDS[i].name };
    }
  }
  return { level: 1, name: 'Novice' };
}

export function getNextLevelProgress(points: number): {
  currentLevel: number;
  nextLevel: number | null;
  pointsToNext: number | null;
  progress: number;
} {
  const current = getLevelForPoints(points);
  const currentIdx = LEVEL_THRESHOLDS.findIndex(t => t.level === current.level);
  const nextThreshold = LEVEL_THRESHOLDS[currentIdx + 1];

  if (!nextThreshold) {
    return { currentLevel: current.level, nextLevel: null, pointsToNext: null, progress: 1 };
  }

  const currentMin = LEVEL_THRESHOLDS[currentIdx].minPoints;
  const range = nextThreshold.minPoints - currentMin;
  const progress = (points - currentMin) / range;

  return {
    currentLevel: current.level,
    nextLevel: nextThreshold.level,
    pointsToNext: nextThreshold.minPoints - points,
    progress: Math.min(1, progress),
  };
}

// Badge evaluation
const BADGE_RULES: { name: string; check: (stats: BadgeStats) => boolean }[] = [
  { name: 'First Steps', check: s => s.completedChallenges >= 1 },
  { name: 'Speed Demon', check: s => s.speedBonusCount >= 3 },
  { name: 'Perfectionist', check: s => s.perfectScoreCount >= 1 },
  { name: 'Tag Explorer', check: s => s.uniqueTagsCompleted >= 5 },
  { name: 'Bug Hunter', check: s => s.codingChallengesCompleted >= 5 },
  { name: 'Streak Master', check: s => s.longestStreak >= 7 },
  { name: 'Unstoppable', check: s => s.longestStreak >= 30 },
  { name: 'Centurion', check: s => s.totalPoints >= 10000 },
  { name: 'All-Rounder', check: s => s.uniqueTagsCompleted >= 15 },
  { name: 'Full House', check: s => s.completedChallenges >= 50 },
];

interface BadgeStats {
  completedChallenges: number;
  speedBonusCount: number;
  perfectScoreCount: number;
  uniqueTagsCompleted: number;
  codingChallengesCompleted: number;
  longestStreak: number;
  totalPoints: number;
}

export function evaluateBadges(stats: BadgeStats, existingBadges: string[]): string[] {
  const newBadges: string[] = [];
  for (const rule of BADGE_RULES) {
    if (!existingBadges.includes(rule.name) && rule.check(stats)) {
      newBadges.push(rule.name);
    }
  }
  return newBadges;
}
