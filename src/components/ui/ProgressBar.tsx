interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  variant = 'default'
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value / max * 100));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-primary',
    warning: 'bg-yellow-500',
    danger: 'bg-destructive'
  };

  return (
    <div data-ev-id="ev_53a0ec5ca6" className="w-full">
			<div data-ev-id="ev_34ab672565"
      className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}>

				<div data-ev-id="ev_83453bfd52"
        className={`h-full rounded-full transition-all duration-300 ${variantClasses[variant]}`}
        style={{ width: `${percent}%` }} />

			</div>
			{showLabel &&
      <span data-ev-id="ev_f3cb6e0032" className="text-xs text-muted-foreground mt-1 block text-end">
					{Math.round(percent)}%
				</span>
      }
		</div>);

}