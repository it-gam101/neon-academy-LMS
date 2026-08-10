import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Loader2, RefreshCw, Package } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { getDictionary } from '@/i18n/dictionary';
import { Badge } from '@/components/ui/Badge';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';

// Hardcoded sandbox configuration — used for anonymous visitors
const DEFAULT_SANDBOX_ORIGIN = 'https://pub-e8446b5e9ca042bdb42ad44abe9aa269.r2.dev';
const DEFAULT_ENTRY_POINT = 'mbti-v1/index.html';
const DEFAULT_VERSION = '1.2';
const GUEST_NAME = 'Guest';

// Package type from scorm_packages table
interface ScormPackage {
  id: string;
  title: string;
  scorm_version: string;
  storage_base_url: string;
  entry_point: string;
}

// Special marker for the default/hardcoded package
const DEFAULT_PACKAGE_ID = '__default__';

interface ScormMessage {
  type: 'scorm:ready' | 'scorm:commit' | 'scorm:terminate' | 'scorm:error';
  payload?: {
    cmi?: Record<string, unknown>;
    message?: string;
  };
}

/**
 * Flatten a nested object into dot-notation key-value pairs.
 * e.g. { core: { student_id: 'x' } } → [['core.student_id', 'x']]
 */
function flattenCmi(obj: Record<string, unknown>, prefix = ''): [string, string][] {
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenCmi(value as Record<string, unknown>, path));
    } else {
      entries.push([path, String(value ?? '')]);
    }
  }
  return entries;
}

// Allowed roles for package picker
const PICKER_ROLES = ['super_admin', 'hr_manager', 'instructor'];

