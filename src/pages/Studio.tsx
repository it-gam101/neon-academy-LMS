import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, BookOpen, Edit, Eye, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, Trash2, GripVertical, FileQuestion } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';

export default function Studio() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { courses, categories, loading, error, refetch, getLocalizedTitle, getLocalizedCategoryName } = useCourses({ onlyOwn: true });
  const navigate = useNavigate();
  const Chevron = locale === 'he' ? ChevronLeft : ChevronRight;

  const handleCreateCourse = async () => {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.
    from('courses').
    insert({
      title_en: 'New Course',
      title_he: 'קורס חדש',
      status: 'draft',
      created_by: user.id
    }).
    select().
    single();

    if (error) {
      showToast('error', error.message);
    } else {
      navigate(`/studio/${data.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">{dict.common.published}</Badge>;
      case 'archived':
        return <Badge variant="warning">{dict.common.archived}</Badge>;
      default:
        return <Badge>{dict.common.draft}</Badge>;
    }
  };

  if (loading) {
    return (
      <AppShell>
      <div data-ev-id="ev_0403bc2c57" className="max-w-6xl mx-auto">
				<LoadingSkeleton variant="text" count={2} />
				<div data-ev-id="ev_fb173e2954" className="mt-8">
					<LoadingSkeleton variant="list" count={5} />
				</div>
			</div>
      </AppShell>);

  }

  return (
    <AppShell>
    <div data-ev-id="ev_e953f14ce8">
			<div data-ev-id="ev_3f2dd53e8b" className="max-w-6xl mx-auto">
				{/* Header */}
				<div data-ev-id="ev_8ab9aacb53" className="flex items-center justify-between mb-8">
					<div data-ev-id="ev_5b70f2a250">
						<h1 data-ev-id="ev_e8a8de4b97" className="text-3xl font-bold text-foreground mb-2">{dict.studio.title}</h1>
						<p data-ev-id="ev_d2516c3383" className="text-muted-foreground">{dict.studio.description}</p>
					</div>
					<button data-ev-id="ev_20d39d9b23"
          onClick={handleCreateCourse}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

						<Plus className="w-4 h-4" />
						{dict.studio.createCourse}
					</button>
				</div>

				{error &&
        <div data-ev-id="ev_161d2a1a0a" className="text-center py-8">
						<p data-ev-id="ev_cd572e2210" className="text-destructive">{error}</p>
					</div>
        }

				{courses.length === 0 ?
        <EmptyState
          icon={BookOpen}
          title={dict.studio.noCourses}
          description={dict.studio.noCoursesDescription}
          action={{
            label: dict.studio.createCourse,
            onClick: handleCreateCourse
          }} /> :


        <div data-ev-id="ev_1e8ab6cf5f" className="space-y-4">
						{courses.map((course) =>
          <Link
            key={course.id}
            to={`/studio/${course.id}`}
            className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all relative">

								<div data-ev-id="ev_2137b3c806" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-lg" />

								{/* Thumbnail */}
								<div data-ev-id="ev_941d7cf170" className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
									{course.thumbnail_url ?
              <img data-ev-id="ev_6d10efcbc3" src={course.thumbnail_url} alt="" className="w-full h-full object-cover" /> :

              <div data-ev-id="ev_731fc7d532" className="w-full h-full flex items-center justify-center">
											<BookOpen className="w-8 h-8 text-muted-foreground" />
										</div>
              }
								</div>

								{/* Content */}
								<div data-ev-id="ev_f778f8489d" className="flex-1 min-w-0">
									<div data-ev-id="ev_c2e14383ec" className="flex items-center gap-2 mb-1">
										<h3 data-ev-id="ev_3f57fde027" className="font-semibold text-foreground truncate">{getLocalizedTitle(course)}</h3>
										{getStatusBadge(course.status)}
									</div>
									<div data-ev-id="ev_132246d517" className="flex items-center gap-4 text-sm text-muted-foreground">
										{course.category &&
                <span data-ev-id="ev_1d32dff65b">{getLocalizedCategoryName(course.category)}</span>
                }
										{course.module_count !== undefined &&
                <span data-ev-id="ev_1eef4aada0">{course.module_count} {dict.catalogue.modules}</span>
                }
									</div>
								</div>

								<Chevron className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
							</Link>
          )}
					</div>
        }
			</div>
		</div>
    </AppShell>);

}