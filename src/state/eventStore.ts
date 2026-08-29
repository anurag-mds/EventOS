// ─── EVENTOS Event Store ─────────────────────────────────────────────────────
// Single in-memory source of truth. Every view reads via getState().
// No view may hold its own duplicate copy of a number.

import type {
  EventState,
  EventAction,
  StoreSubscriber,
  LeaderboardEntry,
  Role,
} from './types';
import {
  seedEvent,
  seedParticipants,
  seedTeams,
  seedJudges,
  seedSubmissions,
  seedIncidents,
  seedActivity,
} from './seedData';

export interface DispatchContext {
  role: Role;
}

// ─── Initial State ────────────────────────────────────────────────────────────

function buildLeaderboard(state: EventState): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = Object.values(state.submissions)
    .filter((s) => Object.keys(s.scores).length > 0)
    .map((s) => {
      const scoreValues = Object.values(s.scores);
      const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
      return {
        rank: 0,
        teamId: s.teamId,
        teamName: state.teams[s.teamId]?.name ?? 'Unknown',
        averageScore: Math.round(avg * 10) / 10,
        submissionId: s.id,
        judgesScored: scoreValues.length,
      };
    });

  entries.sort((a, b) => b.averageScore - a.averageScore);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

function cloneRecord<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, { ...(v as object) }])
  ) as T;
}

export function createInitialState(): EventState {
  const base: EventState = {
    event: { ...seedEvent },
    participants: cloneRecord(seedParticipants),
    teams: cloneRecord(seedTeams),
    judges: cloneRecord(seedJudges),
    submissions: cloneRecord(seedSubmissions),
    incidents: seedIncidents.map((i) => ({ ...i })),
    activityFeed: [...seedActivity].sort((a, b) => b.timestamp - a.timestamp),
    leaderboard: [],
  };
  return { ...base, leaderboard: buildLeaderboard(base) };
}

const initialState: EventState = createInitialState();

function reassignSubmission(
  state: EventState,
  submissionId: string,
  fromJudgeId: string,
  toJudgeId: string
): EventState {
  const fromJudge = state.judges[fromJudgeId];
  const toJudge = state.judges[toJudgeId];
  if (!fromJudge || !toJudge) return state;
  if (!fromJudge.assignedSubmissionIds.includes(submissionId)) return state;
  if (toJudge.assignedSubmissionIds.includes(submissionId)) return state;

  return {
    ...state,
    judges: {
      ...state.judges,
      [fromJudgeId]: {
        ...fromJudge,
        assignedSubmissionIds: fromJudge.assignedSubmissionIds.filter((id) => id !== submissionId),
      },
      [toJudgeId]: {
        ...toJudge,
        assignedSubmissionIds: [...toJudge.assignedSubmissionIds, submissionId],
      },
    },
  };
}


