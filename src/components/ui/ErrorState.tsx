import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

interface ErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  // Map TIMEOUT error to localized message
  const displayError = error === 'TIMEOUT' || error?.includes('timed out') ?
  dict.errors.connectionTimeout :
  error || dict.errors.failedToLoad;

  return (
    <div data-ev-id="ev_8dd32ada56" className="flex flex-col items-center justify-center py-12 text-center">
			<div data-ev-id="ev_1d86d0a58b" className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
				<AlertCircle className="w-8 h-8 text-destructive" />
			</div>
			<h3 data-ev-id="ev_529f44876c" className="text-lg font-semibold text-foreground mb-2">
				{title || dict.common.errorOccurred}
			</h3>
			<p data-ev-id="ev_bd878b3619" className="text-muted-foreground mb-4 max-w-md">
				{displayError}
			</p>
			{onRetry &&
      <button data-ev-id="ev_e5a7f166dd"
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors focus-ring">

					<RefreshCw className="w-4 h-4" />
					{dict.errors.retry}
				</button>
      }
		</div>);

}