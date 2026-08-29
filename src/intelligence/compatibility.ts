// ─── Intelligence: Team–Project Compatibility ────────────────────────────────
// Pure functions for both team–project fit and participant–participant matching.

import type { Team, Participant } from '../state/types';

export interface CompatibilityInput {
  team: Team;
  /** All participants so we can resolve member skills */
  participants: Record<string, Participant>;
}

export interface CompatibilityResult {
  teamId: string;
  /** 0–100 alignment score */
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * Scores team–project fit using keyword overlap between member skills and
 * project tags. Case-insensitive, no stemming (keeps it deterministic).
 */
export function teamProjectCompatibility(input: CompatibilityInput): CompatibilityResult {
  const { team, participants } = input;

  const memberSkills = team.memberIds
    .flatMap((id) => participants[id]?.skills ?? [])
    .map((s) => s.toLowerCase());

  const skillSet = new Set(memberSkills);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const tag of team.tags) {
    const normalised = tag.toLowerCase();
    if (skillSet.has(normalised)) {
      matched.push(tag);
    } else {
      // Partial match: any skill that includes the tag word
      const partial = memberSkills.some(
        (skill) => skill.includes(normalised) || normalised.includes(skill)
      );
      if (partial) {
        matched.push(tag);
      } else {
        missing.push(tag);
      }
    }
  }

  const total = team.tags.length;
  const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return {
    teamId: team.id,
    score,
    matchedKeywords: matched,
    missingKeywords: missing,
  };
}

/**
 * Batch-scores all teams in a record map.
 */
export function batchCompatibility(
  teams: Record<string, Team>,
  participants: Record<string, Participant>
): CompatibilityResult[] {
  return Object.values(teams).map((team) =>
    teamProjectCompatibility({ team, participants })
  );
}

// ─── Participant–Participant Matching ────────────────────────────────────────

export interface ParticipantCompatibilityResult {
  participantId: string;
  /** Compatibility score 0–100 */
  score: number;
  /** Human-readable reasons explaining the score */
  reasons: string[];
}

/**
 * Computes compatibility between two participants for team formation.
 * 
 * Algorithm:
 * - Skill complementarity: different skills = higher score (diversity bonus)
 * - Too much overlap on primary skills = lower score (redundancy penalty)
 * - Generates specific, explainable reasons for each factor
 * 
 * @param a - First participant (typically "you")
 * @param b - Second participant (candidate teammate)
 * @returns Score 0–100 with specific reasons
 */
export function computeCompatibility(
  a: Participant,
  b: Participant
): ParticipantCompatibilityResult {
  const reasons: string[] = [];
  let score = 50; // Start at neutral

  const aSkills = a.skills.map((s) => s.toLowerCase());
  const bSkills = b.skills.map((s) => s.toLowerCase());

  const aSet = new Set(aSkills);
  const bSet = new Set(bSkills);

  // ── Skill overlap ─────────────────────────────────────────────────────────
  const overlapping = aSkills.filter((s) => bSet.has(s));
  const uniqueToB = bSkills.filter((s) => !aSet.has(s));

  // Heavy overlap on primary skills = redundancy penalty
  if (overlapping.length >= 2) {
    score -= 15;
    reasons.push(`You both have ${overlapping.slice(0, 2).join(' and ')} — some skill redundancy.`);
  }

  // Complementary skills = diversity bonus
  if (uniqueToB.length >= 2) {
    score += 25;
    const topUnique = uniqueToB.slice(0, 2).join(' and ');
    reasons.push(`They bring ${topUnique}, complementing your skill set.`);
  } else if (uniqueToB.length === 1) {
    score += 15;
    reasons.push(`They bring ${uniqueToB[0]}, adding diversity to the team.`);
  }

  // ── Balanced overlap ──────────────────────────────────────────────────────
  // Some overlap is good (shared language), but not too much
  if (overlapping.length === 1) {
    score += 10;
    reasons.push(`Shared expertise in ${overlapping[0]} helps communication.`);
  }

  // ── No overlap at all ──────────────────────────────────────────────────────
  if (overlapping.length === 0 && uniqueToB.length === 0) {
    score -= 10;
    reasons.push(`Very few technical skills listed — hard to assess fit.`);
  }

  // ── Highly complementary (no overlap, many unique) ─────────────────────────
  if (overlapping.length === 0 && uniqueToB.length >= 3) {
    score += 15;
    reasons.push(`Completely different skill sets create a well-rounded team.`);
  }

  // Clamp score to 0–100
  score = Math.max(0, Math.min(100, score));

  // Ensure at least 2 reasons (requirement)
  if (reasons.length === 0) {
    reasons.push(`Similar skill levels — could work together.`);
    reasons.push(`Consider exploring project interests to assess fit.`);
  } else if (reasons.length === 1) {
    reasons.push(`Overall compatibility: ${score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'fair'} match.`);
  }

  return {
    participantId: b.id,
    score,
    reasons,
  };
}

/**
 * Finds top N most compatible teammates for a given participant.
 * Filters out participants already on teams.
 * 
 * @param participant - The participant looking for teammates
 * @param allParticipants - Pool of all participants
 * @param topN - Number of top candidates to return (default: 5)
 * @returns Sorted list of compatibility results, best first
 */
export function findTopMatches(
  participant: Participant,
  allParticipants: Record<string, Participant>,
  topN: number = 5
): ParticipantCompatibilityResult[] {
  const candidates = Object.values(allParticipants).filter(
    (p) => p.id !== participant.id && p.teamId === null // Not self, not on a team
  );

  const results = candidates.map((candidate) =>
    computeCompatibility(participant, candidate)
  );

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topN);
}

/**
 * Computes team-level member compatibility by averaging all pairwise scores.
 * Returns 0 if team has fewer than 2 members.
 * 
 * @param team - The team to evaluate
 * @param participants - All participants to resolve member data
 * @returns Score 0–100 representing average inter-member compatibility
 */
export function teamMemberCompatibility(
  team: Team,
  participants: Record<string, Participant>
): number {
  const members = team.memberIds
    .map((id) => participants[id])
    .filter((p): p is Participant => p !== undefined);

  if (members.length < 2) return 0;

  // Compute all pairwise compatibilities
  const scores: number[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const result = computeCompatibility(members[i], members[j]);
      scores.push(result.score);
    }
  }

  // Return average
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avg);
}
