import { type ReactNode } from 'react';
import { Link } from 'react-router';
import { useLocale } from '@/hooks/useLocale';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import logoSrc from '@/assets/logo.svg';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  const { t, isRTL } = useLocale();

  return (
    <div data-ev-id="ev_428f2f0803" className="min-h-screen bg-background bg-grid-texture flex flex-col">
			{/* Header with language toggle */}
			<header data-ev-id="ev_046c244768" className="p-4 flex justify-end">
				<LanguageToggle />
			</header>
			
			{/* Centered auth card */}
			<main data-ev-id="ev_d38ee4bb63" className="flex-1 flex items-center justify-center p-4">
				<div data-ev-id="ev_ed8620bc02" className="w-full max-w-md">
					{/* Logo and app name */}
					<div data-ev-id="ev_4dc04a9fbb" className="text-center mb-8">
						<img data-ev-id="ev_f2654a32bb" src={logoSrc} alt="Neon Academy" className="w-16 h-16 rounded-xl mx-auto mb-4" />
						<h1 data-ev-id="ev_39feb958d4" className="text-2xl font-bold text-foreground">{t.appName}</h1>
						<p data-ev-id="ev_ae115b1ab5" className="text-foreground-muted text-sm mt-1">{t.tagline}</p>
					</div>
					
					{/* Auth card */}
					<div data-ev-id="ev_6add778236" className="bg-card border border-card-border rounded-xl p-6">
						<h2 data-ev-id="ev_bbbc183eb9" className="text-xl font-semibold text-foreground mb-6 text-center">
							{title}
						</h2>
						{children}
					</div>
					
					{/* Back to landing link */}
					<div data-ev-id="ev_29ae7cd96a" className="mt-6 text-center">
						<Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors focus-ring rounded">

							{isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
							{t.landing.backToOverview}
						</Link>
					</div>
				</div>
			</main>
		</div>);

}