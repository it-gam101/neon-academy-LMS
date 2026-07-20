import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

interface LightboxImageProps {
  src: string;
  alt: string;
  caption?: ReactNode;
  width?: number;
  height?: number;
  className?: string;
}

export function LightboxImage({ src, alt, caption, width, height, className }: LightboxImageProps) {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsZoomed(false);
    // Return focus to trigger
    setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    // Reset scroll position when toggling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  return (
    <>
      {/* Trigger button wrapping the image */}
      <button data-ev-id="ev_d5c47e2e9a"
      ref={triggerRef}
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label={t.landing.enlargeImage}
      className={`group block cursor-zoom-in focus-ring rounded-xl transition-all ${className || ''}`}>

        <div data-ev-id="ev_cd2d54658a" className="border border-border rounded-xl overflow-hidden bg-card group-hover:ring-2 group-hover:ring-primary/50 transition-all">
          <img data-ev-id="ev_88696304b9"
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className="w-full h-auto" />

        </div>
      </button>

      {/* Lightbox overlay */}
      {isOpen &&
      <div data-ev-id="ev_4d61027904"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      onClick={handleBackdropClick}>

          {/* Backdrop */}
          <div data-ev-id="ev_fd1ef58302" className="absolute inset-0 bg-background/95" />
          
          {/* Close button - logical positioning for RTL */}
          <button data-ev-id="ev_cd216b755c"
        ref={closeButtonRef}
        type="button"
        onClick={handleClose}
        aria-label={t.common.close}
        className="absolute top-4 z-10 p-2 rounded-lg bg-muted/80 hover:bg-muted text-foreground transition-colors focus-ring"
        style={{ insetInlineEnd: '1rem' }}>

            <X className="w-6 h-6" />
          </button>

          {/* Image container */}
          <div data-ev-id="ev_abac35492f" className="relative z-10 flex flex-col items-center max-w-[92vw] max-h-[92vh]">
            {isZoomed ? (
          /* Zoomed/natural size mode with scroll */
          <div data-ev-id="ev_224ccaf873"
          ref={scrollContainerRef}
          className="overflow-auto max-w-[92vw] max-h-[calc(92vh-3rem)] cursor-zoom-out touch-pan-x touch-pan-y"
          onClick={toggleZoom}>

                <button data-ev-id="ev_0c4e4cee2a"
            type="button"
            aria-label={t.landing.toggleZoom}
            className="block focus:outline-none">

                  <img data-ev-id="ev_aedc182605"
              src={src}
              alt={alt}
              className="max-w-none h-auto" />

                </button>
              </div>) : (

          /* Fit mode */
          <button data-ev-id="ev_4062452584"
          type="button"
          onClick={toggleZoom}
          aria-label={t.landing.toggleZoom}
          className="cursor-zoom-in focus:outline-none">

                <img data-ev-id="ev_f6aad3ea83"
            src={src}
            alt={alt}
            className="max-w-[92vw] max-h-[calc(92vh-3rem)] object-contain" />

              </button>)
          }
            
            {/* Caption */}
            {caption &&
          <div data-ev-id="ev_6588b62ec4" className="mt-4 text-center text-muted-foreground text-sm max-w-2xl px-4">
                {caption}
              </div>
          }
          </div>
        </div>
      }
    </>);

}