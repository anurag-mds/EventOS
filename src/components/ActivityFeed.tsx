// ─── ActivityFeed Component ──────────────────────────────────────────────────
import {
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  Trophy,
  Megaphone,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityEntry, ActivityKind } from '../state/types';

interface ActivityFeedProps {
  entries: ActivityEntry[];
  maxItems?: number;
}

const KIND_ICON: Record<ActivityKind, LucideIcon> = {
  submission:        Package,
  team_join:         Users,
  incident_opened:   AlertTriangle,
  incident_resolved: CheckCircle,
  score_posted:      Trophy,
  announcement:      Megaphone,
  check_in:          UserCheck,
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ActivityFeed({ entries, maxItems = 50 }: ActivityFeedProps) {
  const visible = entries.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <div className="empty-state" role="status">
        <Megaphone className="empty-state__icon" aria-hidden="true" />
        <p>No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="activity-feed" role="log" aria-label="Live activity feed" aria-live="polite">
      {visible.map((entry) => {
        const Icon = KIND_ICON[entry.kind];
        return (
          <div key={entry.id} className={`activity-feed__item activity-feed__item--${entry.kind}`}>
            <Icon className="activity-feed__icon" aria-hidden="true" />
            <div className="activity-feed__body">
              <span className="activity-feed__message">{entry.message}</span>
              <span className="activity-feed__meta">
                {entry.actorName} · <time dateTime={new Date(entry.timestamp).toISOString()}>{timeAgo(entry.timestamp)}</time>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
