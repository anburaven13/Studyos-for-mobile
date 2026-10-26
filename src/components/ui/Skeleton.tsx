import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60 dark:bg-white/[0.06] relative overflow-hidden animate-pulse",
        shimmer && "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 dark:after:via-white/[0.08] after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
