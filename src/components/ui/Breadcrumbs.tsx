import { Link } from 'react-router';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Show home icon at start. Default: false */
  showHome?: boolean;
}

export function Breadcrumbs({ items, showHome = false }: BreadcrumbsProps) {
  const { locale, isRTL } = useLocale();
  const dict = getDictionary(locale);
  const Separator = isRTL ? ChevronLeft : ChevronRight;

  // Optionally prepend home item
  const allItems = showHome ?
  [{ label: dict.breadcrumbs.home, href: '/' }, ...items] :
  items;

  return (
    <nav data-ev-id="ev_ad5c5cfb1a" aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-sm mb-4">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isHome = index === 0 && showHome;

        return (
          <span data-ev-id="ev_e0fefff47c" key={index} className="flex items-center gap-1.5">
            {index > 0 &&
            <Separator className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            }
            {isLast ?
            <span data-ev-id="ev_1a8b407e09" className="text-foreground font-medium truncate max-w-[200px]" aria-current="page">
                {item.label}
              </span> :
            item.href ?
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded flex items-center gap-1.5">

                {isHome && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                <span data-ev-id="ev_cd072e756f" className="truncate max-w-[150px]">{item.label}</span>
              </Link> :

            <span data-ev-id="ev_7b60e39ec1" className="text-muted-foreground truncate max-w-[150px]">
                {item.label}
              </span>
            }
          </span>);

      })}
    </nav>);

}