import { NavLink } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { navItems, universalNavItems } from '@/components/layout/nav-config';


export function Navigation() {
  const { profile } = useAuth();
  const { t, isRTL } = useLocale();

  // A null profile means "role unknown", NOT "employee". Guessing the lowest role
  // silently downgrades a super_admin and makes their navigation disappear.
  const visibleItems = profile?.role ?
  navItems.filter((item) => item.allowedRoles.includes(profile.role)) :
  universalNavItems;

  // Directional chevron for RTL support
  const ChevronForward = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav data-ev-id="ev_17ff66ffb2" className="hidden md:flex items-center gap-1">
			{visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink data-ev-id="ev_a580085bef"
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