function reducer(
  state: EventState,
  action: EventAction,
  context?: DispatchContext
): EventState {
  switch (action.type) {
    case 'CHECK_IN_PARTICIPANT': {
      if (context?.role !== 'organizer') return state;
      const p = state.participants[action.participantId];
      if (!p || p.checkedIn) return state;
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.participantId]: { ...p, checkedIn: true },
        },
      };
    }

    case 'ADD_ACTIVITY': {
      const feed = [action.entry, ...state.activityFeed].slice(0, 200);
      return { ...state, activityFeed: feed };
    }

    case 'OPEN_INCIDENT': {
      if (state.incidents.some((i) => i.id === action.incident.id)) return state;
      return { ...state, incidents: [action.incident, ...state.incidents] };
    }

    case 'RESOLVE_INCIDENT': {
      if (context?.role !== 'organizer') return state;
      const incident = state.incidents.find((i) => i.id === action.incidentId);
      if (!incident || incident.status === 'resolved') return state;
      return {
        ...state,
        incidents: state.incidents.map((inc) =>
          inc.id === action.incidentId
            ? { ...inc, status: 'resolved', resolvedAt: action.resolvedAt }
            : inc
        ),
      };
    }

    case 'APPLY_JUDGE_OVERLOAD': {
      if (context?.role !== 'organizer') return state;
      const incident = state.incidents.find((i) => i.id === action.incidentId);
      if (!incident || incident.status === 'resolved' || !incident.recommendation) {
        return state;
      }

      const { submissionIdsToMove, overloadedJudgeId, targetJudgeId } =
        incident.recommendation;

      let next = state;
      for (const submissionId of submissionIdsToMove) {
        next = reassignSubmission(next, submissionId, overloadedJudgeId, targetJudgeId);
      }

      return {
        ...next,
        incidents: next.incidents.map((inc) =>
          inc.id === action.incidentId
            ? { ...inc, status: 'resolved', resolvedAt: Date.now() }
            : inc
        ),
      };
    }

    case 'SUBMIT_PROJECT': {
      if (context?.role !== 'organizer' && context?.role !== 'participant') return state;
      const updatedTeam = { ...state.teams[action.teamId], submissionId: action.submission.id };
      return {
        ...state,
        teams: { ...state.teams, [action.teamId]: updatedTeam },
        submissions: { ...state.submissions, [action.submission.id]: action.submission },
      };
    }

    case 'POST_SCORE': {
      if (context?.role !== 'judge') return state;
      if (!Number.isFinite(action.score) || action.score < 0 || action.score > 100) {
        return state;
      }

      const sub = state.submissions[action.submissionId];
      const judge = state.judges[action.judgeId];
      if (!sub || !judge) return state;
      if (!judge.assignedSubmissionIds.includes(action.submissionId)) return state;
      if (sub.scores[action.judgeId] !== undefined) return state;

      const updated = {
        ...sub,
        scores: { ...sub.scores, [action.judgeId]: action.score },
        status: 'scored' as const,
      };
      const next: EventState = {
        ...state,
        submissions: { ...state.submissions, [action.submissionId]: updated },
      };
      return { ...next, leaderboard: buildLeaderboard(next) };
    }

    case 'ASSIGN_SUBMISSION_TO_JUDGE': {
      if (context?.role !== 'organizer') return state;
      const judge = state.judges[action.judgeId];
      if (!judge || !state.submissions[action.submissionId]) return state;
      if (judge.assignedSubmissionIds.includes(action.submissionId)) return state;
      return {
        ...state,
        judges: {
          ...state.judges,
          [action.judgeId]: {
            ...judge,
            assignedSubmissionIds: [...judge.assignedSubmissionIds, action.submissionId],
          },
        },
      };
    }

    case 'REASSIGN_SUBMISSION': {
      if (context?.role !== 'organizer') return state;
      return reassignSubmission(
        state,
        action.submissionId,
        action.fromJudgeId,
        action.toJudgeId
      );
    }

    case 'SET_PHASE': {
      if (context?.role !== 'organizer') return state;
      return { ...state, event: { ...state.event, phase: action.phase } };
    }

    case 'CREATE_TEAM': {
      if (context?.role !== 'participant' && context?.role !== 'organizer') return state;
      const newTeam = action.team;
      const updatedParticipants = { ...state.participants };

      for (const memberId of newTeam.memberIds) {
        const member = updatedParticipants[memberId];
        if (!member || member.teamId !== null) return state;
      }

      for (const memberId of newTeam.memberIds) {
        updatedParticipants[memberId] = {
          ...updatedParticipants[memberId],
          teamId: newTeam.id,
        };
      }

      return {
        ...state,
        teams: { ...state.teams, [newTeam.id]: newTeam },
        participants: updatedParticipants,
      };
    }

    case 'REBUILD_LEADERBOARD': {
      return { ...state, leaderboard: buildLeaderboard(state) };
    }

    case 'RESET_STATE': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

class EventStoreClass {
  private state: EventState = initialState;
  private subscribers = new Set<StoreSubscriber>();

  getState(): Readonly<EventState> {
    return this.state;
  }

  dispatch(action: EventAction, context?: DispatchContext): void {
    this.state = reducer(this.state, action, context);
    this.notify();
  }

  subscribe(cb: StoreSubscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  reset(): void {
    this.state = createInitialState();
    this.notify();
  }

  private notify(): void {
    const snap = this.state;
    this.subscribers.forEach((cb) => cb(snap));
  }
}

// Module-level singleton — the one and only state owner.
export const EventStore = new EventStoreClass();

export type EventStoreType = typeof EventStore;
