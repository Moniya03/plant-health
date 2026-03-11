import { Droplets, Thermometer, Wind, Sun } from 'lucide-react';
import { useSensorData } from '../hooks/useSensorData';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { SensorCard } from '../components/SensorCard';
import { SensorChart } from '../components/SensorChart';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { readings, latest, isLoading, error } = useSensorData();

  const getMoistureStatus = (v: number) => v < 20 || v > 80 ? 'critical' : v < 30 || v > 70 ? 'warning' : 'healthy';
  const getTempStatus = (v: number) => v < 15 || v > 32 ? 'critical' : v < 18 || v > 28 ? 'warning' : 'healthy';
  const getHumidityStatus = (v: number) => v < 30 || v > 80 ? 'critical' : v < 40 || v > 70 ? 'warning' : 'healthy';
  const getLightStatus = (v: number) => v < 100 || v > 8000 ? 'critical' : v < 200 || v > 5000 ? 'warning' : 'healthy';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">🌿 Plant Health Monitor</h1>
          </div>
          <ConnectionStatus status="offline" />
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 border border-red-100">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {isLoading ? (
              <Skeleton className="w-full h-[300px] rounded-xl" />
            ) : (
              <SensorChart readings={readings} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))
          ) : !latest && !isLoading ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm text-gray-500">
              No recent sensor readings available. Ensure the backend is collecting data.
            </div>
          ) : latest ? (
            <>
              <SensorCard
                label="Soil Moisture"
                value={latest.soil_moisture}
                unit="%"
                icon={Droplets}
                status={getMoistureStatus(latest.soil_moisture)}
                testId="sensor-card-moisture"
              />
              <SensorCard
                label="Temperature"
                value={latest.temperature}
                unit="°C"
                icon={Thermometer}
                status={getTempStatus(latest.temperature)}
                testId="sensor-card-temperature"
              />
              <SensorCard
                label="Humidity"
                value={latest.humidity}
                unit="%"
                icon={Wind}
                status={getHumidityStatus(latest.humidity)}
                testId="sensor-card-humidity"
              />
              <SensorCard
                label="Light Level"
                value={latest.light}
                unit="lux"
                icon={Sun}
                status={getLightStatus(latest.light)}
                testId="sensor-card-light"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
