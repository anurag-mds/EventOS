// ─── Intelligence: Incident Detection ────────────────────────────────────────
// Pure functions — no store mutations.

import type { EventState, Incident, Judge, Submission } from '../state/types';

export const JUDGE_OVERLOAD_THRESHOLD = 1.8;

export interface JudgeOverloadRecommendation {
  overloadedJudgeId: string;
  overloadedJudgeName: string;
  targetJudgeId: string;
  targetJudgeName: string;
  submissionIdsToMove: string[];
  pendingCount: number;
  averagePending: number;
  overloadRatio: number;
}

/** Pending = assigned submissions this judge has not yet scored. */
export function judgePendingCount(
  judge: Judge,
  submissions: Record<string, Submission>
): number {
  return judge.assignedSubmissionIds.filter((id) => {
    const sub = submissions[id];
    return sub !== undefined && sub.scores[judge.id] === undefined;
  }).length;
}

function buildRecommendation(
  state: EventState,
  overloadedJudge: Judge,
  pendingCount: number,
  averagePending: number
): JudgeOverloadRecommendation {
  const judges = Object.values(state.judges);
  const target = judges
    .filter((j) => j.id !== overloadedJudge.id)
    .sort(
      (a, b) =>
        judgePendingCount(a, state.submissions) -
        judgePendingCount(b, state.submissions)
    )[0];

  const movable = overloadedJudge.assignedSubmissionIds.filter((id) => {
    const sub = state.submissions[id];
    return sub && sub.scores[overloadedJudge.id] === undefined;
  });

  const threshold = averagePending * JUDGE_OVERLOAD_THRESHOLD;
  let simulatedPending = pendingCount;
  let n = 0;

  while (simulatedPending > threshold && n < movable.length) {
    n++;
    simulatedPending--;
  }

  if (n === 0 && movable.length > 0) {
    n = 1;
  }

  const overloadRatio = averagePending > 0 ? pendingCount / averagePending : pendingCount;

  return {
    overloadedJudgeId: overloadedJudge.id,
    overloadedJudgeName: overloadedJudge.name,
    targetJudgeId: target?.id ?? overloadedJudge.id,
    targetJudgeName: target?.name ?? '—',
    submissionIdsToMove: movable.slice(0, n),
    pendingCount,
    averagePending: Math.round(averagePending * 10) / 10,
    overloadRatio: Math.round(overloadRatio * 10) / 10,
  };
}

/**
 * Returns a judge-overload incident when any judge's pending load exceeds
 * 1.8× the average pending load across all judges.
 */
export function detectJudgeOverload(state: EventState): Incident | null {
  const judges = Object.values(state.judges);
  if (judges.length === 0) return null;

  const pendingCounts = judges.map((j) => ({
    judge: j,
    pending: judgePendingCount(j, state.submissions),
  }));

  const totalPending = pendingCounts.reduce((sum, p) => sum + p.pending, 0);
  const averagePending = totalPending / judges.length;

  const overloaded = pendingCounts
    .filter(({ pending }) => pending > averagePending * JUDGE_OVERLOAD_THRESHOLD)
    .sort((a, b) => b.pending - a.pending)[0];

  if (!overloaded || overloaded.pending === 0) return null;

  const recommendation = buildRecommendation(
    state,
    overloaded.judge,
    overloaded.pending,
    averagePending
  );

  const ratioLabel = recommendation.overloadRatio.toFixed(1);

  return {
    id: `inc-judge-overload-${overloaded.judge.id}`,
    kind: 'judge_overload',
    title: 'Judge workload overload',
    description:
      `${recommendation.overloadedJudgeName} has ${recommendation.pendingCount} pending evaluations ` +
      `(avg ${recommendation.averagePending}) — ${ratioLabel}× the average. ` +
      `Move ${recommendation.submissionIdsToMove.length} submission(s) to ${recommendation.targetJudgeName}.`,
    severity: recommendation.overloadRatio >= 2.5 ? 'critical' : 'high',
    status: 'open',
    reportedAt: Date.now(),
    resolvedAt: null,
    affectedTeamIds: [],
    recommendation,
  };
}
