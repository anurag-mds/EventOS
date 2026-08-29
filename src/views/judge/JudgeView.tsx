// ─── Judge View ───────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { EventStore } from '../../state/eventStore';
import type { EventState, Submission } from '../../state/types';
import { judgeOverload } from '../../intelligence/judgeOverload';
import { ActivityFeed } from '../../components/ActivityFeed';

// Demo: show view from Dr. Vaidya's perspective (judge j-01)
const MY_JUDGE_ID = 'j-01';

export function JudgeView() {
  const [state, setState] = useState<Readonly<EventState>>(EventStore.getState());
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = EventStore.subscribe(setState);
    return unsub;
  }, []);

  const me = state.judges[MY_JUDGE_ID];
  const overload = judgeOverload(Object.values(state.judges));
  const amOverloaded = overload.overloadedJudgeIds.includes(MY_JUDGE_ID);

  const mySubmissions: Submission[] = (me?.assignedSubmissionIds ?? [])
    .map((id) => state.submissions[id])
    .filter((s): s is Submission => s !== undefined);

  function handleScoreSubmit(submissionId: string) {
    const raw = scoreDraft[submissionId];
    const score = parseInt(raw, 10);
    if (isNaN(score) || score < 0 || score > 100) return;

    EventStore.dispatch({ type: 'POST_SCORE', submissionId, judgeId: MY_JUDGE_ID, score });
    EventStore.dispatch({
      type: 'ADD_ACTIVITY',
      entry: {
        id: `act-score-${submissionId}-${MY_JUDGE_ID}`,
        kind: 'score_posted',
        message: `${me?.name ?? 'Judge'} scored ${state.submissions[submissionId]?.title ?? submissionId}: ${score}/100`,
        timestamp: Date.now(),
        teamId: state.submissions[submissionId]?.teamId ?? null,
        actorName: me?.name ?? 'Judge',
      },
    });
    setScoreDraft((prev) => {
      const next = { ...prev };
      delete next[submissionId];
      return next;
    });
  }

  return (
    <main className="view judge-view" aria-label="Judge Panel">
      <header className="view__header">
        <div>
          <h1 className="view__title">Judge Panel</h1>
          <p className="view__subtitle">{me?.name ?? 'Judge'} · {state.event.name}</p>
        </div>
        {amOverloaded && (
          <div className="overload-banner" role="alert" aria-live="assertive">
            ⚠️ You are over capacity — {overload.overloadBy[MY_JUDGE_ID]} extra submissions assigned
          </div>
        )}
      </header>

      <div className="view__body">
        {/* Submission queue */}
        <section className="panel panel--wide" aria-labelledby="queue-heading">
          <h2 id="queue-heading" className="panel__title">
            My Submission Queue
            <span className="panel__badge">{mySubmissions.length}</span>
          </h2>

          {mySubmissions.length === 0 && (
            <p className="panel__empty">No submissions assigned yet.</p>
          )}

          {mySubmissions.map((sub) => {
            const myScore = sub.scores[MY_JUDGE_ID];
            const team = state.teams[sub.teamId];
            const alreadyScored = myScore !== undefined;

            return (
              <article key={sub.id} className={`submission-card submission-card--${sub.status}`}>
                <div className="submission-card__header">
                  <h3 className="submission-card__title">{sub.title}</h3>
                  <span className={`submission-card__status submission-card__status--${sub.status}`}>
                    {sub.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <p className="submission-card__team">by {team?.name ?? sub.teamId}</p>
                <p className="submission-card__desc">{sub.description}</p>

                <div className="submission-card__links">
                  <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer" className="link">
                    📁 Repository
                  </a>
                  <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer" className="link">
                    🚀 Demo
                  </a>
                </div>

                <div className="submission-card__scoring">
                  {alreadyScored ? (
                    <div className="scoring-done" aria-label={`You scored ${myScore}/100`}>
                      <span className="scoring-done__icon">✅</span>
                      <span>Your score: <strong>{myScore}/100</strong></span>
                    </div>
                  ) : (
                    <div className="scoring-form">
                      <label htmlFor={`score-${sub.id}`} className="scoring-form__label">
                        Your Score (0–100)
                      </label>
                      <input
                        id={`score-${sub.id}`}
                        type="number"
                        min={0}
                        max={100}
                        className="scoring-form__input"
                        value={scoreDraft[sub.id] ?? ''}
                        onChange={(e) =>
                          setScoreDraft((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        aria-label={`Score for ${sub.title}`}
                      />
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleScoreSubmit(sub.id)}
                        disabled={!scoreDraft[sub.id]}
                        aria-label={`Submit score for ${sub.title}`}
                      >
                        Submit Score
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* My expertise */}
        <section className="panel" aria-labelledby="expertise-heading">
          <h2 id="expertise-heading" className="panel__title">My Expertise</h2>
          <div className="tag-list">
            {(me?.expertise ?? []).map((e) => (
              <span key={e} className="tag">{e}</span>
            ))}
          </div>
        </section>

        {/* Feed */}
        <section className="panel" aria-labelledby="jfeed-heading">
          <h2 id="jfeed-heading" className="panel__title">Score Events</h2>
          <ActivityFeed
            entries={state.activityFeed.filter((a) => a.kind === 'score_posted')}
            maxItems={20}
          />
        </section>
      </div>
    </main>
  );
}
