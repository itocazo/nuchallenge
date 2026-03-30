'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Criterion {
  name: string;
  weight: number;
  score: number;
  justification: string;
}

interface CriteriaBreakdownProps {
  criteria: Criterion[];
  delay?: number;
}

export default function CriteriaBreakdown({ criteria, delay = 800 }: CriteriaBreakdownProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getBarColor = (score: number) => {
    if (score >= 90) return 'from-purple-500 to-indigo-500';
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 70) return 'from-blue-500 to-cyan-500';
    if (score >= 60) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  return (
    <div className="space-y-4">
      {criteria.map((c, i) => (
        <div
          key={c.name}
          className={cn(
            'rounded-lg border border-gray-100 bg-white p-4 transition-all duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
          style={{ transitionDelay: `${i * 150}ms` }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{c.name}</span>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                {c.weight}% weight
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums text-gray-900">{c.score}</span>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                'h-2 rounded-full bg-gradient-to-r transition-all duration-1000 ease-out',
                getBarColor(c.score)
              )}
              style={{ width: visible ? `${c.score}%` : '0%', transitionDelay: `${i * 150 + 200}ms` }}
            />
          </div>
          <p className="text-xs leading-relaxed text-gray-500">{c.justification}</p>
        </div>
      ))}
    </div>
  );
}
