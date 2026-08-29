// ─── Judge View ───────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { AlertTriangle, FolderOpen, ExternalLink, CheckCircle, ClipboardList } from 'lucide-react';
import { EventStore } from '../../state/eventStore';
import type { EventState, Submission } from '../../state/types';
import { judgeOverload } from '../../intelligence/judgeOverload';
import { ActivityFeed } from '../../components/ActivityFeed';

const MY_JUDGE_ID = 'j-01';
const JUDGE = { role: 'judge' as const };

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

    EventStore.dispatch(
      { type: 'POST_SCORE', submissionId, judgeId: MY_JUDGE_ID, score },
      JUDGE
    );
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
    }, JUDGE);
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
          <p className="view__eyebrow">Judging</p>
          <h1 className="view__title">{me?.name ?? 'Judge'}</h1>
          <p className="view__subtitle">{state.event.name} · {mySubmissions.length} in queue</p>
        </div>
        {amOverloaded && (
          <div className="overload-banner" role="alert" aria-live="assertive">
            <AlertTriangle className="overload-banner__icon" aria-hidden="true" />
            {overload.overloadBy[MY_JUDGE_ID]} over capacity
          </div>
        )}
      </header>

      <div className="view__body">
        <section className="panel panel--wide" aria-labelledby="queue-heading">
          <div className="panel__head">
            <h2 id="queue-heading" className="panel__title">
              Queue
              <span className="panel__badge">{mySubmissions.length}</span>
            </h2>
          </div>
          <div className="panel__body" style={{ padding: mySubmissions.length === 0 ? undefined : 0 }}>

          {mySubmissions.length === 0 && (
            <div className="empty-state" role="status">
              <ClipboardList className="empty-state__icon" aria-hidden="true" />
              <p>No submissions assigned.</p>
            </div>
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
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="submission-card__team">{team?.name ?? sub.teamId}</p>
                <p className="submission-card__desc">{sub.description}</p>

                <div className="submission-card__links">
                  <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer" className="link">
                    <FolderOpen className="link__icon" aria-hidden="true" />
                    Repo
                  </a>
                  <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer" className="link">
                    <ExternalLink className="link__icon" aria-hidden="true" />
                    Demo
                  </a>
                </div>

                <div className="submission-card__scoring">
                  {alreadyScored ? (
                    <div className="scoring-done" aria-label={`You scored ${myScore}/100`}>
                      <CheckCircle className="scoring-done__icon" aria-hidden="true" />
                      <span>Scored <strong>{myScore}/100</strong></span>
                    </div>
                  ) : (
                    <div className="scoring-form">
                      <label htmlFor={`score-${sub.id}`} className="scoring-form__label">
                        Score
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
                        placeholder="0–100"
                      />
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleScoreSubmit(sub.id)}
                        disabled={!scoreDraft[sub.id]}
                        aria-label={`Submit score for ${sub.title}`}
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          </div>
        </section>

        <section className="panel" aria-labelledby="expertise-heading">
          <div className="panel__head">
            <h2 id="expertise-heading" className="panel__title">Expertise</h2>
          </div>
          <div className="panel__body">
          <div className="tag-list">
            {(me?.expertise ?? []).map((e) => (
              <span key={e} className="tag">{e}</span>
            ))}
          </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="jfeed-heading">
          <div className="panel__head">
            <h2 id="jfeed-heading" className="panel__title">Score log</h2>
          </div>
          <div className="panel__body">
          <ActivityFeed
            entries={state.activityFeed.filter((a) => a.kind === 'score_posted')}
            maxItems={20}
          />
          </div>
        </section>
      </div>
    </main>
  );
}
