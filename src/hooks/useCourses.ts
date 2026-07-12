import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { useLocale } from '@/hooks/useLocale';
import { withTimeout } from '@/utils/fetchWithTimeout';

export type Course = Tables<'courses'>;
export type Category = Tables<'course_categories'>;

interface CourseWithDetails extends Course {
	category?: Category;
	module_count?: number;
	enrollment?: Tables<'enrollments'> | null;
}

export function useCourses(options?: { onlyPublished?: boolean; onlyOwn?: boolean }) {
	const [courses, setCourses] = useState<CourseWithDetails[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { locale } = useLocale();

	const fetchCourses = useCallback(async () => {
		if (!supabase) {
			setLoading(false);
			setError('Database not available');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			
			// Fetch categories with timeout
			const { data: categoriesData } = await withTimeout(
				supabase
					.from('course_categories')
					.select('*')
					.order('sort_order')
					.then(r => r),
				10000
			);
			
			if (categoriesData) setCategories(categoriesData);

			// Build courses query
			let query = supabase
				.from('courses')
				.select(`
					*,
					category:course_categories(*),
					modules(id)
				`);

			if (options?.onlyPublished) {
				query = query.eq('status', 'published');
			}

			if (options?.onlyOwn) {
				const { data: { user } } = await supabase.auth.getUser();
				if (user) {
					query = query.eq('created_by', user.id);
				}
			}

			const { data: coursesData, error: coursesError } = await withTimeout(query.then(r => r), 10000);

			if (coursesError) throw coursesError;

			// Fetch user's enrollments
			const { data: { user } } = await supabase.auth.getUser();
			let enrollments: Tables<'enrollments'>[] = [];
			
			if (user) {
				const { data: enrollmentsData } = await withTimeout(
					supabase
						.from('enrollments')
						.select('*')
						.eq('user_id', user.id)
						.then(r => r),
					10000
				);
				enrollments = enrollmentsData || [];
			}

			// Map courses with enrollment and module count
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const coursesWithDetails = (coursesData || []).map((course: any) => ({
				...course,
				module_count: course.modules?.length || 0,
				enrollment: enrollments.find(e => e.course_id === course.id) || null,
			}));

			setCourses(coursesWithDetails);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load courses';
			setError(message === 'TIMEOUT' ? 'Request timed out. Please try again.' : message);
		} finally {
			setLoading(false);
		}
	}, [options?.onlyPublished, options?.onlyOwn]);

	useEffect(() => {
		fetchCourses();
	}, [fetchCourses]);

	const getLocalizedTitle = (course: Course) => 
		locale === 'he' ? course.title_he : course.title_en;

	const getLocalizedDescription = (course: Course) => 
		locale === 'he' ? (course.description_he || '') : (course.description_en || '');

	const getLocalizedCategoryName = (category: Category) =>
		locale === 'he' ? category.name_he : category.name_en;

	const enrollInCourse = async (courseId: string) => {
		if (!supabase) return { error: 'Database not available' };

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return { error: 'Not authenticated' };

		// Get course for due_days
		const course = courses.find(c => c.id === courseId);
		let dueAt: string | null = null;
		if (course?.due_days) {
			const dueDate = new Date();
			dueDate.setDate(dueDate.getDate() + course.due_days);
			dueAt = dueDate.toISOString();
		}

		const { data, error: enrollError } = await supabase
			.from('enrollments')
			.insert({
				user_id: user.id,
				course_id: courseId,
				assigned_by: null,
				due_at: dueAt,
			})
			.select()
			.single();

		if (enrollError) return { error: enrollError.message };

		// Update local state
		setCourses(prev => prev.map(c => 
			c.id === courseId ? { ...c, enrollment: data } : c
		));

		return { data };
	};

	return {
		courses,
		categories,
		loading,
		error,
		refetch: fetchCourses,
		getLocalizedTitle,
		getLocalizedDescription,
		getLocalizedCategoryName,
		enrollInCourse,
	};
}
