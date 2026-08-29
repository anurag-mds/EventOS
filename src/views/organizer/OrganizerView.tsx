// ─── Organizer View ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { EventStore } from '../../state/eventStore';
import type { EventState } from '../../state/types';
import { eventHealth } from '../../intelligence/eventHealth';
import { judgeOverload } from '../../intelligence/judgeOverload';
import { ActivityFeed } from '../../components/ActivityFeed';
import { IncidentCard } from '../../components/IncidentCard';
import { startSimulation, stopSimulation, isSimulationRunning } from '../../simulation/scriptedEngine';

export function OrganizerView() {
  const [state, setState] = useState<Readonly<EventState>>(EventStore.getState());
  const [simRunning, setSimRunning] = useState(isSimulationRunning());

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  const health = eventHealth({
    event: state.event,
    teams: Object.values(state.teams),
    submissions: Object.values(state.submissions),
    incidents: state.incidents,
    participants: Object.values(state.participants),
  });

  const overload = judgeOverload(Object.values(state.judges));

  const openIncidents = state.incidents.filter((i) => i.status !== 'resolved');
  const checkedIn = Object.values(state.participants).filter((p) => p.checkedIn).length;
  const totalParticipants = Object.values(state.participants).length;
  const submittedTeams = Object.values(state.teams).filter((t) => t.submissionId !== null).length;

  function handleToggleSim() {
    if (simRunning) {
      stopSimulation();
      setSimRunning(false);
    } else {
      startSimulation(EventStore);
      setSimRunning(true);
    }
  }

  function handleResolve(incidentId: string) {
    EventStore.dispatch({ type: 'RESOLVE_INCIDENT', incidentId, resolvedAt: Date.now() });
    EventStore.dispatch({
      type: 'ADD_ACTIVITY',
      entry: {
        id: `act-resolve-${incidentId}`,
        kind: 'incident_resolved',
        message: `Incident ${incidentId} resolved by Organizer`,
        timestamp: Date.now(),
        teamId: null,
        actorName: 'Organizer',
      },
    });
  }

  return (
    <main className="view organizer-view" aria-label="Organizer Dashboard">
      {/* Header */}
      <header className="view__header">
        <div>
          <h1 className="view__title">Organizer Dashboard</h1>
          <p className="view__subtitle">{state.event.name} · {state.event.phase.toUpperCase()} phase</p>
        </div>
        <button
          id="sim-toggle-btn"
          className={`btn ${simRunning ? 'btn--danger' : 'btn--primary'}`}
          onClick={handleToggleSim}
          aria-pressed={simRunning}
        >
          {simRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
        </button>
      </header>

      {/* KPI Strip */}
      <section className="kpi-strip" aria-label="Key metrics">
        <div className={`kpi-card kpi-card--health kpi-card--${health.label}`}>
          <span className="kpi-card__value">{health.score}</span>
          <span className="kpi-card__label">Event Health</span>
          <span className={`kpi-card__tag kpi-card__tag--${health.label}`}>{health.label.toUpperCase()}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__value">{checkedIn}<span className="kpi-card__denom">/{totalParticipants}</span></span>
          <span className="kpi-card__label">Checked In</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__value">{submittedTeams}<span className="kpi-card__denom">/{Object.keys(state.teams).length}</span></span>
          <span className="kpi-card__label">Teams Submitted</span>
        </div>

        <div className={`kpi-card ${openIncidents.length > 0 ? 'kpi-card--alert' : ''}`}>
          <span className="kpi-card__value">{openIncidents.length}</span>
          <span className="kpi-card__label">Open Incidents</span>
        </div>

        <div className={`kpi-card ${overload.overloadedJudgeIds.length > 0 ? 'kpi-card--alert' : ''}`}>
          <span className="kpi-card__value">{overload.overloadedJudgeIds.length}</span>
          <span className="kpi-card__label">Overloaded Judges</span>
        </div>
      </section>

      {/* Body: Incidents + Feed */}
      <div className="view__body">
        <section className="panel" aria-labelledby="incidents-heading">
          <h2 id="incidents-heading" className="panel__title">
            Active Incidents
            {openIncidents.length > 0 && (
              <span className="panel__badge panel__badge--alert">{openIncidents.length}</span>
            )}
          </h2>
          {openIncidents.length === 0 ? (
            <p className="panel__empty">✅ No active incidents</p>
          ) : (
            <div className="panel__list">
              {openIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="feed-heading">
          <h2 id="feed-heading" className="panel__title">Live Activity</h2>
          <ActivityFeed entries={state.activityFeed} />
        </section>
      </div>
    </main>
  );
}
