import { Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ProfileMenu } from '@/components/layout/ProfileMenu';
import { Navigation } from '@/components/layout/Navigation';
import type { UserRole } from '@/contexts/auth-context';
import logoSrc from '@/assets/logo.svg';

interface HeaderProps {
  hideLoginButton?: boolean;
}

/**
 * Get the role-appropriate home path for authenticated users.
 * - employee -> My Learning (their primary dashboard)
 * - team_manager -> Team (their primary dashboard)
 * - instructor -> Studio (their primary dashboard)  
 * - hr_manager -> HR Analytics (their primary dashboard)
 * - super_admin -> Admin (their primary dashboard)
 */
function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'employee':
      return '/my-learning';
    case 'team_manager':
      return '/team';
    case 'instructor':
      return '/studio';
    case 'hr_manager':
      return '/hr-analytics';
    case 'super_admin':
      return '/admin';
    default:
      return '/my-learning';
  }
}

export function Header({ hideLoginButton = false }: HeaderProps) {
  const { isAuthenticated, profile } = useAuth();
  const { t } = useLocale();

  // Determine home path based on user role
  const homePath = isAuthenticated && profile?.role ?
  getRoleHomePath(profile.role) :
  '/';

  return (
    <header data-ev-id="ev_14941de2e5" className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
			<div data-ev-id="ev_e3a42eed08" className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
				<div data-ev-id="ev_e5684798cf" className="flex items-center justify-between h-16">
					{/* Logo - links to role-appropriate home */}
					<Link
            to={homePath}
            className="flex items-center gap-3 focus-ring rounded-lg">

						<img data-ev-id="ev_9998a899e0" src={logoSrc} alt="Neon Academy" className="w-9 h-9 rounded-lg" />
						<span data-ev-id="ev_499d519ef4" className="text-lg font-semibold text-foreground hidden sm:block">
							{t.appName}
						</span>
					</Link>
					
					{/* Navigation (only when authenticated) */}
					{isAuthenticated && <Navigation />}
					
					{/* Actions */}
					<div data-ev-id="ev_6681e70319" className="flex items-center gap-3">
						<LanguageToggle />
						{isAuthenticated ?
            <ProfileMenu /> :
            !hideLoginButton ?
            <Link
              to="/auth/login"
              className={
              `px-4 py-2 rounded-lg font-medium text-sm ` +
              `bg-primary text-primary-foreground hover:bg-primary-hover ` +
              `transition-colors focus-ring`
              }>

								{t.auth.login}
							</Link> :
            null}
					</div>
				</div>
			</div>
		</header>);

}