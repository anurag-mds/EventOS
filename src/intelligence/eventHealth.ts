// ─── Intelligence: Event Health ──────────────────────────────────────────────
// Pure function — produces a 0–100 health score from live event state metrics.
// Formula: health = round(0.35×attendance + 0.25×teamFormation + 0.25×judging + 0.15×judgeBalance) × 100

import type { HackathonEvent, Team, Submission, Incident, Participant, Judge } from '../state/types';

export interface EventHealthInput {
  event: HackathonEvent;
  teams: Team[];
  submissions: Submission[];
  incidents: Incident[];
  participants: Participant[];
  judges: Judge[];
}

export interface EventHealthResult {
  /** Composite health score 0–100 */
  score: number;
  /** Breakdown of individual components (0–1 scale before weighting) */
  breakdown: {
    /** Ratio of participants checked in (0–1) */
    attendanceRatio: number;
    /** Ratio of teams that have submitted (0–1) */
    teamFormationRatio: number;
    /** Ratio of submissions with at least one score (0–1) */
    judgingProgressRatio: number;
    /** Judge balance score: 1 = perfectly balanced, 0 = severely unbalanced (0–1) */
    judgeBalanceScore: number;
  };
  label: 'critical' | 'at-risk' | 'healthy' | 'excellent';
}

/**
 * Weights for each component of event health.
 * Total = 1.0 (100%)
 */
const WEIGHTS = {
  attendance: 0.35,       // 35%: how many participants are checked in
  teamFormation: 0.25,    // 25%: how many teams have submitted
  judgingProgress: 0.25,  // 25%: how many submissions have been scored
  judgeBalance: 0.15,     // 15%: how evenly work is distributed across judges
} as const;

/**
 * Computes judge balance score based on workload distribution.
 * 
 * Formula: judgeBalanceScore = 1 - min(1, (maxLoad - avgLoad) / avgLoad)
 * 
 * - Returns 1.0 when all judges have equal load (perfectly balanced)
 * - Returns 0.0 when max judge has infinite load relative to average (severely unbalanced)
 * - Handles edge cases: no judges, zero average load
 * 
 * @param judges - Array of all judges with their assigned submissions
 * @returns Score between 0 and 1, where 1 is perfectly balanced
 */
function computeJudgeBalanceScore(judges: Judge[]): number {
  if (judges.length === 0) return 1; // No judges = no imbalance

  const loads = judges.map((j) => j.assignedSubmissionIds.length);
  const maxLoad = Math.max(...loads);
  const avgLoad = loads.reduce((sum, l) => sum + l, 0) / loads.length;

  // If no one has assignments, perfect balance
  if (avgLoad === 0) return 1;

  // judgeBalanceScore = 1 - min(1, (maxLoad - avgLoad) / avgLoad)
  const imbalanceRatio = (maxLoad - avgLoad) / avgLoad;
  const balanceScore = 1 - Math.min(1, imbalanceRatio);

  return balanceScore;
}

/**
 * Computes overall event health as a weighted composite score.
 * 
 * Formula:
 *   health = round(
 *     0.35 × attendanceRatio +
 *     0.25 × teamFormationRatio +
 *     0.25 × judgingProgressRatio +
 *     0.15 × judgeBalanceScore
 *   ) × 100
 * 
 * All inputs are plain data — no store reads, no side effects.
 * 
 * @param input - Snapshot of event state (participants, teams, submissions, judges)
 * @returns Health score (0–100) with breakdown and label
 */
export function eventHealth(input: EventHealthInput): EventHealthResult {
  const { teams, submissions, participants, judges } = input;

  // ── Attendance Ratio ─────────────────────────────────────────────────────────
  // Fraction of registered participants who have checked in (0–1)
  const checkedInCount = participants.filter((p) => p.checkedIn).length;
  const attendanceRatio = participants.length > 0 ? checkedInCount / participants.length : 0;

  // ── Team Formation Ratio ─────────────────────────────────────────────────────
  // Fraction of teams that have submitted their project (0–1)
  const teamsWithSubmissions = teams.filter((t) => t.submissionId !== null).length;
  const teamFormationRatio = teams.length > 0 ? teamsWithSubmissions / teams.length : 0;

  // ── Judging Progress Ratio ───────────────────────────────────────────────────
  // Fraction of submissions that have received at least one score (0–1)
  const submissionsScored = submissions.filter((s) => Object.keys(s.scores).length > 0).length;
  const judgingProgressRatio = submissions.length > 0 ? submissionsScored / submissions.length : 1;

  // ── Judge Balance Score ──────────────────────────────────────────────────────
  // Measures how evenly judging workload is distributed (0–1, where 1 = perfect balance)
  const judgeBalanceScore = computeJudgeBalanceScore(judges);

  // ── Weighted Sum ─────────────────────────────────────────────────────────────
  // Apply weights and scale to 0–100
  const rawScore =
    WEIGHTS.attendance * attendanceRatio +
    WEIGHTS.teamFormation * teamFormationRatio +
    WEIGHTS.judgingProgress * judgingProgressRatio +
    WEIGHTS.judgeBalance * judgeBalanceScore;

  const score = Math.round(rawScore * 100);

  // ── Label ────────────────────────────────────────────────────────────────────
  // Categorical assessment of event health
  const label: EventHealthResult['label'] =
    score >= 85 ? 'excellent' :
    score >= 65 ? 'healthy' :
    score >= 40 ? 'at-risk' :
    'critical';

  return {
    score,
    breakdown: {
      attendanceRatio,
      teamFormationRatio,
      judgingProgressRatio,
      judgeBalanceScore,
    },
    label,
  };
}
