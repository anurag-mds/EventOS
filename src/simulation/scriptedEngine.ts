// ─── EVENTOS Scripted Simulation Engine ──────────────────────────────────────
// Deterministic scripted event ticker. Dispatches pre-authored actions against
// the EventStore on a fixed interval (~1.5s) so demos look live without randomness.

import type { EventStoreType } from '../state/eventStore';
import type { ActivityEntry, Team } from '../state/types';
import { detectJudgeOverload } from '../intelligence/incidents';

type Store = EventStoreType;

const STEP_DELAY_MS = 1_500;
const ORGANIZER = { role: 'organizer' as const };
const JUDGE = { role: 'judge' as const };
const PARTICIPANT = { role: 'participant' as const };

interface ScriptStep {
  label: string;
  run: (store: Store) => void;
}

let stepCounter = 1000;

function nextId(prefix: string): string {
  return `${prefix}-sim-${++stepCounter}`;
}

function addActivity(store: Store, entry: Omit<ActivityEntry, 'id'> & { id?: string }): void {
  store.dispatch(
    {
      type: 'ADD_ACTIVITY',
      entry: { ...entry, id: entry.id ?? nextId('act') },
    },
    ORGANIZER
  );
}

const SCRIPT: ScriptStep[] = [
  {
    label: 'Check in Arjun Bose',
    run: (store) => {
      store.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId: 'p-32' }, ORGANIZER);
      addActivity(store, {
        kind: 'check_in',
        message: 'Arjun Bose checked in',
        timestamp: Date.now(),
        teamId: null,
        actorName: 'Arjun Bose',
      });
    },
  },
  {
    label: 'Check in Nisha Agarwal',
    run: (store) => {
      store.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId: 'p-37' }, ORGANIZER);
      addActivity(store, {
        kind: 'check_in',
        message: 'Nisha Agarwal checked in',
        timestamp: Date.now(),
        teamId: null,
        actorName: 'Nisha Agarwal',
      });
    },
  },
  {
    label: 'Check in Nikhil Patil',
    run: (store) => {
      store.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId: 'p-11' }, ORGANIZER);
      addActivity(store, {
        kind: 'check_in',
        message: 'Nikhil Patil checked in',
        timestamp: Date.now(),
        teamId: 't-03',
        actorName: 'Nikhil Patil',
      });
    },
  },
  {
    label: 'Team formation: Aryan + Arjun',
    run: (store) => {
      const teamId = 't-sim-01';
      const newTeam: Team = {
        id: teamId,
        name: 'Team Aryan',
        memberIds: ['p-01', 'p-32'],
        projectTitle: 'Untitled Project',
        projectDescription: 'Newly formed team via simulation',
        tags: ['React', 'TypeScript', 'Backend'],
        submissionId: null,
      };
      store.dispatch({ type: 'CREATE_TEAM', team: newTeam }, PARTICIPANT);
      addActivity(store, {
        kind: 'team_join',
        message: 'Aryan Mehta & Arjun Bose formed a new team',
        timestamp: Date.now(),
        teamId,
        actorName: 'Aryan Mehta',
      });
    },
  },
  {
    label: 'Assign extra submissions to Dr. Vaidya (overload setup)',
    run: (store) => {
      for (const submissionId of ['sub-04', 'sub-05', 'sub-06', 'sub-07', 'sub-08']) {
        store.dispatch(
          { type: 'ASSIGN_SUBMISSION_TO_JUDGE', submissionId, judgeId: 'j-01' },
          ORGANIZER
        );
      }
      addActivity(store, {
        kind: 'announcement',
        message: 'Organizer reassigned 5 submissions to Dr. Vaidya for review',
        timestamp: Date.now(),
        teamId: null,
        actorName: 'Organizer',
      });
    },
  },
  {
    label: 'Detect judge overload incident',
    run: (store) => {
      const state = store.getState();
      const incident = detectJudgeOverload(state);
      if (!incident) return;

      store.dispatch({ type: 'OPEN_INCIDENT', incident }, ORGANIZER);
      addActivity(store, {
        kind: 'incident_opened',
        message: `Judge overload: ${incident.description}`,
        timestamp: Date.now(),
        teamId: null,
        actorName: 'EventOS Intelligence',
      });
    },
  },
  {
    label: 'Dr. Vaidya scores JudgeAssist',
    run: (store) => {
      store.dispatch(
        { type: 'POST_SCORE', submissionId: 'sub-04', judgeId: 'j-01', score: 90 },
        JUDGE
      );
      addActivity(store, {
        kind: 'score_posted',
        message: 'Dr. Vaidya scored JudgeAssist: 90/100',
        timestamp: Date.now(),
        teamId: 't-04',
        actorName: 'Dr. Prashant Vaidya',
      });
    },
  },
  {
    label: 'Dr. Vaidya scores HackaChain',
    run: (store) => {
      store.dispatch(
        { type: 'POST_SCORE', submissionId: 'sub-05', judgeId: 'j-01', score: 83 },
        JUDGE
      );
      addActivity(store, {
        kind: 'score_posted',
        message: 'Dr. Vaidya scored HackaChain: 83/100',
        timestamp: Date.now(),
        teamId: 't-05',
        actorName: 'Dr. Prashant Vaidya',
      });
    },
  },
];

