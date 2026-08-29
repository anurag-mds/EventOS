// ─── Participant View ────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import { Check, AlertTriangle, Users } from 'lucide-react';
import { EventStore } from '../../state/eventStore';
import type { EventState } from '../../state/types';
import { Leaderboard } from '../../components/Leaderboard';
import { ActivityFeed } from '../../components/ActivityFeed';
import { teamMemberCompatibility, findTopMatches } from '../../intelligence/compatibility';

const MY_PARTICIPANT_ID = 'p-01';
const PARTICIPANT = { role: 'participant' as const };

function scoreClass(score: number): string {
  if (score >= 70) return 'candidate-card__score--high';
  if (score >= 50) return 'candidate-card__score--mid';
  return 'candidate-card__score--low';
}

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

  const compatibilityScore = myTeam
    ? teamMemberCompatibility(myTeam, state.participants)
    : 0;

  const timeLeft = Math.max(0, state.event.endTime - Date.now());
  const minutesLeft = Math.floor(timeLeft / 60_000);
  const secondsLeft = Math.floor((timeLeft % 60_000) / 1000);

  const topMatches = useMemo(
    () => (me && !myTeam ? findTopMatches(me, state.participants, 5) : []),
    [me, myTeam, state.participants]
  );

  function handleProposeTeam(candidateId: string, matchScore: number) {
    if (!me) return;

    const candidate = state.participants[candidateId];
    if (!candidate) return;

    if (candidate.teamId !== null) {
      setTeamFormError(`${candidate.name} is already on another team. Try another candidate.`);
      setTimeout(() => setTeamFormError(null), 3000);
      return;
    }

    const teamId = `t-new-${Date.now()}`;
    const memberIds = [MY_PARTICIPANT_ID, candidateId];
    const memberNames = [me.name, candidate.name].join(' & ');

    // Derive team tags from members' combined skills (take top 3 unique)
    const allSkills = [...me.skills, ...candidate.skills];
    const uniqueSkills = Array.from(new Set(allSkills));
    const teamTags = uniqueSkills.slice(0, 3);

    const newTeam = {
      id: teamId,
      name: `Team ${me.name.split(' ')[0]}`,
      memberIds,
      projectTitle: 'Untitled Project',
      projectDescription: 'Newly formed team — ready to start building!',
      tags: teamTags,
      submissionId: null,
    };

    EventStore.dispatch({ type: 'CREATE_TEAM', team: newTeam }, PARTICIPANT);

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
    }, PARTICIPANT);

    setTeamFormSuccess(`Team formed with ${candidate.name} (${matchScore}% match)`);
    setTimeout(() => setTeamFormSuccess(null), 4000);
  }

  return (
    <main className="view participant-view" aria-label="Participant View">
      <header className="view__header">
        <div>
          <p className="view__eyebrow">Participant</p>
          <h1 className="view__title">{me?.name ?? 'Participant'}</h1>
          <p className="view__subtitle">{state.event.name}</p>
        </div>
        <div className="countdown" aria-label={`Time remaining: ${minutesLeft} minutes ${secondsLeft} seconds`}>
          <span className="countdown__value">{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}</span>
          <span className="countdown__label">time left</span>
        </div>
      </header>

      <div className="view__body">
        {!myTeam && me && (
          <section className="panel panel--wide" aria-labelledby="matchmaking-heading">
            <div className="panel__head">
              <h2 id="matchmaking-heading" className="panel__title">Team match</h2>
            </div>
            <div className="panel__body">
            <p className="section-intro">
              {topMatches.length} candidates ranked by skill overlap — {me.skills.join(', ')}
            </p>

            {teamFormSuccess && (
              <div className="alert alert--success" role="alert">
                <Check className="alert__icon" aria-hidden="true" />
                {teamFormSuccess}
              </div>
            )}

            {teamFormError && (
              <div className="alert alert--error" role="alert">
                <AlertTriangle className="alert__icon" aria-hidden="true" />
                {teamFormError}
              </div>
            )}

            {topMatches.length === 0 ? (
              <div className="empty-state" role="status">
                <Users className="empty-state__icon" aria-hidden="true" />
                <p>No available teammates right now. Check back soon.</p>
              </div>
            ) : (
              <div className="data-list">
                {topMatches.map((match) => {
                  const participant = state.participants[match.participantId];
                  if (!participant) return null;

                  return (
                    <div key={participant.id} className="candidate-card">
                      <div className="candidate-card__row">
                        <div>
                          <div className="candidate-card__name">{participant.name}</div>
                          <div className="candidate-card__skills">
                            {participant.skills.join(' · ')}
                          </div>
                        </div>
                        <div className="candidate-card__score-block">
                          <div className={`candidate-card__score ${scoreClass(match.score)}`}>
                            {match.score}%
                          </div>
                          <div className="candidate-card__score-label">match</div>
                        </div>
                      </div>

                      <div className="candidate-card__reasons">
                        {match.reasons.map((reason, idx) => (
                          <div key={idx} className="candidate-card__reason">
                            {reason}
                          </div>
                        ))}
                      </div>

                      <button
                        className="btn btn--primary btn--block"
                        onClick={() => handleProposeTeam(participant.id, match.score)}
                      >
                        Invite {participant.name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </section>
        )}

        {myTeam && (
          <section className="panel" aria-labelledby="team-heading">
            <div className="panel__head">
              <h2 id="team-heading" className="panel__title">Team</h2>
            </div>
            <div className="panel__body">
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
                      <span className="member-chip__dot" aria-hidden="true" />
                      {p.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            </div>
          </section>
        )}

        <section className="panel" aria-labelledby="submission-heading">
          <div className="panel__head">
            <h2 id="submission-heading" className="panel__title">Submission</h2>
          </div>
          <div className="panel__body">
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
            <p className="panel__empty">No submission yet.</p>
          )}
          </div>
        </section>

        <section className="panel panel--wide" aria-labelledby="lb-heading">
          <div className="panel__head">
            <h2 id="lb-heading" className="panel__title">Leaderboard</h2>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
          <Leaderboard entries={state.leaderboard} />
          </div>
        </section>

        <section className="panel" aria-labelledby="pfeed-heading">
          <div className="panel__head">
            <h2 id="pfeed-heading" className="panel__title">Activity</h2>
          </div>
          <div className="panel__body">
          <ActivityFeed entries={state.activityFeed} maxItems={20} />
          </div>
        </section>
      </div>
    </main>
  );
}
