import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const result = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (active) {
          setEntries(result.leaderboard ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load leaderboard');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." statusText="Loading leaderboard..." statusRole="status" />;
  }

  if (error) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." statusText={`Unable to load leaderboard: ${error}`} statusRole="alert" />;
  }

  if (entries.length === 0) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." statusText="No leaderboard" statusRole="status" />;
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ol className="list-group list-group-numbered">
        {entries.map((entry, index) => (
          <li key={`${entry.teamName ?? 'team'}-${index}`} className="list-group-item">
            #{entry.rank ?? index + 1}: {entry.teamName ?? 'Team'} — {entry.totalPoints ?? 0} pts
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
