import { type ReactNode, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { Loader2, RefreshCw } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  hideLoginButton?: boolean;
}

export function AppShell({ children, hideLoginButton = false }: AppShellProps) {
  const { isLoading, isAuthenticated, profileError, refreshProfile } = useAuth();
  const { t } = useLocale();
  const hasShownError = useRef(false);

  // Show non-blocking toast when profile fails to load
  useEffect(() => {
    // Only show toast once per error, and only when authenticated
    if (profileError && isAuthenticated && !hasShownError.current) {
      hasShownError.current = true;
    }
    // Reset when error clears
    if (!profileError) {
      hasShownError.current = false;
    }
  }, [profileError, isAuthenticated]);

  // Show loading only during initial session check (milliseconds)
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
			
			{/* Non-blocking profile error toast */}
			{profileError && isAuthenticated &&
      <div
        data-ev-id="ev_profile_error_toast"
        className="fixed bottom-4 inset-inline-start-4 z-50 bg-destructive/10 border border-destructive/30 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-bottom-5"
        role="alert">

					<p data-ev-id="ev_ea1d150649" className="text-sm text-foreground mb-2">{t.common.profileLoadError}</p>
					<button data-ev-id="ev_219c5667a7"
        onClick={() => void refreshProfile()}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">

						<RefreshCw className="w-4 h-4" />
						{t.common.retry}
					</button>
				</div>
      }
		</div>);
}