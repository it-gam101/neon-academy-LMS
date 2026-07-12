import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div data-ev-id="ev_2c1845ee7b" className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div data-ev-id="ev_b9a33453cb" className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Icon className="w-8 h-8 text-muted-foreground" />
			</div>
			<h3 data-ev-id="ev_b273a41d37" className="text-lg font-medium text-foreground mb-2">{title}</h3>
			<p data-ev-id="ev_b9a3c8e1c6" className="text-muted-foreground max-w-sm mb-6">{description}</p>
			{action &&
      <button data-ev-id="ev_6cf80b34b9"
      onClick={action.onClick}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

					{action.label}
				</button>
      }
		</div>);

}