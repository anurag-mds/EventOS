// ─── EVENTOS Event Store ─────────────────────────────────────────────────────
// Single in-memory source of truth. Every view reads via getState().
// No view may hold its own duplicate copy of a number.

import type { EventState, EventAction, StoreSubscriber, LeaderboardEntry } from './types';
import {
  seedEvent,
  seedParticipants,
  seedTeams,
  seedJudges,
  seedSubmissions,
  seedIncidents,
  seedActivity,
  seedLeaderboard,
} from './seedData';

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: EventState = {
  event: seedEvent,
  participants: { ...seedParticipants },
  teams: { ...seedTeams },
  judges: { ...seedJudges },
  submissions: { ...seedSubmissions },
  incidents: [...seedIncidents],
  activityFeed: [...seedActivity].sort((a, b) => b.timestamp - a.timestamp),
  leaderboard: [...seedLeaderboard],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

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

function reducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case 'CHECK_IN_PARTICIPANT': {
      const p = state.participants[action.participantId];
      if (!p) return state;
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
      return { ...state, incidents: [action.incident, ...state.incidents] };
    }

    case 'RESOLVE_INCIDENT': {
      return {
        ...state,
        incidents: state.incidents.map((inc) =>
          inc.id === action.incidentId
            ? { ...inc, status: 'resolved', resolvedAt: action.resolvedAt }
            : inc
        ),
      };
    }

    case 'SUBMIT_PROJECT': {
      const updatedTeam = { ...state.teams[action.teamId], submissionId: action.submission.id };
      return {
        ...state,
        teams: { ...state.teams, [action.teamId]: updatedTeam },
        submissions: { ...state.submissions, [action.submission.id]: action.submission },
      };
    }

    case 'POST_SCORE': {
      const sub = state.submissions[action.submissionId];
      if (!sub) return state;
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
      const judge = state.judges[action.judgeId];
      if (!judge) return state;
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

    case 'SET_PHASE': {
      return { ...state, event: { ...state.event, phase: action.phase } };
    }

    case 'REBUILD_LEADERBOARD': {
      return { ...state, leaderboard: buildLeaderboard(state) };
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

  dispatch(action: EventAction): void {
    this.state = reducer(this.state, action);
    this.notify();
  }

  subscribe(cb: StoreSubscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify(): void {
    const snap = this.state;
    this.subscribers.forEach((cb) => cb(snap));
  }
}

// Module-level singleton — the one and only state owner.
export const EventStore = new EventStoreClass();
