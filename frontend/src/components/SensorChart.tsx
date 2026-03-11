import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { SensorReading } from '../hooks/useSensorData';

interface SensorChartProps {
  readings: SensorReading[];
  title?: string;
}

export function SensorChart({ readings, title }: SensorChartProps) {
  if (!readings || readings.length === 0) {
    return (
      <div className="w-full" data-testid="sensor-chart">
        {title && <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>}
        <div className="w-full h-[300px] flex items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <p className="text-gray-500 font-medium text-sm">No data yet</p>
        </div>
      </div>
    );
  }

  // The backend might return readings descending (latest first). Let's reverse for chronological left-to-right.
  const chartData = [...readings].reverse().map(r => ({
    ...r,
    formattedDate: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    light_normalized: r.light,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-xl ring-1 ring-black/5">
          <p className="text-sm font-semibold text-gray-900 mb-3">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any) => {
              const isLight = entry.dataKey === 'light_normalized' || entry.name === 'Light';
              const value = isLight ? entry.payload.light : entry.value;
              const unit = isLight ? '%' : entry.dataKey === 'temperature' || entry.name === 'Temperature' ? '°C' : '%';
              return (
                <div key={entry.dataKey || entry.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-600 capitalize w-24">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {value !== undefined ? Number(value).toFixed(isLight ? 0 : 1) : '--'}
                    {unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" data-testid="sensor-chart">
      {title && <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} 
            />
            <Area
              type="monotone"
              dataKey="soil_moisture"
              name="Soil Moisture"
              stroke="#16a34a"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMoisture)"
            />
            <Area
              type="monotone"
              dataKey="temperature"
              name="Temperature"
              stroke="#f97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTemp)"
            />
            <Area
              type="monotone"
              dataKey="humidity"
              name="Humidity"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHumidity)"
            />
            <Area
              type="monotone"
              dataKey="light_normalized"
              name="Light"
              stroke="#eab308"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLight)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