export default function Sandbox() {
  const { locale } = useLocale();
  const { profile, isAuthenticated } = useAuth();
  const dict = getDictionary(locale);

  const [bridgeReady, setBridgeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cmiSnapshot, setCmiSnapshot] = useState<Record<string, unknown> | null>(null);
  const [iframeKey, setIframeKey] = useState(0); // For relaunch

  // Package picker state (only for authenticated instructors+)
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(DEFAULT_PACKAGE_ID);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initSentRef = useRef(false); // Guard to send init exactly once per load

  // Determine if user can see the package picker
  const canPickPackages = profile?.role && PICKER_ROLES.includes(profile.role);

  // Derive active package config from selection
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const isDefaultPackage = selectedPackageId === DEFAULT_PACKAGE_ID || !selectedPackage;

  // Get active origin, entry URL, and version based on selection
  let activeOrigin: string;
  let activeEntryUrl: string;
  let activeVersion: string;
  let originError: string | null = null;

  if (isDefaultPackage) {
    activeOrigin = DEFAULT_SANDBOX_ORIGIN;
    activeEntryUrl = `${DEFAULT_SANDBOX_ORIGIN}/${DEFAULT_ENTRY_POINT}`;
    activeVersion = DEFAULT_VERSION;
  } else {
    try {
      const url = new URL(selectedPackage!.storage_base_url);
      activeOrigin = url.origin;
      activeEntryUrl = `${selectedPackage!.storage_base_url}/${selectedPackage!.entry_point}`;
      activeVersion = selectedPackage!.scorm_version === '1.2' ? '1.2' : '2004';
    } catch {
      originError = dict.scorm.invalidPackageUrl;
      activeOrigin = DEFAULT_SANDBOX_ORIGIN;
      activeEntryUrl = `${DEFAULT_SANDBOX_ORIGIN}/${DEFAULT_ENTRY_POINT}`;
      activeVersion = DEFAULT_VERSION;
    }
  }

  // Build iframe src - each bucket hosts its own bridge
  const bridgeUrl = `${activeOrigin}/player/player.html`;

  // Fetch packages only for authenticated users with allowed roles
  useEffect(() => {
    if (!canPickPackages || !supabase) return;

    const fetchPackages = async () => {
      setPackagesLoading(true);
      try {
        const { data, error: fetchError } = await supabase.
        from('scorm_packages').
        select('id,title,scorm_version,storage_base_url,entry_point').
        eq('is_public_sandbox', false).
        order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Failed to load packages:', fetchError);
          setError(dict.sandbox.packageLoadError);
        } else {
          setPackages(data ?? []);
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
        setError(dict.sandbox.packageLoadError);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [canPickPackages, dict.sandbox.packageLoadError]);

  // Send scorm:init to the bridge (guarded)
  const sendInit = useCallback(() => {
    if (initSentRef.current || !iframeRef.current?.contentWindow) return;
    initSentRef.current = true;

    const cmi = {
      core: {
        student_id: 'sandbox',
        student_name: GUEST_NAME,
        lesson_status: 'not attempted'
      }
    };

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'scorm:init',
        payload: {
          version: activeVersion,
          entryUrl: activeEntryUrl,
          cmi,
          autocommitSeconds: 10
        }
      },
      activeOrigin
    );
    setBridgeReady(true);
  }, [activeOrigin, activeEntryUrl, activeVersion]);

  // Handle iframe load — guaranteed to fire after bridge's listener is attached
  const handleIframeLoad = useCallback(() => {
    sendInit();
  }, [sendInit]);

  // Handle postMessage from bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ScormMessage>) => {
      // SECURITY: Verify origin matches the CURRENTLY SELECTED package's origin
      if (event.origin !== activeOrigin) {
        return;
      }

      const { type, payload } = event.data;

      switch (type) {
        case 'scorm:ready':
          setBridgeReady(true);
          // Fast path — also try to send init here
          sendInit();
          break;

        case 'scorm:commit':
          if (payload?.cmi) {
            setCmiSnapshot(payload.cmi);
          }
          break;

        case 'scorm:terminate':
          if (payload?.cmi) {
            setCmiSnapshot(payload.cmi);
          }
          break;

        case 'scorm:error':
          setError(payload?.message || dict.scorm.runtimeError);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeOrigin, sendInit, dict.scorm.runtimeError]);

  // Reset handler — reset state and remount iframe
  const handleReset = useCallback(() => {
    initSentRef.current = false; // Reset guard before remounting
    setBridgeReady(false);
    setError(null);
    setCmiSnapshot(null);
    setIframeKey((k) => k + 1);
  }, []);

  // Handle package selection change
  const handlePackageChange = (packageId: string) => {
    setSelectedPackageId(packageId);
    // Full reset: same as Relaunch
    handleReset();
  };

  // Flatten CMI for inspector
  const flattenedCmi = cmiSnapshot ? flattenCmi(cmiSnapshot) : [];

  // Display version in badge
  const displayVersion = isDefaultPackage ? DEFAULT_VERSION : activeVersion;

  // Error state
  if (error || originError) {
    return (
      <div data-ev-id="ev_a935a26d06" className="min-h-screen bg-background flex items-center justify-center">
        <div data-ev-id="ev_957a4f2860" className="flex flex-col items-center gap-4 text-center p-8">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 data-ev-id="ev_ebf2404937" className="text-xl font-semibold text-foreground">{dict.common.errorOccurred}</h2>
          <p data-ev-id="ev_8d26e27992" className="text-muted-foreground">{error || originError}</p>
          <button data-ev-id="ev_0838301faf"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

            <RefreshCw className="w-4 h-4" />
            {dict.sandbox.relaunch}
          </button>
        </div>
      </div>);

  }

  return (
    <div data-ev-id="ev_00154589a4" className="min-h-screen bg-background flex flex-col">
      {/* Header Chrome */}
      <div data-ev-id="ev_704d1fcabb" className="bg-card border-b border-border px-4 py-4">
        <div data-ev-id="ev_d263a11984" className="max-w-7xl mx-auto">
          <div data-ev-id="ev_563cabe32e" className="flex items-start justify-between gap-3 flex-wrap">
            <div data-ev-id="ev_51128fa7b7" className="min-w-0">
              <div data-ev-id="ev_326efd7679" className="flex items-center gap-3">
                <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">{dict.sandbox.title}</Link>
                <Badge>
                  <Package className="w-3 h-3 me-1" />
                  SCORM {displayVersion}
                </Badge>
              </div>
              <p data-ev-id="ev_62a8a79c66" className="text-sm text-muted-foreground mt-1">{dict.sandbox.subtitle}</p>
            </div>
            <div data-ev-id="ev_ebf3a710e6" className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Package picker for authenticated instructors+ */}
              {canPickPackages &&
              <div data-ev-id="ev_6f83f26e13" className="flex items-center gap-2">
                  <label data-ev-id="ev_e24388249c" htmlFor="package-picker" className="text-sm text-muted-foreground">
                    {dict.sandbox.packagePicker}:
                  </label>
                  <select data-ev-id="ev_86386b2da0"
                id="package-picker"
                value={selectedPackageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                disabled={packagesLoading}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]">

                    <option data-ev-id="ev_d215d0e34b" value={DEFAULT_PACKAGE_ID}>{dict.sandbox.defaultPackage}</option>
                    {packages.map((pkg) =>
                  <option data-ev-id="ev_f753ee1e07" key={pkg.id} value={pkg.id}>
                        {pkg.title}
                      </option>
                  )}
                  </select>
                </div>
              }
              <LanguageToggle />
              {isAuthenticated ? (
                <Link to="/" className="px-4 py-2 rounded-lg font-medium text-sm border border-border text-foreground hover:bg-muted transition-colors focus-ring">{dict.sandbox.backToAcademy}</Link>
              ) : (
                <Link to="/auth/login" className="px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-ring">{dict.auth.login}</Link>
              )}
              <button data-ev-id="ev_48108b3bd0"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

                <RefreshCw className="w-4 h-4" />
                {dict.sandbox.relaunch}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: iframe + inspector */}
      <div data-ev-id="ev_d8103163ee" className="flex-1 flex flex-col lg:flex-row">
        {/* SCORM Player iframe */}
        <div data-ev-id="ev_e12195c683" className="flex-1 relative min-h-[60vh] lg:min-h-0">
          {!bridgeReady &&
          <div data-ev-id="ev_98eddf14ef" className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div data-ev-id="ev_1a8f90293a" className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p data-ev-id="ev_8dea8746b4" className="text-muted-foreground">{dict.scorm.loadingPlayer}</p>
              </div>
            </div>
          }
          <iframe data-ev-id="ev_9d646d6511"
          key={iframeKey}
          ref={iframeRef}
          src={bridgeUrl}
          title={dict.sandbox.title}
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 200px)' }}
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleIframeLoad} />

        </div>

        {/* CMI Inspector Panel */}
        <div data-ev-id="ev_311b1b1ec0" className="w-full lg:w-80 xl:w-96 bg-card border-t lg:border-t-0 lg:border-s border-border p-4 overflow-auto max-h-[40vh] lg:max-h-none">
          <h2 data-ev-id="ev_cee88aa0d9" className="text-sm font-semibold text-foreground mb-3">{dict.sandbox.inspectorTitle}</h2>
          {flattenedCmi.length === 0 ?
          <p data-ev-id="ev_2f4cbe48a5" className="text-sm text-muted-foreground italic">{dict.sandbox.noData}</p> :

          <div data-ev-id="ev_541cd3182a"
          className="font-mono text-xs ltr-content"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>

              <table data-ev-id="ev_0620896fce" className="w-full">
                <tbody data-ev-id="ev_cc6fc43451" className="divide-y divide-border">
                  {flattenedCmi.map(([key, value]) =>
                <tr data-ev-id="ev_f6747911d1" key={key}>
                      <td data-ev-id="ev_d259042029" className="py-1.5 pe-2 text-muted-foreground align-top whitespace-nowrap">
                        {key}
                      </td>
                      <td data-ev-id="ev_95facad0fc" className="py-1.5 text-foreground break-all">{value}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>);

}