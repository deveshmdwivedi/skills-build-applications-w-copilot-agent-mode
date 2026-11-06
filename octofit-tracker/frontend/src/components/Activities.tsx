import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        const result = await getJson<{ activities: Activity[] }>('/api/activities');
        if (active) {
          setActivities(result.activities ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load activities');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." statusText="Loading activities..." statusRole="status" />;
  }

  if (error) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." statusText={`Unable to load activities: ${error}`} statusRole="alert" />;
  }

  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." statusText="No activities" statusRole="status" />;
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            {activity.type ?? 'Activity'}: {activity.minutes ?? 0} min • {activity.points ?? 0} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
