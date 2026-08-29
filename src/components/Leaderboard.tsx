// ─── Leaderboard Component ───────────────────────────────────────────────────
import { Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '../state/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

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
            <th scope="col" className="leaderboard__th leaderboard__th--rank">#</th>
            <th scope="col" className="leaderboard__th">Team</th>
            <th scope="col" className="leaderboard__th leaderboard__th--score">Score</th>
            <th scope="col" className="leaderboard__th leaderboard__th--judges">Judges</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.teamId}
              className={`leaderboard__row ${entry.rank <= 3 ? 'leaderboard__row--top' : ''}`}
            >
              <td className="leaderboard__td leaderboard__td--rank" aria-label={`Rank ${entry.rank}`}>
                <span className={`leaderboard__rank ${entry.rank <= 3 ? 'leaderboard__rank--top' : ''}`}>
                  {String(entry.rank).padStart(2, '0')}
                </span>
              </td>
              <td className="leaderboard__td leaderboard__td--team">{entry.teamName}</td>
              <td className="leaderboard__td leaderboard__td--score">
                <span className="leaderboard__score">{entry.averageScore.toFixed(1)}</span>
                <span className="leaderboard__score-max"> /100</span>
              </td>
              <td className="leaderboard__td leaderboard__td--judges">{entry.judgesScored}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
