import { Link } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

interface BackButtonProps {
  to: string;
  label: string;
  className?: string;
}

export function BackButton({ to, label, className = '' }: BackButtonProps) {
  const { isRTL } = useLocale();
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-2 py-1 -ms-2 mb-4 ${className}`}>

			<Arrow className="w-4 h-4" />
			<span data-ev-id="ev_d57c6b362a">{label}</span>
		</Link>);

}