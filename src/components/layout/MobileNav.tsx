import { useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { navItems } from '@/components/layout/nav-config';
import logoSrc from '@/assets/logo.svg';

interface MobileNavProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ isOpen, onOpenChange }: MobileNavProps) {
  const { profile } = useAuth();
  const { t, isRTL } = useLocale();
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousOverflowRef = useRef<string | null>(null);

  const userRole = profile?.role ?? 'employee';
  const visibleItems = navItems.filter((item) =>
  item.allowedRoles.includes(userRole)
  );

  const drawerId = 'mobile-nav-drawer';

  const closeDrawer = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Scroll lock management
  useEffect(() => {
    if (isOpen) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }

    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      drawerRef.current?.focus();
    } else {
      buttonRef.current?.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Translation direction for slide-in
  const translateOpen = 'translate-x-0';
  const translateClosed = isRTL ? '-translate-x-full' : 'translate-x-full';

  return (
    <>
      {/* Hamburger button */}
      <button data-ev-id="ev_57b0622d1f"
      ref={buttonRef}
      type="button"
      onClick={() => onOpenChange(true)}
      className="md:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-muted transition-colors focus-ring"
      aria-label={t.nav.openMenu}
      aria-expanded={isOpen}
      aria-controls={drawerId}>

        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {isOpen &&
      <div data-ev-id="ev_736f654ad7"
      className="fixed inset-0 z-50 bg-black/50 md:hidden"
      onClick={closeDrawer}
      aria-hidden="true" />

      }

      {/* Drawer */}
      <div data-ev-id="ev_d7e49dd043"
      id={drawerId}
      ref={drawerRef}
      tabIndex={-1}
      className={
      `fixed top-0 bottom-0 end-0 z-50 w-[280px] bg-background border-s border-border ` +
      `transform transition-transform duration-300 ease-out md:hidden ` +
      `${isOpen ? translateOpen : translateClosed}`
      }
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.menuTitle}>

        {/* Header */}
        <div data-ev-id="ev_de02b54979" className="flex items-center justify-between px-4 h-16 border-b border-border">
          <div data-ev-id="ev_dbaa91c85d" className="flex items-center gap-3">
            <img data-ev-id="ev_021b8610d3" src={logoSrc} alt="" className="w-8 h-8 rounded-lg" />
            <span data-ev-id="ev_abdeba1958" className="text-lg font-semibold text-foreground">
              {t.nav.menuTitle}
            </span>
          </div>
          <button data-ev-id="ev_c50d60d11f"
          type="button"
          onClick={closeDrawer}
          className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-muted transition-colors focus-ring"
          aria-label={t.common.close}>

            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav data-ev-id="ev_fa9b1b6b8b" className="flex flex-col gap-1 p-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeDrawer}
                className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ` +
                `transition-colors focus-ring ` + (
                isActive ?
                'bg-primary-muted text-primary' :
                'text-foreground-muted hover:text-foreground hover:bg-muted')
                }>

                <Icon className="w-5 h-5" />
                <span data-ev-id="ev_3727b1df27">{t.nav[item.labelKey]}</span>
              </NavLink>);

          })}
        </nav>
      </div>
    </>);

}