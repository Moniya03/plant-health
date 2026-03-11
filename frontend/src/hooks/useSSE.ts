import { useState, useEffect, useRef } from 'react';
import type { SensorReading } from './useSensorData';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface AnalysisResult {
  id: number;
  health_score: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  analysis_type: 'rule_based' | 'ai_analysis';
  model_used: string | null;
  created_at: string;
}

interface UseSSEResult {
  lastSensorData: SensorReading | null;
  lastAnalysis: AnalysisResult | null;
  connectionStatus: ConnectionStatus;
}

export function useSSE(url: string): UseSSEResult {
  const [lastSensorData, setLastSensorData] = useState<SensorReading | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting');
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnectionStatus('connected');
        if (retryRef.current) {
          clearTimeout(retryRef.current);
          retryRef.current = null;
        }
      };

      es.addEventListener('sensor_data', (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastSensorData(data);
        } catch (err) {
          console.error('Failed to parse sensor_data event', err);
        }
      });

      es.addEventListener('analysis', (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastAnalysis(data);
        } catch (err) {
          console.error('Failed to parse analysis event', err);
        }
      });

      es.addEventListener('ping', () => {
        // Just acknowledging ping, nothing to update directly
      });

      es.onerror = () => {
        setConnectionStatus('reconnecting');
        es.close();
        
        if (!retryRef.current) {
          retryRef.current = setTimeout(() => {
            retryRef.current = null;
            connect();
          }, 3000);
        }
      };
    }

    connect();

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
  }, [url]);

  return { lastSensorData, lastAnalysis, connectionStatus };
}
