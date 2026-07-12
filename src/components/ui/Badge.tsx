import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-primary/20 text-primary',
    warning: 'bg-yellow-500/20 text-yellow-500',
    danger: 'bg-destructive/20 text-destructive',
    info: 'bg-blue-500/20 text-blue-500',
    purple: 'bg-purple-500/20 text-purple-400'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span data-ev-id="ev_a024fe73d9" className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
			{children}
		</span>);

}