// ─── Organizer View ──────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Square,
  Check,
  CheckCircle,
  Clock,
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
import { startSimulation, stopSimulation, isSimulationRunning } from '../../simulation/scriptedEngine';

export function OrganizerView() {
  const [state, setState] = useState<Readonly<EventState>>(EventStore.getState());
  const [simRunning, setSimRunning] = useState(isSimulationRunning());

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  const participants = Object.values(state.participants);
  const teams = Object.values(state.teams);
  const judges = Object.values(state.judges);
  const submissions = Object.values(state.submissions);

  const health = eventHealth({
    event: state.event,
    teams,
    submissions,
    incidents: state.incidents,
    participants,
    judges,
  });

  const overload = judgeOverload(judges);

  const checkedInCount = participants.filter((p) => p.checkedIn).length;
  const totalParticipants = participants.length;
  const attendanceRatio = totalParticipants > 0 ? checkedInCount / totalParticipants : 0;

  const teamsWithSubmissions = teams.filter((t) => t.submissionId !== null).length;
  const totalTeams = teams.length;
  const teamFormationRatio = totalTeams > 0 ? teamsWithSubmissions / totalTeams : 0;

  const submissionsScored = submissions.filter((s) => Object.keys(s.scores).length > 0).length;
  const totalSubmissions = submissions.length;
  const judgingProgressRatio = totalSubmissions > 0 ? submissionsScored / totalSubmissions : 1;

  const openIncidents = state.incidents.filter((i) => i.status !== 'resolved');

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

    EventStore.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId });

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
    });

    setCheckInMessage({
      text: `${participant.name} checked in successfully`,
      type: 'success',
    });
    setSelectedParticipantId(null);
    setTimeout(() => setCheckInMessage(null), 3000);
  }

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
        id: `act-resolve-${incidentId}-${Date.now()}`,
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
      <header className="view__header">
        <div>
          <h1 className="view__title">Organizer Command Center</h1>
          <p className="view__subtitle">{state.event.name} · {state.event.phase.toUpperCase()} phase</p>
        </div>
        <button
          id="sim-toggle-btn"
          className={`btn ${simRunning ? 'btn--danger' : 'btn--primary'}`}
          onClick={handleToggleSim}
          aria-pressed={simRunning}
        >
          {simRunning ? (
            <>
              <Square className="btn__icon" aria-hidden="true" />
              Stop Simulation
            </>
          ) : (
            <>
              <Play className="btn__icon" aria-hidden="true" />
              Start Simulation
            </>
          )}
        </button>
      </header>

      <section className="kpi-strip" aria-label="Key metrics">
        <div className={`kpi-card kpi-card--health`}>
          <span className="kpi-card__value">{health.score}</span>
          <span className="kpi-card__label">Event Health</span>
          <span className={`kpi-card__tag kpi-card__tag--${health.label}`}>{health.label.toUpperCase()}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__value">{checkedInCount}<span className="kpi-card__denom">/{totalParticipants}</span></span>
          <span className="kpi-card__label">Attendance</span>
          <span className="kpi-card__subtext">{Math.round(attendanceRatio * 100)}%</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__value">{teamsWithSubmissions}<span className="kpi-card__denom">/{totalTeams}</span></span>
          <span className="kpi-card__label">Team Formation</span>
          <span className="kpi-card__subtext">{Math.round(teamFormationRatio * 100)}%</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__value">{submissionsScored}<span className="kpi-card__denom">/{totalSubmissions}</span></span>
          <span className="kpi-card__label">Judging Progress</span>
          <span className="kpi-card__subtext">{Math.round(judgingProgressRatio * 100)}%</span>
        </div>

        <div className={`kpi-card ${openIncidents.length > 0 ? 'kpi-card--alert' : ''}`}>
          <span className="kpi-card__value">{openIncidents.length}</span>
          <span className="kpi-card__label">Open Incidents</span>
        </div>
      </section>

      <section className="panel panel--wide" aria-labelledby="checkin-heading">
        <h2 id="checkin-heading" className="panel__title">
          QR Check-In Scanner
          <span className="panel__badge">{notCheckedInParticipants.length} pending</span>
        </h2>

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
                className="form-control"
                value={selectedParticipantId ?? ''}
                onChange={(e) => setSelectedParticipantId(e.target.value || null)}
                style={{ marginBottom: 'var(--sp-4)' }}
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
      </section>

      <div className="view__grid-2">
        <section className="panel" aria-labelledby="teams-heading">
          <h2 id="teams-heading" className="panel__title">
            Teams
            <span className="panel__badge">{filteredTeams.length}/{totalTeams}</span>
          </h2>
          <input
            type="search"
            className="form-control"
            placeholder="Filter by team name or member skill…"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{ marginBottom: 'var(--sp-4)' }}
            aria-label="Filter teams"
          />
          {filteredTeams.length === 0 ? (
            <div className="empty-state" role="status">
              <Users className="empty-state__icon" aria-hidden="true" />
              <p>{teamFilter ? `No teams match "${teamFilter}"` : 'No teams yet'}</p>
            </div>
          ) : (
            <div className="panel__list">
              {filteredTeams.map((team) => (
                <div key={team.id} className="list-card">
                  <div className="list-card__title">{team.name}</div>
                  <div className="list-card__meta">
                    {team.memberIds.length} members · {team.tags.join(', ') || 'No tags'}
                  </div>
                  <div className={`list-card__status ${team.submissionId ? 'list-card__status--success' : 'list-card__status--pending'}`}>
                    {team.submissionId ? (
                      <>
                        <Check className="list-card__status-icon" aria-hidden="true" />
                        Submitted
                      </>
                    ) : (
                      <>
                        <Clock className="list-card__status-icon" aria-hidden="true" />
                        In progress
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="judges-heading">
          <h2 id="judges-heading" className="panel__title">
            Judge Workload
            {overload.overloadedJudgeIds.length > 0 && (
              <span className="panel__badge panel__badge--alert">{overload.overloadedJudgeIds.length} overloaded</span>
            )}
          </h2>
          <div className="panel__list">
            {judgeWorkload.map((j) => (
              <div key={j.id} className={`list-card ${j.isOverloaded ? 'list-card--warning' : ''}`}>
                <div className="list-card__header">
                  <span className="list-card__title">{j.name}</span>
                  <span className={`workload-count ${j.isOverloaded ? 'workload-count--over' : ''}`}>
                    {j.assigned}/{j.capacity}
                    {j.isOverloaded && (
                      <AlertTriangle className="workload-count__icon" aria-label="Over capacity" />
                    )}
                  </span>
                </div>
                <div className="workload-bar" role="progressbar" aria-valuenow={j.assigned} aria-valuemin={0} aria-valuemax={j.capacity} aria-label={`${j.name} workload`}>
                  <div
                    className={`workload-bar__fill ${j.isOverloaded ? 'workload-bar__fill--over' : 'workload-bar__fill--ok'}`}
                    style={{ width: `${Math.min(100, (j.assigned / j.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="view__grid-2">
        <section className="panel" aria-labelledby="feed-heading">
          <h2 id="feed-heading" className="panel__title">Live Activity</h2>
          <ActivityFeed entries={state.activityFeed.slice(0, 10)} />
        </section>

        <section className="panel" aria-labelledby="incidents-heading">
          <h2 id="incidents-heading" className="panel__title">
            Active Incidents
            {openIncidents.length > 0 && (
              <span className="panel__badge panel__badge--alert">{openIncidents.length}</span>
            )}
          </h2>
          {openIncidents.length === 0 ? (
            <div className="empty-state" role="status">
              <ShieldCheck className="empty-state__icon" aria-hidden="true" />
              <p>No active incidents</p>
            </div>
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
      </div>
    </main>
  );
}
