import { useState } from 'react';
import { inlineBold } from '@/lib/inlineText';
import type { BranchingData, BranchOption } from '@/lib/branchingParser';

/**
 * Item 109 step 2, renderer 4 — the lesson `branching` interaction, as Spark's player renders it: a setup, a
 * question, and one choice per branch. Taking a choice shows who reacts and how, the debrief, and the line back to
 * the choices; every choice stays open, so the learner is never left at a dead end. The finale is EARNED: it
 * appears only once every branch has been tried. Worked = every branch tried AND the finale opened (every branch
 * alone when there is no finale) — Spark's rule, Isaac 2026-10-06 — and then `onWorked` is called once. Rendered
 * INSTEAD of the block's prose. Writes nothing itself, locks nothing.
 */

export function BranchingInteraction({ branching, locale, blockKey, onWorked }: {branching: BranchingData;locale: 'en' | 'he';blockKey: string;onWorked?: (blockKey: string) => void;}) {
  const [current, setCurrent] = useState<number | null>(null);
  const [tried, setTried] = useState<Set<number>>(() => new Set());
  const [finaleOpened, setFinaleOpened] = useState(false);
  const n = branching.branches.length;
  const finale = branching.finale;
  const unlocked = !!finale && tried.size === n;
  // The finale is index n, after the branches.
  const shown: BranchOption | null = current === null ? null : current === n ? finale : branching.branches[current];

  const choose = (i: number) => {
    setCurrent(i);
    const nextTried = i < n && !tried.has(i) ? new Set(tried).add(i) : tried;
    const nextFinale = finaleOpened || i === n;
    setTried(nextTried);
    setFinaleOpened(nextFinale);
    const was = tried.size === n && (!finale || finaleOpened);
    const now = nextTried.size === n && (!finale || nextFinale);
    if (now && !was) onWorked?.(blockKey);
  };

  const option = (o: BranchOption, i: number) =>
  <label key={i} data-ev-id="ev_branching_option" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-foreground transition-colors ${i === current ? 'bg-primary/10 border-primary' : tried.has(i) || i === n && finaleOpened ? 'border-primary/50 hover:border-primary' : 'border-border hover:border-primary/50'}`}>
			<input data-ev-id="ev_6ddfa269b5"
    type="radio"
    name={`branching-${blockKey}`}
    className="mt-1 accent-primary"
    checked={i === current}
    onChange={() => choose(i)} />
			<span data-ev-id="ev_0d2227bd84" className="flex-1 whitespace-pre-wrap">{inlineBold(o.choice)}</span>
		</label>;

  return (
    <div data-ev-id="ev_lesson_branching" lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} className="my-6 rounded-lg border border-border bg-background/40 p-5">
			{branching.setup &&
      <p data-ev-id="ev_branching_setup" className="mb-4 text-foreground whitespace-pre-wrap">{inlineBold(branching.setup)}</p>
      }
			<fieldset data-ev-id="ev_branching_choices" className="space-y-2">
				{branching.prompt && <legend data-ev-id="ev_branching_prompt" className="mb-3 font-medium text-foreground">{branching.prompt}</legend>}
				{branching.branches.map((o, i) => option(o, i))}
				{unlocked && finale &&
        <>
						{finale.unlock && <p data-ev-id="ev_branching_unlock" className="pt-2 text-sm text-muted-foreground whitespace-pre-wrap">{inlineBold(finale.unlock)}</p>}
						{option(finale, n)}
					</>
        }
			</fieldset>

			{/* One live region for every consequence: heard without the focus leaving the choice just made. */}
			<div data-ev-id="ev_branching_result" aria-live="polite" role="status" className="mt-4">
				{shown &&
        <div data-ev-id="ev_branching_consequence" className="rounded-lg border border-border p-4">
						{shown.reaction.speaker && <p data-ev-id="ev_branching_speaker" className="text-sm font-medium text-primary">{shown.reaction.speaker}</p>}
						{shown.reaction.text && <p data-ev-id="ev_branching_reaction" className="mt-1 text-foreground whitespace-pre-wrap">{inlineBold(shown.reaction.text)}</p>}
						{shown.debrief && <p data-ev-id="ev_branching_debrief" className="mt-3 text-foreground whitespace-pre-wrap">{inlineBold(shown.debrief)}</p>}
						{branching.trunkReturn && <p data-ev-id="ev_branching_trunk" className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{inlineBold(branching.trunkReturn)}</p>}
					</div>
        }
			</div>
		</div>);
}