import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
  minutes?: number;
  difficulty?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkouts() {
      const userEmail = 'mona@example.com';
      try {
        const result = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
        if (active) {
          setSuggestions(result.suggestions ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load workout suggestions');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWorkouts();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." statusText="Loading workout suggestions..." statusRole="status" />;
  }

  if (error) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." statusText={`Unable to load workout suggestions: ${error}`} statusRole="alert" />;
  }

  if (suggestions.length === 0) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." statusText="No workout suggestions" statusRole="status" />;
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title ?? 'suggestion'}-${index}`} className="list-group-item">
            <strong>{suggestion.title ?? 'Suggested workout'}</strong>
            <div>{suggestion.focus ?? 'General'} • {suggestion.minutes ?? 0} min • {suggestion.difficulty ?? 'moderate'}</div>
            <small>{suggestion.reason ?? 'Built for your activity history.'}</small>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
