// ─── Intelligence: Event Health ──────────────────────────────────────────────
// Pure function — produces a 0–100 health score from live event state metrics.

import type { HackathonEvent, Team, Submission, Incident, Participant } from '../state/types';

export interface EventHealthInput {
  event: HackathonEvent;
  teams: Team[];
  submissions: Submission[];
  incidents: Incident[];
  participants: Participant[];
}

export interface EventHealthResult {
  /** Composite health score 0–100 */
  score: number;
  /** Breakdown of individual components */
  breakdown: {
    /** % of teams that have submitted */
    submissionRate: number;
    /** Penalty from open high/critical incidents */
    incidentPenalty: number;
    /** % of participants checked in */
    checkInRate: number;
    /** % of submissions with at least one score */
    judgingCoverage: number;
  };
  label: 'critical' | 'at-risk' | 'healthy' | 'excellent';
}

const WEIGHTS = {
  submissionRate: 0.35,
  checkInRate: 0.20,
  judgingCoverage: 0.30,
  incidentPenalty: 0.15, // subtracted
} as const;

function incidentPenaltyScore(incidents: Incident[]): number {
  const severityPenalty: Record<string, number> = {
    critical: 25,
    high: 12,
    medium: 5,
    low: 2,
  };
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const total = openIncidents.reduce(
    (sum, inc) => sum + (severityPenalty[inc.severity] ?? 0),
    0
  );
  // Clamp penalty to 0–100
  return Math.min(100, total);
}

/**
 * Computes overall event health as a weighted composite score.
 * All inputs are plain data — no store reads.
 */
export function eventHealth(input: EventHealthInput): EventHealthResult {
  const { teams, submissions, incidents, participants } = input;

  const teamsWithSubs = teams.filter((t) => t.submissionId !== null).length;
  const submissionRate = teams.length > 0 ? (teamsWithSubs / teams.length) * 100 : 0;

  const checkedIn = participants.filter((p) => p.checkedIn).length;
  const checkInRate = participants.length > 0 ? (checkedIn / participants.length) * 100 : 0;

  const scored = submissions.filter((s) => Object.keys(s.scores).length > 0).length;
  const judgingCoverage = submissions.length > 0 ? (scored / submissions.length) * 100 : 100;

  const incidentPenalty = incidentPenaltyScore(incidents);

  const rawScore =
    submissionRate * WEIGHTS.submissionRate +
    checkInRate * WEIGHTS.checkInRate +
    judgingCoverage * WEIGHTS.judgingCoverage -
    incidentPenalty * WEIGHTS.incidentPenalty;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  const label: EventHealthResult['label'] =
    score >= 85 ? 'excellent' :
    score >= 65 ? 'healthy' :
    score >= 40 ? 'at-risk' :
    'critical';

  return {
    score,
    breakdown: {
      submissionRate: Math.round(submissionRate),
      incidentPenalty: Math.round(incidentPenalty),
      checkInRate: Math.round(checkInRate),
      judgingCoverage: Math.round(judgingCoverage),
    },
    label,
  };
}
