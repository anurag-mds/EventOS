// ─── IncidentCard Component ──────────────────────────────────────────────────
import type { Incident, IncidentSeverity } from '../state/types';

interface IncidentCardProps {
  incident: Incident;
  canApply?: boolean;
  onApplyRecommendation?: (id: string) => void;
}

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  low:      'LOW',
  medium:   'MEDIUM',
  high:     'HIGH',
  critical: 'CRITICAL',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function IncidentCard({
  incident,
  canApply = false,
  onApplyRecommendation,
}: IncidentCardProps) {
  const isJudgeOverload = incident.kind === 'judge_overload';
  const rec = incident.recommendation;
  const isResolved = incident.status === 'resolved';

  return (
    <article
      className={`incident-card incident-card--${incident.severity} incident-card--${incident.status}`}
      aria-label={`Incident: ${incident.title}`}
    >
      <header className="incident-card__header">
        <span
          className={`incident-card__badge incident-card__badge--${incident.severity}`}
          aria-label={`Severity: ${SEVERITY_LABEL[incident.severity]}`}
        >
          {SEVERITY_LABEL[incident.severity]}
        </span>
        <h3 className="incident-card__title">{incident.title}</h3>
        <span className={`incident-card__status incident-card__status--${incident.status}`}>
          {incident.status.toUpperCase()}
        </span>
      </header>

      <p className="incident-card__desc">{incident.description}</p>

      {isJudgeOverload && rec && (
        <dl className="incident-card__metrics">
          <div className="incident-card__metric">
            <dt>Pending load</dt>
            <dd>{rec.pendingCount} evaluations</dd>
          </div>
          <div className="incident-card__metric">
            <dt>Average</dt>
            <dd>{rec.averagePending}</dd>
          </div>
          <div className="incident-card__metric">
            <dt>Overload</dt>
            <dd>{rec.overloadRatio.toFixed(1)}× average</dd>
          </div>
        </dl>
      )}

      {isJudgeOverload && rec && !isResolved && (
        <p className="incident-card__recommendation">
          Move {rec.submissionIdsToMove.length} submission(s) from{' '}
          <strong>{rec.overloadedJudgeName}</strong> to{' '}
          <strong>{rec.targetJudgeName}</strong>.
        </p>
      )}

      <footer className="incident-card__footer">
        <time className="incident-card__time" dateTime={new Date(incident.reportedAt).toISOString()}>
          Reported {formatTime(incident.reportedAt)}
          {incident.resolvedAt && (
            <> · Resolved {formatTime(incident.resolvedAt)}</>
          )}
        </time>

        <div className="incident-card__actions">
          {isJudgeOverload && onApplyRecommendation && (
            <button
              className="btn btn--sm btn--primary"
              onClick={() => onApplyRecommendation(incident.id)}
              disabled={isResolved || !canApply}
              aria-label={`Apply recommendation for ${incident.title}`}
            >
              {isResolved ? 'Applied' : 'Apply Recommendation'}
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
