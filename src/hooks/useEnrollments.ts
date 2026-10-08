import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { useLocale } from '@/hooks/useLocale';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { useAuth } from '@/hooks/useAuth';
import { isModuleDone, countModulesAddedSince } from '@/lib/courseProgress';
import { errorMessage } from '@/lib/errorText';

export type Enrollment = Tables<'enrollments'>;

interface EnrollmentWithCourse extends Enrollment {
	course: Tables<'courses'> & {
		category?: Tables<'course_categories'>;
		modules?: { id: string; created_at: string }[];
	};
	module_progress?: Tables<'module_progress'>[];
}

export function useEnrollments(userId?: string) {
	const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { locale } = useLocale();
	const { user } = useAuth();

	const fetchEnrollments = useCallback(async () => {
		if (!supabase) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const targetUserId = userId || user?.id;
			if (!targetUserId) {
				setError('TIMEOUT');
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
							modules(id, created_at)
						),
						module_progress(*)
					`)
					.eq('user_id', targetUserId)
					.then(r => r),
				10000
			);

			if (fetchError) throw fetchError;
			// Filter out enrollments whose course embed returned null (e.g. archived courses)
			const visible = ((data as EnrollmentWithCourse[]) || []).filter((e) => e.course != null);
			setEnrollments(visible);
		} catch (err) {
			const message = errorMessage(err, 'Failed to load enrollments');
			setError(message === 'TIMEOUT' ? 'Request timed out. Please try again.' : message);
		} finally {
			setLoading(false);
		}
	}, [userId, user?.id]);

	useEffect(() => {
		fetchEnrollments();
	}, [fetchEnrollments]);

	const getLocalizedTitle = (enrollment: EnrollmentWithCourse) => {
		if (!enrollment?.course) return '';
		return locale === 'he' ? enrollment.course.title_he : enrollment.course.title_en;
	};

	const calculateProgress = (enrollment: EnrollmentWithCourse) => {
		if (!enrollment?.course) return 0;
		const totalModules = enrollment.course.modules?.length || 0;
		if (totalModules === 0) return 0;
		
		// Item 106: a completion is sticky (policy C), so a completed course reads 100% even
		// after a module is added; the "new content" marker says what changed.
		if (enrollment.status === 'completed') return 100;

		// Same rule as the rollup: a FAILED module is not done. Only modules still in the course.
		const moduleIds = new Set(enrollment.course.modules?.map((m) => m.id) ?? []);
		const completedModules = enrollment.module_progress?.filter(
			mp => moduleIds.has(mp.module_id) && isModuleDone(mp)
		).length || 0;
		
		return Math.min(100, Math.round((completedModules / totalModules) * 100));
	};

	// Item 106: modules added to the course after this learner completed it.
	const newModulesSinceCompleted = (enrollment: EnrollmentWithCourse) => {
		if (enrollment?.status !== 'completed') return 0;
		return countModulesAddedSince(enrollment.course?.modules, enrollment.completed_at);
	};

	const isOverdue = (enrollment: EnrollmentWithCourse) => {
		if (!enrollment?.course) return false;
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
		newModulesSinceCompleted,
		isOverdue,
	};
}
