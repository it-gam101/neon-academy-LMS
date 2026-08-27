import type { UserRole } from '@/contexts/auth-context';
import {
  BookOpen,
  GraduationCap,
  Users,
  PenTool,
  BarChart3,
  Settings,
} from 'lucide-react';

export interface NavItem {
  path: string;
  labelKey: keyof typeof import('@/i18n/dictionary').dictionaries.en.nav;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

export const navItems: NavItem[] = [
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
  }
];

const ALL_ROLES: UserRole[] = [
  'super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee'
];

/**
 * Items safe to show BEFORE the role is known — those every role can see.
 * Rendering nothing strands the user with no navigation (regression, 2026-08-26);
 * rendering the employee set would silently downgrade a super_admin.
 */
export const universalNavItems: NavItem[] = navItems.filter((item) =>
  ALL_ROLES.every((role) => item.allowedRoles.includes(role))
);
