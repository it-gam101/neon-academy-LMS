import { useEffect, useRef, useState } from 'react';
import type { getDictionary } from '@/i18n/dictionary';
import { inlineBold } from '@/lib/inlineText';
import { endingFor, type SimulatorData } from '@/lib/simulatorParser';

/**
 * Item 109 step 2, renderer 5 — the lesson `simulator` interaction, as Spark's player renders it: one turn at a time
 * ("Turn 2 of 4"), a narration keyed by the choice before, and that turn's choices; after the last turn, the path
 * taken (each move by its tag's name) and the ending that path earned. Worked = an ending reached (Spark's rule,
 * Isaac 2026-10-06) — `onWorked` is called once. Academy addition (Isaac 2026-10-06): "Start again" after the
 * ending, to try another path; it does not change completion. Rendered INSTEAD of the block's prose. Writes nothing
 * itself, locks nothing.
 */

export function SimulatorInteraction({ simulator, locale, dict, blockKey, onWorked }: {simulator: SimulatorData;locale: 'en' | 'he';dict: ReturnType<typeof getDictionary>;blockKey: string;onWorked?: (blockKey: string) => void;}) {
  const [path, setPath] = useState<string[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const reported = useRef(false);
  const moved = useRef(false);
  const total = simulator.steps.length;
  const step = path.length < total ? simulator.steps[path.length] : null;
  const narration = step ? step.narration[path.length === 0 ? 'start' : path[path.length - 1]] ?? '' : '';
  const ending = step ? null : endingFor(simulator, path);

  // After each move, and on "Start again", the focus goes to the scene, so a keyboard learner is not dropped on
  // <body> when the buttons they were on are replaced. Not on the first render.
  useEffect(() => {
    if (moved.current) stageRef.current?.focus();
  }, [path.length]);

  const choose = (tag: string) => {
    moved.current = true;
    const next = [...path, tag];
    setPath(next);
    if (next.length >= total && !reported.current) {
      reported.current = true;
      onWorked?.(blockKey);
    }
  };

  const restart = () => {
    moved.current = true;
    setPath([]);
  };

  return (
    <div data-ev-id="ev_lesson_simulator" lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} className="my-6 rounded-lg border border-border bg-background/40 p-5">
			{step &&
      <p data-ev-id="ev_simulator_turn" className="text-sm text-muted-foreground">{dict.course.simulatorTurn} {path.length + 1} {dict.common.of} {total}</p>
      }
			{/* The scene: announced as it changes, and focused after each move. */}
			<div ref={stageRef} tabIndex={-1} data-ev-id="ev_simulator_stage" aria-live="polite" role="status" className="mt-2 outline-none">
				{step && narration &&
        <p data-ev-id="ev_simulator_narration" className="text-foreground whitespace-pre-wrap">{inlineBold(narration)}</p>
        }
				{ending &&
        <>
						{simulator.summaryHeading && <h4 data-ev-id="ev_simulator_summary" className="text-sm font-semibold text-foreground">{simulator.summaryHeading}</h4>}
						<ol data-ev-id="ev_simulator_path" className="mt-2 list-decimal space-y-1 ps-6 text-sm text-muted-foreground">
							{path.map((tag, i) => <li data-ev-id="ev_e03a21eddb" key={i}>{simulator.tags[tag] || tag}</li>)}
						</ol>
						{ending.title && <h4 data-ev-id="ev_simulator_ending_title" className="mt-4 font-semibold text-primary">{ending.title}</h4>}
						{ending.body && <p data-ev-id="ev_simulator_ending_body" className="mt-1 text-foreground whitespace-pre-wrap">{inlineBold(ending.body)}</p>}
					</>
        }
			</div>
			{step ?
      <ul data-ev-id="ev_simulator_choices" className="mt-4 space-y-2">
					{step.choices.map((c, i) =>
        <li data-ev-id="ev_bfec192aaa" key={`${path.length}-${i}`}>
							<button
            type="button"
            data-ev-id="ev_simulator_choice"
            onClick={() => choose(c.tag)}
            className="w-full rounded-lg border border-border px-3 py-2 text-start text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5">
								{inlineBold(c.text)}
							</button>
						</li>
        )}
				</ul> :
      <button
        type="button"
        data-ev-id="ev_simulator_restart"
        onClick={restart}
        className="mt-4 px-4 py-2 border border-border text-foreground rounded-lg hover:border-primary/50 transition-colors">
					{dict.course.simulatorRestart}
				</button>
      }
		</div>);
}