import { useState, useEffect } from 'react';
import { BarChart3, Users, AlertTriangle, TrendingUp, Download, Save } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';

interface KPIs {
  completionRate: number;
  overdueCount: number;
  activeLearners: number;
  topCourses: {id: string;title: string;enrollments: number;}[];
}

interface ReportRow {
  title?: string;
  department?: string;
  enrolled?: number;
  completed?: number;
  overdue?: number;
  rate?: number;
  avgScore?: number | null;
  avgTime?: number | null;
  attempts?: number;
}

interface ReportData {
  type: 'completion' | 'compliance' | 'engagement';
  rows: ReportRow[];
}

export default function HRAnalytics() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchKPIs = async () => {
      setLoading(true);

      // Fetch all enrollments for KPIs
      const { data: enrollments } = await supabase.
      from('enrollments').
      select(`
					*,
					course:courses(id, title_en, title_he)
				`);

      if (enrollments) {
        const total = enrollments.length;
        const completed = enrollments.filter((e) => e.status === 'completed').length;
        const overdue = enrollments.filter((e) =>
        e.status !== 'completed' && e.due_at && new Date(e.due_at) < new Date()
        ).length;

        // Active learners (any progress in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: moduleProgress } = await supabase.
        from('module_progress').
        select('enrollment:enrollments(user_id)').
        gte('updated_at', thirtyDaysAgo.toISOString());

        const activeUserIds = new Set(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (moduleProgress || []).map((mp: any) => mp.enrollment?.user_id).filter(Boolean)
        );

        // Top courses by enrollment
        const courseEnrollments: Record<string, {title: string;count: number;}> = {};
        enrollments.forEach((e) => {
          if (e.course) {
            const title = locale === 'he' ? e.course.title_he : e.course.title_en;
            if (!courseEnrollments[e.course.id]) {
              courseEnrollments[e.course.id] = { title, count: 0 };
            }
            courseEnrollments[e.course.id].count++;
          }
        });

        const topCourses = Object.entries(courseEnrollments).
        map(([id, { title, count }]) => ({ id, title, enrollments: count })).
        sort((a, b) => b.enrollments - a.enrollments).
        slice(0, 5);

        setKpis({
          completionRate: total > 0 ? Math.round(completed / total * 100) : 0,
          overdueCount: overdue,
          activeLearners: activeUserIds.size,
          topCourses
        });
      }

      setLoading(false);
    };

    fetchKPIs();
  }, [locale]);

  const generateReport = async (type: 'completion' | 'compliance' | 'engagement') => {
    if (!supabase) return;
    setGeneratingReport(true);

    try {
      if (type === 'completion') {
        const { data: enrollments } = await supabase.
        from('enrollments').
        select('*, course:courses(id, title_en, title_he)');

        const courseStats: Record<string, {
          title: string;
          enrolled: number;
          completed: number;
          overdue: number;
        }> = {};

        (enrollments || []).forEach((e) => {
          if (!e.course) return;
          const id = e.course.id;
          if (!courseStats[id]) {
            courseStats[id] = {
              title: locale === 'he' ? e.course.title_he : e.course.title_en,
              enrolled: 0,
              completed: 0,
              overdue: 0
            };
          }
          courseStats[id].enrolled++;
          if (e.status === 'completed') courseStats[id].completed++;
          if (e.status !== 'completed' && e.due_at && new Date(e.due_at) < new Date()) {
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
        const { data: enrollments } = await supabase.
        from('enrollments').
        select(`
						*,
						course:courses!inner(id, title_en, title_he, is_mandatory),
						user:profiles(department)
					`).
        eq('courses.is_mandatory', true);

        const deptStats: Record<string, {
          department: string;
          enrolled: number;
          completed: number;
          overdue: number;
        }> = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (enrollments || []).forEach((e: any) => {
          const dept = e.user?.department || 'Unknown';
          if (!deptStats[dept]) {
            deptStats[dept] = { department: dept, enrolled: 0, completed: 0, overdue: 0 };
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
        const { data: courses } = await supabase.
        from('courses').
        select('id, title_en, title_he').
        eq('status', 'published');

        const { data: moduleProgress } = await supabase.
        from('module_progress').
        select(`
						score,
						time_spent_seconds,
						module:modules(course_id)
					`);

        const { data: quizAttempts } = await supabase.
        from('quiz_attempts').
        select(`
						score,
						quiz:quizzes(module:modules(course_id))
					`);

        const courseEngagement: Record<string, {
          title: string;
          scores: number[];
          times: number[];
          attempts: number;
        }> = {};

        (courses || []).forEach((c) => {
          courseEngagement[c.id] = {
            title: locale === 'he' ? c.title_he : c.title_en,
            scores: [],
            times: [],
            attempts: 0
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
          }
        });

        setReportData({
          type: 'engagement',
          rows: Object.values(courseEngagement).map((c) => ({
            title: c.title,
            avgScore: c.scores.length > 0 ?
            Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length) :
            null,
            avgTime: c.times.length > 0 ?
            Math.round(c.times.reduce((a, b) => a + b, 0) / c.times.length / 60) :
            null,
            attempts: c.attempts
          }))
        });
      }
    } catch (err) {
      showToast('error', dict.common.error);
    }

    setGeneratingReport(false);
  };

  const saveSnapshot = async () => {
    if (!supabase || !reportData) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('report_snapshots').insert({
      report_type: reportData.type,
      params: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: reportData.rows as any,
      generated_by: user.id
    });

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', dict.hrAnalytics.snapshotSaved);
    }
  };

  const exportCsv = () => {
    if (!reportData) return;

    const headers = Object.keys(reportData.rows[0] || {});
    const csv = [
    headers.join(','),
    ...reportData.rows.map((row) => headers.map((h) => row[h] ?? '').join(','))].
    join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
  { id: 'overview', label: dict.hrAnalytics.overview },
  { id: 'reports', label: dict.hrAnalytics.reports }];


  if (loading) {
    return (
      <AppShell>
      <div data-ev-id="ev_a8efb950bf" className="max-w-6xl mx-auto">
				<LoadingSkeleton variant="card" count={4} />
			</div>
      </AppShell>);

  }

  return (
    <AppShell>
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
														<span data-ev-id="ev_2c56f42817" className="truncate text-muted-foreground">{i + 1}. {course.title}</span>
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
                  className="p-4 bg-card border border-border rounded-lg text-start hover:border-primary/50 transition-colors disabled:opacity-50">

										<h3 data-ev-id="ev_ae2d165069" className="font-medium text-foreground mb-1">{dict.hrAnalytics.completionSummary}</h3>
										<p data-ev-id="ev_e5515a1cc3" className="text-sm text-muted-foreground">{dict.hrAnalytics.completionSummaryDesc}</p>
									</button>

									<button data-ev-id="ev_c4b1643432"
                  onClick={() => generateReport('compliance')}
                  disabled={generatingReport}
                  className="p-4 bg-card border border-border rounded-lg text-start hover:border-primary/50 transition-colors disabled:opacity-50">

										<h3 data-ev-id="ev_e6bd0fa445" className="font-medium text-foreground mb-1">{dict.hrAnalytics.complianceReport}</h3>
										<p data-ev-id="ev_b902784c57" className="text-sm text-muted-foreground">{dict.hrAnalytics.complianceReportDesc}</p>
									</button>

									<button data-ev-id="ev_b9a60f4f1e"
                  onClick={() => generateReport('engagement')}
                  disabled={generatingReport}
                  className="p-4 bg-card border border-border rounded-lg text-start hover:border-primary/50 transition-colors disabled:opacity-50">

										<h3 data-ev-id="ev_429232c23a" className="font-medium text-foreground mb-1">{dict.hrAnalytics.courseEngagement}</h3>
										<p data-ev-id="ev_ba4c6bb854" className="text-sm text-muted-foreground">{dict.hrAnalytics.courseEngagementDesc}</p>
									</button>
								</div>

								{/* Report table */}
								{reportData &&
                <div data-ev-id="ev_8defc1a524" className="bg-card border border-border rounded-lg overflow-hidden">
										<div data-ev-id="ev_73a9cadda8" className="flex items-center justify-between p-4 border-b border-border">
											<h3 data-ev-id="ev_19c223c775" className="font-medium text-foreground">
												{reportData.type === 'completion' ? dict.hrAnalytics.completionSummary :
                      reportData.type === 'compliance' ? dict.hrAnalytics.complianceReport :
                      dict.hrAnalytics.courseEngagement}
											</h3>
											<div data-ev-id="ev_c18b87b03b" className="flex items-center gap-2">
												<button data-ev-id="ev_857b53227b"
                      onClick={exportCsv}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">

													<Download className="w-4 h-4" />
													{dict.common.exportCsv}
												</button>
												<button data-ev-id="ev_6c6b7f1713"
                      onClick={saveSnapshot}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">

													<Save className="w-4 h-4" />
													{dict.common.saveSnapshot}
												</button>
											</div>
										</div>

										<div data-ev-id="ev_00d4d89971" className="overflow-x-auto">
											<table data-ev-id="ev_7f93c7d467" className="w-full">
												<thead data-ev-id="ev_6e92382ce3" className="bg-muted">
													<tr data-ev-id="ev_f92d789534">
														{reportData.type === 'compliance' ?
                          <th data-ev-id="ev_94965ba788" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.departmentCol}</th> :

                          <th data-ev-id="ev_68c67f2e80" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.courseCol}</th>
                          }
														{reportData.type === 'engagement' ?
                          <>
																<th data-ev-id="ev_6e6e3b70e6" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.avgScore}</th>
																<th data-ev-id="ev_1b7073bf5d" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.avgTime}</th>
																<th data-ev-id="ev_5c047aa944" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.avgAttempts}</th>
															</> :

                          <>
																<th data-ev-id="ev_df72c8c0ef" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.enrollmentCount}</th>
																<th data-ev-id="ev_98b57ba3bc" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.completedCount}</th>
																<th data-ev-id="ev_bbaf077ad7" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.completionRateCol}</th>
																<th data-ev-id="ev_45a2987b22" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.hrAnalytics.overdueCountCol}</th>
															</>
                          }
													</tr>
												</thead>
												<tbody data-ev-id="ev_cc8ed3068f" className="divide-y divide-border">
													{reportData.rows.map((row, i) =>
                        <tr data-ev-id="ev_bb4ee88eae" key={i}>
															<td data-ev-id="ev_8206ec624f" className="px-4 py-3 text-foreground">
																{row.title || row.department}
															</td>
															{reportData.type === 'engagement' ?
                          <>
																	<td data-ev-id="ev_8aa2991b92" className="px-4 py-3 text-muted-foreground">
																		{row.avgScore !== null ? `${row.avgScore}%` : '-'}
																	</td>
																	<td data-ev-id="ev_238daed558" className="px-4 py-3 text-muted-foreground">
																		{row.avgTime !== null ? `${row.avgTime} ${dict.common.minutes}` : '-'}
																	</td>
																	<td data-ev-id="ev_600eaf429e" className="px-4 py-3 text-muted-foreground">{row.attempts}</td>
																</> :

                          <>
																	<td data-ev-id="ev_a8466e6d08" className="px-4 py-3 text-muted-foreground">{row.enrolled}</td>
																	<td data-ev-id="ev_a3cc61b5d2" className="px-4 py-3 text-primary">{row.completed}</td>
																	<td data-ev-id="ev_9b1f26c66b" className="px-4 py-3">
																		<Badge variant={row.rate >= 70 ? 'success' : row.rate >= 40 ? 'warning' : 'danger'}>
																			{row.rate}%
																		</Badge>
																	</td>
																	<td data-ev-id="ev_18af289756" className={`px-4 py-3 ${row.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
																		{row.overdue}
																	</td>
																</>
                          }
														</tr>
                        )}
												</tbody>
											</table>
										</div>
									</div>
                }
							</div>);

          }}
				</Tabs>
			</div>
		</div>
    </AppShell>);

}