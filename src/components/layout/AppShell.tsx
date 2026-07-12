import { type ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { Loader2 } from 'lucide-react';

interface AppShellProps {
	children: ReactNode;
	hideLoginButton?: boolean;
}

export function AppShell({ children, hideLoginButton = false }: AppShellProps) {
  const { isLoading } = useAuth();
  const { t } = useLocale();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div data-ev-id="ev_559d72eb3a" className="min-h-screen bg-background bg-grid-texture flex items-center justify-center">
				<div data-ev-id="ev_74a4fcbb7c" className="flex flex-col items-center gap-4">
					<Loader2 className="w-8 h-8 text-primary animate-spin" />
					<p data-ev-id="ev_dc1067a1a4" className="text-foreground-muted">{t.common.loading}</p>
				</div>
			</div>);

  }

  return (
    <div data-ev-id="ev_e4b5704809" className="min-h-screen bg-background bg-grid-texture flex flex-col">
			<Header hideLoginButton={hideLoginButton} />
			<main data-ev-id="ev_8fe1d07f71" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
				<div data-ev-id="ev_54777fd27c" className="max-w-7xl mx-auto">
					{children}
				</div>
			</main>
		</div>);

}