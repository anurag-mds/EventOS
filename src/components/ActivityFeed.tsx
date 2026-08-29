// ─── ActivityFeed Component ──────────────────────────────────────────────────
import type { ActivityEntry, ActivityKind } from '../state/types';

interface ActivityFeedProps {
  entries: ActivityEntry[];
  maxItems?: number;
}

const KIND_ICON: Record<ActivityKind, string> = {
  submission:        '📦',
  team_join:         '👥',
  incident_opened:   '🚨',
  incident_resolved: '✅',
  score_posted:      '🏅',
  announcement:      '📢',
  check_in:          '✔️',
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ActivityFeed({ entries, maxItems = 50 }: ActivityFeedProps) {
  const visible = entries.slice(0, maxItems);

  return (
    <div className="activity-feed" role="log" aria-label="Live activity feed" aria-live="polite">
      {visible.length === 0 && (
        <p className="activity-feed__empty">No activity yet.</p>
      )}
      {visible.map((entry) => (
        <div key={entry.id} className={`activity-feed__item activity-feed__item--${entry.kind}`}>
          <span className="activity-feed__icon" aria-hidden="true">
            {KIND_ICON[entry.kind]}
          </span>
          <div className="activity-feed__body">
            <span className="activity-feed__message">{entry.message}</span>
            <span className="activity-feed__meta">
              {entry.actorName} · <time dateTime={new Date(entry.timestamp).toISOString()}>{timeAgo(entry.timestamp)}</time>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
