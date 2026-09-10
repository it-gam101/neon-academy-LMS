import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { useAuth } from '@/hooks/useAuth';

export type Profile = Tables<'profiles'>;
export type UserRole = 'super_admin' | 'hr_manager' | 'team_manager' | 'instructor' | 'employee';

export function useProfile() {
	const { user, isLoading: authLoading } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!supabase) {
			setLoading(false);
			return;
		}

		// AuthProvider already tracks the session, so this hook derives from it rather
		// than making its own getUser() round-trip. Hold `loading` while auth is still
		// booting, or consumers briefly see a resolved "no profile" state.
		if (authLoading) return;

		if (!user) {
			setProfile(null);
			setLoading(false);
			return;
		}

		const fetchProfile = async () => {
			try {
				const { data, error: profileError } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (profileError) throw profileError;
				setProfile(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load profile');
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
		// The context's own onAuthStateChange drives `user`, so a second subscription
		// here would only add a duplicate fetch on every auth event.
	// eslint-disable-next-line react-hooks/exhaustive-deps -- user?.id not user: avoids refetch on token refresh
	}, [user?.id, authLoading]);

	const updateProfile = async (updates: Partial<Profile>) => {
		if (!supabase || !profile) return { error: 'Not authenticated' };

		const { data, error: updateError } = await supabase
			.from('profiles')
			.update(updates)
			.eq('id', profile.id)
			.select()
			.single();

		if (updateError) return { error: updateError.message };
		setProfile(data);
		return { data };
	};

	const role = profile?.role as UserRole | undefined;

	const isAdmin = role === 'super_admin';
	const isHR = role === 'hr_manager' || isAdmin;
	const isTeamManager = role === 'team_manager' || isHR;
	const isInstructor = role === 'instructor' || isAdmin;

	return {
		profile,
		loading,
		error,
		updateProfile,
		role,
		isAdmin,
		isHR,
		isTeamManager,
		isInstructor,
	};
}
