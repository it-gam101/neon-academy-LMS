import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Loader2, RefreshCw, Package } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { Badge } from '@/components/ui/Badge';

// Hardcoded sandbox configuration — NO backend access
const SANDBOX_ORIGIN = 'https://pub-e8446b5e9ca042bdb42ad44abe9aa269.r2.dev';
const ENTRY_POINT = 'mbti-v1/index.html';
const VERSION = '1.2';

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

export default function Sandbox() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const [bridgeReady, setBridgeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cmiSnapshot, setCmiSnapshot] = useState<Record<string, unknown> | null>(null);
  const [iframeKey, setIframeKey] = useState(0); // For relaunch

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initSentRef = useRef(false); // Guard to send init exactly once per load

  // Send scorm:init to the bridge (guarded)
  const sendInit = useCallback(() => {
    if (initSentRef.current || !iframeRef.current?.contentWindow) return;
    initSentRef.current = true;

    const cmi = {
      core: {
        student_id: 'sandbox',
        student_name: dict.sandbox.guestName,
        lesson_status: 'not attempted'
      }
    };

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'scorm:init',
        payload: {
          version: VERSION,
          entryUrl: `${SANDBOX_ORIGIN}/${ENTRY_POINT}`,
          cmi,
          autocommitSeconds: 10
        }
      },
      SANDBOX_ORIGIN
    );
  }, [dict.sandbox.guestName]);

  // Handle iframe load — guaranteed to fire after bridge's listener is attached
  const handleIframeLoad = useCallback(() => {
    sendInit();
  }, [sendInit]);

  // Handle postMessage from bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ScormMessage>) => {
      // SECURITY: Verify origin matches sandbox bucket
      if (event.origin !== SANDBOX_ORIGIN) {
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
  }, [sendInit, dict.scorm.runtimeError]);

  // Relaunch handler — reset state and remount iframe
  const handleRelaunch = () => {
    initSentRef.current = false; // Reset guard before remounting
    setBridgeReady(false);
    setError(null);
    setCmiSnapshot(null);
    setIframeKey((k) => k + 1);
  };

  // Build iframe src
  const bridgeUrl = `${SANDBOX_ORIGIN}/player/player.html`;

  // Flatten CMI for inspector
  const flattenedCmi = cmiSnapshot ? flattenCmi(cmiSnapshot) : [];

  // Error state
  if (error) {
    return (
      <div data-ev-id="ev_41ef596fa9" className="min-h-screen bg-background flex items-center justify-center">
        <div data-ev-id="ev_09d7a4f439" className="flex flex-col items-center gap-4 text-center p-8">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 data-ev-id="ev_37c2a1a32d" className="text-xl font-semibold text-foreground">{dict.common.errorOccurred}</h2>
          <p data-ev-id="ev_1f835863c4" className="text-muted-foreground">{error}</p>
          <button data-ev-id="ev_d1a7e4d2bd"
          onClick={handleRelaunch}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

            <RefreshCw className="w-4 h-4" />
            {dict.sandbox.relaunch}
          </button>
        </div>
      </div>);

  }

  return (
    <div data-ev-id="ev_70f27f78da" className="min-h-screen bg-background flex flex-col">
      {/* Header Chrome */}
      <div data-ev-id="ev_d1f333b448" className="bg-card border-b border-border px-4 py-4">
        <div data-ev-id="ev_342648475c" className="max-w-7xl mx-auto">
          <div data-ev-id="ev_ff615492b4" className="flex items-center justify-between">
            <div data-ev-id="ev_791c77451b">
              <div data-ev-id="ev_47d760a13e" className="flex items-center gap-3">
                <h1 data-ev-id="ev_130ee1ecdb" className="text-xl font-semibold text-foreground">{dict.sandbox.title}</h1>
                <Badge>
                  <Package className="w-3 h-3 me-1" />
                  SCORM {VERSION}
                </Badge>
              </div>
              <p data-ev-id="ev_c857bcec1c" className="text-sm text-muted-foreground mt-1">{dict.sandbox.subtitle}</p>
            </div>
            <button data-ev-id="ev_398983e797"
            onClick={handleRelaunch}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

              <RefreshCw className="w-4 h-4" />
              {dict.sandbox.relaunch}
            </button>
          </div>
        </div>
      </div>

      {/* Main content: iframe + inspector */}
      <div data-ev-id="ev_ef1104d7ad" className="flex-1 flex flex-col lg:flex-row">
        {/* SCORM Player iframe */}
        <div data-ev-id="ev_c1b0554c70" className="flex-1 relative min-h-[60vh] lg:min-h-0">
          {!bridgeReady &&
          <div data-ev-id="ev_e8a0771481" className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div data-ev-id="ev_febc7886c2" className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p data-ev-id="ev_7b3b9f8607" className="text-muted-foreground">{dict.scorm.loadingPlayer}</p>
              </div>
            </div>
          }
          <iframe data-ev-id="ev_8ca75d1993"
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
        <div data-ev-id="ev_5eb6cdcdb7" className="w-full lg:w-80 xl:w-96 bg-card border-t lg:border-t-0 lg:border-s border-border p-4 overflow-auto max-h-[40vh] lg:max-h-none">
          <h2 data-ev-id="ev_782237064d" className="text-sm font-semibold text-foreground mb-3">{dict.sandbox.inspectorTitle}</h2>
          {flattenedCmi.length === 0 ?
          <p data-ev-id="ev_be669fb770" className="text-sm text-muted-foreground italic">{dict.sandbox.noData}</p> :

          <div data-ev-id="ev_28f22457ec"
          className="font-mono text-xs ltr-content"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>

              <table data-ev-id="ev_fc47bd251f" className="w-full">
                <tbody data-ev-id="ev_393e83d13c" className="divide-y divide-border">
                  {flattenedCmi.map(([key, value]) =>
                <tr data-ev-id="ev_192096fcf7" key={key}>
                      <td data-ev-id="ev_afb58d6656" className="py-1.5 pe-2 text-muted-foreground align-top whitespace-nowrap">
                        {key}
                      </td>
                      <td data-ev-id="ev_517d1ed5c2" className="py-1.5 text-foreground break-all">{value}</td>
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