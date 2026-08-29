// ─── IncidentCard Component ──────────────────────────────────────────────────
import type { Incident, IncidentSeverity } from '../state/types';

interface IncidentCardProps {
  incident: Incident;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
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

export function IncidentCard({ incident, onAcknowledge, onResolve }: IncidentCardProps) {
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

      <footer className="incident-card__footer">
        <time className="incident-card__time" dateTime={new Date(incident.reportedAt).toISOString()}>
          Reported {formatTime(incident.reportedAt)}
        </time>

        <div className="incident-card__actions">
          {incident.status === 'open' && onAcknowledge && (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => onAcknowledge(incident.id)}
              aria-label={`Acknowledge incident: ${incident.title}`}
            >
              Acknowledge
            </button>
          )}
          {incident.status !== 'resolved' && onResolve && (
            <button
              className="btn btn--sm btn--primary"
              onClick={() => onResolve(incident.id)}
              aria-label={`Resolve incident: ${incident.title}`}
            >
              Resolve
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
