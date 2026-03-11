import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number | null;
  unit: string;
  icon: LucideIcon;
  status: 'healthy' | 'warning' | 'critical';
  testId: string;
}

export function SensorCard({ label, value, unit, icon: Icon, status, testId }: SensorCardProps) {
  const statusColors = {
    healthy: 'bg-plant-healthy/10 text-plant-healthy border-plant-healthy/20',
    warning: 'bg-plant-warning/10 text-plant-warning border-plant-warning/20',
    critical: 'bg-plant-critical/10 text-plant-critical border-plant-critical/20',
  };

  const badgeText = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid={testId}
      className="h-full"
    >
      <Card className="h-full relative overflow-hidden border-gray-100 shadow-sm transition-shadow hover:shadow-md bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100">
              <Icon className="w-5 h-5 text-gray-500" />
            </div>
            {value !== null && (
              <Badge variant="outline" className={`font-semibold ${statusColors[status]}`}>
                {badgeText[status]}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500">{label}</h3>
            <div className="flex items-baseline gap-1">
              {value !== null ? (
                <>
                  <span className="text-3xl font-bold tracking-tight text-gray-900">
                    {value}
                  </span>
                  <span className="text-sm font-medium text-gray-500">{unit}</span>
                </>
              ) : (
                <span className="text-3xl font-bold tracking-tight text-gray-300">--</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
