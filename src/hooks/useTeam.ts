import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { withTimeout } from '@/utils/fetchWithTimeout';
import type { UserRole } from '@/contexts/auth-context';

export type TeamMember = Tables<'profiles'> & {
	enrollments?: (Tables<'enrollments'> & {
		course: Tables<'courses'>;
	})[];
	manager?: Tables<'profiles'>[] | null;
};

interface UseTeamOptions {
	viewerRole?: UserRole;
}

export function useTeam(options?: UseTeamOptions) {
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const viewerRole = options?.viewerRole;

	const fetchTeam = useCallback(async () => {
		if (!supabase) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				setLoading(false);
				return;
			}

			// super_admin and hr_manager see ALL users; team_manager sees direct reports only
			const isOrgWideViewer = viewerRole === 'super_admin' || viewerRole === 'hr_manager';

			// Build the query - FK hint fixes ambiguous enrollments relationship
			let query = supabase
				.from('profiles')
				.select(`
					*,
					enrollments!enrollments_user_id_fkey(
						*,
						course:courses(*)
					),
					manager:profiles!profiles_manager_id_fkey(*)
				`)
				.eq('is_active', true);

			// Apply direct-reports filter only for team_manager
			if (!isOrgWideViewer) {
				query = query.eq('manager_id', user.id);
			}

			const { data: membersData, error: membersError } = await withTimeout(
				query.then(r => r),
				10000
			);

			if (membersError) throw membersError;
			setMembers((membersData as unknown as TeamMember[]) || []);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load team';
			setError(message === 'TIMEOUT' ? 'Request timed out. Please try again.' : message);
		} finally {
			setLoading(false);
		}
	}, [viewerRole]);

	useEffect(() => {
		fetchTeam();
	}, [fetchTeam]);

	const getMemberStats = (member: TeamMember) => {
		const enrollments = member.enrollments || [];
		const enrolled = enrollments.length;
		const completed = enrollments.filter(e => e.status === 'completed').length;
		const overdue = enrollments.filter(e => 
			e.status !== 'completed' && e.due_at && new Date(e.due_at) < new Date()
		).length;

		return { enrolled, completed, overdue };
	};

	const assignCourse = async (userIds: string[], courseId: string, dueAt: string | null) => {
		if (!supabase) return { error: 'Database not available' };

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return { error: 'Not authenticated' };

		const enrollments = userIds.map(userId => ({
			user_id: userId,
			course_id: courseId,
			assigned_by: user.id,
			due_at: dueAt,
		}));

		const { data, error: insertError } = await supabase
			.from('enrollments')
			.insert(enrollments)
			.select();

		if (insertError) return { error: insertError.message };

		await fetchTeam();
		return { data };
	};

	const updateDueDate = async (enrollmentId: string, dueAt: string | null) => {
		if (!supabase) return { error: 'Database not available' };

		const { error: updateError } = await supabase
			.from('enrollments')
			.update({ due_at: dueAt })
			.eq('id', enrollmentId);

		if (updateError) return { error: updateError.message };

		await fetchTeam();
		return { success: true };
	};

	const revokeEnrollment = async (enrollmentId: string) => {
		if (!supabase) return { error: 'Database not available' };

		const { error: deleteError } = await supabase
			.from('enrollments')
			.delete()
			.eq('id', enrollmentId);

		if (deleteError) return { error: deleteError.message };

		await fetchTeam();
		return { success: true };
	};

	return {
		members,
		loading,
		error,
		refetch: fetchTeam,
		getMemberStats,
		assignCourse,
		updateDueDate,
		revokeEnrollment,
	};
}
