'use client';

type AvatarBadgeProps = {
  label: string;
  avatar?: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function AvatarBadge({ label, avatar, size = 'md', className = '' }: AvatarBadgeProps) {
  const base =
    'inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100';
  const sizeClasses =
    size === 'sm'
      ? 'h-8 w-8 text-[11px] font-semibold'
      : 'h-12 w-12 text-sm font-semibold';

  return (
    <div className={`${base} ${sizeClasses} ${className}`} title={label}>
      {avatar || label.slice(0, 1)}
    </div>
  );
}
