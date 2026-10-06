import { useState } from 'react';
import { inlineBold } from '@/lib/inlineText';
import { segmentColumn, type HotspotData, type HotspotPiece } from '@/lib/hotspotParser';

/**
 * Item 109 step 2, renderer 3 — the lesson `hotspot` interaction: a TEXT-SPAN comparison of two columns, as
 * Spark's player renders it. The learner picks each highlighted phrase in the invitation; its counterpart in the
 * announcement lights up and the move is explained. Once every move has been found the closing line lands and
 * `onWorked` is called once (Spark's definition of "worked"); the lesson page then completes the lesson when every
 * activity in it is done (item 119 widened, Isaac 2026-10-05). Rendered INSTEAD of the block's prose. Writes
 * nothing itself, locks nothing.
 *
 * As in Spark: below `sm` the columns stack and the list of moves and the fallback note appear. The list also
 * shows on every screen when a move cannot be picked in the invitation (its span is missing or overlaps), so no
 * move is ever out of reach.
 */

export function HotspotInteraction({ hotspot, locale, blockKey, onWorked }: {hotspot: HotspotData;locale: 'en' | 'he';blockKey: string;onWorked?: (blockKey: string) => void;}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [found, setFound] = useState<Set<number>>(() => new Set());
  const total = hotspot.regions.length;
  const announcement = segmentColumn(hotspot.announcement.text, hotspot.regions, 'announcementSpan');
  const invitation = segmentColumn(hotspot.invitation.text, hotspot.regions, 'invitationSpan');
  const listEverywhere = invitation.missed.length > 0;
  const allFound = found.size === total;
  const current = selected === null ? null : hotspot.regions[selected];

  const select = (i: number) => {
    setSelected(i);
    if (found.has(i)) return;
    const next = new Set(found).add(i);
    setFound(next);
    if (next.size === total) onWorked?.(blockKey);
  };

  const renderPiece = (p: HotspotPiece, k: number, pickable: boolean) => {
    if (p.region === null) return <span data-ev-id="ev_16643d10c4" key={k}>{p.text}</span>;
    const on = p.region === selected;
    const region = p.region;
    return pickable ?
    <button
      key={k}
      type="button"
      data-ev-id="ev_hotspot_span"
      aria-pressed={on}
      onClick={() => select(region)}
      className={`rounded-sm px-0.5 text-start transition-colors ${on ? 'bg-primary text-primary-foreground' : 'border-b-2 border-dotted border-primary hover:bg-primary/10'}`}>
				{p.text}
			</button> :
    <span key={k} data-ev-id="ev_hotspot_mark" className={`rounded-sm px-0.5 transition-colors ${on ? 'bg-primary text-primary-foreground' : ''}`}>{p.text}</span>;
  };

  return (
    <div data-ev-id="ev_lesson_hotspot" lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} className="my-6 rounded-lg border border-border bg-background/40 p-5">
			{hotspot.prompt &&
      <p data-ev-id="ev_hotspot_prompt" className="mb-4 font-medium text-foreground whitespace-pre-wrap">{inlineBold(hotspot.prompt)}</p>
      }
			<div data-ev-id="ev_hotspot_columns" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<section data-ev-id="ev_hotspot_col_announcement" className="min-w-0 rounded-lg border border-border bg-card p-4">
					{hotspot.announcement.label && <h4 data-ev-id="ev_hotspot_col_label" className="mb-2 text-sm font-semibold text-foreground">{hotspot.announcement.label}</h4>}
					<p data-ev-id="ev_hotspot_col_text" className="leading-relaxed text-foreground whitespace-pre-wrap">{announcement.pieces.map((p, k) => renderPiece(p, k, false))}</p>
				</section>
				<section data-ev-id="ev_hotspot_col_invitation" className="min-w-0 rounded-lg border border-border bg-card p-4">
					{hotspot.invitation.label && <h4 data-ev-id="ev_hotspot_col_label" className="mb-2 text-sm font-semibold text-foreground">{hotspot.invitation.label}</h4>}
					<p data-ev-id="ev_hotspot_col_text" className="leading-relaxed text-foreground whitespace-pre-wrap">{invitation.pieces.map((p, k) => renderPiece(p, k, true))}</p>
				</section>
			</div>

			<ul data-ev-id="ev_hotspot_moves" className={`mt-4 space-y-2 ${listEverywhere ? '' : 'sm:hidden'}`}>
				{hotspot.regions.map((r, i) =>
        <li data-ev-id="ev_5fd4a23298" key={i}>
						<button
            type="button"
            data-ev-id="ev_hotspot_move"
            aria-pressed={i === selected}
            onClick={() => select(i)}
            className={`w-full rounded-lg border px-3 py-2 text-start text-sm text-foreground transition-colors hover:border-primary/50 ${i === selected ? 'border-primary bg-primary/10' : found.has(i) ? 'border-primary/50' : 'border-border'}`}>
							{r.label}
						</button>
					</li>
        )}
			</ul>
			{hotspot.fallbackNote &&
      <p data-ev-id="ev_hotspot_note" className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap sm:hidden">{inlineBold(hotspot.fallbackNote)}</p>
      }

			{/* Announced as the learner picks each move; the closing line lands once all are found. */}
			<div data-ev-id="ev_hotspot_result" aria-live="polite" role="status" className="mt-4">
				{current &&
        <div data-ev-id="ev_hotspot_explain" className="rounded-lg border border-border p-4">
						<p data-ev-id="ev_hotspot_label" className="text-sm font-medium text-primary">{current.label}</p>
						<p data-ev-id="ev_hotspot_body" className="mt-1 text-foreground whitespace-pre-wrap">{inlineBold(current.body)}</p>
						{allFound && hotspot.complete &&
          <p data-ev-id="ev_hotspot_complete" className="mt-3 font-medium text-foreground whitespace-pre-wrap">{inlineBold(hotspot.complete)}</p>
          }
					</div>
        }
			</div>
		</div>);
}