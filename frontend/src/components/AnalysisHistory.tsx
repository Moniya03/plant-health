import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { AnalysisResult } from '@/hooks/useSSE';
import { History, Activity } from 'lucide-react';

interface AnalysisHistoryProps {
  refreshTrigger: number;
}

export function AnalysisHistory({ refreshTrigger }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getAnalysisHistory(5);
        if (Array.isArray(res)) {
          setHistory(res);
        } else if (res.analyses) {
          setHistory(res.analyses);
        } else if (res.history) {
          setHistory(res.history);
        }
      } catch (err) {
        console.error('Failed to fetch analysis history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Card className="border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center text-gray-900">
            <History className="w-5 h-5 mr-2 text-gray-500" />
            Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <Activity className="w-6 h-6 animate-pulse text-gray-300" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="border-gray-100 shadow-sm bg-white h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center text-gray-900">
          <History className="w-5 h-5 mr-2 text-gray-500" />
          Recent Analyses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
          {history.map((item, idx) => {
            let iconColor = 'text-gray-400';
            let badgeClasses = 'bg-gray-100 text-gray-600 border-gray-200';

            if (item.status === 'healthy') {
              iconColor = 'text-plant-healthy';
              badgeClasses = 'bg-plant-healthy/10 text-plant-healthy border-plant-healthy/20';
            } else if (item.status === 'warning') {
              iconColor = 'text-plant-warning';
              badgeClasses = 'bg-plant-warning/10 text-plant-warning border-plant-warning/20';
            } else if (item.status === 'critical') {
              iconColor = 'text-plant-critical';
              badgeClasses = 'bg-plant-critical/10 text-plant-critical border-plant-critical/20';
            }

            return (
              <div key={item.id || idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 bg-white p-0.5 rounded-full">
                  <div className={`w-3 h-3 rounded-full border-2 border-white bg-current ${iconColor}`} />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${iconColor}`}>{item.health_score}</span>
                    <Badge variant="outline" className={`capitalize text-xs py-0 ${badgeClasses}`}>
                      {item.status}
                    </Badge>
                  </div>
                  <time className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </time>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
