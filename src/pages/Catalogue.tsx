import { useState } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/courses/CourseCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/Toast';

export default function Catalogue() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { courses, categories, loading, error, refetch, getLocalizedCategoryName, enrollInCourse } = useCourses({ onlyPublished: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const filteredCourses = courses.filter((course) => {
    // Category filter
    if (selectedCategory && course.category_id !== selectedCategory) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = locale === 'he' ? course.title_he : course.title_en;
      const description = locale === 'he' ? course.description_he || '' : course.description_en || '';
      return title.toLowerCase().includes(query) || description.toLowerCase().includes(query);
    }

    return true;
  });

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    const { error } = await enrollInCourse(courseId);
    if (error) {
      showToast('error', error);
    } else {
      showToast('success', dict.catalogue.enrolled);
    }
    setEnrollingId(null);
  };

  return (
    <div data-ev-id="ev_507e222300" className="min-h-screen bg-background">
			<div data-ev-id="ev_ef64fb4e15" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div data-ev-id="ev_f58e92002e" className="mb-8">
					<h1 data-ev-id="ev_455822cc29" className="text-3xl font-bold text-foreground mb-2">{dict.catalogue.title}</h1>
					<p data-ev-id="ev_b05bdfb015" className="text-muted-foreground">{dict.catalogue.description}</p>
				</div>

				{/* Filters */}
				<div data-ev-id="ev_e3ccaf26b7" className="flex flex-col sm:flex-row gap-4 mb-8">
					{/* Search */}
					<div data-ev-id="ev_a977c77eae" className="relative flex-1">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
						<input data-ev-id="ev_4aab791ffb"
            type="text"
            placeholder={dict.catalogue.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            aria-label={dict.tooltips.searchCourses} />

					</div>

					{/* Category filter */}
					<div data-ev-id="ev_d18433c542" className="relative">
						<Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
						<select data-ev-id="ev_4421d7c569"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="ps-10 pe-8 py-2 bg-card border border-border rounded-lg text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
            aria-label={dict.tooltips.filterByCategory}>

							<option data-ev-id="ev_8f40505df7" value="">{dict.catalogue.allCategories}</option>
							{categories.map((cat) =>
              <option data-ev-id="ev_06b2e15d11" key={cat.id} value={cat.id}>
									{getLocalizedCategoryName(cat)}
								</option>
              )}
						</select>
					</div>
				</div>

				{/* Content */}
				{loading ?
        <LoadingSkeleton variant="card" count={6} /> :
        error ?
        <ErrorState
          error={error}
          onRetry={refetch} /> :
        filteredCourses.length === 0 ?
        <EmptyState
          icon={BookOpen}
          title={dict.catalogue.noCourses}
          description={dict.catalogue.noCoursesDescription} /> :


        <div data-ev-id="ev_0dbbd123f3" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredCourses.map((course) =>
          <CourseCard
            key={course.id}
            course={course}
            onEnroll={handleEnroll}
            enrolling={enrollingId === course.id} />

          )}
					</div>
        }
			</div>
		</div>);

}