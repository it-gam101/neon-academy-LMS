import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, type Profile } from '@/contexts/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	
	const fetchProfile = async (userId: string) => {
		if (!supabase) return null;
		
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.single();
		
		if (error) {
			console.error('Error fetching profile:', error);
			return null;
		}
		
		return data as Profile;
	};
	
	const refreshProfile = async () => {
		if (user) {
			const profileData = await fetchProfile(user.id);
			setProfile(profileData);
		}
	};
	
	useEffect(() => {
		if (!supabase) {
			setIsLoading(false);
			return;
		}
		
		// Get initial session
		const initAuth = async () => {
			try {
				const { data: { user: currentUser } } = await supabase.auth.getUser();
				const { data: { session: currentSession } } = await supabase.auth.getSession();
				
				setUser(currentUser);
				setSession(currentSession);
				
				if (currentUser) {
					const profileData = await fetchProfile(currentUser.id);
					setProfile(profileData);
					
					// Sync locale from profile
					if (profileData?.locale) {
						localStorage.setItem('neon-academy-locale', profileData.locale);
					}
				}
			} catch (error) {
				console.error('Error initializing auth:', error);
			} finally {
				setIsLoading(false);
			}
		};
		
		initAuth();
		
		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, newSession) => {
				setSession(newSession);
				setUser(newSession?.user ?? null);
				
				if (newSession?.user) {
					const profileData = await fetchProfile(newSession.user.id);
					setProfile(profileData);
					
					// Sync locale from profile
					if (profileData?.locale) {
						localStorage.setItem('neon-academy-locale', profileData.locale);
					}
				} else {
					setProfile(null);
				}
			}
		);
		
		return () => {
			subscription.unsubscribe();
		};
	}, []);
	
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
				signOut,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
