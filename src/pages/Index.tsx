import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { AppShell } from '@/components/layout/AppShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { BookOpen, GraduationCap, Users, PenTool, BarChart3, Settings, ChevronRight, ChevronLeft, PlayCircle, Clock, Sparkles } from 'lucide-react';
import type { UserRole } from '@/contexts/auth-context';

interface QuickAction {
  path: string;
  titleKey: keyof typeof import('@/i18n/dictionary').dictionaries.en.nav;
  descriptionSection: 'catalogue' | 'myLearning' | 'team' | 'studio' | 'hrAnalytics' | 'admin';
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const quickActions: QuickAction[] = [
{
  path: '/catalogue',
  titleKey: 'catalogue',
  descriptionSection: 'catalogue',
  icon: BookOpen,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee']
},
{
  path: '/my-learning',
  titleKey: 'myLearning',
  descriptionSection: 'myLearning',
  icon: GraduationCap,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee']
},
{
  path: '/team',
  titleKey: 'team',
  descriptionSection: 'team',
  icon: Users,
  allowedRoles: ['super_admin', 'hr_manager', 'team_manager']
},
{
  path: '/studio',
  titleKey: 'studio',
  descriptionSection: 'studio',
  icon: PenTool,
  allowedRoles: ['super_admin', 'hr_manager', 'instructor']
},
{
  path: '/hr-analytics',
  titleKey: 'hrAnalytics',
  descriptionSection: 'hrAnalytics',
  icon: BarChart3,
  allowedRoles: ['super_admin', 'hr_manager']
},
{
  path: '/admin',
  titleKey: 'admin',
  descriptionSection: 'admin',
  icon: Settings,
  allowedRoles: ['super_admin']
}];


export default function Index() {
  const { isAuthenticated, profile } = useAuth();
  const { t, isRTL, locale } = useLocale();
  const navigate = useNavigate();

  // Only fetch data when authenticated
  const { inProgress, loading: enrollmentsLoading, calculateProgress, getLocalizedTitle: getEnrollmentTitle } = useEnrollments(
    isAuthenticated ? profile?.id : undefined
  );
  const { courses, loading: coursesLoading, getLocalizedTitle: getCourseTitle } = useCourses({ onlyPublished: true });

  const userRole = profile?.role ?? 'employee';
  const visibleActions = quickActions.filter((action) =>
  action.allowedRoles.includes(userRole)
  );

  // Get the most recent in-progress enrollment for "continue where you left off"
  const continueEnrollment = inProgress[0];

  // Get 3 most recently published courses (sorted by created_at desc)
  const newCourses = [...courses].
  sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).
  slice(0, 3);

  // Directional chevron
  const ChevronForward = isRTL ? ChevronLeft : ChevronRight;

