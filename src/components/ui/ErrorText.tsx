import { useLocale } from '@/hooks/useLocale';
import { describeError } from '@/lib/errorText';

/**
 * Dispatch 1a: any error, in the reader's language — the sentence, and below it, small and left-to-right, the original
 * message when it adds something (rule 4: whatever breaks must tell us what broke).
 */
export function ErrorText({ error }: {error: unknown;}) {
  const { t, locale } = useLocale();
  const { text, detail } = describeError(error, t, locale);
  return (
    <>
			{text}
			{detail && <span data-ev-id="ev_9bff8d4ffe" dir="ltr" className="mt-1 block break-words text-xs opacity-70">{detail}</span>}
		</>);
}