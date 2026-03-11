import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Activity, Sparkles, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { AnalysisResult } from '@/hooks/useSSE';

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(0, { bounce: 0, duration: 1000 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}

interface AnalysisCardProps {
  analysis: AnalysisResult | null;
  onAnalysisTriggered?: () => void;
}

export function AnalysisCard({ analysis, onAnalysisTriggered }: AnalysisCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      await api.triggerAnalysis();
      if (onAnalysisTriggered) {
        onAnalysisTriggered();
      }
    } catch (err: any) {
      if (err.message?.includes('Need at least 5 readings')) {
        setError('Need at least 5 readings for analysis');
      } else {
        setError(err.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!analysis && !error && !isAnalyzing) {
    return (
      <Card data-testid="analysis-card" className="border-gray-100 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Activity className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Run an analysis to get insights about your plant's health, issues, and recommendations.
          </p>
          <Button onClick={handleAnalyze} data-testid="analyze-button">
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const score = analysis?.health_score || 0;
  let statusColor = 'text-gray-400';
  let badgeClasses = 'bg-gray-100 text-gray-600 border-gray-200';
  let StatusIcon = Activity;

  if (analysis) {
    if (score >= 80) {
      statusColor = 'text-plant-healthy';
      badgeClasses = 'bg-plant-healthy/10 text-plant-healthy border-plant-healthy/20';
      StatusIcon = CheckCircle2;
    } else if (score >= 50) {
      statusColor = 'text-plant-warning';
      badgeClasses = 'bg-plant-warning/10 text-plant-warning border-plant-warning/20';
      StatusIcon = AlertTriangle;
    } else {
      statusColor = 'text-plant-critical';
      badgeClasses = 'bg-plant-critical/10 text-plant-critical border-plant-critical/20';
      StatusIcon = AlertCircle;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card data-testid="analysis-card" className="border-gray-100 shadow-sm bg-white overflow-hidden relative">
        <CardContent className="p-0">
          <div className="bg-gray-50/50 border-b border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    className="text-gray-100 stroke-current"
                    strokeWidth="6"
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                  ></circle>
                  <motion.circle
                    className={`${statusColor} stroke-current transition-colors duration-500`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    initial={{ strokeDasharray: '0 214' }}
                    animate={{ strokeDasharray: `${(score / 100) * 214} 214` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  ></motion.circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${statusColor}`} data-testid="health-score">
                    {analysis ? <AnimatedCounter value={score} /> : '--'}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Health Score</h3>
                  {analysis && (
                    <Badge variant="outline" className={`capitalize font-semibold ${badgeClasses}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {analysis.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 gap-2">
                  <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                    {analysis?.analysis_type === 'ai_analysis' ? (
                      <><Sparkles className="w-3 h-3 mr-1 text-purple-500" /> AI Powered {analysis.model_used && `(${analysis.model_used})`}</>
                    ) : (
                      'Rule-based'
                    )}
                  </span>
                  {analysis?.created_at && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(analysis.created_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={handleAnalyze} disabled={isAnalyzing} data-testid="analyze-button">
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Analyze Now
            </Button>
          </div>

          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 mr-2 text-plant-warning" />
                  Issues
                </h4>
                {analysis.issues.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.issues.map((issue, i) => (
                      <motion.li 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-plant-warning mt-1.5 shrink-0" />
                        <span>{issue}</span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">No issues detected.</p>
                )}
              </div>

              <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-plant-healthy" />
                  Recommendations
                </h4>
                {analysis.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <motion.li 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-start gap-2 text-sm text-gray-600 bg-plant-bg/50 p-3 rounded-lg border border-plant-healthy/20"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-plant-healthy mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">No recommendations right now.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
