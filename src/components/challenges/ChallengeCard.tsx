import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Challenge, ChallengeUserStatus } from '@/lib/types';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import { Clock, Lock, CheckCircle2, Play } from 'lucide-react';

const STATUS_STRIP: Record<ChallengeUserStatus, string> = {
  available: 'border-l-transparent',
  in_progress: 'border-l-amber-400',
  completed: 'border-l-emerald-400',
  locked: 'border-l-transparent opacity-50',
};

export default function ChallengeCard({
  challenge,
  userStatus = 'available',
  bestScore,
}: {
  challenge: Challenge;
  userStatus?: ChallengeUserStatus;
  bestScore?: number | null;
}) {
  const isLocked = userStatus === 'locked';

  const card = (
    <div
      className={cn(
        'group relative rounded-xl border-l-[3px] border border-gray-200 bg-white p-5 transition-all',
        STATUS_STRIP[userStatus],
        !isLocked && 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{challenge.id}</span>
        <DifficultyBadge difficulty={challenge.difficulty} />
      </div>

      <h3 className="mb-2 text-[15px] font-semibold leading-snug text-gray-900">
        {challenge.title}
      </h3>

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
        {challenge.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-1">
        {challenge.tags.slice(0, 3).map(tag => (
          <TagPill key={tag} tag={tag} size="sm" />
        ))}
        {challenge.tags.length > 3 && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
            +{challenge.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {challenge.timeMinutes} min
          </span>
          <span className="tabular-nums font-semibold text-purple-600">
            {challenge.pointsBase} pts
          </span>
        </div>

        {userStatus === 'completed' && (
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {bestScore != null ? `${bestScore}/100` : 'Done'}
          </span>
        )}
        {userStatus === 'in_progress' && (
          <span className="flex items-center gap-1 font-medium text-amber-600">
            <Play className="h-3.5 w-3.5" />
            Resume
          </span>
        )}
        {isLocked && (
          <span className="flex items-center gap-1 text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            Locked
          </span>
        )}
      </div>
    </div>
  );

  if (isLocked) return card;

  return (
    <Link href={`/challenges/${challenge.id}`}>
      {card}
    </Link>
  );
}
