import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { AppShell } from '@/components/layout/AppShell';
import { BookOpen, GraduationCap, Users, PenTool, BarChart3, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import type { UserRole } from '@/contexts/auth-context';

interface QuickAction {
  path: string;
  titleKey: keyof typeof import('@/i18n/dictionary').dictionaries.en.nav;
  descriptionSection: 'catalogue' | 'myLearning' | 'team' | 'studio' | 'hrAnalytics' | 'admin';
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const quickActions: QuickAction[] = [
{
  path: '/catalogue',
  titleKey: 'catalogue',
  descriptionSection: 'catalogue',
  icon: BookOpen,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee']
},
{
  path: '/my-learning',
  titleKey: 'myLearning',
  descriptionSection: 'myLearning',
  icon: GraduationCap,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee']
},
{
  path: '/team',
  titleKey: 'team',
  descriptionSection: 'team',
  icon: Users,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager']
},
{
  path: '/studio',
  titleKey: 'studio',
  descriptionSection: 'studio',
  icon: PenTool,
  allowedRoles: ['super_admin', 'hr_manager', 'instructor']
},
{
  path: '/hr-analytics',
  titleKey: 'hrAnalytics',
  descriptionSection: 'hrAnalytics',
  icon: BarChart3,
  allowedRoles: ['super_admin', 'hr_manager']
},
{
  path: '/admin',
  titleKey: 'admin',
  descriptionSection: 'admin',
  icon: Settings,
  allowedRoles: ['super_admin']
}];


export default function Index() {
  const { isAuthenticated, profile } = useAuth();
  const { t, isRTL } = useLocale();
  const navigate = useNavigate();

  const userRole = profile?.role ?? 'employee';
  const visibleActions = quickActions.filter((action) =>
  action.allowedRoles.includes(userRole)
  );

  // Directional chevron
  const ChevronForward = isRTL ? ChevronLeft : ChevronRight;

  return (
		<AppShell hideLoginButton={!isAuthenticated}>
			{!isAuthenticated ?
      // Welcome screen for unauthenticated users
      <div data-ev-id="ev_145ef5f237" className="flex flex-col items-center justify-center min-h-[60vh] text-center">
					<div data-ev-id="ev_dd00302cc0" className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-muted border border-primary/30 mb-6">
						<span data-ev-id="ev_a606fc9a3e" className="text-3xl font-bold text-primary">NA</span>
					</div>
					<h1 data-ev-id="ev_a6f0842431" className="text-4xl font-bold text-foreground mb-3">{t.appName}</h1>
					<p data-ev-id="ev_0a55aa9db5" className="text-lg text-foreground-muted mb-8 max-w-md">
						{t.tagline}
					</p>
					<button data-ev-id="ev_9de53a18a8"
        onClick={() => navigate('/auth/login')}
        className={
        `px-6 py-3 rounded-lg font-medium ` +
        `bg-primary text-primary-foreground hover:bg-primary-hover ` +
        `transition-colors focus-ring`
        }>

						{t.auth.login}
					</button>
				</div> :

      // Dashboard for authenticated users
      <div data-ev-id="ev_08ff689a4f">
					<div data-ev-id="ev_95a2ddd1cb" className="mb-8">
						<h1 data-ev-id="ev_f74521f482" className="text-2xl font-bold text-foreground mb-2">
							{profile?.full_name ?
            `${isRTL ? 'שלום' : 'Welcome'}, ${profile.full_name}` :
            isRTL ? 'שלום' : 'Welcome'}
						</h1>
						<p data-ev-id="ev_16e75e1faf" className="text-foreground-muted">
							{t.roles[userRole]}
						</p>
					</div>
					
					{/* Quick actions grid */}
					<div data-ev-id="ev_d2c628a2cc" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <button data-ev-id="ev_9f7219b529"
              key={action.path}
              onClick={() => navigate(action.path)}
              className={
              `relative flex items-start gap-4 p-5 rounded-xl ` +
              `bg-card border border-card-border text-start ` +
              `card-interactive focus-ring overflow-hidden`
              }>

									<div data-ev-id="ev_e4e9793bba" className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center">
										<Icon className="w-5 h-5 text-primary" />
									</div>
									<div data-ev-id="ev_5d6143d5ca" className="flex-1 min-w-0">
										<h3 data-ev-id="ev_7ac9360175" className="font-semibold text-foreground mb-1">
											{t.nav[action.titleKey]}
										</h3>
										<p data-ev-id="ev_3112d9eb08" className="text-sm text-foreground-muted line-clamp-2">
											{t[action.descriptionSection].description}
										</p>
									</div>
									<ChevronForward className="flex-shrink-0 w-5 h-5 text-foreground-subtle self-center" />
								</button>);

          })}
					</div>
				</div>
      }
		</AppShell>);

}