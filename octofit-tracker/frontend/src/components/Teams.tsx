import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name?: string;
  mascot?: string;
  members?: Array<string | { toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const result = await getJson<{ teams: Team[] }>('/api/teams');
        if (active) {
          setTeams(result.teams ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load teams');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Teams" description="Manage teams and members." statusText="Loading teams..." statusRole="status" />;
  }

  if (error) {
    return <CapabilityCard title="Teams" description="Manage teams and members." statusText={`Unable to load teams: ${error}`} statusRole="alert" />;
  }

  if (teams.length === 0) {
    return <CapabilityCard title="Teams" description="Manage teams and members." statusText="No teams" statusRole="status" />;
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <strong>{team.name ?? 'Team'}</strong> — {team.mascot ?? 'Mascot'} • {team.members?.length ?? 0} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
