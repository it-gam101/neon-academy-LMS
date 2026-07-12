import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, type Profile } from '@/contexts/auth-context';
import { withTimeout } from '@/utils/fetchWithTimeout';

const PROFILE_TIMEOUT_MS = 10000;

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [profileError, setProfileError] = useState<string | null>(null);
	
	// Load profile with timeout - never blocks rendering
	const loadProfile = useCallback(async (userId: string) => {
		if (!supabase) return;
		
		setProfileError(null);
		
		try {
			const { data, error } = await withTimeout(
				supabase
					.from('profiles')
					.select('*')
					.eq('id', userId)
					.single(),
				PROFILE_TIMEOUT_MS
			);
			
			if (error) {
				console.error('Error fetching profile:', error);
				setProfileError(error.message);
				setProfile(null);
				return;
			}
			
			setProfile(data as Profile);
			setProfileError(null);
			
			// Sync locale from profile
			if (data?.locale) {
				localStorage.setItem('neon-academy-locale', data.locale);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load profile';
			console.error('Profile load error:', message);
			setProfileError(message);
			setProfile(null);
		}
	}, []);
	
	const refreshProfile = useCallback(async () => {
		if (user) {
			await loadProfile(user.id);
		}
	}, [user, loadProfile]);
	
	useEffect(() => {
		if (!supabase) {
			setIsLoading(false);
			return;
		}
		
		// Boot path: use getSession() only (local read, no network)
		// This allows immediate rendering without waiting for profile
		const initAuth = () => {
			supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
				setSession(currentSession);
				setUser(currentSession?.user ?? null);
				setIsLoading(false);
				
				// Load profile in background if user exists
				if (currentSession?.user) {
					// Schedule outside current execution to avoid blocking
					setTimeout(() => {
						void loadProfile(currentSession.user.id);
					}, 0);
				}
			}).catch((error) => {
				console.error('Error initializing auth:', error);
				setIsLoading(false);
			});
		};
		
		initAuth();
		
		// Listen for auth changes - MUST be synchronous (no await in callback)
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(event, newSession) => {
				// Synchronous state updates only
				setSession(newSession);
				setUser(newSession?.user ?? null);
				
				if (newSession?.user) {
					// Schedule profile load OUTSIDE the callback via setTimeout
					// This avoids deadlocking the auth client's internal lock
					setTimeout(() => {
						void loadProfile(newSession.user.id);
					}, 0);
				} else {
					// Synchronously clear profile when logged out
					setProfile(null);
					setProfileError(null);
				}
			}
		);
		
		return () => {
			subscription.unsubscribe();
		};
	}, [loadProfile]);
	
	const signOut = async () => {
		if (supabase) {
			await supabase.auth.signOut();
		}
	};
	
	return (
		<AuthContext.Provider
			value={{
				user,
				profile,
				session,
				isLoading,
				isAuthenticated: !!user,
				profileError,
				signOut,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
