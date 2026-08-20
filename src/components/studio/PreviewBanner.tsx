import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Monitor, Smartphone } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

interface PreviewBannerProps {
  courseId: string;
  children: React.ReactNode;
}

export function PreviewBanner({ courseId, children }: PreviewBannerProps) {
  const { locale, isRTL } = useLocale();
  const dict = getDictionary(locale);
  const [searchParams] = useSearchParams();
  const isFrame = searchParams.get('frame') === '1';
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // If we're inside the iframe, don't render the banner
  if (isFrame) {
    return <>{children}</>;
  }

  // Build the iframe URL for mobile preview
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('frame', '1');
  const iframeSrc = currentUrl.pathname + currentUrl.search;

  return (
    <>
      {/* Sticky preview banner */}
      <div data-ev-id="ev_30c692c1f1" className="sticky top-16 z-30 bg-amber-100 border-b border-amber-300 px-4 py-2">
        <div data-ev-id="ev_07af9c4483" className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div data-ev-id="ev_afa330ff7c" className="flex items-center gap-3">
            <span data-ev-id="ev_b8282e4a66" className="text-amber-900 text-sm font-medium">
              {dict.studio.previewBanner}
            </span>
            <Link
              to={`/studio/${courseId}`}
              className="flex items-center gap-1 text-sm text-amber-800 hover:text-amber-950 underline">

              <BackArrow className="w-4 h-4" />
              {dict.studio.previewBackToEdit}
            </Link>
          </div>

          {/* Desktop / Mobile toggle */}
          <div data-ev-id="ev_fcbf05b516" className="flex items-center gap-1 bg-amber-200 rounded-lg p-1">
            <button data-ev-id="ev_224fdb856f"
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'desktop' ?
            'bg-white text-amber-900 shadow-sm' :
            'text-amber-700 hover:text-amber-900'}`
            }>

              <Monitor className="w-4 h-4" />
              {dict.studio.previewDesktop}
            </button>
            <button data-ev-id="ev_1694d410cd"
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'mobile' ?
            'bg-white text-amber-900 shadow-sm' :
            'text-amber-700 hover:text-amber-900'}`
            }>

              <Smartphone className="w-4 h-4" />
              {dict.studio.previewMobile}
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      {viewMode === 'desktop' ?
      children :

      <div data-ev-id="ev_973f5cfe91" className="flex justify-center py-8 bg-muted min-h-[calc(100vh-8rem)]">
          <div data-ev-id="ev_9d7f1c72e4"
        className="bg-foreground rounded-[2.5rem] p-3 shadow-2xl"
        style={{ width: 390 + 24, height: 844 + 24 }}>

            <iframe data-ev-id="ev_d3dd1729fd"
          src={iframeSrc}
          title="Mobile preview"
          className="w-[390px] h-[844px] bg-background rounded-[2rem] border-0" />

          </div>
        </div>
      }
    </>);

}