// ABOUTME: Button component for quick actions in the cockpit
// ABOUTME: Displays an icon, label, and optional badge

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  badge?: number | string;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  badge,
  badgeVariant = 'secondary',
  disabled = false,
  loading = false,
  className,
}: QuickActionButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        'h-auto flex flex-col items-start gap-1 p-4 relative',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className={cn('h-5 w-5', loading && 'animate-pulse')} />
        <span className="font-medium">{label}</span>
        {badge !== undefined && (
          <Badge variant={badgeVariant} className="ml-auto text-xs">
            {badge}
          </Badge>
        )}
      </div>
      {description && (
        <span className="text-xs text-muted-foreground font-normal text-left">
          {description}
        </span>
      )}
    </Button>
  );
}
