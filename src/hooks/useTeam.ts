import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { withTimeout } from '@/utils/fetchWithTimeout';
import type { UserRole } from '@/contexts/auth-context';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

type Profile = Tables<'profiles'>;
type Enrollment = Tables<'enrollments'>;
type Course = Tables<'courses'>;

export type TeamMember = Profile & {
	enrollments?: (Enrollment & {
		course: Course;
	})[];
	manager?: Profile | null;
};

interface UseTeamOptions {
	viewerRole?: UserRole;
}

/**
 * Extract error message from Supabase PostgrestError or standard Error
 * PostgrestError objects are NOT instanceof Error, so direct instanceof checks fail
 */
function extractErrorMessage(err: unknown, fallback: string): string {
	const message = (err as { message?: string })?.message ?? (typeof err === 'string' ? err : fallback);
	return message;
}

export function useTeam(options?: UseTeamOptions) {
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { locale } = useLocale();
	const dict = getDictionary(locale);

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

			// QUERY 1: Profiles
			let profilesQuery = supabase
				.from('profiles')
				.select('*')
				.eq('is_active', true);

			// Apply direct-reports filter only for team_manager (or when viewerRole is undefined)
			if (!isOrgWideViewer) {
				profilesQuery = profilesQuery.eq('manager_id', user.id);
			}

			const { data: profiles, error: profilesError } = await withTimeout(
				profilesQuery.then(r => r),
				10000
			);

			if (profilesError) {
				console.error('useTeam profilesQuery error:', profilesError);
				throw profilesError;
			}

			const profileList = (profiles ?? []) as Profile[];

			if (profileList.length === 0) {
				setMembers([]);
				setLoading(false);
				return;
			}

			const memberIds = profileList.map(p => p.id);

			// QUERY 2: Enrollments for those profiles
			const { data: enrollments, error: enrollmentsError } = await supabase
				.from('enrollments')
				.select('*')
				.in('user_id', memberIds);

			if (enrollmentsError) {
				console.error('useTeam enrollmentsQuery error:', enrollmentsError);
				throw enrollmentsError;
			}

			const enrollmentList = (enrollments ?? []) as Enrollment[];

			// QUERY 3: Courses for those enrollments (if any)
			const courseIds = [...new Set(enrollmentList.map(e => e.course_id))];
			const coursesMap: Map<string, Course> = new Map();

			if (courseIds.length > 0) {
				const { data: courses, error: coursesError } = await supabase
					.from('courses')
					.select('*')
					.in('id', courseIds);

				if (coursesError) {
					console.error('useTeam coursesQuery error:', coursesError);
					throw coursesError;
				}

				(courses ?? []).forEach((c) => {
					coursesMap.set(c.id, c as Course);
				});
			}

			// Create a lookup for managers from the already-fetched profiles list
			const profilesMap = new Map<string, Profile>();
			profileList.forEach(p => profilesMap.set(p.id, p));

			// CLIENT-SIDE MERGE
			const merged: TeamMember[] = profileList.map(profile => {
				// Attach enrollments with their course objects
				const memberEnrollments = enrollmentList
					.filter(e => e.user_id === profile.id)
					.map(e => ({
						...e,
						course: coursesMap.get(e.course_id) as Course
					}))
					.filter(e => e.course); // Only include enrollments where course was found

				// Resolve manager from fetched profiles (for team_manager, manager is the viewer;
				// for org-wide viewers most managers will be in the same list)
				const manager = profile.manager_id ? profilesMap.get(profile.manager_id) ?? null : null;

				return {
					...profile,
					enrollments: memberEnrollments,
					manager
				};
			});

			setMembers(merged);
		} catch (err) {
			console.error('useTeam fetch error:', err);
			const message = extractErrorMessage(err, dict.errors?.failedToLoad ?? 'Failed to load team');
			setError(message === 'TIMEOUT' ? 'Request timed out. Please try again.' : message);
		} finally {
			setLoading(false);
		}
	}, [viewerRole, dict.errors?.failedToLoad]);

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

		try {
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

			if (insertError) {
				console.error('useTeam assignCourse error:', insertError);
				return { error: extractErrorMessage(insertError, 'Failed to assign course') };
			}

			await fetchTeam();
			return { data };
		} catch (err) {
			console.error('useTeam assignCourse error:', err);
			return { error: extractErrorMessage(err, 'Failed to assign course') };
		}
	};

	const updateDueDate = async (enrollmentId: string, dueAt: string | null) => {
		if (!supabase) return { error: 'Database not available' };

		try {
			const { error: updateError } = await supabase
				.from('enrollments')
				.update({ due_at: dueAt })
				.eq('id', enrollmentId);

			if (updateError) {
				console.error('useTeam updateDueDate error:', updateError);
				return { error: extractErrorMessage(updateError, 'Failed to update due date') };
			}

			await fetchTeam();
			return { success: true };
		} catch (err) {
			console.error('useTeam updateDueDate error:', err);
			return { error: extractErrorMessage(err, 'Failed to update due date') };
		}
	};

	const revokeEnrollment = async (enrollmentId: string) => {
		if (!supabase) return { error: 'Database not available' };

		try {
			const { error: deleteError } = await supabase
				.from('enrollments')
				.delete()
				.eq('id', enrollmentId);

			if (deleteError) {
				console.error('useTeam revokeEnrollment error:', deleteError);
				return { error: extractErrorMessage(deleteError, 'Failed to revoke enrollment') };
			}

			await fetchTeam();
			return { success: true };
		} catch (err) {
			console.error('useTeam revokeEnrollment error:', err);
			return { error: extractErrorMessage(err, 'Failed to revoke enrollment') };
		}
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
