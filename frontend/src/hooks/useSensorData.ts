import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface SensorReading {
  id: number;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  light: number;
  created_at: string;
}

interface UseSensorDataResult {
  readings: SensorReading[];
  latest: SensorReading | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSensorData(): UseSensorDataResult {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [historyRes, latestRes] = await Promise.all([
        api.getSensorData(24),
        api.getLatestReading(),
      ]);
      if (historyRes.readings) setReadings(historyRes.readings);
      if (latestRes && !latestRes.error) setLatest(latestRes);
      setError(null);
    } catch (err) {
      setError('Unable to connect to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Expose refetch for external callers (e.g., SSE updates in Task 13)
  return { readings, latest, isLoading, error, refetch: fetchData };
}
