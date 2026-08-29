// ─── Leaderboard Component ───────────────────────────────────────────────────
import type { LeaderboardEntry } from '../state/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="leaderboard leaderboard--empty">
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
          {entries.map((entry) => (
            <tr
              key={entry.teamId}
              className={`leaderboard__row ${entry.rank <= 3 ? `leaderboard__row--top-${entry.rank}` : ''}`}
            >
              <td className="leaderboard__td leaderboard__td--rank" aria-label={`Rank ${entry.rank}`}>
                {MEDAL[entry.rank] ?? entry.rank}
              </td>
              <td className="leaderboard__td leaderboard__td--team">{entry.teamName}</td>
              <td className="leaderboard__td leaderboard__td--score">
                <span className="leaderboard__score">{entry.averageScore.toFixed(1)}</span>
                <span className="leaderboard__score-max">/100</span>
              </td>
              <td className="leaderboard__td leaderboard__td--judges">{entry.judgesScored}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
