import { Link } from 'react-router';
import { Home, AlertCircle } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

export default function NotFound() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  return (
    <div data-ev-id="ev_7bb0c3be63" className="min-h-screen bg-background flex items-center justify-center px-4">
			<div data-ev-id="ev_5e8ac9c3f6" className="text-center">
				<div data-ev-id="ev_05a52ba802" className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
					<AlertCircle className="w-10 h-10 text-destructive" />
				</div>
				<h1 data-ev-id="ev_27df3ca774" className="text-6xl font-bold text-foreground mb-4">404</h1>
				<p data-ev-id="ev_d71b223728" className="text-xl text-muted-foreground mb-8">{dict.common.pageNotFound}</p>
				<Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

					<Home className="w-5 h-5" />
					{dict.common.goHome}
				</Link>
			</div>
		</div>);

}