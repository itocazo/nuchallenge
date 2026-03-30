import { cn } from '@/lib/utils';
import { Difficulty, DIFFICULTY_CONFIG } from '@/lib/types';

export default function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', config.bgColor, config.color, className)}>
      {config.label}
    </span>
  );
}
