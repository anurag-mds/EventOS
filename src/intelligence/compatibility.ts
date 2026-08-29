// ─── Intelligence: Team–Project Compatibility ────────────────────────────────
// Pure function — scores how well a team's skills match a project's tags.

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