// ─── Engine ────────────────────────────────────────────────────────────────────

let timeouts: ReturnType<typeof setTimeout>[] = [];
let running = false;
let paused = false;
let pauseResolve: (() => void) | null = null;
let currentStepIndex = 0;

function clearScheduledSteps(): void {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function waitWhilePaused(): Promise<void> {
  if (!paused) return Promise.resolve();
  return new Promise((resolve) => {
    pauseResolve = resolve;
  });
}

async function runFromStep(store: Store, startIndex: number): Promise<void> {
  for (let i = startIndex; i < SCRIPT.length; i++) {
    if (!running) return;

    await waitWhilePaused();
    if (!running) return;

    currentStepIndex = i;
    const step = SCRIPT[i];

    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        if (!running) {
          resolve();
          return;
        }
        try {
          step.run(store);
        } catch (err) {
          console.error(`[Simulation] Step "${step.label}" failed:`, err);
        }
        resolve();
      }, STEP_DELAY_MS);
      timeouts.push(t);
    });
  }

  running = false;
  currentStepIndex = 0;
}

/**
 * Starts the deterministic simulation from the beginning.
 * Calling again while running is a no-op.
 */
export function startSimulation(store: Store): void {
  if (running) return;
  running = true;
  paused = false;
  currentStepIndex = 0;
  clearScheduledSteps();
  void runFromStep(store, 0);
}

/**
 * Pauses the simulation between steps.
 */
export function pauseSimulation(): void {
  if (!running || paused) return;
  paused = true;
}

/**
 * Resumes a paused simulation.
 */
export function resumeSimulation(_store: Store): void {
  if (!running || !paused) return;
  paused = false;
  if (pauseResolve) {
    pauseResolve();
    pauseResolve = null;
  }
}

/**
 * Stops the simulation and clears all pending timeouts.
 */
export function stopSimulation(): void {
  clearScheduledSteps();
  running = false;
  paused = false;
  currentStepIndex = 0;
  if (pauseResolve) {
    pauseResolve();
    pauseResolve = null;
  }
}

/**
 * Resets the store to original seed state and stops any running simulation.
 */
export function resetSimulation(store: Store): void {
  stopSimulation();
  store.reset();
  stepCounter = 1000;
}

export function isSimulationRunning(): boolean {
  return running;
}

export function isSimulationPaused(): boolean {
  return paused && running;
}

export function getSimulationProgress(): { current: number; total: number } {
  return { current: currentStepIndex, total: SCRIPT.length };
}
