import { cn } from '@/lib/utils';

export default function TagPill({
  tag,
  selected,
  onClick,
  size = 'sm',
}: {
  tag: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-colors',
          sizeClasses,
          selected
            ? 'bg-purple-600 text-white'
            : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50'
        )}
      >
        {tag}
      </button>
    );
  }

  return (
    <span className={cn('inline-flex items-center rounded-full bg-purple-100 font-medium text-purple-700', sizeClasses)}>
      {tag}
    </span>
  );
}
