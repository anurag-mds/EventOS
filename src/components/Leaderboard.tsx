// ─── Leaderboard Component ───────────────────────────────────────────────────
import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '../state/types';
import type { LucideIcon } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const RANK_ICON: Record<number, { icon: LucideIcon; className: string }> = {
  1: { icon: Trophy, className: 'leaderboard__rank-icon--1' },
  2: { icon: Medal,  className: 'leaderboard__rank-icon--2' },
  3: { icon: Award,  className: 'leaderboard__rank-icon--3' },
};

export function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="empty-state" role="status">
        <Trophy className="empty-state__icon" aria-hidden="true" />
        <p>No scores posted yet.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <table className="leaderboard__table" role="table" aria-label="Event leaderboard">
        <thead>
          <tr>
            <th scope="col" className="leaderboard__th leaderboard__th--rank">Rank</th>
            <th scope="col" className="leaderboard__th">Team</th>
            <th scope="col" className="leaderboard__th leaderboard__th--score">Avg Score</th>
            <th scope="col" className="leaderboard__th leaderboard__th--judges">Judges</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const rankConfig = RANK_ICON[entry.rank];
            const RankIcon = rankConfig?.icon;

            return (
              <tr key={entry.teamId} className="leaderboard__row">
                <td className="leaderboard__td leaderboard__td--rank" aria-label={`Rank ${entry.rank}`}>
                  <span className="leaderboard__rank">
                    {RankIcon ? (
                      <RankIcon
                        className={`leaderboard__rank-icon ${rankConfig.className}`}
                        aria-hidden="true"
                      />
                    ) : (
                      entry.rank
                    )}
                  </span>
                </td>
                <td className="leaderboard__td leaderboard__td--team">{entry.teamName}</td>
                <td className="leaderboard__td leaderboard__td--score">
                  <span className="leaderboard__score">{entry.averageScore.toFixed(1)}</span>
                  <span className="leaderboard__score-max">/100</span>
                </td>
                <td className="leaderboard__td leaderboard__td--judges">{entry.judgesScored}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