  return (
    <AppShell hideLoginButton={!isAuthenticated}>
			{!isAuthenticated ?
      // Welcome screen for unauthenticated users
      <div data-ev-id="ev_145ef5f237" className="flex flex-col items-center justify-center min-h-[60vh] text-center">
					<div data-ev-id="ev_dd00302cc0" className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-muted border border-primary/30 mb-6">
						<span data-ev-id="ev_a606fc9a3e" className="text-3xl font-bold text-primary">NA</span>
					</div>
					<h1 data-ev-id="ev_a6f0842431" className="text-4xl font-bold text-foreground mb-3">{t.appName}</h1>
					<p data-ev-id="ev_0a55aa9db5" className="text-lg text-foreground-muted mb-8 max-w-md">
						{t.tagline}
					</p>
					<button data-ev-id="ev_9de53a18a8"
        onClick={() => navigate('/auth/login')}
        className={
        `px-6 py-3 rounded-lg font-medium ` +
        `bg-primary text-primary-foreground hover:bg-primary-hover ` +
        `transition-colors focus-ring`
        }>

						{t.auth.login}
					</button>
				</div> :

      // Dashboard for authenticated users
      <div data-ev-id="ev_08ff689a4f">
					{/* Welcome header */}
					<div data-ev-id="ev_95a2ddd1cb" className="mb-8">
						<h1 data-ev-id="ev_f74521f482" className="text-2xl font-bold text-foreground mb-2">
							{profile?.full_name ?
            `${t.dashboard.welcome}, ${profile.full_name}` :
            t.dashboard.welcome}
						</h1>
						<p data-ev-id="ev_16e75e1faf" className="text-foreground-muted">
							{t.roles[userRole]}
						</p>
					</div>

					{/* Continue where you left off */}
					{enrollmentsLoading ?
        <div data-ev-id="ev_continue_loading" className="mb-8">
							<div data-ev-id="ev_continue_header" className="flex items-center justify-between mb-4">
								<h2 data-ev-id="ev_continue_title" className="text-lg font-semibold text-foreground flex items-center gap-2">
									<PlayCircle className="w-5 h-5 text-primary" />
									{t.dashboard.continueLearning}
								</h2>
							</div>
							<LoadingSkeleton variant="card" count={1} />
						</div> :
        continueEnrollment ?
        <div data-ev-id="ev_continue_section" className="mb-8">
							<div data-ev-id="ev_continue_header" className="flex items-center justify-between mb-4">
								<h2 data-ev-id="ev_continue_title" className="text-lg font-semibold text-foreground flex items-center gap-2">
									<PlayCircle className="w-5 h-5 text-primary" />
									{t.dashboard.continueLearning}
								</h2>
								<Link
              to="/my-learning"
              className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1">

									{t.dashboard.viewAllCourses}
									<ChevronForward className="w-4 h-4" />
								</Link>
							</div>
							<Link
            to={`/course/${continueEnrollment.course_id}`}
            className="group block bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 relative">

								<div data-ev-id="ev_continue_accent" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-xl" />
								<div data-ev-id="ev_continue_content" className="flex items-center gap-4">
									<div data-ev-id="ev_continue_icon" className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
										<PlayCircle className="w-7 h-7 text-primary" />
									</div>
									<div data-ev-id="ev_continue_info" className="flex-1 min-w-0">
										<p data-ev-id="ev_continue_label" className="text-sm text-muted-foreground mb-1">
											{t.dashboard.continueWhereLeft}
										</p>
										<h3 data-ev-id="ev_continue_course" className="font-semibold text-foreground truncate text-lg">
											{getEnrollmentTitle(continueEnrollment)}
										</h3>
										<div data-ev-id="ev_continue_progress" className="mt-3 max-w-md">
											<ProgressBar value={calculateProgress(continueEnrollment)} size="sm" showLabel />
										</div>
									</div>
									<ChevronForward className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
								</div>
							</Link>
						</div> :
        null}

					{/* New in the catalogue */}
					{coursesLoading ?
        <div data-ev-id="ev_new_loading" className="mb-8">
							<div data-ev-id="ev_new_header" className="flex items-center justify-between mb-4">
								<h2 data-ev-id="ev_new_title" className="text-lg font-semibold text-foreground flex items-center gap-2">
									<Sparkles className="w-5 h-5 text-primary" />
									{t.dashboard.newInCatalogue}
								</h2>
							</div>
							<div data-ev-id="ev_new_skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								<LoadingSkeleton variant="card" count={3} />
							</div>
						</div> :
        newCourses.length > 0 ?
        <div data-ev-id="ev_new_section" className="mb-8">
							<div data-ev-id="ev_new_header" className="flex items-center justify-between mb-4">
								<h2 data-ev-id="ev_new_title" className="text-lg font-semibold text-foreground flex items-center gap-2">
									<Sparkles className="w-5 h-5 text-primary" />
									{t.dashboard.newInCatalogue}
								</h2>
								<Link
              to="/catalogue"
              className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1">

									{t.dashboard.viewAllCourses}
									<ChevronForward className="w-4 h-4" />
								</Link>
							</div>
							<div data-ev-id="ev_new_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{newCourses.map((course) =>
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-md">

										{/* Thumbnail */}
										<div data-ev-id={`ev_course_thumb_${course.id}`} className="aspect-video bg-muted relative overflow-hidden">
											{course.thumbnail_url ?
                <img data-ev-id="ev_ab3cb2065f"
                src={course.thumbnail_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> :


                <div data-ev-id={`ev_course_placeholder_${course.id}`} className="w-full h-full flex items-center justify-center">
													<BookOpen className="w-12 h-12 text-muted-foreground/40" />
												</div>
                }
										</div>
										{/* Content */}
										<div data-ev-id={`ev_course_content_${course.id}`} className="p-4">
											<h3 data-ev-id={`ev_course_title_${course.id}`} className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
												{getCourseTitle(course)}
											</h3>
											{course.estimated_minutes &&
                <p data-ev-id={`ev_course_time_${course.id}`} className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
													<Clock className="w-4 h-4" />
													{course.estimated_minutes} {t.common.minutes}
												</p>
                }
										</div>
									</Link>
            )}
							</div>
						</div> :
        null}
					
					{/* Quick actions grid */}
					<div data-ev-id="ev_quick_actions_header" className="mb-4">
						<h2 data-ev-id="ev_quick_actions_title" className="text-lg font-semibold text-foreground">
							{t.common.actions}
						</h2>
					</div>
					<div data-ev-id="ev_d2c628a2cc" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <button data-ev-id="ev_9f7219b529"
              key={action.path}
              onClick={() => navigate(action.path)}
              className={
              `relative flex items-start gap-4 p-5 rounded-xl ` +
              `bg-card border border-card-border text-start ` +
              `card-interactive focus-ring overflow-hidden`
              }>

									<div data-ev-id="ev_e4e9793bba" className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center">
										<Icon className="w-5 h-5 text-primary" />
									</div>
									<div data-ev-id="ev_5d6143d5ca" className="flex-1 min-w-0">
										<h3 data-ev-id="ev_7ac9360175" className="font-semibold text-foreground mb-1">
											{t.nav[action.titleKey]}
										</h3>
										<p data-ev-id="ev_3112d9eb08" className="text-sm text-foreground-muted line-clamp-2">
											{t[action.descriptionSection].description}
										</p>
									</div>
									<ChevronForward className="flex-shrink-0 w-5 h-5 text-foreground-subtle self-center" />
								</button>);

          })}
					</div>
				</div>
      }
		</AppShell>);

}