import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { withTimeout } from '@/utils/fetchWithTimeout';

export type Module = Tables<'modules'>;
export type ModuleProgress = Tables<'module_progress'>;

interface ModuleWithProgress extends Module {
	progress?: ModuleProgress;
	quiz?: Tables<'quizzes'> & {
		questions?: Tables<'quiz_questions'>[];
	};
	attempts?: Tables<'quiz_attempts'>[];
}

export function useCourseModules(courseId: string) {
	const [modules, setModules] = useState<ModuleWithProgress[]>([]);
	const [course, setCourse] = useState<Tables<'courses'> | null>(null);
	const [enrollment, setEnrollment] = useState<Tables<'enrollments'> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { locale } = useLocale();
	const dict = getDictionary(locale);

	const fetchModules = useCallback(async () => {
		if (!supabase || !courseId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// Fetch course with timeout
			const { data: courseData, error: courseError } = await withTimeout(
				supabase
					.from('courses')
					.select('*, category:course_categories(*)')
					.eq('id', courseId)
					.single()
					.then(r => r),
				10000
			);

			if (courseError) throw courseError;
			setCourse(courseData);

			// Fetch modules with quizzes and SCORM packages
			const { data: modulesData, error: modulesError } = await supabase
				.from('modules')
				.select(`
					*,
					quiz:quizzes(
						*,
						questions:quiz_questions(*)
					),
					scorm_package:scorm_packages(*)
				`)
				.eq('course_id', courseId)
				.order('sort_order');

			if (modulesError) throw modulesError;

			// Fetch user's enrollment and progress
			const { data: { user } } = await supabase.auth.getUser();
			let enrollmentData: Tables<'enrollments'> | null = null;
			let progressData: ModuleProgress[] = [];
			let attemptsData: Tables<'quiz_attempts'>[] = [];
			let scormRegistrationsData: Tables<'scorm_registrations'>[] = [];

			if (user) {
				// Get enrollment
				const { data: enrollment } = await supabase
					.from('enrollments')
					.select('*')
					.eq('user_id', user.id)
					.eq('course_id', courseId)
					.single();

				enrollmentData = enrollment;
				setEnrollment(enrollment);

				if (enrollment) {
					// Get module progress
					const { data: progress } = await supabase
						.from('module_progress')
						.select('*')
						.eq('enrollment_id', enrollment.id);

					progressData = progress || [];
				}

				// Get quiz attempts
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const quizIds = (modulesData as any[])
					?.filter((m) => m.quiz && m.quiz[0])
					.map((m) => m.quiz[0].id) || [];

				if (quizIds.length > 0) {
					const { data: attempts } = await supabase
						.from('quiz_attempts')
						.select('*')
						.eq('user_id', user.id)
						.in('quiz_id', quizIds);

					attemptsData = attempts || [];
				}

				// Get SCORM registrations for SCORM modules
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const scormPackageIds = (modulesData as any[])
					?.filter((m) => m.module_type === 'scorm_package' && m.scorm_package_id)
					.map((m) => m.scorm_package_id) || [];

				if (scormPackageIds.length > 0 && enrollment) {
					const { data: registrations } = await supabase
						.from('scorm_registrations')
						.select('*')
						.eq('enrollment_id', enrollment.id)
						.in('package_id', scormPackageIds);

					scormRegistrationsData = registrations || [];
				}
			}

			// Map modules with progress, attempts, and SCORM registrations
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const modulesWithProgress = (modulesData || []).map((mod: any) => ({
				...mod,
				progress: progressData.find(p => p.module_id === mod.id),
				attempts: mod.quiz 
					? attemptsData.filter(a => a.quiz_id === mod.quiz.id)
					: [],
				scorm_registration: mod.module_type === 'scorm_package' && mod.scorm_package_id
					? scormRegistrationsData.find(r => r.package_id === mod.scorm_package_id)
					: undefined,
			}));

			setModules(modulesWithProgress);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load course';
			setError(message === 'TIMEOUT' ? 'Request timed out. Please try again.' : message);
		} finally {
			setLoading(false);
		}
	}, [courseId]);

	useEffect(() => {
		fetchModules();
	}, [fetchModules]);

	const getLocalizedTitle = (mod: Module) =>
		locale === 'he' ? mod.title_he : mod.title_en;

	const getLocalizedCourseTitle = () =>
		course ? (locale === 'he' ? course.title_he : course.title_en) : '';

	const markModuleProgress = async (moduleId: string, status: 'in_progress' | 'completed', score?: number, passed?: boolean) => {
		if (!supabase || !enrollment) return { error: 'Not enrolled' };

		const { data, error: upsertError } = await supabase
			.from('module_progress')
			.upsert({
				enrollment_id: enrollment.id,
				module_id: moduleId,
				status,
				score,
				// Only sent when the caller actually knows the answer. Omitted for
				// lessons, which leaves any existing value untouched on conflict.
				...(passed !== undefined && { passed }),
				updated_at: new Date().toISOString(),
			}, {
				onConflict: 'enrollment_id,module_id',
			})
			.select()
			.single();

		if (upsertError) return { error: upsertError.message };

		// Update local state
		setModules(prev => prev.map(m =>
			m.id === moduleId ? { ...m, progress: data } : m
		));

		// Check if all modules are completed
		// A module that is completed but FAILED must not roll the course up as complete.
		// `!== false` and never `=== true`: NULL means not-applicable (a lesson) or
		// unknown (a legacy row), and must keep behaving exactly as it does today.
		// Using `=== true` here would stop every lesson in the product from counting.
		const allCompleted = modules.every(m =>
			m.id === moduleId
				? status === 'completed' && passed !== false
				: m.progress?.status === 'completed' && m.progress?.passed !== false
		);

		if (allCompleted) {
			// Calculate average score
			const scores = modules
				.map(m => m.id === moduleId ? score : m.progress?.score)
				.filter((s): s is number => s !== null && s !== undefined);
			
			const avgScore = scores.length > 0 
				? scores.reduce((a, b) => a + b, 0) / scores.length 
				: null;

			const { data: rollupData, error: rollupError } = await supabase
				.from('enrollments')
				.update({
					status: 'completed',
					completed_at: new Date().toISOString(),
					score: avgScore,
				})
				.eq('id', enrollment.id)
				.select();

			if (rollupError) {
				console.error('useCourseModules: enrollment rollup failed', rollupError);
				return { error: rollupError.message };
			}
			if (!rollupData || rollupData.length === 0) {
				console.error('useCourseModules: enrollment rollup REFUSED (0 rows) for', enrollment.id);
				return { error: dict.common.changeRefused };
			}

			setEnrollment(prev => prev ? { ...prev, status: 'completed', score: avgScore } : null);
		} else if (enrollment.status === 'not_started') {
			const { data: startData, error: startError } = await supabase
				.from('enrollments')
				.update({ status: 'in_progress' })
				.eq('id', enrollment.id)
				.select();

			if (startError) {
				console.error('useCourseModules: enrollment start failed', startError);
			} else if (!startData || startData.length === 0) {
				console.error('useCourseModules: enrollment start REFUSED (0 rows) for', enrollment.id);
			} else {
				setEnrollment(prev => prev ? { ...prev, status: 'in_progress' } : null);
			}
		}

		return { data };
	};

	const completedCount = modules.filter(m => m.progress?.status === 'completed').length;
	const totalCount = modules.length;
	const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	return {
		course,
		modules,
		enrollment,
		loading,
		error,
		refetch: fetchModules,
		getLocalizedTitle,
		getLocalizedCourseTitle,
		markModuleProgress,
		completedCount,
		totalCount,
		progressPercent,
	};
}
