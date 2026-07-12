import { Link } from 'react-router';
import { Clock, BookOpen, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Tables } from '@/integrations/supabase/helpers';

interface CourseCardProps {
  course: Tables<'courses'> & {
    category?: Tables<'course_categories'>;
    module_count?: number;
    enrollment?: Tables<'enrollments'> | null;
  };
  onEnroll?: (courseId: string) => void;
  enrolling?: boolean;
  progressPercent?: number;
}

export function CourseCard({ course, onEnroll, enrolling, progressPercent }: CourseCardProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const title = locale === 'he' ? course.title_he : course.title_en;
  const description = locale === 'he' ? course.description_he || '' : course.description_en || '';
  const categoryName = course.category ?
  locale === 'he' ? course.category.name_he : course.category.name_en :
  null;

  const isEnrolled = !!course.enrollment;
  const Chevron = locale === 'he' ? ChevronLeft : ChevronRight;

  return (
    <div data-ev-id="ev_5bbd3425f7" className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 relative">
			{/* Leading edge accent */}
			<div data-ev-id="ev_4628b547e6" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary group-focus-within:bg-primary transition-colors" />
			
			{/* Thumbnail */}
			<div data-ev-id="ev_b5c01ba48c" className="relative h-40 bg-muted overflow-hidden">
				{course.thumbnail_url ?
        <img data-ev-id="ev_7441a4fc01"
        src={course.thumbnail_url}
        alt={title}
        className="w-full h-full object-cover" /> :


        <div data-ev-id="ev_f2e5c465ce" className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
						<BookOpen className="w-12 h-12 text-muted-foreground/50" />
					</div>
        }
				
				{/* Badges */}
				<div data-ev-id="ev_b19792ea52" className="absolute top-3 inset-inline-start-3 flex flex-wrap gap-2">
					{course.is_mandatory &&
          <Badge variant="danger">{dict.catalogue.mandatory}</Badge>
          }
					{categoryName &&
          <Badge variant="info">{categoryName}</Badge>
          }
				</div>
			</div>

			{/* Content */}
			<div data-ev-id="ev_5e1f468629" className="p-4">
				<h3 data-ev-id="ev_262551c9a3" className="font-semibold text-foreground mb-2 line-clamp-2">{title}</h3>
				<p data-ev-id="ev_2849792f4c" className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

				{/* Meta */}
				<div data-ev-id="ev_9481c774b7" className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
					{course.estimated_minutes &&
          <span data-ev-id="ev_a8bc25e40e" className="flex items-center gap-1">
							<Clock className="w-4 h-4" />
							{course.estimated_minutes} {dict.common.minutes}
						</span>
          }
					{course.module_count !== undefined &&
          <span data-ev-id="ev_9704e09e83" className="flex items-center gap-1">
							<BookOpen className="w-4 h-4" />
							{course.module_count} {dict.catalogue.modules}
						</span>
          }
				</div>

				{/* Progress bar for enrolled courses */}
				{isEnrolled && progressPercent !== undefined &&
        <div data-ev-id="ev_869dd43270" className="mb-4">
						<ProgressBar value={progressPercent} showLabel size="sm" />
					</div>
        }

				{/* Actions */}
				<div data-ev-id="ev_7198daf63e" className="flex items-center justify-between">
					{isEnrolled ?
          <Link
            to={`/course/${course.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

							{dict.catalogue.continueCourse}
							<Chevron className="w-4 h-4" />
						</Link> :

          <button data-ev-id="ev_9476254cd5"
          onClick={() => onEnroll?.(course.id)}
          disabled={enrolling}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

							{dict.catalogue.enroll}
						</button>
          }

					{isEnrolled &&
          <Badge variant="success">{dict.catalogue.enrolled}</Badge>
          }
				</div>
			</div>
		</div>);

}