// ─── Participant View ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { EventStore } from '../../state/eventStore';
import type { EventState } from '../../state/types';
import { Leaderboard } from '../../components/Leaderboard';
import { ActivityFeed } from '../../components/ActivityFeed';
import { teamMemberCompatibility, findTopMatches } from '../../intelligence/compatibility';

// Demo: show the view from Aryan Mehta's perspective (p-01, team t-01)
// You can change this to any participant ID to test different scenarios
const MY_PARTICIPANT_ID = 'p-01';

export function ParticipantView() {
  const [state, setState] = useState<Readonly<EventState>>(EventStore.getState());
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [teamFormSuccess, setTeamFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  const me = state.participants[MY_PARTICIPANT_ID];
  const myTeam = me?.teamId ? state.teams[me.teamId] : null;
  const mySubmissionId = myTeam?.submissionId ?? null;
  const mySubmission = mySubmissionId ? state.submissions[mySubmissionId] : null;

  // Use teamMemberCompatibility (pairwise average) instead of teamProjectCompatibility (tags)
  const compatibilityScore = myTeam
    ? teamMemberCompatibility(myTeam, state.participants)
    : 0;

  const timeLeft = Math.max(0, state.event.endTime - Date.now());
  const minutesLeft = Math.floor(timeLeft / 60_000);
  const secondsLeft = Math.floor((timeLeft % 60_000) / 1000);

  // ─── Matchmaking ─────────────────────────────────────────────────────────────
  const topMatches = me && !myTeam ? findTopMatches(me, state.participants, 5) : [];

  function handleProposeTeam(candidateId: string, compatibilityScore: number) {
    if (!me) return;

    // Validate: check if candidate is already on a team
    const candidate = state.participants[candidateId];
    if (!candidate) return;

    if (candidate.teamId !== null) {
      setTeamFormError(`${candidate.name} is already on another team. Try another candidate.`);
      setTimeout(() => setTeamFormError(null), 3000);
      return;
    }

    // Create 2-person team (me + candidate)
    const teamId = `t-new-${Date.now()}`;
    const memberIds = [MY_PARTICIPANT_ID, candidateId];
    const memberNames = [me.name, candidate.name].join(' & ');

    const newTeam = {
      id: teamId,
      name: `Team ${me.name.split(' ')[0]}`,
      memberIds,
      projectTitle: 'Untitled Project',
      projectDescription: 'Newly formed team — ready to start building!',
      tags: [],
      submissionId: null,
    };

    EventStore.dispatch({ type: 'CREATE_TEAM', team: newTeam });

    EventStore.dispatch({
      type: 'ADD_ACTIVITY',
      entry: {
        id: `act-team-${teamId}-${Date.now()}`,
        kind: 'team_join',
        message: `${memberNames} formed a new team`,
        timestamp: Date.now(),
        teamId,
        actorName: me.name,
      },
    });

    setTeamFormSuccess(`✓ Team formed with ${candidate.name} (${compatibilityScore}% match)!`);
    setTimeout(() => setTeamFormSuccess(null), 4000);
  }

  return (
    <main className="view participant-view" aria-label="Participant View">
      <header className="view__header">
        <div>
          <h1 className="view__title">Participant Portal</h1>
          <p className="view__subtitle">{me?.name ?? 'Participant'} · {state.event.name}</p>
        </div>
        <div className="countdown" aria-label={`Time remaining: ${minutesLeft} minutes ${secondsLeft} seconds`}>
          <span className="countdown__value">{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}</span>
          <span className="countdown__label">remaining</span>
        </div>
      </header>

      <div className="view__body">
        {/* Matchmaking — only show if not on a team */}
        {!myTeam && me && (
          <section className="panel panel--wide" aria-labelledby="matchmaking-heading" style={{ gridColumn: '1 / -1' }}>
            <h2 id="matchmaking-heading" className="panel__title">Find Your Team</h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Top {topMatches.length} compatible teammates based on your skills: {me.skills.join(', ')}
            </p>

            {teamFormSuccess && (
              <div className="alert alert--success" role="alert">
                {teamFormSuccess}
              </div>
            )}

            {teamFormError && (
              <div className="alert alert--error" role="alert">
                {teamFormError}
              </div>
            )}

            {topMatches.length === 0 ? (
              <p className="panel__empty">No available teammates right now. Check back soon!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topMatches.map((match) => {
                  const participant = state.participants[match.participantId];
                  if (!participant) return null;

                  return (
                    <div
                      key={participant.id}
                      style={{
                        padding: '1rem',
                        background: '#f9f9f9',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '1.1rem' }}>{participant.name}</strong>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                            {participant.skills.join(' · ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: match.score >= 70 ? '#2e7d32' : match.score >= 50 ? '#f57c00' : '#666' }}>
                            {match.score}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>compatibility</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>
                        {match.reasons.map((reason, idx) => (
                          <div key={idx} style={{ marginBottom: '0.25rem' }}>
                            • {reason}
                          </div>
                        ))}
                      </div>

                      <button
                        className="btn btn--primary"
                        onClick={() => handleProposeTeam(participant.id, match.score)}
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        Propose Team with {participant.name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Team card — only show if on a team */}
        {myTeam && (
          <section className="panel" aria-labelledby="team-heading">
            <h2 id="team-heading" className="panel__title">My Team</h2>
            <div className="team-card">
              <h3 className="team-card__name">{myTeam.name}</h3>
              <p className="team-card__project">{myTeam.projectTitle}</p>
              <p className="team-card__desc">{myTeam.projectDescription}</p>

              <div className="team-card__tags">
                {myTeam.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="compatibility-meter" aria-label={`Compatibility score: ${compatibilityScore}%`}>
                <span className="compatibility-meter__label">Skill Match</span>
                <div className="compatibility-meter__bar-track">
                  <div
                    className="compatibility-meter__bar-fill"
                    style={{ width: `${compatibilityScore}%` }}
                    role="progressbar"
                    aria-valuenow={compatibilityScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="compatibility-meter__score">{compatibilityScore}%</span>
              </div>

              <div className="team-card__members">
                <strong>Members:</strong>
                {myTeam.memberIds.map((id) => {
                  const p = state.participants[id];
                  return p ? (
                    <span key={id} className={`member-chip ${p.checkedIn ? 'member-chip--in' : 'member-chip--out'}`}>
                      {p.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </section>
        )}

        {/* Submission status */}
        <section className="panel" aria-labelledby="submission-heading">
          <h2 id="submission-heading" className="panel__title">Submission</h2>
          {mySubmission ? (
            <div className={`submission-status submission-status--${mySubmission.status}`}>
              <div className="submission-status__row">
                <span className="submission-status__label">Status</span>
                <span className={`submission-status__badge submission-status__badge--${mySubmission.status}`}>
                  {mySubmission.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="submission-status__row">
                <span className="submission-status__label">Project</span>
                <span>{mySubmission.title}</span>
              </div>
              <div className="submission-status__row">
                <span className="submission-status__label">Scores</span>
                <span>
                  {Object.keys(mySubmission.scores).length > 0
                    ? `${Object.values(mySubmission.scores).join(', ')} / 100`
                    : 'Awaiting judges'}
                </span>
              </div>
            </div>
          ) : (
            <p className="panel__empty">No submission yet. Submit before time runs out!</p>
          )}
        </section>

        {/* Leaderboard */}
        <section className="panel panel--wide" aria-labelledby="lb-heading">
          <h2 id="lb-heading" className="panel__title">Live Leaderboard</h2>
          <Leaderboard entries={state.leaderboard} />
        </section>

        {/* Feed */}
        <section className="panel" aria-labelledby="pfeed-heading">
          <h2 id="pfeed-heading" className="panel__title">Event Feed</h2>
          <ActivityFeed entries={state.activityFeed} maxItems={20} />
        </section>
      </div>
    </main>
  );
}
