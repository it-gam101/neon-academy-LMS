import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { useLocale } from '@/hooks/useLocale';
import { withTimeout } from '@/utils/fetchWithTimeout';

export type Enrollment = Tables<'enrollments'>;

interface EnrollmentWithCourse extends Enrollment {
	course: Tables<'courses'> & {
		category?: Tables<'course_categories'>;
		modules?: { id: string }[];
	};
	module_progress?: Tables<'module_progress'>[];
}

export function useEnrollments(userId?: string) {
	const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { locale } = useLocale();

	const fetchEnrollments = useCallback(async () => {
		if (!supabase) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
			if (!targetUserId) {
				setLoading(false);
				return;
			}

			const { data, error: fetchError } = await withTimeout(
				supabase
					.from('enrollments')
					.select(`
						*,
						course:courses(
							*,
							category:course_categories(*),
							modules(id)
						),
						module_progress(*)
					`)
					.eq('user_id', targetUserId)
					.then(r => r),
				10000
			);

			if (fetchError) throw fetchError;
			setEnrollments((data as EnrollmentWithCourse[]) || []);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load enrollments';
			setError(message === 'TIMEOUT' ? 'Request timed out. Please try again.' : message);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		fetchEnrollments();
	}, [fetchEnrollments]);

	const getLocalizedTitle = (enrollment: EnrollmentWithCourse) =>
		locale === 'he' ? enrollment.course.title_he : enrollment.course.title_en;

	const calculateProgress = (enrollment: EnrollmentWithCourse) => {
		const totalModules = enrollment.course.modules?.length || 0;
		if (totalModules === 0) return 0;
		
		const completedModules = enrollment.module_progress?.filter(
			mp => mp.status === 'completed'
		).length || 0;
		
		return Math.round((completedModules / totalModules) * 100);
	};

	const isOverdue = (enrollment: EnrollmentWithCourse) => {
		if (enrollment.status === 'completed') return false;
		if (!enrollment.due_at) return false;
		return new Date(enrollment.due_at) < new Date();
	};

	const inProgress = enrollments.filter(e => 
		e.status === 'in_progress' || (e.status === 'not_started' && !isOverdue(e))
	);
	
	const completed = enrollments.filter(e => e.status === 'completed');
	
	const overdue = enrollments.filter(e => isOverdue(e));

	return {
		enrollments,
		inProgress,
		completed,
		overdue,
		loading,
		error,
		refetch: fetchEnrollments,
		getLocalizedTitle,
		calculateProgress,
		isOverdue,
	};
}
