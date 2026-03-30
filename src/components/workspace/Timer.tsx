'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  totalMinutes: number;
  onTimeUp?: () => void;
}

export default function Timer({ totalMinutes, onTimeUp }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);

  const pct = (secondsLeft / (totalMinutes * 60)) * 100;
  const isWarning = pct < 25;
  const isDanger = pct < 10;

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused, secondsLeft, onTimeUp]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
      isDanger ? 'border-red-300 bg-red-50' :
      isWarning ? 'border-amber-300 bg-amber-50' :
      'border-gray-200 bg-white'
    )}>
      {isDanger ? (
        <AlertTriangle className="h-4 w-4 text-red-500" />
      ) : (
        <Clock className={cn('h-4 w-4', isWarning ? 'text-amber-500' : 'text-gray-400')} />
      )}
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all duration-1000',
              isDanger ? 'bg-red-500' :
              isWarning ? 'bg-amber-500' :
              'bg-purple-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className={cn(
        'font-mono font-semibold tabular-nums',
        isDanger ? 'text-red-600' :
        isWarning ? 'text-amber-600' :
        'text-gray-700'
      )}>
        {formatTime(secondsLeft)}
      </span>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
