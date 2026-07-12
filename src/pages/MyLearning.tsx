import { Link } from 'react-router';
import { BookOpen, CheckCircle, AlertTriangle, PlayCircle, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useEnrollments } from '@/hooks/useEnrollments';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatRelativeDate } from '@/utils/formatDate';

export default function MyLearning() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { enrollments, inProgress, completed, overdue, loading, error, getLocalizedTitle, calculateProgress, isOverdue } = useEnrollments();
  const Chevron = locale === 'he' ? ChevronLeft : ChevronRight;

  const tabs = [
  { id: 'in_progress', label: dict.myLearning.inProgressTab, count: inProgress.length },
  { id: 'completed', label: dict.myLearning.completedTab, count: completed.length },
  { id: 'overdue', label: dict.myLearning.overdueTab, count: overdue.length }];


  // Find the most recent in-progress enrollment for "continue where you left off"
  const continueEnrollment = inProgress[0];

  if (loading) {
    return (
      <div data-ev-id="ev_af2908c6d6" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div data-ev-id="ev_c23f48f0bc" className="mb-8">
					<LoadingSkeleton variant="text" count={2} />
				</div>
				<LoadingSkeleton variant="list" count={5} />
			</div>);

  }

  if (error) {
    return (
      <div data-ev-id="ev_bb019f7e60" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
				<p data-ev-id="ev_67c667bf0e" className="text-destructive">{error}</p>
			</div>);

  }

  return (
    <div data-ev-id="ev_489677b633" className="min-h-screen bg-background">
			<div data-ev-id="ev_f20949d045" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div data-ev-id="ev_26724187ad" className="mb-8">
					<h1 data-ev-id="ev_aa068b4215" className="text-3xl font-bold text-foreground mb-2">{dict.myLearning.title}</h1>
					<p data-ev-id="ev_e4fe386720" className="text-muted-foreground">{dict.myLearning.description}</p>
				</div>

				{/* Continue where you left off */}
				{continueEnrollment &&
        <Link
          to={`/course/${continueEnrollment.course_id}`}
          className="group block bg-card border border-border rounded-lg p-6 mb-8 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 relative">

						<div data-ev-id="ev_0cfe95060b" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-lg" />
						
						<div data-ev-id="ev_4e73d9db8c" className="flex items-center gap-4">
							<div data-ev-id="ev_6395dfd786" className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
								<PlayCircle className="w-6 h-6 text-primary" />
							</div>
							<div data-ev-id="ev_4f5e6372cf" className="flex-1 min-w-0">
								<p data-ev-id="ev_9cc285eae4" className="text-sm text-muted-foreground mb-1">{dict.myLearning.continueWhere}</p>
								<h3 data-ev-id="ev_4644086fef" className="font-semibold text-foreground truncate">{getLocalizedTitle(continueEnrollment)}</h3>
								<div data-ev-id="ev_5bbc6d371a" className="mt-2 max-w-xs">
									<ProgressBar value={calculateProgress(continueEnrollment)} size="sm" />
								</div>
							</div>
							<Chevron className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
						</div>
					</Link>
        }

				{/* Enrollments by status */}
				{enrollments.length === 0 ?
        <EmptyState
          icon={BookOpen}
          title={dict.myLearning.noCourses}
          description={dict.myLearning.noCoursesDescription}
          action={{
            label: dict.catalogue.viewCourse,
            onClick: () => window.location.href = '/catalogue'
          }} /> :


        <Tabs tabs={tabs}>
						{(activeTab) => {
            const items = activeTab === 'completed' ? completed :
            activeTab === 'overdue' ? overdue : inProgress;

            if (items.length === 0) {
              const emptyProps = activeTab === 'completed' ?
              { title: dict.myLearning.noCompleted, description: dict.myLearning.noCompletedDescription, icon: CheckCircle } :
              activeTab === 'overdue' ?
              { title: dict.myLearning.noOverdue, description: dict.myLearning.noOverdueDescription, icon: AlertTriangle } :
              { title: dict.myLearning.noInProgress, description: dict.myLearning.noInProgressDescription, icon: PlayCircle };

              return <EmptyState {...emptyProps} />;
            }

            return (
              <div data-ev-id="ev_0000c02e8b" className="space-y-4">
									{items.map((enrollment) =>
                <Link
                  key={enrollment.id}
                  to={`/course/${enrollment.course_id}`}
                  className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all relative">

											<div data-ev-id="ev_6ee4161168" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-lg" />

											{/* Thumbnail */}
											<div data-ev-id="ev_fe6ad626c3" className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
												{enrollment.course.thumbnail_url ?
                    <img data-ev-id="ev_50facd61d8" src={enrollment.course.thumbnail_url} alt="" className="w-full h-full object-cover" /> :

                    <div data-ev-id="ev_df48a58e6b" className="w-full h-full flex items-center justify-center">
														<BookOpen className="w-6 h-6 text-muted-foreground" />
													</div>
                    }
											</div>

											{/* Content */}
											<div data-ev-id="ev_e7911136f2" className="flex-1 min-w-0">
												<div data-ev-id="ev_2cc128a1c2" className="flex items-center gap-2 mb-1">
													<h3 data-ev-id="ev_d83db9895f" className="font-medium text-foreground truncate">{getLocalizedTitle(enrollment)}</h3>
													{enrollment.course.is_mandatory &&
                      <Badge variant="danger" size="sm">{dict.catalogue.mandatory}</Badge>
                      }
												</div>

												{/* Due date */}
												{enrollment.due_at &&
                    <div data-ev-id="ev_b22bf1e607" className={`flex items-center gap-1 text-sm ${
                    isOverdue(enrollment) ? 'text-destructive' : 'text-muted-foreground'}`
                    }>
														<Calendar className="w-4 h-4" />
														{isOverdue(enrollment) ? dict.myLearning.overdueBy : dict.myLearning.dueIn} {formatRelativeDate(enrollment.due_at, locale)}
													</div>
                    }

												{/* Progress */}
												{activeTab !== 'completed' &&
                    <div data-ev-id="ev_4227574b02" className="mt-2 max-w-xs">
														<ProgressBar
                        value={calculateProgress(enrollment)}
                        size="sm"
                        variant={isOverdue(enrollment) ? 'danger' : 'default'} />

													</div>
                    }

												{/* Score for completed */}
												{activeTab === 'completed' && enrollment.score &&
                    <p data-ev-id="ev_287fa120a8" className="text-sm text-muted-foreground mt-1">
														{dict.course.yourScore}: {Math.round(enrollment.score)}%
													</p>
                    }
											</div>

											<Chevron className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
										</Link>
                )}
								</div>);

          }}
					</Tabs>
        }
			</div>
		</div>);

}