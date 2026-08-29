// ─── EVENTOS Scripted Simulation Engine ──────────────────────────────────────
// Deterministic scripted event ticker. Dispatches pre-authored actions against
// the EventStore on a fixed interval so demos look live without randomness.

import type { EventStore as EventStoreType } from '../state/eventStore';
import type { ActivityEntry, Incident } from '../state/types';

type Store = typeof EventStoreType;

// ─── Script ───────────────────────────────────────────────────────────────────
// Each step fires after `delayMs` from the previous step.

interface ScriptStep {
  delayMs: number;
  label: string;
  run: (store: Store) => void;
}

let stepCounter = 1000; // start high to avoid colliding with seed IDs

function nextId(prefix: string): string {
  return `${prefix}-sim-${++stepCounter}`;
}

const SCRIPT: ScriptStep[] = [
  {
    delayMs: 4_000,
    label: 'SynapticSquad submits HackaChain',
    run: (store) => {
      const now = Date.now();
      store.dispatch({
        type: 'SUBMIT_PROJECT',
        teamId: 't-05',
        submission: {
          id: 'sub-05',
          teamId: 't-05',
          title: 'HackaChain',
          description: 'Blockchain-anchored submission audit trail',
          repoUrl: 'https://github.com/synapticsquad/hackachain',
          demoUrl: 'https://hackachain.run.app',
          status: 'pending',
          scores: {},
          submittedAt: now,
        },
      });
      const entry: ActivityEntry = {
        id: nextId('act'),
        kind: 'submission',
        message: 'SynapticSquad submitted HackaChain',
        timestamp: now,
        teamId: 't-05',
        actorName: 'Aditya Kumar',
      };
      store.dispatch({ type: 'ADD_ACTIVITY', entry });
    },
  },
  {
    delayMs: 7_000,
    label: 'Check in Sneha Iyer',
    run: (store) => {
      store.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId: 'p-04' });
      const entry: ActivityEntry = {
        id: nextId('act'),
        kind: 'check_in',
        message: 'Sneha Iyer checked in (late)',
        timestamp: Date.now(),
        teamId: 't-01',
        actorName: 'Sneha Iyer',
      };
      store.dispatch({ type: 'ADD_ACTIVITY', entry });
    },
  },
  {
    delayMs: 10_000,
    label: 'New critical incident: Projector failure',
    run: (store) => {
      const now = Date.now();
      const incident: Incident = {
        id: nextId('inc'),
        title: 'Main Projector Failure',
        description: 'Presentation projector in Hall A is not responding.',
        severity: 'critical',
        status: 'open',
        reportedAt: now,
        resolvedAt: null,
        affectedTeamIds: [],
      };
      store.dispatch({ type: 'OPEN_INCIDENT', incident });
      store.dispatch({
        type: 'ADD_ACTIVITY',
        entry: {
          id: nextId('act'),
          kind: 'incident_opened',
          message: '🚨 CRITICAL: Main Projector Failure in Hall A',
          timestamp: now,
          teamId: null,
          actorName: 'Organizer',
        },
      });
    },
  },
  {
    delayMs: 15_000,
    label: 'Dr. Vaidya scores HackaChain',
    run: (store) => {
      store.dispatch({ type: 'POST_SCORE', submissionId: 'sub-05', judgeId: 'j-01', score: 74 });
      store.dispatch({
        type: 'ADD_ACTIVITY',
        entry: {
          id: nextId('act'),
          kind: 'score_posted',
          message: 'Dr. Vaidya scored HackaChain: 74/100',
          timestamp: Date.now(),
          teamId: 't-05',
          actorName: 'Dr. Prashant Vaidya',
        },
      });
    },
  },
  {
    delayMs: 20_000,
    label: 'Resolve Wi-Fi incident',
    run: (store) => {
      const now = Date.now();
      store.dispatch({ type: 'RESOLVE_INCIDENT', incidentId: 'inc-01', resolvedAt: now });
      store.dispatch({
        type: 'ADD_ACTIVITY',
        entry: {
          id: nextId('act'),
          kind: 'incident_resolved',
          message: '✅ Wi-Fi Gateway Overloaded — RESOLVED',
          timestamp: now,
          teamId: null,
          actorName: 'Organizer',
        },
      });
    },
  },
  {
    delayMs: 25_000,
    label: 'DataDrifters submits InsightBoard',
    run: (store) => {
      const now = Date.now();
      store.dispatch({
        type: 'SUBMIT_PROJECT',
        teamId: 't-07',
        submission: {
          id: 'sub-07',
          teamId: 't-07',
          title: 'InsightBoard',
          description: 'Real-time analytics dashboard powered by Looker + BigQuery',
          repoUrl: 'https://github.com/datadrifters/insightboard',
          demoUrl: 'https://insightboard.run.app',
          status: 'pending',
          scores: {},
          submittedAt: now,
        },
      });
      store.dispatch({
        type: 'ADD_ACTIVITY',
        entry: {
          id: nextId('act'),
          kind: 'submission',
          message: 'DataDrifters submitted InsightBoard',
          timestamp: now,
          teamId: 't-07',
          actorName: 'Harsh Trivedi',
        },
      });
    },
  },
  {
    delayMs: 30_000,
    label: 'Phase transitions to judging',
    run: (store) => {
      store.dispatch({ type: 'SET_PHASE', phase: 'judging' });
      store.dispatch({
        type: 'ADD_ACTIVITY',
        entry: {
          id: nextId('act'),
          kind: 'announcement',
          message: '⏱️ Hacking phase ended. Judging phase begins now!',
          timestamp: Date.now(),
          teamId: null,
          actorName: 'Organizer',
        },
      });
    },
  },
];

// ─── Engine ────────────────────────────────────────────────────────────────────

let timeouts: ReturnType<typeof setTimeout>[] = [];
let running = false;

/**
 * Starts the deterministic simulation, scheduling all script steps.
 * Calling again while running is a no-op.
 */
export function startSimulation(store: Store): void {
  if (running) return;
  running = true;

  let elapsed = 0;
  for (const step of SCRIPT) {
    elapsed += step.delayMs;
    const t = setTimeout(() => {
      try {
        step.run(store);
      } catch (err) {
        console.error(`[Simulation] Step "${step.label}" failed:`, err);
      }
    }, elapsed);
    timeouts.push(t);
  }
}

/**
 * Stops the simulation and clears all pending timeouts.
 */
export function stopSimulation(): void {
  timeouts.forEach(clearTimeout);
  timeouts = [];
  running = false;
}

export function isSimulationRunning(): boolean {
  return running;
}
