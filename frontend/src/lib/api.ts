import axios from 'axios';
import type { SensorReading } from '@/hooks/useSensorData';
import type { AnalysisResult } from '@/hooks/useSSE';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
});

interface SensorDataResponse {
  readings: SensorReading[];
}

interface AnalysisHistoryResponse {
  analyses?: AnalysisResult[];
  history?: AnalysisResult[];
  count: number;
}

interface PlantConfigData {
  species: string;
  name: string;
  updated_at?: string | null;
}

export const api = {
  async getSensorData(hours: number = 24): Promise<SensorDataResponse> {
    const { data } = await client.get<SensorDataResponse>('/api/sensor-data', {
      params: { hours },
    });
    return data;
  },

  async getLatestReading(): Promise<SensorReading & { error?: string }> {
    const { data } = await client.get<SensorReading & { error?: string }>('/api/sensor-data/latest');
    return data;
  },

  async triggerAnalysis(): Promise<AnalysisResult> {
    const { data } = await client.post<AnalysisResult>('/api/analyze');
    return data;
  },

  async getAnalysis(): Promise<AnalysisResult & { error?: string; detail?: string }> {
    const { data } = await client.get<AnalysisResult & { error?: string; detail?: string }>('/api/analysis/latest');
    return data;
  },

  async getAnalysisHistory(limit: number = 10): Promise<AnalysisHistoryResponse> {
    const { data } = await client.get<AnalysisHistoryResponse>('/api/analysis/history', {
      params: { limit },
    });
    return data;
  },

  async getPlantConfig(): Promise<PlantConfigData> {
    const { data } = await client.get<PlantConfigData>('/api/plant/species');
    return data;
  },

  async updatePlantConfig(config: { species: string; name: string }): Promise<PlantConfigData> {
    const { data } = await client.put<PlantConfigData>('/api/plant/species', config);
    return data;
  },
};
