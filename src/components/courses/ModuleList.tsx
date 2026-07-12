import { Link } from 'react-router';
import { BookOpen, FileQuestion, CheckCircle, Circle, PlayCircle, ChevronRight, ChevronLeft, Lock } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { Badge } from '@/components/ui/Badge';
import type { Tables } from '@/integrations/supabase/helpers';

interface ModuleWithProgress extends Tables<'modules'> {
  progress?: Tables<'module_progress'>;
  quiz?: Tables<'quizzes'>;
  attempts?: Tables<'quiz_attempts'>[];
}

interface ModuleListProps {
  courseId: string;
  modules: ModuleWithProgress[];
  enrolled: boolean;
}

export function ModuleList({ courseId, modules, enrolled }: ModuleListProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const Chevron = locale === 'he' ? ChevronLeft : ChevronRight;

  const getStatusIcon = (mod: ModuleWithProgress) => {
    const status = mod.progress?.status || 'not_started';

    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-primary" />;
    }
    if (status === 'in_progress') {
      return <PlayCircle className="w-5 h-5 text-primary" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const getModuleIcon = (moduleType: string) => {
    switch (moduleType) {
      case 'quiz':
        return <FileQuestion className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (mod: ModuleWithProgress) => {
    const status = mod.progress?.status || 'not_started';

    if (mod.module_type === 'quiz' && mod.attempts && mod.attempts.length > 0) {
      const lastAttempt = mod.attempts[0];
      if (lastAttempt.passed) {
        return <Badge variant="success">{dict.course.quizPassed} ({lastAttempt.score}%)</Badge>;
      }
      return <Badge variant="danger">{dict.course.quizFailed} ({lastAttempt.score}%)</Badge>;
    }

    switch (status) {
      case 'completed':
        return <Badge variant="success">{dict.common.completed}</Badge>;
      case 'in_progress':
        return <Badge variant="info">{dict.course.inProgress}</Badge>;
      default:
        return <Badge>{dict.course.notStarted}</Badge>;
    }
  };

  const getTitle = (mod: ModuleWithProgress) =>
  locale === 'he' ? mod.title_he : mod.title_en;

  return (
    <div data-ev-id="ev_8039c02d05" className="space-y-2">
			{modules.map((mod, index) => {
        const canAccess = enrolled;

        return (
          <div data-ev-id="ev_649ed2b906" key={mod.id} className="group">
						{canAccess ?
            <Link
              to={`/course/${courseId}/module/${mod.id}`}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group-hover:shadow-md relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

								{/* Leading accent */}
								<div data-ev-id="ev_7cc9978516" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-lg" />

								{/* Status indicator */}
								{getStatusIcon(mod)}

								{/* Module icon */}
								<div data-ev-id="ev_37f14f48dc" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
									{getModuleIcon(mod.module_type || 'lesson')}
								</div>

								{/* Content */}
								<div data-ev-id="ev_534866f1a2" className="flex-1 min-w-0">
									<div data-ev-id="ev_2830a6f1ab" className="flex items-center gap-2">
										<span data-ev-id="ev_424b0648eb" className="text-sm text-muted-foreground">
											{mod.module_type === 'quiz' ? dict.course.quiz : dict.course.lesson} {index + 1}
										</span>
									</div>
									<h4 data-ev-id="ev_b76dd0d2c8" className="font-medium text-foreground truncate">{getTitle(mod)}</h4>
								</div>

								{/* Status badge */}
								{getStatusBadge(mod)}

								{/* Chevron */}
								<Chevron className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
							</Link> :

            <div data-ev-id="ev_41eb2a9b79" className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg opacity-60">
								<Lock className="w-5 h-5 text-muted-foreground" />
								<div data-ev-id="ev_ad645455a2" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
									{getModuleIcon(mod.module_type || 'lesson')}
								</div>
								<div data-ev-id="ev_2fae3deed8" className="flex-1">
									<span data-ev-id="ev_927d2526e3" className="text-sm text-muted-foreground">
										{mod.module_type === 'quiz' ? dict.course.quiz : dict.course.lesson} {index + 1}
									</span>
									<h4 data-ev-id="ev_27ca456428" className="font-medium text-foreground">{getTitle(mod)}</h4>
								</div>
							</div>
            }
					</div>);

      })}
		</div>);

}