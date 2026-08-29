// ─── EVENTOS Domain Types ───────────────────────────────────────────────────
// Single source of type truth. Every view and intelligence module imports
// from here. Never use `any`.

export type Role = 'organizer' | 'participant' | 'judge';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

export type SubmissionStatus = 'pending' | 'under_review' | 'scored' | 'disqualified';

export type EventPhase =
  | 'registration'
  | 'hacking'
  | 'submission'
  | 'judging'
  | 'results';

export type ActivityKind =
  | 'submission'
  | 'team_join'
  | 'incident_opened'
  | 'incident_resolved'
  | 'score_posted'
  | 'announcement'
  | 'check_in';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface Participant {
  id: string;
  name: string;
  email: string;
  teamId: string | null;
  checkedIn: boolean;
  skills: string[];
}

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  projectTitle: string;
  projectDescription: string;
  tags: string[];
  submissionId: string | null;
}

export interface Judge {
  id: string;
  name: string;
  expertise: string[];
  assignedSubmissionIds: string[];
  /** Max submissions this judge should review */
  capacityLimit: number;
}

export interface Submission {
  id: string;
  teamId: string;
  title: string;
  description: string;
  repoUrl: string;
  demoUrl: string;
  status: SubmissionStatus;
  scores: Record<string, number>; // judgeId → score (0–100)
  submittedAt: number; // Unix ms
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: number; // Unix ms
  resolvedAt: number | null;
  affectedTeamIds: string[];
}

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  message: string;
  timestamp: number; // Unix ms
  teamId: string | null;
  actorName: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  averageScore: number;
  submissionId: string;
  judgesScored: number;
}

export interface HackathonEvent {
  id: string;
  name: string;
  tagline: string;
  startTime: number; // Unix ms
  endTime: number;   // Unix ms
  phase: EventPhase;
  venueOrUrl: string;
  organizerName: string;
  maxTeamSize: number;
  totalPrizePool: string;
}

// ─── Store Shape ─────────────────────────────────────────────────────────────

export interface EventState {
  event: HackathonEvent;
  participants: Record<string, Participant>;
  teams: Record<string, Team>;
  judges: Record<string, Judge>;
  submissions: Record<string, Submission>;
  incidents: Incident[];
  activityFeed: ActivityEntry[];
  leaderboard: LeaderboardEntry[];
}

// ─── Store Actions ────────────────────────────────────────────────────────────

export type EventAction =
  | { type: 'CHECK_IN_PARTICIPANT'; participantId: string }
  | { type: 'ADD_ACTIVITY'; entry: ActivityEntry }
  | { type: 'OPEN_INCIDENT'; incident: Incident }
  | { type: 'RESOLVE_INCIDENT'; incidentId: string; resolvedAt: number }
  | { type: 'SUBMIT_PROJECT'; submission: Submission; teamId: string }
  | { type: 'POST_SCORE'; submissionId: string; judgeId: string; score: number }
  | { type: 'ASSIGN_SUBMISSION_TO_JUDGE'; submissionId: string; judgeId: string }
  | { type: 'SET_PHASE'; phase: EventPhase }
  | { type: 'REBUILD_LEADERBOARD' };

export type StoreSubscriber = (state: Readonly<EventState>) => void;
