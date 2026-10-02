import { useState } from 'react';
import { inlineBold } from '@/lib/inlineText';
import type { CinematicData, CinematicState } from '@/lib/cinematicParser';

/**
 * Item 109 step 2, renderer 2 — the lesson `cinematic-scroll` interaction, as STATIC stacked panels in
 * reading order (Spark's player does the same; Isaac ruled static first, 2026-09-24). Each panel: its
 * image, then eyebrow, title and body — text is never laid over the image, which would need a gradient
 * scrim the design rules exclude. Rendered INSTEAD of the block's prose. Writes nothing, locks nothing.
 */

function TourPanel({ state }: {state: CinematicState;}) {
	const [failed, setFailed] = useState(false);
	return (
		<article data-ev-id="ev_tour_state" className="overflow-hidden rounded-lg border border-border bg-background/40">
			{state.image && !failed &&
			<img
				data-ev-id="ev_tour_image"
				src={state.image}
				alt={state.alt}
				loading="lazy"
				onError={() => setFailed(true)}
				className="aspect-video w-full object-cover" />
			}
			<div data-ev-id="ev_tour_copy" className="p-5">
				{state.eyebrow &&
				<span data-ev-id="ev_tour_eyebrow" className="block text-xs font-medium uppercase tracking-wide text-primary">{state.eyebrow}</span>
				}
				{state.title &&
				<h3 data-ev-id="ev_tour_title" className="mt-1 text-lg font-semibold text-foreground">{state.title}</h3>
				}
				{state.body &&
				<p data-ev-id="ev_tour_body" className="mt-2 whitespace-pre-wrap leading-relaxed text-muted-foreground">{inlineBold(state.body)}</p>
				}
			</div>
		</article>);
}

export function CinematicScroll({ tour, locale }: {tour: CinematicData;locale: 'en' | 'he';}) {
	return (
		<div data-ev-id="ev_lesson_tour" lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} className="my-6 space-y-6">
			{tour.states.map((state, i) =>
			<TourPanel key={i} state={state} />
			)}
		</div>);
}
