import { useParams, useNavigate, Link } from 'react-router';
import { Clock, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourses } from '@/hooks/useCourses';
import { ModuleList } from '@/components/courses/ModuleList';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/Toast';
import { formatRelativeDate } from '@/utils/formatDate';
import { useState } from 'react';

export default function CoursePage() {
  const { courseId } = useParams<{courseId: string;}>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const {
    course,
    modules,
    enrollment,
    loading,
    error,
    refetch,
    getLocalizedCourseTitle,
    completedCount,
    totalCount,
    progressPercent
  } = useCourseModules(courseId || '');

  const { enrollInCourse } = useCourses();
  const [enrolling, setEnrolling] = useState(false);

  if (loading) {
    return (
      <div data-ev-id="ev_0bf22c888e" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<LoadingSkeleton variant="text" count={3} />
				<div data-ev-id="ev_62301e1cdd" className="mt-8">
					<LoadingSkeleton variant="list" count={5} />
				</div>
			</div>);

  }

  if (error || !course) {
    return (
      <div data-ev-id="ev_7ae8776e0b" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<BackButton to="/catalogue" label={dict.nav.catalogue} />
				<ErrorState
          error={error || dict.common.notFound}
          onRetry={refetch} />

			</div>);

  }

  const title = getLocalizedCourseTitle();
  const description = locale === 'he' ? course.description_he || '' : course.description_en || '';
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';
  const isOverdue = enrollment && enrollment.due_at &&
  new Date(enrollment.due_at) < new Date() && enrollment.status !== 'completed';

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    const { error } = await enrollInCourse(courseId);
    if (error) {
      showToast('error', error);
    } else {
      showToast('success', dict.catalogue.enrolled);
      window.location.reload();
    }
    setEnrolling(false);
  };

  return (
    <div data-ev-id="ev_825ddcb642" className="min-h-screen bg-background">
			<div data-ev-id="ev_0004629ff6" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Breadcrumbs */}
				<Breadcrumbs
          showHome={false}
          items={[
          { label: dict.nav.catalogue, href: '/catalogue' },
          { label: title }]
          } />

				
				{/* Back button */}
				<BackButton to="/catalogue" label={dict.nav.catalogue} />

				{/* Course header */}
				<div data-ev-id="ev_032181e230" className="bg-card border border-border rounded-lg p-6 mb-8">
					<div data-ev-id="ev_dd19893164" className="flex flex-col lg:flex-row gap-6">
						{/* Thumbnail */}
						<div data-ev-id="ev_7bfea69526" className="lg:w-64 h-40 lg:h-auto bg-muted rounded-lg overflow-hidden flex-shrink-0">
							{course.thumbnail_url ?
              <img data-ev-id="ev_6192811443" src={course.thumbnail_url} alt={title} className="w-full h-full object-cover" /> :

              <div data-ev-id="ev_2d873d0df2" className="w-full h-full flex items-center justify-center">
									<BookOpen className="w-12 h-12 text-muted-foreground" />
								</div>
              }
						</div>

						{/* Details */}
						<div data-ev-id="ev_747b051bba" className="flex-1">
							<div data-ev-id="ev_3a922e93ce" className="flex flex-wrap gap-2 mb-3">
								{course.is_mandatory &&
                <Badge variant="danger">{dict.catalogue.mandatory}</Badge>
                }
								{isCompleted &&
                <Badge variant="success">{dict.common.completed}</Badge>
                }
								{isOverdue &&
                <Badge variant="warning">{dict.common.overdue}</Badge>
                }
							</div>

							<h1 data-ev-id="ev_55add39692" className="text-2xl font-bold text-foreground mb-2">{title}</h1>
							<p data-ev-id="ev_63a87f0235" className="text-muted-foreground mb-4">{description}</p>

							<div data-ev-id="ev_32443aeeae" className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
								{course.estimated_minutes &&
                <span data-ev-id="ev_5d745fefc0" className="flex items-center gap-1">
										<Clock className="w-4 h-4" />
										{course.estimated_minutes} {dict.common.minutes}
									</span>
                }
								<span data-ev-id="ev_489dee5e7d" className="flex items-center gap-1">
									<BookOpen className="w-4 h-4" />
									{totalCount} {dict.catalogue.modules}
								</span>
								{enrollment?.due_at &&
                <span data-ev-id="ev_21e86ad763" className="flex items-center gap-1">
										<Calendar className="w-4 h-4" />
										{dict.course.dueDateLabel}: {formatRelativeDate(enrollment.due_at, locale)}
									</span>
                }
							</div>

							{/* Progress or enroll button */}
							{isEnrolled ?
              <div data-ev-id="ev_f8380e2c18">
									<div data-ev-id="ev_81cb7d0b55" className="flex items-center justify-between text-sm mb-2">
										<span data-ev-id="ev_5491c82e0d" className="text-muted-foreground">{dict.course.moduleProgress}</span>
										<span data-ev-id="ev_6864330b20" className="text-foreground font-medium">
											{completedCount} / {totalCount}
										</span>
									</div>
									<ProgressBar value={progressPercent} />
									{isCompleted && enrollment.score &&
                <p data-ev-id="ev_c188806412" className="mt-2 text-sm text-muted-foreground">
											{dict.course.yourScore}: {Math.round(enrollment.score)}%
										</p>
                }
								</div> :

              <button data-ev-id="ev_84b0c9d34e"
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

									{enrolling ? dict.common.loading : dict.catalogue.enroll}
								</button>
              }
						</div>
					</div>
				</div>

				{/* Modules */}
				<div data-ev-id="ev_423f96bb38">
					<h2 data-ev-id="ev_c1c131f524" className="text-xl font-semibold text-foreground mb-4">{dict.course.modules}</h2>
					<ModuleList
            courseId={courseId || ''}
            modules={modules}
            enrolled={isEnrolled} />

				</div>

				{/* Completion message */}
				{isCompleted &&
        <div data-ev-id="ev_dc180930aa" className="mt-8 p-6 bg-primary/10 border border-primary/30 rounded-lg text-center">
						<h3 data-ev-id="ev_739caeedf9" className="text-xl font-semibold text-primary mb-2">{dict.course.courseCompleted}</h3>
						<p data-ev-id="ev_0a4eae3796" className="text-muted-foreground">{dict.course.courseCompletedMessage}</p>
					</div>
        }
			</div>
		</div>);

}