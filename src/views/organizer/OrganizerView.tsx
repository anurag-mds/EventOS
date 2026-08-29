// ─── Organizer View ──────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
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
  
  // Check-in UI state
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Team filter state
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  // ─── Derived Metrics ────────────────────────────────────────────────────────

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

  // ─── Judge Workload ─────────────────────────────────────────────────────────

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

  // ─── Team Filtering ─────────────────────────────────────────────────────────

  const filteredTeams = useMemo(() => {
    if (!teamFilter.trim()) return teams;
    const query = teamFilter.toLowerCase();
    return teams.filter((team) => {
      // Match team name
      if (team.name.toLowerCase().includes(query)) return true;
      // Match member skills
      const memberSkills = team.memberIds
        .map((mid) => state.participants[mid]?.skills ?? [])
        .flat()
        .map((s) => s.toLowerCase());
      return memberSkills.some((skill) => skill.includes(query));
    });
  }, [teams, teamFilter, state.participants]);

  // ─── Check-In Logic ─────────────────────────────────────────────────────────

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

    // Dispatch check-in
    EventStore.dispatch({ type: 'CHECK_IN_PARTICIPANT', participantId });

    // Add activity
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
      text: `✓ ${participant.name} checked in successfully`,
      type: 'success',
    });
    setSelectedParticipantId(null);
    setTimeout(() => setCheckInMessage(null), 3000);
  }

  // ─── Simulation Toggle ──────────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="view organizer-view" aria-label="Organizer Dashboard">
      {/* Header */}
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

      {/* Check-In Section */}
      <section className="panel" aria-labelledby="checkin-heading" style={{ marginTop: '1.5rem' }}>
        <h2 id="checkin-heading" className="panel__title">
          QR Check-In Scanner
          <span className="panel__badge">{notCheckedInParticipants.length} pending</span>
        </h2>

        {checkInMessage && (
          <div className={`alert alert--${checkInMessage.type}`} role="alert">
            {checkInMessage.text}
          </div>
        )}

        {notCheckedInParticipants.length === 0 ? (
          <p className="panel__empty">✅ All participants checked in!</p>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Participant Selector */}
            <div style={{ flex: '1 1 300px' }}>
              <label htmlFor="participant-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Select participant to simulate scan:
              </label>
              <select
                id="participant-select"
                value={selectedParticipantId ?? ''}
                onChange={(e) => setSelectedParticipantId(e.target.value || null)}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem' }}
              >
                <option value="">-- Choose participant --</option>
                {notCheckedInParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
              <button
                className="btn btn--primary"
                onClick={() => selectedParticipantId && handleScanCheckIn(selectedParticipantId)}
                disabled={!selectedParticipantId}
                style={{ width: '100%' }}
              >
                ✓ Scan &amp; Check In
              </button>
            </div>

            {/* QR Code Display */}
            {selectedParticipantId && (
              <div style={{ flex: '0 0 auto', textAlign: 'center', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  {state.participants[selectedParticipantId]?.name}'s Pass
                </div>
                <QRCodeSVG
                  value={selectedParticipantId}
                  size={160}
                  level="M"
                  includeMargin
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                  ID: {selectedParticipantId}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Two-column layout: Teams & Judge Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Teams with Filter */}
        <section className="panel" aria-labelledby="teams-heading">
          <h2 id="teams-heading" className="panel__title">
            Teams
            <span className="panel__badge">{filteredTeams.length}/{totalTeams}</span>
          </h2>
          <input
            type="search"
            placeholder="Filter by team name or member skill..."
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', border: '1px solid #ddd', borderRadius: '4px' }}
            aria-label="Filter teams"
          />
          {filteredTeams.length === 0 ? (
            <p className="panel__empty">No teams match "{teamFilter}"</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredTeams.map((team) => (
                <div key={team.id} style={{ padding: '0.75rem', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #e5e5e5' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{team.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    {team.memberIds.length} members · {team.tags.join(', ')}
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {team.submissionId ? (
                      <span style={{ color: '#2e7d32' }}>✓ Submitted</span>
                    ) : (
                      <span style={{ color: '#f57c00' }}>⏳ In progress</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Judge Workload */}
        <section className="panel" aria-labelledby="judges-heading">
          <h2 id="judges-heading" className="panel__title">
            Judge Workload
            {overload.overloadedJudgeIds.length > 0 && (
              <span className="panel__badge panel__badge--alert">{overload.overloadedJudgeIds.length} overloaded</span>
            )}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {judgeWorkload.map((j) => (
              <div key={j.id} style={{ padding: '0.75rem', background: j.isOverloaded ? '#fff3e0' : '#f9f9f9', borderRadius: '6px', border: `1px solid ${j.isOverloaded ? '#ff9800' : '#e5e5e5'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{j.name}</span>
                  <span style={{ fontSize: '0.9rem', color: j.isOverloaded ? '#e65100' : '#666' }}>
                    {j.assigned}/{j.capacity}
                    {j.isOverloaded && ' ⚠️'}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (j.assigned / j.capacity) * 100)}%`, background: j.isOverloaded ? '#ff9800' : '#4caf50', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Activity Feed + Incidents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
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
      </div>
    </main>
  );
}
