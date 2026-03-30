'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  delay?: number;
}

export default function ScoreRing({ score, size = 160, strokeWidth = 10, delay = 300 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const getColor = (s: number) => {
    if (s >= 90) return { stroke: '#8b5cf6', text: 'text-purple-600', label: 'Outstanding!' };
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-600', label: 'Great Work!' };
    if (s >= 70) return { stroke: '#3b82f6', text: 'text-blue-600', label: 'Good Job!' };
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-600', label: 'Solid Effort' };
    return { stroke: '#ef4444', text: 'text-red-500', label: 'Keep Practicing' };
  };

  const config = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-4xl font-extrabold tabular-nums', config.text)}>
            {animatedScore}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <span className={cn('text-sm font-semibold', config.text)}>{config.label}</span>
    </div>
  );
}
