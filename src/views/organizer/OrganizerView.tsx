// ─── Organizer View ──────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  CheckCircle,
  AlertTriangle,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { EventStore } from '../../state/eventStore';
import type { EventState } from '../../state/types';
import { eventHealth } from '../../intelligence/eventHealth';
import { judgeOverload } from '../../intelligence/judgeOverload';
import { ActivityFeed } from '../../components/ActivityFeed';
import { IncidentCard } from '../../components/IncidentCard';
import {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  resetSimulation,
  isSimulationRunning,
  isSimulationPaused,
} from '../../simulation/scriptedEngine';

const ORGANIZER = { role: 'organizer' as const };

export function OrganizerView() {
  const [state, setState] = useState<Readonly<EventState>>(EventStore.getState());
  const [simRunning, setSimRunning] = useState(isSimulationRunning());
  const [simPaused, setSimPaused] = useState(isSimulationPaused());

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!simRunning) return;
    const interval = setInterval(() => {
      setSimRunning(isSimulationRunning());
      setSimPaused(isSimulationPaused());
    }, 200);
    return () => clearInterval(interval);
  }, [simRunning]);

  const participants = Object.values(state.participants);
  const teams = Object.values(state.teams);
  const judges = Object.values(state.judges);

  const health = eventHealth({
    event: state.event,
    teams,
    submissions: Object.values(state.submissions),
    incidents: state.incidents,
    participants,
    judges,
  });

  const overload = judgeOverload(judges);

  const checkedInCount = Math.round(health.breakdown.attendanceRatio * participants.length);
  const totalParticipants = participants.length;
  const teamsWithSubmissions = Math.round(health.breakdown.teamFormationRatio * teams.length);
  const totalTeams = teams.length;
  const submissionsScored = Math.round(
    health.breakdown.judgingProgressRatio * Object.keys(state.submissions).length
  );
  const totalSubmissions = Object.keys(state.submissions).length;

  const openIncidents = state.incidents.filter((i) => i.status !== 'resolved');
  const judgeOverloadIncidents = state.incidents.filter((i) => i.kind === 'judge_overload');
  const visibleIncidents = useMemo(() => {
    const ids = new Set<string>();
    const combined = [...judgeOverloadIncidents, ...openIncidents].filter((inc) => {
      if (ids.has(inc.id)) return false;
      ids.add(inc.id);
      return true;
    });
    return combined.sort((a, b) => b.reportedAt - a.reportedAt);
  }, [judgeOverloadIncidents, openIncidents]);

  const judgeWorkload = judges.map((judge) => {
    const assigned = judge.assignedSubmissionIds.length;
    const isOverloaded = assigned > judge.capacityLimit;
    return {
      id: judge.id,
      name: judge.name,
      assigned,
      capacity: judge.capacityLimit,
      isOverloaded,
    };
  });

  const filteredTeams = useMemo(() => {
    if (!teamFilter.trim()) return teams;
    const query = teamFilter.toLowerCase();
    return teams.filter((team) => {
      if (team.name.toLowerCase().includes(query)) return true;
      const memberSkills = team.memberIds
        .map((mid) => state.participants[mid]?.skills ?? [])
        .flat()
        .map((s) => s.toLowerCase());
      return memberSkills.some((skill) => skill.includes(query));
    });
  }, [teams, teamFilter, state.participants]);

  const notCheckedInParticipants = participants.filter((p) => !p.checkedIn);

  function handleScanCheckIn(participantId: string) {
    const participant = state.participants[participantId];
    if (!participant) return;

    if (participant.checkedIn) {
      setCheckInMessage({
        text: `${participant.name} is already checked in.`,
        type: 'error',
      });
      setTimeout(() => setCheckInMessage(null), 3000);
      return;
    }

    EventStore.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId }, ORGANIZER);

    EventStore.dispatch({
      type: 'ADD_ACTIVITY',
      entry: {
        id: `act-checkin-${participantId}-${Date.now()}`,
        kind: 'check_in',
        message: `${participant.name} checked in`,
        timestamp: Date.now(),
        teamId: participant.teamId,
        actorName: participant.name,
      },
    }, ORGANIZER);

    setCheckInMessage({
      text: `${participant.name} checked in successfully`,
      type: 'success',
    });
    setSelectedParticipantId(null);
    setTimeout(() => setCheckInMessage(null), 3000);
  }

  function handleStartSim() {
    startSimulation(EventStore);
    setSimRunning(true);
    setSimPaused(false);
  }

  function handlePauseSim() {
    if (simPaused) {
      resumeSimulation(EventStore);
      setSimPaused(false);
    } else {
      pauseSimulation();
      setSimPaused(true);
    }
  }

  function handleResetSim() {
    resetSimulation(EventStore);
    setSimRunning(false);
    setSimPaused(false);
  }

  function handleApplyRecommendation(incidentId: string) {
    const incident = state.incidents.find((i) => i.id === incidentId);
    if (!incident?.recommendation || incident.status === 'resolved') return;

    EventStore.dispatch({ type: 'APPLY_JUDGE_OVERLOAD', incidentId }, ORGANIZER);

    const rec = incident.recommendation;
    EventStore.dispatch({
      type: 'ADD_ACTIVITY',
      entry: {
        id: `act-reassign-${incidentId}-${Date.now()}`,
        kind: 'incident_resolved',
        message:
          `Redistributed ${rec.submissionIdsToMove.length} submission(s) from ` +
          `${rec.overloadedJudgeName} to ${rec.targetJudgeName}`,
        timestamp: Date.now(),
        teamId: null,
        actorName: 'Organizer',
      },
    }, ORGANIZER);
  }

  return (
    <main className="view organizer-view" aria-label="Organizer Dashboard">
      <header className="view__header">
        <div>
          <p className="view__eyebrow">Operations</p>
          <h1 className="view__title">{state.event.name}</h1>
          <p className="view__subtitle">{state.event.phase} phase</p>
        </div>
        <div className="sim-controls">
          <button
            id="sim-start-btn"
            className="btn btn--primary"
            onClick={handleStartSim}
            disabled={simRunning}
            aria-pressed={simRunning}
          >
            <Play className="btn__icon" aria-hidden="true" />
            Start Simulation
          </button>
          <button
            id="sim-pause-btn"
            className="btn btn--ghost"
            onClick={handlePauseSim}
            disabled={!simRunning}
            aria-pressed={simPaused}
          >
            <Pause className="btn__icon" aria-hidden="true" />
            {simPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            id="sim-reset-btn"
            className="btn btn--ghost"
            onClick={handleResetSim}
            aria-label="Reset simulation and restore seed state"
          >
            <RotateCcw className="btn__icon" aria-hidden="true" />
            Reset
          </button>
        </div>
      </header>

      <section className="stat-bar" aria-label="Key metrics">
        <div className="stat">
          <span className="stat__value">{health.score}</span>
          <span className="stat__label">Health</span>
          <span className={`stat__tag stat__tag--${health.label}`}>{health.label}</span>
        </div>

        <div className="stat">
          <span className="stat__value">{checkedInCount}<span className="stat__denom">/{totalParticipants}</span></span>
          <span className="stat__label">Attendance</span>
          <span className="stat__meta">{Math.round(health.breakdown.attendanceRatio * 100)}%</span>
        </div>

        <div className="stat">
          <span className="stat__value">{teamsWithSubmissions}<span className="stat__denom">/{totalTeams}</span></span>
          <span className="stat__label">Teams w/ submission</span>
          <span className="stat__meta">{Math.round(health.breakdown.teamFormationRatio * 100)}%</span>
        </div>

        <div className="stat">
          <span className="stat__value">{submissionsScored}<span className="stat__denom">/{totalSubmissions}</span></span>
          <span className="stat__label">Judging</span>
          <span className="stat__meta">{Math.round(health.breakdown.judgingProgressRatio * 100)}%</span>
        </div>

        <div className={`stat ${openIncidents.length > 0 ? 'stat--alert' : ''}`}>
          <span className="stat__value">{openIncidents.length}</span>
          <span className="stat__label">Incidents</span>
        </div>
      </section>

      <section className="panel panel--wide" aria-labelledby="checkin-heading">
        <div className="panel__head">
          <h2 id="checkin-heading" className="panel__title">
            Check-in
            <span className="panel__badge">{notCheckedInParticipants.length} pending</span>
          </h2>
        </div>
        <div className="panel__body">
        {checkInMessage && (
          <div className={`alert alert--${checkInMessage.type}`} role="alert">
            {checkInMessage.type === 'success' ? (
              <Check className="alert__icon" aria-hidden="true" />
            ) : (
              <AlertTriangle className="alert__icon" aria-hidden="true" />
            )}
            {checkInMessage.text}
          </div>
        )}

        {notCheckedInParticipants.length === 0 ? (
          <div className="empty-state" role="status">
            <CheckCircle className="empty-state__icon" aria-hidden="true" />
            <p>All participants checked in</p>
          </div>
        ) : (
          <div className="checkin-layout">
            <div className="checkin-layout__form">
              <label htmlFor="participant-select" className="form-label">
                Select participant to simulate scan
              </label>
              <select
                id="participant-select"
                className="form-control form-control--spaced"
                value={selectedParticipantId ?? ''}
                onChange={(e) => setSelectedParticipantId(e.target.value || null)}
              >
                <option value="">Choose participant</option>
                {notCheckedInParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
              <button
                className="btn btn--primary btn--block"
                onClick={() => selectedParticipantId && handleScanCheckIn(selectedParticipantId)}
                disabled={!selectedParticipantId}
              >
                <Check className="btn__icon" aria-hidden="true" />
                Scan &amp; Check In
              </button>
            </div>

            {selectedParticipantId && (
              <div className="qr-pass">
                <div className="qr-pass__label">
                  {state.participants[selectedParticipantId]?.name}'s Pass
                </div>
                <div className="qr-pass__canvas">
                  <QRCodeSVG
                    value={selectedParticipantId}
                    size={160}
                    level="M"
                    includeMargin
                  />
                </div>
                <div className="qr-pass__id">
                  ID: {selectedParticipantId}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </section>

      <div className="view__grid-2">
        <section className="panel" aria-labelledby="teams-heading">
          <div className="panel__head">
            <h2 id="teams-heading" className="panel__title">
              Teams
              <span className="panel__badge">{filteredTeams.length}/{totalTeams}</span>
            </h2>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
          <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            type="search"
            className="form-control"
            placeholder="Filter by name or skill…"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            aria-label="Filter teams"
          />
          </div>
          {filteredTeams.length === 0 ? (
            <div className="empty-state" role="status">
              <Users className="empty-state__icon" aria-hidden="true" />
              <p>{teamFilter ? `No teams match "${teamFilter}"` : 'No teams yet'}</p>
            </div>
          ) : (
            <div className="data-list">
              <div className="data-list__head data-list__head--team">
                <span>Team</span>
                <span>Members</span>
                <span>Status</span>
              </div>
              {filteredTeams.map((team) => (
                <div key={team.id} className="data-row data-row--team">
                  <div>
                    <div className="data-row__primary">{team.name}</div>
                    <div className="data-row__secondary">{team.tags.join(', ') || '—'}</div>
                  </div>
                  <span className="data-row__metric">{team.memberIds.length}</span>
                  <span className={`status-pill ${team.submissionId ? 'status-pill--ok' : 'status-pill--wait'}`}>
                    <span className="status-pill__dot" aria-hidden="true" />
                    {team.submissionId ? 'Submitted' : 'Building'}
                  </span>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>

        <section className="panel" aria-labelledby="judges-heading">
          <div className="panel__head">
            <h2 id="judges-heading" className="panel__title">
              Judge workload
              {overload.overloadedJudgeIds.length > 0 && (
                <span className="panel__badge panel__badge--alert">{overload.overloadedJudgeIds.length} over</span>
              )}
            </h2>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            <div className="data-list">
              <div className="data-list__head data-list__head--judge">
                <span>Judge</span>
                <span>Load</span>
                <span>Capacity</span>
              </div>
              {judgeWorkload.map((j) => (
                <div key={j.id} className={`data-row data-row--judge ${j.isOverloaded ? 'data-row--warn' : ''}`}>
                  <div className="data-row__primary">{j.name}</div>
                  <span className={`workload-count ${j.isOverloaded ? 'workload-count--over' : ''}`}>
                    {j.assigned}/{j.capacity}
                    {j.isOverloaded && (
                      <AlertTriangle className="workload-count__icon" aria-label="Over capacity" />
                    )}
                  </span>
                  <div className="workload-bar" role="progressbar" aria-valuenow={j.assigned} aria-valuemin={0} aria-valuemax={j.capacity} aria-label={`${j.name} workload`}>
                    <div
                      className={`workload-bar__fill ${j.isOverloaded ? 'workload-bar__fill--over' : ''}`}
                      style={{ width: `${Math.min(100, (j.assigned / j.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="view__grid-2">
        <section className="panel" aria-labelledby="feed-heading">
          <div className="panel__head">
            <h2 id="feed-heading" className="panel__title">Activity</h2>
          </div>
          <div className="panel__body">
          <ActivityFeed entries={state.activityFeed.slice(0, 10)} />
          </div>
        </section>

        <section className="panel" aria-labelledby="incidents-heading">
          <div className="panel__head">
            <h2 id="incidents-heading" className="panel__title">
              Active Incidents
              {openIncidents.length > 0 && (
                <span className="panel__badge panel__badge--alert">{openIncidents.length}</span>
              )}
            </h2>
          </div>
          <div className="panel__body" style={{ padding: visibleIncidents.length === 0 ? undefined : 0 }}>
          {visibleIncidents.length === 0 ? (
            <div className="empty-state" role="status">
              <ShieldCheck className="empty-state__icon" aria-hidden="true" />
              <p>No active incidents</p>
            </div>
          ) : (
            <div className="panel__list">
              {visibleIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  canApply
                  onApplyRecommendation={handleApplyRecommendation}
                />
              ))}
            </div>
          )}
          </div>
        </section>
      </div>
    </main>
  );
}
