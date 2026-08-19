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
