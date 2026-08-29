// ─── Participant View ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { EventStore } from '../../state/eventStore';
import type { EventState } from '../../state/types';
import { Leaderboard } from '../../components/Leaderboard';
import { ActivityFeed } from '../../components/ActivityFeed';
import { teamProjectCompatibility } from '../../intelligence/compatibility';

// Demo: show the view from NeuralNomads' perspective (team t-01)
const MY_TEAM_ID = 't-01';

export function ParticipantView() {
  const [state, setState] = useState<Readonly<EventState>>(EventStore.getState());

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  const myTeam = state.teams[MY_TEAM_ID];
  const mySubmissionId = myTeam?.submissionId ?? null;
  const mySubmission = mySubmissionId ? state.submissions[mySubmissionId] : null;

  const compatibility = myTeam
    ? teamProjectCompatibility({ team: myTeam, participants: state.participants })
    : null;

  const timeLeft = Math.max(0, state.event.endTime - Date.now());
  const minutesLeft = Math.floor(timeLeft / 60_000);
  const secondsLeft = Math.floor((timeLeft % 60_000) / 1000);

  return (
    <main className="view participant-view" aria-label="Participant View">
      <header className="view__header">
        <div>
          <h1 className="view__title">Participant Portal</h1>
          <p className="view__subtitle">{myTeam?.name ?? 'No Team'} · {state.event.name}</p>
        </div>
        <div className="countdown" aria-label={`Time remaining: ${minutesLeft} minutes ${secondsLeft} seconds`}>
          <span className="countdown__value">{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}</span>
          <span className="countdown__label">remaining</span>
        </div>
      </header>

      <div className="view__body">
        {/* Team card */}
        <section className="panel" aria-labelledby="team-heading">
          <h2 id="team-heading" className="panel__title">My Team</h2>
          {myTeam ? (
            <div className="team-card">
              <h3 className="team-card__name">{myTeam.name}</h3>
              <p className="team-card__project">{myTeam.projectTitle}</p>
              <p className="team-card__desc">{myTeam.projectDescription}</p>

              <div className="team-card__tags">
                {myTeam.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              {compatibility && (
                <div className="compatibility-meter" aria-label={`Compatibility score: ${compatibility.score}%`}>
                  <span className="compatibility-meter__label">Skill Match</span>
                  <div className="compatibility-meter__bar-track">
                    <div
                      className="compatibility-meter__bar-fill"
                      style={{ width: `${compatibility.score}%` }}
                      role="progressbar"
                      aria-valuenow={compatibility.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <span className="compatibility-meter__score">{compatibility.score}%</span>
                </div>
              )}

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
          ) : (
            <p className="panel__empty">You are not part of a team yet.</p>
          )}
        </section>

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
