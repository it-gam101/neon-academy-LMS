import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { AlertCircle, CheckCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import type { Tables } from '@/integrations/supabase/helpers';

type Module = Tables<'modules'>;
type ScormPackage = Tables<'scorm_packages'>;
type ScormRegistration = Tables<'scorm_registrations'>;
type Enrollment = Tables<'enrollments'>;
type Course = Tables<'courses'>;

interface ScormMessage {
  type: 'scorm:ready' | 'scorm:commit' | 'scorm:terminate' | 'scorm:error';
  payload?: {
    cmi?: Record<string, unknown>;
    message?: string;
  };
}

export default function ScormPlayer() {
  const { enrollmentId, moduleId } = useParams<{enrollmentId: string;moduleId: string;}>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { profile, session } = useAuth();
  const Chevron = locale === 'he' ? ChevronLeft : ChevronRight;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [scormPackage, setScormPackage] = useState<ScormPackage | null>(null);
  const [registration, setRegistration] = useState<ScormRegistration | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);
  const [scoreRaw, setScoreRaw] = useState<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bucketOriginRef = useRef<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!supabase || !enrollmentId || !moduleId) {
        setError(dict.common.errorOccurred);
        setLoading(false);
        return;
      }

      try {
        // Fetch enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase.
        from('enrollments').
        select('*').
        eq('id', enrollmentId).
        single();

        if (enrollmentError || !enrollmentData) {
          setError(dict.common.accessDenied);
          setLoading(false);
          return;
        }
        setEnrollment(enrollmentData);

        // Fetch course
        const { data: courseData } = await supabase.
        from('courses').
        select('*').
        eq('id', enrollmentData.course_id).
        single();

        if (courseData) setCourse(courseData);

        // Fetch module with scorm_package
        const { data: moduleData, error: moduleError } = await supabase.
        from('modules').
        select('*, scorm_package:scorm_packages(*)').
        eq('id', moduleId).
        eq('course_id', enrollmentData.course_id).
        single();

        if (moduleError || !moduleData) {
          setError(dict.common.notFound);
          setLoading(false);
          return;
        }

        setModule(moduleData);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pkg = (moduleData as any).scorm_package as ScormPackage | null;
        if (!pkg) {
          setError(dict.scorm.packageNotFound);
          setLoading(false);
          return;
        }
        setScormPackage(pkg);

        // Store bucket origin for message verification
        try {
          bucketOriginRef.current = new URL(pkg.storage_base_url).origin;
        } catch {
          setError(dict.scorm.invalidPackageUrl);
          setLoading(false);
          return;
        }

        // Fetch existing registration
        const { data: regData } = await supabase.
        from('scorm_registrations').
        select('*').
        eq('package_id', pkg.id).
        eq('enrollment_id', enrollmentId).
        maybeSingle();

        if (regData) {
          setRegistration(regData);
          setCompletionStatus(regData.completion_status);
          setScoreRaw(regData.score_raw ? Number(regData.score_raw) : null);
        }

        // Mark module as in_progress if not already
        await supabase.
        from('module_progress').
        upsert(
          {
            enrollment_id: enrollmentId,
            module_id: moduleId,
            status: regData?.completion_status === 'completed' ? 'completed' : 'in_progress',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'enrollment_id,module_id' }
        );

        setLoading(false);
      } catch (err) {
        console.error('Failed to load SCORM data:', err);
        setError(dict.common.errorOccurred);
        setLoading(false);
      }
    };

    loadData();
  }, [enrollmentId, moduleId, dict]);

  // Commit CMI data to Edge Function
  const commitCmi = useCallback(
    async (cmi: Record<string, unknown>, event: 'commit' | 'terminate') => {
      if (!scormPackage || !enrollmentId || !moduleId || !session?.access_token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scorm-commit`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              module_id: moduleId,
              package_id: scormPackage.id,
              enrollment_id: enrollmentId,
              event,
              cmi
            }),
            keepalive: true // Survives tab close
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.registration) {
            setCompletionStatus(data.registration.completion_status);
            setScoreRaw(data.registration.score_raw);
          }
        }
      } catch (err) {
        console.error('Failed to commit SCORM data:', err);
      }
    },
    [scormPackage, enrollmentId, moduleId, session?.access_token]
  );

  // Handle postMessage from bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ScormMessage>) => {
      // SECURITY: Verify origin matches bucket
      if (event.origin !== bucketOriginRef.current) {
        return;
      }

      const { type, payload } = event.data;

      switch (type) {
        case 'scorm:ready':
          setBridgeReady(true);
          break;

        case 'scorm:commit':
          if (payload?.cmi) {
            void commitCmi(payload.cmi, 'commit');
          }
          break;

        case 'scorm:terminate':
          if (payload?.cmi) {
            void commitCmi(payload.cmi, 'terminate');
          }
          break;

        case 'scorm:error':
          setError(payload?.message || dict.scorm.runtimeError);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [commitCmi, dict]);

  // Send init message when bridge is ready
  useEffect(() => {
    if (!bridgeReady || !scormPackage || !iframeRef.current || !bucketOriginRef.current || !profile) return;

    // Map scorm_version to bridge version
    const version = scormPackage.scorm_version === '1.2' ? '1.2' : '2004';

    // Build entry URL
    const entryUrl = `${scormPackage.storage_base_url}/${scormPackage.entry_point}`;

    // Build initial CMI object
    let cmi: Record<string, unknown>;

    if (registration?.cmi_data) {
      // Resume with existing CMI data
      cmi = registration.cmi_data as Record<string, unknown>;
    } else {
      // First launch - minimal CMI
      if (version === '1.2') {
        cmi = {
          core: {
            student_id: profile.id,
            student_name: profile.full_name || '',
            lesson_status: 'not attempted'
          }
        };
      } else {
        cmi = {
          learner_id: profile.id,
          learner_name: profile.full_name || '',
          completion_status: 'not attempted'
        };
      }
    }

    // Add suspend_data if present
    if (registration?.suspend_data) {
      cmi.suspend_data = registration.suspend_data;
    }

    // Send init message to bridge
    iframeRef.current.contentWindow?.postMessage(
      {
        type: 'scorm:init',
        payload: {
          version,
          entryUrl,
          cmi,
          autocommitSeconds: 30
        }
      },
      bucketOriginRef.current
    );
  }, [bridgeReady, scormPackage, registration, profile]);

  // Get localized title
  const getTitle = (item: {title_en?: string;title_he?: string;} | null) => {
    if (!item) return '';
    return locale === 'he' ? item.title_he || item.title_en : item.title_en || item.title_he;
  };

  // Loading state
  if (loading) {
    return (
      <div data-ev-id="ev_e1ae0ce2e5" className="min-h-screen bg-background flex items-center justify-center">
				<div data-ev-id="ev_df58304947" className="flex flex-col items-center gap-4">
					<Loader2 className="w-8 h-8 text-primary animate-spin" />
					<p data-ev-id="ev_afa399e27c" className="text-muted-foreground">{dict.common.loading}</p>
				</div>
			</div>);

  }

  // Error state
  if (error) {
    return (
      <div data-ev-id="ev_6d5a2562bf" className="min-h-screen bg-background flex items-center justify-center">
				<div data-ev-id="ev_b58297d3e4" className="flex flex-col items-center gap-4 text-center p-8">
					<AlertCircle className="w-12 h-12 text-destructive" />
					<h2 data-ev-id="ev_7ffedb30fe" className="text-xl font-semibold text-foreground">{dict.common.errorOccurred}</h2>
					<p data-ev-id="ev_215ec20890" className="text-muted-foreground">{error}</p>
					<div data-ev-id="ev_594b565c44" className="flex gap-4 mt-4">
						<button data-ev-id="ev_e6e681e100"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							<RefreshCw className="w-4 h-4" />
							{dict.common.retry}
						</button>
						{course &&
            <Link
              to={`/course/${course.id}`}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">

								{dict.course.backToCourse}
							</Link>
            }
					</div>
				</div>
			</div>);

  }

  // Build iframe src - bridge lives at bucket root /player/player.html
  const bridgeUrl = bucketOriginRef.current ? `${bucketOriginRef.current}/player/player.html` : '';

  return (
    <div data-ev-id="ev_8f783223a9" className="min-h-screen bg-background flex flex-col">
			{/* Header Chrome */}
			<div data-ev-id="ev_a85a160118" className="bg-card border-b border-border px-4 py-3">
				<div data-ev-id="ev_89fff89f7e" className="max-w-7xl mx-auto">
					{/* Breadcrumbs */}
					<Breadcrumbs
            showHome={false}
            items={[
            { label: dict.nav.catalogue, href: '/catalogue' },
            { label: getTitle(course) || '', href: `/course/${course?.id}` },
            { label: getTitle(module) || '' }]
            } />


					{/* Title Row */}
					<div data-ev-id="ev_beab572386" className="flex items-center justify-between mt-2">
						<div data-ev-id="ev_4cb0cad370" className="flex items-center gap-3">
							<Link
                to={`/course/${course?.id}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">

								{locale === 'he' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
								{dict.course.backToCourse}
							</Link>
							<span data-ev-id="ev_74ff5efab8" className="text-muted-foreground">|</span>
							<h1 data-ev-id="ev_877a2ccf09" className="text-lg font-semibold text-foreground">{getTitle(module)}</h1>
						</div>

						{/* Status Badges */}
						<div data-ev-id="ev_a2cfd3cc25" className="flex items-center gap-2">
							{/* SCORM Version Chip */}
							<Badge>
								<Package className="w-3 h-3 me-1" />
								SCORM {scormPackage?.scorm_version}
							</Badge>

							{/* Completion Badge */}
							{completionStatus === 'completed' &&
              <Badge variant="success">
									<CheckCircle className="w-3 h-3 me-1" />
									{dict.common.completed}
									{scoreRaw != null && ` (${scoreRaw}%)`}
								</Badge>
              }
						</div>
					</div>
				</div>
			</div>

			{/* SCORM Player iframe */}
			<div data-ev-id="ev_3bb8664cad" className="flex-1 relative">
				{!bridgeReady &&
        <div data-ev-id="ev_4a48894688" className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
						<div data-ev-id="ev_ba1d1d0fe3" className="flex flex-col items-center gap-4">
							<Loader2 className="w-8 h-8 text-primary animate-spin" />
							<p data-ev-id="ev_6ba24d77c7" className="text-muted-foreground">{dict.scorm.loadingPlayer}</p>
						</div>
					</div>
        }
				<iframe data-ev-id="ev_8eedc28920"
        ref={iframeRef}
        src={bridgeUrl}
        title={getTitle(module) || 'SCORM Content'}
        className="w-full h-full border-0"
        style={{ minHeight: 'calc(100vh - 100px)' }}
        sandbox="allow-scripts allow-same-origin" />

			</div>
		</div>);

}