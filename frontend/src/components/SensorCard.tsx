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

const gradientBg: Record<'healthy' | 'warning' | 'critical', string> = {
  healthy: 'bg-gradient-to-br from-white to-emerald-50/50',
  warning: 'bg-gradient-to-br from-white to-amber-50/50',
  critical: 'bg-gradient-to-br from-white to-red-50/50',
};

const leftBorder: Record<'healthy' | 'warning' | 'critical', string> = {
  healthy: 'border-l-4 border-l-plant-healthy',
  warning: 'border-l-4 border-l-plant-warning',
  critical: 'border-l-4 border-l-plant-critical',
};

const iconBg: Record<'healthy' | 'warning' | 'critical', string> = {
  healthy: 'bg-emerald-50 ring-emerald-100',
  warning: 'bg-amber-50 ring-amber-100',
  critical: 'bg-red-50 ring-red-100',
};

const iconColor: Record<'healthy' | 'warning' | 'critical', string> = {
  healthy: 'text-plant-healthy',
  warning: 'text-plant-warning',
  critical: 'text-plant-critical',
};

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
      data-testid={testId}
      className="h-full"
    >
      <Card className={`h-full relative overflow-hidden shadow-sm transition-shadow hover:shadow-md ${gradientBg[status]} ${leftBorder[status]}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ring-1 ${iconBg[status]}`}>
              <Icon className={`w-5 h-5 ${iconColor[status]}`} />
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
