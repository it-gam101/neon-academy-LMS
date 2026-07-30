import { useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { AppShell } from '@/components/layout/AppShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { LightboxImage } from '@/components/ui/Lightbox';
import { BookOpen, GraduationCap, Users, PenTool, BarChart3, Settings, ChevronRight, ChevronLeft, PlayCircle, Clock, Sparkles, Mail } from 'lucide-react';
import type { UserRole } from '@/contexts/auth-context';
import logoSrc from '@/assets/logo.svg';

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


const IMG_BASE = 'https://pub-390efbd60a134343a0477c83ce0cebfb.r2.dev/site';

export default function Index() {
  const { isAuthenticated, profile } = useAuth();
  const { t, isRTL, locale } = useLocale();
  const navigate = useNavigate();
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);

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

  // Scroll to hero and focus heading
  const scrollToHero = () => {
    heroHeadingRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => heroHeadingRef.current?.focus(), 500);
  };

  // Marketing landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div data-ev-id="ev_be0b5200d3" className="min-h-screen bg-background bg-grid-texture flex flex-col">
        {/* Landing header */}
        <header data-ev-id="ev_e1c6f82c60" className="p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
          <button data-ev-id="ev_1644fee4f4"
          type="button"
          onClick={scrollToHero}
          className="flex items-center gap-3 focus-ring rounded-xl transition-colors hover:opacity-80">

            <img data-ev-id="ev_64376f8554" src={logoSrc} alt={t.appName} className="w-10 h-10 rounded-xl" />
            <span data-ev-id="ev_2d684d230e" className="text-lg font-semibold text-foreground hidden sm:block">{t.appName}</span>
          </button>
          <LanguageToggle />
        </header>

        <main data-ev-id="ev_d9e3b8f841" className="flex-1">
          {/* HERO */}
          <section data-ev-id="ev_02b6e611be" className="px-4 py-16 md:py-24 text-center max-w-4xl mx-auto">
            <img data-ev-id="ev_063371539e"
            src={logoSrc}
            alt={t.appName}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl mx-auto mb-8" />

            <h1 data-ev-id="ev_034017b2d2"
            ref={heroHeadingRef}
            tabIndex={-1}
            className="text-3xl md:text-5xl font-bold text-foreground mb-6 text-balance outline-none">

              {t.landing.heroTitle}
            </h1>
            <p data-ev-id="ev_38e89d6f2b" className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              {t.landing.heroSub}
            </p>

            {/* Buttons */}
            <div data-ev-id="ev_18c0bcfb36" className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                to="/auth/login"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors focus-ring">

                {t.auth.login}
              </Link>
              <a data-ev-id="ev_333a255802"
              href="mailto:hello@vibe-coding4elearning.com"
              className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors focus-ring inline-flex items-center justify-center gap-2">

                <Mail className="w-4 h-4" />
                {t.landing.talkToUs}
              </a>
            </div>

            {/* Trust strip */}
            <div data-ev-id="ev_1c22f51dd3" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span data-ev-id="ev_793f069bd4">{t.landing.trust1}</span>
              <span data-ev-id="ev_0730cab4b0" className="text-border">•</span>
              <span data-ev-id="ev_6d609cf1ef">{t.landing.trust2}</span>
              <span data-ev-id="ev_e5d847956f" className="text-border">•</span>
              <span data-ev-id="ev_8b92430ba1">{t.landing.trust3}</span>
            </div>
          </section>

          {/* SHOWCASE */}
          <section data-ev-id="ev_711616a136" className="px-4 pb-16 md:pb-24 max-w-6xl mx-auto">
            <LightboxImage
              src={`${IMG_BASE}/catalogue.webp`}
              alt={locale === 'he' ? 'קטלוג קורסים' : 'Course catalogue'}
              width={1200}
              height={675}
              caption={t.landing.showcaseCaption} />

            <p data-ev-id="ev_21473935f1" className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t.landing.showcaseCaption}
            </p>
          </section>

          {/* FEATURE BLOCKS */}
          <section data-ev-id="ev_4fd3d97621" className="px-4 pb-16 md:pb-24 max-w-6xl mx-auto flex flex-col gap-16 md:gap-24">
            {/* Feature 1 */}
            <div data-ev-id="ev_449c66a01b" className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div data-ev-id="ev_2061c62540" className="w-full md:w-1/2 order-2 md:order-1">
                <LightboxImage
                  src={`${IMG_BASE}/my-learning-he.webp`}
                  alt={locale === 'he' ? 'מסך הלמידה שלי' : 'My Learning screen'}
                  width={600}
                  height={400}
                  caption={t.landing.feature1Body} />

              </div>
              <div data-ev-id="ev_879fdd159c" className="w-full md:w-1/2 order-1 md:order-2">
                <h3 data-ev-id="ev_bddfc37380" className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {t.landing.feature1Title}
                </h3>
                <p data-ev-id="ev_bc75746c44" className="text-muted-foreground text-pretty">
                  {t.landing.feature1Body}
                </p>
              </div>
            </div>

            {/* Feature 2 - reversed */}
            <div data-ev-id="ev_b2c3ffbaf5" className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div data-ev-id="ev_684f36ef70" className="w-full md:w-1/2">
                <h3 data-ev-id="ev_3a1890475b" className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {t.landing.feature2Title}
                </h3>
                <p data-ev-id="ev_d484f051d3" className="text-muted-foreground text-pretty">
                  {t.landing.feature2Body}
                </p>
              </div>
              <div data-ev-id="ev_d0547cb23e" className="w-full md:w-1/2">
                <LightboxImage
                  src={`${IMG_BASE}/scorm-player.webp`}
                  alt={locale === 'he' ? 'נגן SCORM' : 'SCORM player'}
                  width={600}
                  height={400}
                  caption={t.landing.feature2Body} />

              </div>
            </div>

            {/* Feature 3 */}
            <div data-ev-id="ev_6aae00fdfc" className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div data-ev-id="ev_c1d619da42" className="w-full md:w-1/2 order-2 md:order-1">
                <LightboxImage
                  src={`${IMG_BASE}/hr-analytics.webp`}
                  alt={locale === 'he' ? 'לוח בקרה HR' : 'HR Analytics dashboard'}
                  width={600}
                  height={400}
                  caption={t.landing.feature3Body} />

              </div>
              <div data-ev-id="ev_ad978ed92d" className="w-full md:w-1/2 order-1 md:order-2">
                <h3 data-ev-id="ev_303e689c30" className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {t.landing.feature3Title}
                </h3>
                <p data-ev-id="ev_751cb43905" className="text-muted-foreground text-pretty">
                  {t.landing.feature3Body}
                </p>
              </div>
            </div>
          </section>

          {/* SECONDARY PAIR */}
          <section data-ev-id="ev_54dc3a03e9" className="px-4 pb-16 md:pb-24 max-w-6xl mx-auto">
            <div data-ev-id="ev_60e7aa0f16" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div data-ev-id="ev_3061b87568">
                <LightboxImage
                  src={`${IMG_BASE}/content-studio.webp`}
                  alt={locale === 'he' ? 'סטודיו יצירת תוכן' : 'Content studio'}
                  width={600}
                  height={400}
                  caption={t.landing.secondary1Caption}
                  className="mb-4" />

                <p data-ev-id="ev_4876e6e22e" className="text-muted-foreground text-sm">
                  {t.landing.secondary1Caption}
                </p>
              </div>
              <div data-ev-id="ev_eee086d1eb">
                <LightboxImage
                  src={`${IMG_BASE}/assign-course.webp`}
                  alt={locale === 'he' ? 'שיבוץ קורס לצוות' : 'Assign course to team'}
                  width={600}
                  height={400}
                  caption={t.landing.secondary2Caption}
                  className="mb-4" />

                <p data-ev-id="ev_fe7a64d179" className="text-muted-foreground text-sm">
                  {t.landing.secondary2Caption}
                </p>
              </div>
            </div>
          </section>

          {/* ROADMAP STRIP */}
          <section data-ev-id="ev_cdb1705a9e" className="px-4 pb-16 md:pb-24 max-w-4xl mx-auto text-center">
            <p data-ev-id="ev_02ea897319" className="text-sm text-muted-foreground mb-4">{t.landing.roadmapLabel}</p>
            <div data-ev-id="ev_65e7e00ce7" className="flex flex-wrap items-center justify-center gap-3">
              {[t.landing.roadmap1, t.landing.roadmap2, t.landing.roadmap3, t.landing.roadmap4].map((item, i) =>
              <span data-ev-id="ev_fd4831b1ae"
              key={i}
              className="px-4 py-2 border border-border rounded-full text-sm text-foreground">

                  {item}
                </span>
              )}
            </div>
          </section>

          {/* CTA BAND */}
          <section data-ev-id="ev_f1807df955" className="px-4 pb-16 md:pb-24 max-w-4xl mx-auto text-center">
            <h2 data-ev-id="ev_5997449da9" className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t.landing.ctaTitle}
            </h2>
            <p data-ev-id="ev_61e5ec5fc6" className="text-muted-foreground mb-8 max-w-xl mx-auto text-pretty">
              {t.landing.ctaSub}
            </p>
            <div data-ev-id="ev_df98935ce8" className="flex flex-col sm:flex-row gap-4 justify-center">
              <a data-ev-id="ev_ca3447dbe9"
              href="mailto:hello@vibe-coding4elearning.com"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors focus-ring inline-flex items-center justify-center gap-2">

                <Mail className="w-4 h-4" />
                {t.landing.talkToUs}
              </a>
              <Link
                to="/auth/login"
                className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors focus-ring">

                {t.auth.login}
              </Link>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer data-ev-id="ev_29517d74b9" className="px-4 py-8 border-t border-border">
          <div data-ev-id="ev_e1d1c4d784" className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
            <p data-ev-id="ev_4444ae5dc0" className="mb-2">{t.landing.footerText}</p>
            <a data-ev-id="ev_6923574a26"
            href="mailto:hello@vibe-coding4elearning.com"
            className="text-primary hover:underline">

              hello@vibe-coding4elearning.com
            </a>
          </div>
        </footer>
      </div>);

  }

  // Dashboard for authenticated users
  return (
    <AppShell>
      <div data-ev-id="ev_64d14baea9">
        {/* Welcome header */}
        <div data-ev-id="ev_d9fb160a17" className="mb-8">
          <h1 data-ev-id="ev_e70df0f461" className="text-2xl font-bold text-foreground mb-2">
            {profile?.full_name ?
            `${t.dashboard.welcome}, ${profile.full_name}` :
            t.dashboard.welcome}
          </h1>
          <p data-ev-id="ev_2e97c27e8f" className="text-foreground-muted">
            {t.roles[userRole]}
          </p>
        </div>

        {/* Continue where you left off */}
        {enrollmentsLoading ?
        <div data-ev-id="ev_f61b903ad3" className="mb-8">
            <div data-ev-id="ev_0062a497c0" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_6e1b9f9409" className="text-lg font-semibold text-foreground flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                {t.dashboard.continueLearning}
              </h2>
            </div>
            <LoadingSkeleton variant="card" count={1} />
          </div> :
        continueEnrollment ?
        <div data-ev-id="ev_b55a89b60d" className="mb-8">
            <div data-ev-id="ev_e659724564" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_e5c01b1cf9" className="text-lg font-semibold text-foreground flex items-center gap-2">
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

              <div data-ev-id="ev_208155eddf" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-xl" />
              <div data-ev-id="ev_9cb8e5823c" className="flex items-center gap-4">
                <div data-ev-id="ev_3606c3da4c" className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-7 h-7 text-primary" />
                </div>
                <div data-ev-id="ev_14d6f12d92" className="flex-1 min-w-0">
                  <p data-ev-id="ev_0624162e51" className="text-sm text-muted-foreground mb-1">
                    {t.dashboard.continueWhereLeft}
                  </p>
                  <h3 data-ev-id="ev_f3a3039aae" className="font-semibold text-foreground truncate text-lg">
                    {getEnrollmentTitle(continueEnrollment)}
                  </h3>
                  <div data-ev-id="ev_1de4f15b05" className="mt-3 max-w-md">
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
        <div data-ev-id="ev_6028e09144" className="mb-8">
            <div data-ev-id="ev_badb3a865a" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_4e6f08fd1f" className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t.dashboard.newInCatalogue}
              </h2>
            </div>
            <div data-ev-id="ev_9143803c81" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <LoadingSkeleton variant="card" count={3} />
            </div>
          </div> :
        newCourses.length > 0 ?
        <div data-ev-id="ev_1d7bba364d" className="mb-8">
            <div data-ev-id="ev_347ff442ca" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_10fd03214c" className="text-lg font-semibold text-foreground flex items-center gap-2">
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
            <div data-ev-id="ev_f39d70afec" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {newCourses.map((course) =>
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-md">

                  {/* Thumbnail */}
                  <div data-ev-id="ev_70b5435e56" className="aspect-video bg-muted relative overflow-hidden">
                    {course.thumbnail_url ?
                <img data-ev-id="ev_114934c338"
                src={course.thumbnail_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> :


                <div data-ev-id="ev_c9b40bc61b" className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/40" />
                      </div>
                }
                  </div>
                  {/* Content */}
                  <div data-ev-id="ev_383310068b" className="p-4">
                    <h3 data-ev-id="ev_ee99450c2d" className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {getCourseTitle(course)}
                    </h3>
                    {course.estimated_minutes &&
                <p data-ev-id="ev_6ceba4d3d3" className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
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
        <div data-ev-id="ev_a5fcc18e61" className="mb-4">
          <h2 data-ev-id="ev_75b6ab4637" className="text-lg font-semibold text-foreground">
            {t.common.actions}
          </h2>
        </div>
        <div data-ev-id="ev_a4c5ca02bd" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <button data-ev-id="ev_a84b0b7082"
              key={action.path}
              onClick={() => navigate(action.path)}
              className={
              `relative flex items-start gap-4 p-5 rounded-xl ` +
              `bg-card border border-card-border text-start ` +
              `card-interactive focus-ring overflow-hidden`
              }>

                <div data-ev-id="ev_a1d5acdc44" className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div data-ev-id="ev_8046023a10" className="flex-1 min-w-0">
                  <h3 data-ev-id="ev_23d4ec94d0" className="font-semibold text-foreground mb-1">
                    {t.nav[action.titleKey]}
                  </h3>
                  <p data-ev-id="ev_a8aa47514d" className="text-sm text-foreground-muted line-clamp-2">
                    {t[action.descriptionSection].description}
                  </p>
                </div>
                <ChevronForward className="flex-shrink-0 w-5 h-5 text-foreground-subtle self-center" />
              </button>);

          })}
        </div>
      </div>
    </AppShell>);

}