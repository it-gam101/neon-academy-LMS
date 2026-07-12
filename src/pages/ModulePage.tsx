import { useParams, useNavigate, Link } from 'react-router';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useCourseModules } from '@/hooks/useCourseModules';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/Toast';
import { useState, useMemo, useEffect } from 'react';

interface ContentBlock {
  type: 'heading' | 'text' | 'video';
  content: {en: string;he: string;} | string;
  url?: string;
}

export default function ModulePage() {
  const { courseId, moduleId } = useParams<{courseId: string;moduleId: string;}>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const PrevChevron = locale === 'he' ? ChevronRight : ChevronLeft;
  const NextChevron = locale === 'he' ? ChevronLeft : ChevronRight;

  const { course, modules, enrollment, loading, error, refetch, getLocalizedTitle, getLocalizedCourseTitle, markModuleProgress } = useCourseModules(courseId || '');
  const [marking, setMarking] = useState(false);

  const currentModule = modules.find((m) => m.id === moduleId);
  const currentIndex = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  const isCompleted = currentModule?.progress?.status === 'completed';
  const isQuiz = currentModule?.module_type === 'quiz';

  // Mark as in_progress when entering lesson
  useEffect(() => {
    if (currentModule && !isQuiz && currentModule.progress?.status !== 'completed' && currentModule.progress?.status !== 'in_progress') {
      markModuleProgress(currentModule.id, 'in_progress');
    }
  }, [currentModule, isQuiz, markModuleProgress]);

  const contentBlocks = useMemo<ContentBlock[]>(() => {
    if (!currentModule?.content_json) return [];
    const json = currentModule.content_json as {blocks?: ContentBlock[];};
    return json.blocks || [];
  }, [currentModule]);

  if (loading) {
    return (
      <div data-ev-id="ev_52366ddcd3" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<LoadingSkeleton variant="text" count={10} />
			</div>);

  }

  const courseTitle = course ? getLocalizedCourseTitle() : '';
  const moduleTitle = currentModule ? getLocalizedTitle(currentModule) : '';

  if (error || !currentModule || !course) {
    return (
      <div data-ev-id="ev_0a8291cb1e" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<BackButton to={`/course/${courseId}`} label={dict.course.backToCourse} />
				<ErrorState
          error={error || dict.common.notFound}
          onRetry={refetch} />

			</div>);

  }

  // Redirect to quiz page if it's a quiz
  if (isQuiz) {
    navigate(`/course/${courseId}/quiz/${moduleId}`, { replace: true });
    return null;
  }

  const handleMarkComplete = async () => {
    setMarking(true);
    const { error } = await markModuleProgress(currentModule.id, 'completed');
    if (error) {
      showToast('error', error);
    } else {
      showToast('success', dict.common.completed);
    }
    setMarking(false);
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    const content = typeof block.content === 'string' ?
    block.content :
    locale === 'he' ? block.content.he : block.content.en;

    switch (block.type) {
      case 'heading':
        return (
          <h2 data-ev-id="ev_08c646dc11" key={index} className="text-xl font-semibold text-foreground mt-8 mb-4">
						{content}
					</h2>);

      case 'video':{
          const videoUrl = block.url || content;
          return (
            <div data-ev-id="ev_ef8b1d53d1" key={index} className="my-6 aspect-video rounded-lg overflow-hidden bg-muted">
						<iframe data-ev-id="ev_429d3d884f"
              src={videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video" />

					</div>);
        }
      case 'text':
      default:
        return (
          <div data-ev-id="ev_3b6003bbb3"
          key={index}
          className="text-muted-foreground leading-relaxed whitespace-pre-wrap my-4"
          dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>').replace(/\n/g, '<br />') }} />);


    }
  };

  return (
    <div data-ev-id="ev_9dc9cd554c" className="min-h-screen bg-background">
			<div data-ev-id="ev_90af7b3ade" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Breadcrumbs */}
				<Breadcrumbs
          items={[
          { label: dict.nav.catalogue, href: '/catalogue' },
          { label: courseTitle, href: `/course/${courseId}` },
          { label: moduleTitle }]
          } />

				
				{/* Header */}
				<div data-ev-id="ev_c5459550e6" className="mb-8">
					<BackButton to={`/course/${courseId}`} label={dict.course.backToCourse} />

					<p data-ev-id="ev_8cdba98cd1" className="text-sm text-muted-foreground mb-2">
						{dict.course.lesson} {currentIndex + 1} {dict.common.of} {modules.length}
					</p>
					<h1 data-ev-id="ev_6eb27630c5" className="text-2xl font-bold text-foreground">{getLocalizedTitle(currentModule)}</h1>
				</div>

				{/* Content */}
				<div data-ev-id="ev_1eea7feda1" className="bg-card border border-border rounded-lg p-6 mb-8">
					{contentBlocks.length > 0 ?
          contentBlocks.map((block, index) => renderBlock(block, index)) :

          <p data-ev-id="ev_b8cc61754d" className="text-muted-foreground">{dict.common.noResults}</p>
          }
				</div>

				{/* Actions */}
				<div data-ev-id="ev_ffc1aaac98" className="flex items-center justify-between gap-4">
					{/* Previous */}
					{prevModule ?
          <Link
            to={`/course/${courseId}/module/${prevModule.id}`}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">

							<PrevChevron className="w-5 h-5" />
							{dict.course.previousModule}
						</Link> :

          <div data-ev-id="ev_47e74bb53a" />
          }

					{/* Mark complete */}
					{!isCompleted ?
          <button data-ev-id="ev_bdabb08cd9"
          onClick={handleMarkComplete}
          disabled={marking}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

							<CheckCircle className="w-5 h-5" />
							{marking ? dict.common.loading : dict.course.markComplete}
						</button> :

          <span data-ev-id="ev_0b84f95aeb" className="flex items-center gap-2 text-primary">
							<CheckCircle className="w-5 h-5" />
							{dict.course.completedLesson}
						</span>
          }

					{/* Next */}
					{nextModule ?
          <Link
            to={`/course/${courseId}/module/${nextModule.id}`}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">

							{dict.course.nextModule}
							<NextChevron className="w-5 h-5" />
						</Link> :

          <Link
            to={`/course/${courseId}`}
            className="flex items-center gap-2 px-4 py-2 text-primary hover:text-primary/90 transition-colors">

							{dict.course.backToCourse}
							<NextChevron className="w-5 h-5" />
						</Link>
          }
				</div>
			</div>
		</div>);

}