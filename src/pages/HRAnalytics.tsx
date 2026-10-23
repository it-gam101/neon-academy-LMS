import { useState, useEffect } from 'react';
import { useLatest } from '@/hooks/useLatest';
import { BarChart3, Users, AlertTriangle, TrendingUp, Save } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { errorMessage } from '@/lib/errorText';
import { ReportTable } from '@/components/hr/ReportTable';
import { SavedSnapshots } from '@/components/hr/SavedSnapshots';
import type { ReportRow, ReportType } from '@/lib/reports';

interface KPIs {
  completionRate: number;
  overdueCount: number;
  activeLearners: number;
  topCourses: {id: string;title_en: string;title_he: string;enrollments: number;}[];
}

interface ReportData {
  type: ReportType;
  rows: ReportRow[];
}

export default function HRAnalytics() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const dictRef = useLatest(dict);
  const { user } = useAuth();

  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  // Dispatch 4b: one snapshot per click — a double-click saved two.
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  // Dispatch H1: bumped after each saved snapshot, so the Saved snapshots list shows it without a reload.
  const [snapshotsVersion, setSnapshotsVersion] = useState(0);

  useEffect(() => {
    if (!supabase) return;

    const fetchKPIs = async () => {
      // Dispatch 6: read the dictionary through the ref, so a language switch does not re-run this load.
      const dict = dictRef.current;
      setLoading(true);

      try {
        // Fetch all enrollments for KPIs
        const { data: enrollments, error: enrollError } = await withTimeout(
          supabase.
          from('enrollments').
          select(`
						*,
						course:courses(id, title_en, title_he)
					`),
          10000
        );

        if (enrollError) throw enrollError;

        if (enrollments) {
          const total = enrollments.length;
          const completed = enrollments.filter((e) => e.status === 'completed').length;
          // Item 108: a deleted user's kept records (user_id empty) are history: in the rates, never overdue.
          const overdue = enrollments.filter((e) =>
          e.user_id !== null && e.status !== 'completed' && e.due_at && new Date(e.due_at) < new Date()
          ).length;

          // Active learners (any progress in last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: moduleProgress, error: progressError } = await withTimeout(
            supabase.
            from('module_progress').
            select('enrollment:enrollments(user_id)').
            gte('updated_at', thirtyDaysAgo.toISOString()),
            10000
          );
          if (progressError) throw progressError;

          const activeUserIds = new Set(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (moduleProgress || []).map((mp: any) => mp.enrollment?.user_id).filter(Boolean)
          );

          // Top courses by enrollment
          // Dispatch 6: keep both titles; the language is chosen when the card is drawn, so a switch needs no reload.
          const courseEnrollments: Record<string, {title_en: string;title_he: string;count: number;}> = {};
          enrollments.forEach((e) => {
            if (e.course) {
              if (!courseEnrollments[e.course.id]) {
                courseEnrollments[e.course.id] = { title_en: e.course.title_en, title_he: e.course.title_he, count: 0 };
              }
              courseEnrollments[e.course.id].count++;
            }
          });

          const topCourses = Object.entries(courseEnrollments).
          map(([id, { title_en, title_he, count }]) => ({ id, title_en, title_he, enrollments: count })).
          sort((a, b) => b.enrollments - a.enrollments).
          slice(0, 5);

          setKpis({
            completionRate: total > 0 ? Math.round(completed / total * 100) : 0,
            overdueCount: overdue,
            activeLearners: activeUserIds.size,
            topCourses
          });
        }
      } catch (err) {
        const msg = errorMessage(err, dict.common.error);
        console.error('fetchKPIs failed:', err);
        showToast('error', msg);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [dictRef]);

  // Item 122: the report on screen is marked — the house style's leading-edge accent (inline-start, so the right
  // in Hebrew), which also shows on hover and keyboard focus.
  const reportCardClass = (type: ReportType) =>
  `group relative overflow-hidden p-4 bg-card border rounded-lg text-start transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:opacity-50 ${
  reportData?.type === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`;
  const reportAccentClass = (type: ReportType) =>
  `pointer-events-none absolute inset-y-0 start-0 w-1 transition-colors ${
  reportData?.type === type ? 'bg-primary' : 'bg-transparent group-hover:bg-primary group-focus-visible:bg-primary'}`;

  const generateReport = async (type: 'completion' | 'compliance' | 'engagement') => {
    if (!supabase) return;
    setGeneratingReport(true);

    try {
      if (type === 'completion') {
        const { data: enrollments, error: enrollmentsError } = await supabase.
        from('enrollments').
        select('*, course:courses(id, title_en, title_he)');
        if (enrollmentsError) throw enrollmentsError;

        const courseStats: Record<string, {
          title_en: string;
          title_he: string;
          enrolled: number;
          completed: number;
          overdue: number;
        }> = {};

        (enrollments || []).forEach((e) => {
          if (!e.course) return;
          const id = e.course.id;
          if (!courseStats[id]) {
            courseStats[id] = {
              // Dispatch H1 (R1): both titles; the table and the CSV choose the language when drawn.
              title_en: e.course.title_en,
              title_he: e.course.title_he,
              enrolled: 0,
              completed: 0,
              overdue: 0
            };
          }
          courseStats[id].enrolled++;
          if (e.status === 'completed') courseStats[id].completed++;
          if (e.user_id !== null && e.status !== 'completed' && e.due_at && new Date(e.due_at) < new Date()) {
            courseStats[id].overdue++;
          }
        });

        setReportData({
          type: 'completion',
          rows: Object.values(courseStats).map((s) => ({
            ...s,
            rate: s.enrolled > 0 ? Math.round(s.completed / s.enrolled * 100) : 0
          }))
        });
      } else if (type === 'compliance') {
        const { data: enrollments, error: enrollmentsError } = await supabase.
        from('enrollments').
        select(`
						*,
						course:courses!inner(id, title_en, title_he, is_mandatory),
						user:profiles!enrollments_user_id_fkey(department)
					`).
        eq('courses.is_mandatory', true);
        if (enrollmentsError) throw enrollmentsError;

        const deptStats: Record<string, {
          department: string | null;
          enrolled: number;
          completed: number;
          overdue: number;
        }> = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (enrollments || []).forEach((e: any) => {
          // Item 108: Compliance measures today's staff, so a deleted user's kept records (user_id empty) are left out.
          if (e.user_id === null) return;
          // Dispatch H1 (R1): "no department" is null here and worded when drawn, in the reader's language.
          const department: string | null = e.user?.department || null;
          const dept = department ?? '';
          if (!deptStats[dept]) {
            deptStats[dept] = { department, enrolled: 0, completed: 0, overdue: 0 };
          }
          deptStats[dept].enrolled++;
          if (e.status === 'completed') deptStats[dept].completed++;
          if (e.status !== 'completed' && e.due_at && new Date(e.due_at) < new Date()) {
            deptStats[dept].overdue++;
          }
        });

        setReportData({
          type: 'compliance',
          rows: Object.values(deptStats).map((s) => ({
            ...s,
            rate: s.enrolled > 0 ? Math.round(s.completed / s.enrolled * 100) : 0
          }))
        });
      } else {
        // Engagement report
        const { data: courses, error: coursesError } = await supabase.
        from('courses').
        select('id, title_en, title_he').
        eq('status', 'published');

        const { data: moduleProgress, error: progressError } = await supabase.
        from('module_progress').
        select(`
						score,
						time_spent_seconds,
						module:modules(course_id)
					`);

        const { data: quizAttempts, error: attemptsError } = await supabase.
        from('quiz_attempts').
        select(`
						score,
						user_id,
						quiz:quizzes(module:modules(course_id))
					`);

        const engagementError = coursesError || progressError || attemptsError;
        if (engagementError) throw engagementError;

        const courseEngagement: Record<string, {
          title_en: string;
          title_he: string;
          scores: number[];
          times: number[];
          attempts: number;
          learners: Set<string>;
        }> = {};

        (courses || []).forEach((c) => {
          courseEngagement[c.id] = {
            title_en: c.title_en,
            title_he: c.title_he,
            scores: [],
            times: [],
            attempts: 0,
            learners: new Set<string>()
          };
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (moduleProgress || []).forEach((mp: any) => {
          const courseId = mp.module?.course_id;
          if (courseId && courseEngagement[courseId]) {
            if (mp.score !== null) courseEngagement[courseId].scores.push(mp.score);
            if (mp.time_spent_seconds) courseEngagement[courseId].times.push(mp.time_spent_seconds);
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (quizAttempts || []).forEach((qa: any) => {
          const courseId = qa.quiz?.module?.course_id;
          if (courseId && courseEngagement[courseId]) {
            courseEngagement[courseId].attempts++;
            if (qa.user_id) courseEngagement[courseId].learners.add(qa.user_id);
          }
        });

        setReportData({
          type: 'engagement',
          rows: Object.values(courseEngagement).map((c) => ({
            title_en: c.title_en,
            title_he: c.title_he,
            avgScore: c.scores.length > 0 ?
            Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length) :
            null,
            avgTime: c.times.length > 0 ?
            Math.round(c.times.reduce((a, b) => a + b, 0) / c.times.length / 60) :
            null,
            // Dispatch H1 (R4): attempts ÷ the learners who attempted, to one decimal; null (shown "-") when nobody has.
            avgAttempts: c.learners.size > 0 ? Math.round(c.attempts / c.learners.size * 10) / 10 : null
          }))
        });
      }
    } catch (err) {
      console.error('generateReport failed:', err);
      setReportData(null);
      showToast('error', errorMessage(err, dict.common.error));
    }

    setGeneratingReport(false);
  };

  const saveSnapshot = async () => {
    if (!supabase || !reportData) return;

    if (!user || savingSnapshot) return;
    setSavingSnapshot(true);
    try {
      const { error } = await withTimeout(
        supabase.from('report_snapshots').insert({
          report_type: reportData.type,
          params: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: reportData.rows as any,
          generated_by: user.id
        }),
        10000
      );

      if (error) {
        showToast('error', error.message);
      } else {
        showToast('success', dict.hrAnalytics.snapshotSaved);
        setSnapshotsVersion((v) => v + 1);
      }
    } catch (err) {
      console.error('saveSnapshot failed:', err);
      showToast('error', errorMessage(err, dict.common.error));
    } finally {
      setSavingSnapshot(false);
    }
  };

  const tabs = [
  { id: 'overview', label: dict.hrAnalytics.overview },
  { id: 'reports', label: dict.hrAnalytics.reports }];


  if (loading) {
    return (
      <div data-ev-id="ev_a8efb950bf" className="max-w-6xl mx-auto">
				<LoadingSkeleton variant="card" count={4} />
			</div>);
  }

  return (
    <div data-ev-id="ev_0792db8bf0">
			<div data-ev-id="ev_ea56bb1240" className="max-w-6xl mx-auto">
				{/* Header */}
				<div data-ev-id="ev_02aabed4dd" className="mb-8">
					<h1 data-ev-id="ev_176b256d88" className="text-3xl font-bold text-foreground mb-2">{dict.hrAnalytics.title}</h1>
					<p data-ev-id="ev_0986a5ee77" className="text-muted-foreground">{dict.hrAnalytics.description}</p>
				</div>

				<Tabs tabs={tabs}>
					{(activeTab) => {
            if (activeTab === 'overview') {
              return (
                <div data-ev-id="ev_16366a8b9b" className="space-y-8">
									{/* KPI Cards */}
									<div data-ev-id="ev_cdbf87b007" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
										<div data-ev-id="ev_c4b7ba69a4" className="bg-card border border-border rounded-lg p-6">
											<div data-ev-id="ev_213ef6f417" className="flex items-center gap-3 mb-2">
												<div data-ev-id="ev_7a148011ae" className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
													<BarChart3 className="w-5 h-5 text-primary" />
												</div>
												<span data-ev-id="ev_2eb5144017" className="text-sm text-muted-foreground">{dict.hrAnalytics.completionRate}</span>
											</div>
											<p data-ev-id="ev_e08b98fca3" className="text-3xl font-bold text-foreground">{kpis?.completionRate || 0}%</p>
										</div>

										<div data-ev-id="ev_e475dceac5" className="bg-card border border-border rounded-lg p-6">
											<div data-ev-id="ev_91760a4538" className="flex items-center gap-3 mb-2">
												<div data-ev-id="ev_e36592f18a" className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
													<AlertTriangle className="w-5 h-5 text-destructive" />
												</div>
												<span data-ev-id="ev_9a1d035a51" className="text-sm text-muted-foreground">{dict.hrAnalytics.overdueCount}</span>
											</div>
											<p data-ev-id="ev_c0113fbaff" className="text-3xl font-bold text-foreground">{kpis?.overdueCount || 0}</p>
										</div>

										<div data-ev-id="ev_86c16388c6" className="bg-card border border-border rounded-lg p-6">
											<div data-ev-id="ev_72eec979d9" className="flex items-center gap-3 mb-2">
												<div data-ev-id="ev_3c5ca466ee" className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
													<Users className="w-5 h-5 text-blue-500" />
												</div>
												<span data-ev-id="ev_03ac34a562" className="text-sm text-muted-foreground">{dict.hrAnalytics.activeLearners}</span>
											</div>
											<p data-ev-id="ev_40e8f0830a" className="text-3xl font-bold text-foreground">{kpis?.activeLearners || 0}</p>
											<p data-ev-id="ev_9c33923a40" className="text-xs text-muted-foreground mt-1">{dict.hrAnalytics.last30Days}</p>
										</div>

										<div data-ev-id="ev_3246cfdc92" className="bg-card border border-border rounded-lg p-6">
											<div data-ev-id="ev_dc6ff87201" className="flex items-center gap-3 mb-2">
												<div data-ev-id="ev_86725aa878" className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
													<TrendingUp className="w-5 h-5 text-purple-500" />
												</div>
												<span data-ev-id="ev_0f00ec06df" className="text-sm text-muted-foreground">{dict.hrAnalytics.topCourses}</span>
											</div>
											<div data-ev-id="ev_43b66e7b98" className="space-y-1">
												{kpis?.topCourses.slice(0, 3).map((course, i) =>
                        <div data-ev-id="ev_f60cbb7067" key={course.id} className="flex items-center justify-between text-sm">
														<span data-ev-id="ev_2c56f42817" className="truncate text-muted-foreground">{i + 1}. {locale === 'he' ? course.title_he : course.title_en}</span>
														<Badge variant="purple">{course.enrollments}</Badge>
													</div>
                        )}
											</div>
										</div>
									</div>
								</div>);

            }

            // Reports tab
            return (
              <div data-ev-id="ev_84dce787d3" className="space-y-6">
								{/* Report buttons */}
								<div data-ev-id="ev_47fe116fef" className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<button data-ev-id="ev_a8b63bfbae"
                  onClick={() => generateReport('completion')}
                  disabled={generatingReport}
                  aria-pressed={reportData?.type === 'completion'}
                  className={reportCardClass('completion')}>
										<span data-ev-id="ev_report_accent_completion" aria-hidden="true" className={reportAccentClass('completion')} />

										<h3 data-ev-id="ev_ae2d165069" className="font-medium text-foreground mb-1">{dict.hrAnalytics.completionSummary}</h3>
										<p data-ev-id="ev_e5515a1cc3" className="text-sm text-muted-foreground">{dict.hrAnalytics.completionSummaryDesc}</p>
									</button>

									<button data-ev-id="ev_c4b1643432"
                  onClick={() => generateReport('compliance')}
                  disabled={generatingReport}
                  aria-pressed={reportData?.type === 'compliance'}
                  className={reportCardClass('compliance')}>
										<span data-ev-id="ev_report_accent_compliance" aria-hidden="true" className={reportAccentClass('compliance')} />

										<h3 data-ev-id="ev_e6bd0fa445" className="font-medium text-foreground mb-1">{dict.hrAnalytics.complianceReport}</h3>
										<p data-ev-id="ev_b902784c57" className="text-sm text-muted-foreground">{dict.hrAnalytics.complianceReportDesc}</p>
									</button>

									<button data-ev-id="ev_b9a60f4f1e"
                  onClick={() => generateReport('engagement')}
                  disabled={generatingReport}
                  aria-pressed={reportData?.type === 'engagement'}
                  className={reportCardClass('engagement')}>
										<span data-ev-id="ev_report_accent_engagement" aria-hidden="true" className={reportAccentClass('engagement')} />

										<h3 data-ev-id="ev_429232c23a" className="font-medium text-foreground mb-1">{dict.hrAnalytics.courseEngagement}</h3>
										<p data-ev-id="ev_ba4c6bb854" className="text-sm text-muted-foreground">{dict.hrAnalytics.courseEngagementDesc}</p>
									</button>
								</div>

								{/* Report table — Dispatch H1: shared with a reopened snapshot; Export CSV writes exactly its columns */}
								{reportData &&
								<ReportTable
								type={reportData.type}
								rows={reportData.rows}
								actions={
								<button data-ev-id="ev_6c6b7f1713"
								onClick={saveSnapshot}
								disabled={savingSnapshot}
								className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
										<Save className="w-4 h-4" />
										{dict.common.saveSnapshot}
									</button>
								} />
								}

								<SavedSnapshots version={snapshotsVersion} />
							</div>);

          }}
				</Tabs>
			</div>
		</div>);

}