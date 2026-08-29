// ─── Intelligence: Judge Overload ────────────────────────────────────────────
// Pure function — no side effects, no imports from store.
// Returns IDs of judges that have exceeded their capacity limit.

import type { Judge } from '../state/types';

export interface JudgeOverloadResult {
  overloadedJudgeIds: string[];
  /** Map of judgeId → number of assignments over capacity */
  overloadBy: Record<string, number>;
}

/**
 * Flags judges whose assigned submission count exceeds their capacity limit.
 *
 * @param judges - Array or record values of all Judge entities
 * @returns Overload analysis result
 */
export function judgeOverload(judges: Judge[]): JudgeOverloadResult {
  const overloadedJudgeIds: string[] = [];
  const overloadBy: Record<string, number> = {};

  for (const judge of judges) {
    const assigned = judge.assignedSubmissionIds.length;
    if (assigned > judge.capacityLimit) {
      overloadedJudgeIds.push(judge.id);
      overloadBy[judge.id] = assigned - judge.capacityLimit;
    }
  }

  return { overloadedJudgeIds, overloadBy };
}
