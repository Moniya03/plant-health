import { useState, useEffect } from 'react';
import { Droplets, Thermometer, Wind, Sun, Sprout, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensorData } from '../hooks/useSensorData';
import { useSSE } from '../hooks/useSSE';
import { api } from '@/lib/api';
import type { AnalysisResult } from '@/hooks/useSSE';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { SensorCard } from '../components/SensorCard';
import { SensorChart } from '../components/SensorChart';
import { PlantConfig } from '../components/PlantConfig';
import { AnalysisCard } from '../components/AnalysisCard';
import { AnalysisHistory } from '../components/AnalysisHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const { readings, latest, isLoading, error, refetch } = useSensorData();
  const [activeLatest, setActiveLatest] = useState(latest);
  const [activeReadings, setActiveReadings] = useState(readings);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const { lastSensorData, lastAnalysis, connectionStatus } = useSSE(`${BASE_URL}/api/stream`);

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  useEffect(() => {
    if (latest && !activeLatest) setActiveLatest(latest);
  }, [latest, activeLatest]);

  useEffect(() => {
    if (readings.length > 0 && activeReadings.length === 0) setActiveReadings(readings);
  }, [readings, activeReadings]);

  useEffect(() => {
    if (lastSensorData) {
      setActiveLatest(lastSensorData);
      setActiveReadings(prev => {
        const newReadings = [lastSensorData, ...prev];
        if (newReadings.length > 100) return newReadings.slice(0, 100);
        return newReadings;
      });
    }
  }, [lastSensorData]);

  useEffect(() => {
    if (lastAnalysis) {
      setCurrentAnalysis(lastAnalysis);
      setHistoryTrigger(prev => prev + 1);
    }
  }, [lastAnalysis]);

  useEffect(() => {
    api.getAnalysis().then(res => {
      if (res && !res.error && !res.detail) {
        setCurrentAnalysis(res);
      }
    }).catch(console.error);
  }, []);

  const getMoistureStatus = (v: number) => v < 20 || v > 80 ? 'critical' : v < 30 || v > 70 ? 'warning' : 'healthy';
  const getTempStatus = (v: number) => v < 15 || v > 32 ? 'critical' : v < 18 || v > 28 ? 'warning' : 'healthy';
  const getHumidityStatus = (v: number) => v < 30 || v > 80 ? 'critical' : v < 40 || v > 70 ? 'warning' : 'healthy';
  const getLightStatus = (v: number) => v < 100 || v > 8000 ? 'critical' : v < 200 || v > 5000 ? 'warning' : 'healthy';

  const hasNoData = !isLoading && !error && activeReadings.length === 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">🌿 Plant Health Monitor</h1>
          </div>
          <ConnectionStatus status={connectionStatus} />
        </header>

        <PlantConfig />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AnalysisCard 
              analysis={currentAnalysis} 
              onAnalysisTriggered={() => setHistoryTrigger(prev => prev + 1)} 
            />
          </div>
          <div className="lg:col-span-1">
            <AnalysisHistory refreshTrigger={historyTrigger} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error-state"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 border border-red-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>Unable to connect to backend. Is the server running?</span>
              </div>
              <Button variant="outline" size="sm" onClick={refetch} className="bg-white hover:bg-red-50 text-red-700 border-red-200">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {hasNoData && !error && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              data-testid="empty-state"
              className="mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No sensor data yet</h3>
              <p className="text-gray-500 max-w-md">
                Connect your ESP32 to start monitoring your plant's environment. We're waiting for the first reading.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {(!hasNoData || isLoading) && (
          <>
            <div className="mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="chart-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Skeleton className="w-full h-[300px] rounded-xl" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chart-data"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <SensorChart readings={activeReadings} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <motion.div
                  key="skeleton-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      variants={cardVariants}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Skeleton className="h-40 rounded-xl" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : activeLatest ? (
                <motion.div
                  key="sensor-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div key="card-moisture" variants={cardVariants}>
                    <SensorCard
                      label="Soil Moisture"
                      value={activeLatest.soil_moisture}
                      unit="%"
                      icon={Droplets}
                      status={getMoistureStatus(activeLatest.soil_moisture)}
                      testId="sensor-card-moisture"
                    />
                  </motion.div>
                  <motion.div key="card-temp" variants={cardVariants}>
                    <SensorCard
                      label="Temperature"
                      value={activeLatest.temperature}
                      unit="°C"
                      icon={Thermometer}
                      status={getTempStatus(activeLatest.temperature)}
                      testId="sensor-card-temperature"
                    />
                  </motion.div>
                  <motion.div key="card-humidity" variants={cardVariants}>
                    <SensorCard
                      label="Humidity"
                      value={activeLatest.humidity}
                      unit="%"
                      icon={Wind}
                      status={getHumidityStatus(activeLatest.humidity)}
                      testId="sensor-card-humidity"
                    />
                  </motion.div>
                  <motion.div key="card-light" variants={cardVariants}>
                    <SensorCard
                      label="Light Level"
                      value={activeLatest.light}
                      unit="lux"
                      icon={Sun}
                      status={getLightStatus(activeLatest.light)}
                      testId="sensor-card-light"
                    />
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
