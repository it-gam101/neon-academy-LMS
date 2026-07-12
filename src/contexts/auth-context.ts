import { createContext } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/helpers';

export type UserRole = 'super_admin' | 'hr_manager' | 'team_manager' | 'instructor' | 'employee';

export interface Profile extends Omit<Tables<'profiles'>, 'role'> {
	role: UserRole;
}

export interface AuthContextType {
	user: User | null;
	profile: Profile | null;
	session: Session | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	profileError: string | null;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
