import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  type?: 'submit' | 'button';
  onClick?: () => void;
  isLoading?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function AuthButton({
  type = 'button',
  onClick,
  isLoading,
  children,
  variant = 'primary'
}: AuthButtonProps) {
  const baseClasses = `w-full h-11 rounded-lg font-medium transition-colors focus-ring flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`;

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-border'
  };

  return (
    <button data-ev-id="ev_c70d3013c6"
    type={type}
    onClick={onClick}
    disabled={isLoading}
    className={`${baseClasses} ${variantClasses[variant]}`}>

			{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
			{children}
		</button>);

}