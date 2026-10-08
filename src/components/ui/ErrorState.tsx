import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { describeError } from '@/lib/errorText';

interface ErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  // Dispatch 1a: the shared classifier (lib/errorText) names the failure — timed out, offline, session expired,
  // refused, not found. Anything else keeps "Failed to load data" with the original message below it. A missing or
  // hidden item will not appear on a retry, so it gets no Retry button.
  const described = describeError(error, dict, locale);
  const headline = described.kind === 'other' ? dict.errors.failedToLoad : described.text;
  const detail = described.kind === 'other' ? error && error !== headline ? error : null : described.detail;
  const canRetry = !!onRetry && described.kind !== 'notFound';

  return (
    <div data-ev-id="ev_8dd32ada56" className="flex flex-col items-center justify-center py-12 text-center">
			<div data-ev-id="ev_1d86d0a58b" className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
				<AlertCircle className="w-8 h-8 text-destructive" />
			</div>
			<h3 data-ev-id="ev_529f44876c" className="text-lg font-semibold text-foreground mb-2">
				{title || dict.common.errorOccurred}
			</h3>
			<p data-ev-id="ev_bd878b3619" className="text-muted-foreground mb-4 max-w-md">
				{headline}
			</p>
			{detail &&
			<p data-ev-id="ev_errorstate_detail" dir="ltr" className="text-xs text-muted-foreground/70 mb-4 max-w-md break-words">
				{detail}
			</p>
			}
			{canRetry &&
      <button data-ev-id="ev_e5a7f166dd"
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors focus-ring">

					<RefreshCw className="w-4 h-4" />
					{dict.errors.retry}
				</button>
      }
		</div>);

}