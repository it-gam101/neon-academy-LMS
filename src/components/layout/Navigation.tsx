import { NavLink } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/auth-context';
import { useLocale } from '@/hooks/useLocale';
import {
  BookOpen,
  GraduationCap,
  Users,
  PenTool,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight } from
'lucide-react';

interface NavItem {
  path: string;
  labelKey: keyof typeof import('@/i18n/dictionary').dictionaries.en.nav;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
{
  path: '/catalogue',
  labelKey: 'catalogue',
  icon: BookOpen,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee']
},
{
  path: '/my-learning',
  labelKey: 'myLearning',
  icon: GraduationCap,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee']
},
{
  path: '/team',
  labelKey: 'team',
  icon: Users,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager']
},
{
  path: '/studio',
  labelKey: 'studio',
  icon: PenTool,
  allowedRoles: ['super_admin', 'hr_manager', 'instructor']
},
{
  path: '/hr-analytics',
  labelKey: 'hrAnalytics',
  icon: BarChart3,
  allowedRoles: ['super_admin', 'hr_manager']
},
{
  path: '/admin',
  labelKey: 'admin',
  icon: Settings,
  allowedRoles: ['super_admin']
}];


export function Navigation() {
  const { profile } = useAuth();
  const { t, isRTL } = useLocale();

  const userRole = profile?.role ?? 'employee';

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) =>
  item.allowedRoles.includes(userRole)
  );

  // Directional chevron for RTL support
  const ChevronForward = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav data-ev-id="ev_17ff66ffb2" className="hidden md:flex items-center gap-1">
			{visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ` +
            `transition-colors focus-ring ` + (
            isActive ?
            'bg-primary-muted text-primary' :
            'text-foreground-muted hover:text-foreground hover:bg-muted')
            }>

						<Icon className="w-4 h-4" />
						<span data-ev-id="ev_af1758a351" className="hidden lg:inline">{t.nav[item.labelKey]}</span>
					</NavLink>);

      })}
		</nav>);

}