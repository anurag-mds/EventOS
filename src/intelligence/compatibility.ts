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

function normaliseSkills(skills: string[]): string[] {
  return skills.map((s) => s.toLowerCase().trim());
}

function isPartialSkillMatch(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

/**
 * Deterministic per-skill contribution so candidates with different skills
 * never collapse to the same rounded score.
 */
function uniqueSkillValue(skill: string, index: number): number {
  let hash = index * 13;
  for (let i = 0; i < skill.length; i++) {
    hash = (hash + skill.charCodeAt(i) * (i + 3)) % 97;
  }
  return 6 + (hash % 9); // 6–14 per unique skill
}

function participantIdBias(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 5)) % 13;
  }
  return hash - 6;
}

/**
 * Computes compatibility between two participants for team formation.
 * Scores vary continuously based on exact skill overlap between A and B.
 */
export function computeCompatibility(
  a: Participant,
  b: Participant
): ParticipantCompatibilityResult {
  const reasons: string[] = [];

  const aSkills = normaliseSkills(a.skills);
  const bSkills = normaliseSkills(b.skills);

  const aSet = new Set(aSkills);
  const bSet = new Set(bSkills);

  const exactOverlap = aSkills.filter((s) => bSet.has(s));

  const partialOverlap: string[] = [];
  for (const bs of bSkills) {
    if (aSet.has(bs)) continue;
    const match = aSkills.find((as) => isPartialSkillMatch(as, bs));
    if (match) partialOverlap.push(bs);
  }

  const uniqueToB = bSkills.filter(
    (s) => !aSet.has(s) && !partialOverlap.includes(s)
  );
  const uniqueToA = aSkills.filter(
    (s) => !bSet.has(s) && !aSkills.some((as) => as !== s && isPartialSkillMatch(as, s))
  );

  if (aSkills.length === 0 && bSkills.length === 0) {
    return {
      participantId: b.id,
      score: 40,
      reasons: [
        'Neither of you listed technical skills — hard to assess fit.',
        'Discuss project goals before committing to a team.',
      ],
    };
  }

  let score = 36;

  // Penalise exact overlap (redundant pairing)
  score -= exactOverlap.length * 11;

  // Partial overlap: related stacks, small bonus
  score += partialOverlap.length * 5;

  // Reward skills the candidate uniquely brings
  uniqueToB.forEach((skill, index) => {
    score += uniqueSkillValue(skill, index);
  });

  // Team breadth: your unique skills still add value to the pair
  score += Math.min(uniqueToA.length * 3, 12);

  // Balance: ideal is 1 shared skill + diverse extras
  if (exactOverlap.length === 1 && uniqueToB.length >= 2) {
    score += 10;
    reasons.push(
      `Shared ${exactOverlap[0]} experience plus ${uniqueToB.slice(0, 2).join(' and ')} from their side.`
    );
  } else if (exactOverlap.length >= 2) {
    score -= 6;
    reasons.push(
      `Overlap on ${exactOverlap.slice(0, 2).join(' and ')} — roles may be redundant.`
    );
  } else if (exactOverlap.length === 0 && uniqueToB.length >= 2) {
    score += 8;
    reasons.push(
      `Complementary stacks: they add ${uniqueToB.slice(0, 2).join(' and ')} without overlapping yours.`
    );
  }

  if (partialOverlap.length > 0 && reasons.length === 0) {
    reasons.push(
      `Adjacent skills (${partialOverlap.slice(0, 2).join(', ')}) align with your stack.`
    );
  }

  if (uniqueToB.length === 1) {
    reasons.push(`They uniquely contribute ${uniqueToB[0]}.`);
  } else if (uniqueToB.length >= 3) {
    reasons.push(
      `Strong breadth: ${uniqueToB.length} skills you don't list, including ${uniqueToB[0]}.`
    );
  }

  if (uniqueToB.length === 0 && exactOverlap.length > 0) {
    reasons.push('Their skill list is a subset of yours — limited new capability.');
  }

  score = Math.max(0, Math.min(100, Math.round(score + participantIdBias(b.id))));

  if (reasons.length === 0) {
    reasons.push('Moderate overlap — workable pairing with clear role split.');
  }
  if (reasons.length === 1) {
    reasons.push(
      `Overall fit: ${score >= 75 ? 'strong' : score >= 55 ? 'good' : score >= 40 ? 'fair' : 'weak'}.`
    );
  }

  return {
    participantId: b.id,
    score,
    reasons,
  };
}

/**
 * Finds top N most compatible teammates for a given participant.
 */
export function findTopMatches(
  participant: Participant,
  allParticipants: Record<string, Participant>,
  topN: number = 5
): ParticipantCompatibilityResult[] {
  const candidates = Object.values(allParticipants).filter(
    (p) => p.id !== participant.id && p.teamId === null
  );

  const results = candidates.map((candidate) =>
    computeCompatibility(participant, candidate)
  );

  results.sort((a, b) => b.score - a.score || a.participantId.localeCompare(b.participantId));

  return results.slice(0, topN);
}

/**
 * Computes team-level member compatibility by averaging all pairwise scores.
 */
export function teamMemberCompatibility(
  team: Team,
  participants: Record<string, Participant>
): number {
  const members = team.memberIds
    .map((id) => participants[id])
    .filter((p): p is Participant => p !== undefined);

  if (members.length < 2) return 0;

  const scores: number[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      scores.push(computeCompatibility(members[i], members[j]).score);
    }
  }

  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avg);
}
