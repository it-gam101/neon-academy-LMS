import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { AppShell } from '@/components/layout/AppShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
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

  // Marketing landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div data-ev-id="ev_334e120bad" className="min-h-screen bg-background bg-grid-texture flex flex-col">
        {/* Landing header */}
        <header data-ev-id="ev_0b040c68e7" className="p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div data-ev-id="ev_5eeaf0f6b4" className="flex items-center gap-3">
            <img data-ev-id="ev_58b7e7f97d" src={logoSrc} alt={t.appName} className="w-10 h-10 rounded-xl" />
            <span data-ev-id="ev_5ca41be1c2" className="text-lg font-semibold text-foreground hidden sm:block">{t.appName}</span>
          </div>
          <LanguageToggle />
        </header>

        <main data-ev-id="ev_824c990f98" className="flex-1">
          {/* HERO */}
          <section data-ev-id="ev_c4bf410d9b" className="px-4 py-16 md:py-24 text-center max-w-4xl mx-auto">
            <img data-ev-id="ev_259550fc5f"
            src={logoSrc}
            alt={t.appName}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl mx-auto mb-8" />

            <h1 data-ev-id="ev_5ba3837e1e" className="text-3xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              {t.landing.heroTitle}
            </h1>
            <p data-ev-id="ev_e73a997ae1" className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">אקדמיית ניאון היא מערכת ניהול למידה מודרנית לצוותים שלומדים בעברית ובאנגלית - קורסים, בחנים, תוכן SCORM, שיבוצי הדרכה אישיים וצוותיים, דוחות התקדמות, הכול בפלטפורמה אחת נקייה ומהירה

            </p>
            
            {/* Buttons */}
            <div data-ev-id="ev_8bf165e72f" className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                to="/auth/login"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors focus-ring">

                {t.auth.login}
              </Link>
              <a data-ev-id="ev_c34c85838b"
              href="mailto:hello@vibe-coding4elearning.com"
              className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors focus-ring inline-flex items-center justify-center gap-2">

                <Mail className="w-4 h-4" />
                {t.landing.talkToUs}
              </a>
            </div>
            
            {/* Trust strip */}
            <div data-ev-id="ev_18c0bcfb36" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span data-ev-id="ev_c19d7b6832">{t.landing.trust1}</span>
              <span data-ev-id="ev_715fafe8a8" className="text-border">•</span>
              <span data-ev-id="ev_0b33d802a3">{t.landing.trust2}</span>
              <span data-ev-id="ev_de5d5cd722" className="text-border">•</span>
              <span data-ev-id="ev_b3a219c20c">{t.landing.trust3}</span>
            </div>
          </section>

          {/* SHOWCASE */}
          <section data-ev-id="ev_d37668b3d7" className="px-4 pb-16 md:pb-24 max-w-6xl mx-auto">
            <div data-ev-id="ev_f69866a0b4" className="border border-border rounded-xl overflow-hidden bg-card">
              <img data-ev-id="ev_2a4b2e75d8"
              src={`${IMG_BASE}/catalogue.webp`}
              alt={locale === 'he' ? 'קטלוג קורסים' : 'Course catalogue'}
              width={1200}
              height={675}
              loading="lazy"
              className="w-full h-auto" />

            </div>
            <p data-ev-id="ev_620dab9875" className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t.landing.showcaseCaption}
            </p>
          </section>

          {/* FEATURE BLOCKS */}
          <section data-ev-id="ev_711616a136" className="px-4 pb-16 md:pb-24 max-w-6xl mx-auto flex flex-col gap-16 md:gap-24">
            {/* Feature 1 */}
            <div data-ev-id="ev_979144d1f6" className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div data-ev-id="ev_1bdfd42221" className="w-full md:w-1/2 order-2 md:order-1">
                <div data-ev-id="ev_c36d90c335" className="border border-border rounded-xl overflow-hidden bg-card">
                  <img data-ev-id="ev_2800e1a983"
                  src={`${IMG_BASE}/my-learning-he.webp`}
                  alt={locale === 'he' ? 'מסך הלמידה שלי' : 'My Learning screen'}
                  width={600}
                  height={400}
                  loading="lazy"
                  className="w-full h-auto" />

                </div>
              </div>
              <div data-ev-id="ev_1bf1307331" className="w-full md:w-1/2 order-1 md:order-2">
                <h3 data-ev-id="ev_f8d1c7eebe" className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {t.landing.feature1Title}
                </h3>
                <p data-ev-id="ev_c98953e1b9" className="text-muted-foreground text-pretty">כל מסך, קורס ודוח קיימים בעברית ובאנגלית - עם שיקוף מלא מימין לשמאל, לא תרגום מתוח. לחיצה אחת מחליפה את כל החוויה, וכל עובד לומד בשפה שבה הוא חושב.

                </p>
              </div>
            </div>

            {/* Feature 2 - reversed */}
            <div data-ev-id="ev_f517c08842" className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div data-ev-id="ev_d0af2ecfd5" className="w-full md:w-1/2">
                <h3 data-ev-id="ev_1484255bfe" className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {t.landing.feature2Title}
                </h3>
                <p data-ev-id="ev_37d1c3312c" className="text-muted-foreground text-pretty">
                  {t.landing.feature2Body}
                </p>
              </div>
              <div data-ev-id="ev_665cf35951" className="w-full md:w-1/2">
                <div data-ev-id="ev_af15386c94" className="border border-border rounded-xl overflow-hidden bg-card">
                  <img data-ev-id="ev_f3ca80c932"
                  src={`${IMG_BASE}/scorm-player.webp`}
                  alt={locale === 'he' ? 'נגן SCORM' : 'SCORM player'}
                  width={600}
                  height={400}
                  loading="lazy"
                  className="w-full h-auto" />

                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div data-ev-id="ev_f8ff3806d6" className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div data-ev-id="ev_ec164ac5a5" className="w-full md:w-1/2 order-2 md:order-1">
                <div data-ev-id="ev_fbcab4760c" className="border border-border rounded-xl overflow-hidden bg-card">
                  <img data-ev-id="ev_22cb916c3e"
                  src={`${IMG_BASE}/hr-analytics.webp`}
                  alt={locale === 'he' ? 'לוח בקרה HR' : 'HR Analytics dashboard'}
                  width={600}
                  height={400}
                  loading="lazy"
                  className="w-full h-auto" />

                </div>
              </div>
              <div data-ev-id="ev_f0512ebe03" className="w-full md:w-1/2 order-1 md:order-2">
                <h3 data-ev-id="ev_21790cff03" className="text-xl md:text-2xl font-bold text-foreground mb-4">מענה לדרישות ציות עוד לפני שנשאלתם.

                </h3>
                <p data-ev-id="ev_1574a21ed5" className="text-muted-foreground text-pretty">לוחות בקרה חיים למשאבי אנוש: שיעורי השלמה, הדרכות חובה באיחור, מעורבות לפי קורס - עם ייצוא CSV בלחיצה ותמונות-מצב שמורות. מנהלים רואים את הצוות שלהם, משאבי אנוש רואים את התמונה המלאה, והכול נאכף ברמת בסיס הנתונים.

                </p>
              </div>
            </div>
          </section>

          {/* SECONDARY PAIR */}
          <section data-ev-id="ev_00c5bc23cf" className="px-4 pb-16 md:pb-24 max-w-6xl mx-auto">
            <div data-ev-id="ev_ab1346f44f" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div data-ev-id="ev_b3dee149af">
                <div data-ev-id="ev_d3a49fe8b8" className="border border-border rounded-xl overflow-hidden bg-card mb-4">
                  <img data-ev-id="ev_c94b03b92a"
                  src={`${IMG_BASE}/content-studio.webp`}
                  alt={locale === 'he' ? 'סטודיו יצירת תוכן' : 'Content studio'}
                  width={600}
                  height={400}
                  loading="lazy"
                  className="w-full h-auto" />

                </div>
                <p data-ev-id="ev_02254bbf95" className="text-muted-foreground text-sm">
                  {t.landing.secondary1Caption}
                </p>
              </div>
              <div data-ev-id="ev_ad1b83c450">
                <div data-ev-id="ev_81db43d7de" className="border border-border rounded-xl overflow-hidden bg-card mb-4">
                  <img data-ev-id="ev_a271136a1e"
                  src={`${IMG_BASE}/assign-course.webp`}
                  alt={locale === 'he' ? 'שיבוץ קורס לצוות' : 'Assign course to team'}
                  width={600}
                  height={400}
                  loading="lazy"
                  className="w-full h-auto" />

                </div>
                <p data-ev-id="ev_cb38462093" className="text-muted-foreground text-sm">
                  {t.landing.secondary2Caption}
                </p>
              </div>
            </div>
          </section>

          {/* ROADMAP STRIP */}
          <section data-ev-id="ev_16b5c7563d" className="px-4 pb-16 md:pb-24 max-w-4xl mx-auto text-center">
            <p data-ev-id="ev_2d254332c3" className="text-sm text-muted-foreground mb-4">{t.landing.roadmapLabel}</p>
            <div data-ev-id="ev_0e94c82cf7" className="flex flex-wrap items-center justify-center gap-3">
              {[t.landing.roadmap1, t.landing.roadmap2, t.landing.roadmap3, t.landing.roadmap4].map((item, i) =>
              <span data-ev-id="ev_4b5aa7b573"
              key={i}
              className="px-4 py-2 border border-border rounded-full text-sm text-foreground">

                  {item}
                </span>
              )}
            </div>
          </section>

          {/* CTA BAND */}
          <section data-ev-id="ev_10e798b4a6" className="px-4 pb-16 md:pb-24 max-w-4xl mx-auto text-center">
            <h2 data-ev-id="ev_9677751dcf" className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t.landing.ctaTitle}
            </h2>
            <p data-ev-id="ev_a732e2d263" className="text-muted-foreground mb-8 max-w-xl mx-auto text-pretty">נלווה אתכם בסיור באקדמיית ניאון עם הקורסים והמבנה הארגוני שלכם - בעברית, באנגלית, או בשתיהן.

            </p>
            <div data-ev-id="ev_bea6c921c4" className="flex flex-col sm:flex-row gap-4 justify-center">
              <a data-ev-id="ev_25a3881c1c"
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
        <footer data-ev-id="ev_7f7048d714" className="px-4 py-8 border-t border-border">
          <div data-ev-id="ev_645647b9e9" className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
            <p data-ev-id="ev_f9ad68f8e0" className="mb-2">{t.landing.footerText}</p>
            <a data-ev-id="ev_e4327c96c7"
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
      <div data-ev-id="ev_f7236bbd48">
        {/* Welcome header */}
        <div data-ev-id="ev_f198850d8d" className="mb-8">
          <h1 data-ev-id="ev_00ed4b2bf9" className="text-2xl font-bold text-foreground mb-2">
            {profile?.full_name ?
            `${t.dashboard.welcome}, ${profile.full_name}` :
            t.dashboard.welcome}
          </h1>
          <p data-ev-id="ev_71d1596ab1" className="text-foreground-muted">
            {t.roles[userRole]}
          </p>
        </div>

        {/* Continue where you left off */}
        {enrollmentsLoading ?
        <div data-ev-id="ev_14080067f9" className="mb-8">
            <div data-ev-id="ev_e17c47e076" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_596c59ec4e" className="text-lg font-semibold text-foreground flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                {t.dashboard.continueLearning}
              </h2>
            </div>
            <LoadingSkeleton variant="card" count={1} />
          </div> :
        continueEnrollment ?
        <div data-ev-id="ev_e5f31385d4" className="mb-8">
            <div data-ev-id="ev_d64016c346" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_962868efd8" className="text-lg font-semibold text-foreground flex items-center gap-2">
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

              <div data-ev-id="ev_629b362813" className="absolute inset-block-start-0 inset-block-end-0 inset-inline-start-0 w-1 bg-transparent group-hover:bg-primary transition-colors rounded-s-xl" />
              <div data-ev-id="ev_208155eddf" className="flex items-center gap-4">
                <div data-ev-id="ev_d7febe917e" className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-7 h-7 text-primary" />
                </div>
                <div data-ev-id="ev_9fd27194dd" className="flex-1 min-w-0">
                  <p data-ev-id="ev_10d34d6371" className="text-sm text-muted-foreground mb-1">
                    {t.dashboard.continueWhereLeft}
                  </p>
                  <h3 data-ev-id="ev_48c9e216d4" className="font-semibold text-foreground truncate text-lg">
                    {getEnrollmentTitle(continueEnrollment)}
                  </h3>
                  <div data-ev-id="ev_81c5a757f7" className="mt-3 max-w-md">
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
        <div data-ev-id="ev_031f1f8e60" className="mb-8">
            <div data-ev-id="ev_25964c7869" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_acd14b41f1" className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t.dashboard.newInCatalogue}
              </h2>
            </div>
            <div data-ev-id="ev_e568574b06" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <LoadingSkeleton variant="card" count={3} />
            </div>
          </div> :
        newCourses.length > 0 ?
        <div data-ev-id="ev_30d1340e3a" className="mb-8">
            <div data-ev-id="ev_f3bed35cf5" className="flex items-center justify-between mb-4">
              <h2 data-ev-id="ev_2c7cdbc304" className="text-lg font-semibold text-foreground flex items-center gap-2">
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
            <div data-ev-id="ev_729dc845aa" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {newCourses.map((course) =>
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-md">

                  {/* Thumbnail */}
                  <div data-ev-id="ev_00bc01a431" className="aspect-video bg-muted relative overflow-hidden">
                    {course.thumbnail_url ?
                <img data-ev-id="ev_41c04aea97"
                src={course.thumbnail_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> :


                <div data-ev-id="ev_0547bb24eb" className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/40" />
                      </div>
                }
                  </div>
                  {/* Content */}
                  <div data-ev-id="ev_34d3a2abeb" className="p-4">
                    <h3 data-ev-id="ev_c596b2ceb6" className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {getCourseTitle(course)}
                    </h3>
                    {course.estimated_minutes &&
                <p data-ev-id="ev_31d6a2a035" className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
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
        <div data-ev-id="ev_c442acb604" className="mb-4">
          <h2 data-ev-id="ev_b85b037cb2" className="text-lg font-semibold text-foreground">
            {t.common.actions}
          </h2>
        </div>
        <div data-ev-id="ev_a724a9cd52" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <button data-ev-id="ev_8a8868109d"
              key={action.path}
              onClick={() => navigate(action.path)}
              className={
              `relative flex items-start gap-4 p-5 rounded-xl ` +
              `bg-card border border-card-border text-start ` +
              `card-interactive focus-ring overflow-hidden`
              }>

                <div data-ev-id="ev_3a204c534c" className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div data-ev-id="ev_c7e98e8829" className="flex-1 min-w-0">
                  <h3 data-ev-id="ev_b478c1f429" className="font-semibold text-foreground mb-1">
                    {t.nav[action.titleKey]}
                  </h3>
                  <p data-ev-id="ev_a678a8ff3b" className="text-sm text-foreground-muted line-clamp-2">
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