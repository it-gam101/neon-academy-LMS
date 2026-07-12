import { Globe } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { Tooltip } from '@/components/ui/Tooltip';

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'he' : 'en');
  };

  return (
    <Tooltip content={t.tooltips.languageToggle}>
			<button data-ev-id="ev_84304296aa"
      onClick={toggleLocale}
      className={
      `flex items-center gap-2 px-3 py-2 rounded-lg ` +
      `bg-secondary hover:bg-secondary-hover text-secondary-foreground ` +
      `border border-border transition-colors focus-ring text-sm font-medium`
      }
      aria-label={t.tooltips.languageToggle}>

				<Globe className="w-4 h-4" />
				<span data-ev-id="ev_eac11f633e">{locale === 'en' ? 'עברית' : 'English'}</span>
			</button>
		</Tooltip>);

}