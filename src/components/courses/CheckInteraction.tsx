import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { getDictionary } from '@/i18n/dictionary';
import { questionFraction, verdictOf } from '@/lib/grading';
import type { CheckData } from '@/lib/checkParser';
import { inlineBold } from '@/lib/inlineText';

/**
 * Item 109 step 2 — the lesson `check` interaction (vc4el-source v2, "check", 2026-09-29).
 *
 * A short UNGRADED practice question. It writes NOTHING (no module_progress, no quiz_attempts, no
 * enrollment change), locks nothing, and is judged by the same shared grader as a quiz, with its
 * three verdicts. Rendered INSTEAD of the block's prose, never beside it: the prose ends in the answer.
 * Item 119: "Check answer" also calls `onAnswered` (any answer, right or wrong). The check itself still
 * writes nothing; the lesson page completes the lesson once every activity in it is done (item 109e).
 *
 * The strings come from an imported file, so they are untrusted: rendered as React text only —
 * never innerHTML — with the contract's one formatting rule, **bold**, and newlines.
 */

type Locale = 'en' | 'he';

export function CheckInteraction({ check, locale, dict, blockKey, onAnswered




}: {check: CheckData;locale: Locale;dict: ReturnType<typeof getDictionary>;blockKey: string;onAnswered?: (blockKey: string) => void;}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const multi = check.questionType === 'multi';
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const correctSet = new Set(Array.isArray(check.correct) ? check.correct : [check.correct]);

  const verdict = checked ?
  verdictOf(questionFraction(check.questionType, check.correct, multi ? picked : picked[0])) :
  null;

  const toggle = (i: number) => {
    if (checked) return;
    setPicked((prev) => multi ? prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i] : [i]);
  };

  return (
    <fieldset data-ev-id="ev_lesson_check" lang={locale} dir={dir} className="my-6 rounded-lg border border-border bg-background/40 p-5">
			<legend data-ev-id="ev_lesson_check_legend" className="px-1">
				<span data-ev-id="ev_c7d262cb8e" className="block text-xs font-medium uppercase tracking-wide text-primary">{dict.quiz.checkEyebrow}</span>
			</legend>
			<p data-ev-id="ev_lesson_check_question" className="mb-1 font-medium text-foreground whitespace-pre-wrap">{inlineBold(check.question)}</p>
			<p data-ev-id="ev_lesson_check_hint" className="mb-4 text-sm text-muted-foreground">
				{multi ? dict.quiz.selectAll : check.questionType === 'true_false' ? dict.quiz.trueOrFalse : dict.quiz.selectOne}
			</p>

			<div data-ev-id="ev_lesson_check_options" className="space-y-2">
				{check.options.map((opt, i) => {
          const isPicked = picked.includes(i);
          const isKey = correctSet.has(i);
          const tone = !checked ?
          isPicked ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50' :
          isKey ? 'bg-primary/10 border-primary/50' : isPicked ? 'bg-destructive/10 border-destructive/50' : 'border-border';
          return (
            <div data-ev-id="ev_lesson_check_option" key={i}>
							<label data-ev-id="ev_7152d459ce" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-foreground transition-colors ${tone} ${checked ? 'cursor-default' : ''}`}>
								<input data-ev-id="ev_98e58d6e8c"
                type={multi ? 'checkbox' : 'radio'}
                name={`check-${blockKey}`}
                className="mt-1 accent-primary"
                checked={isPicked}
                disabled={checked}
                onChange={() => toggle(i)} />
								<span data-ev-id="ev_4ff070ef42" className="flex-1 whitespace-pre-wrap">{inlineBold(opt.text)}</span>
								{checked && isKey &&
                <span data-ev-id="ev_661e48c547" className="text-xs font-medium text-primary">{dict.quiz.correct}</span>
                }
							</label>
							{checked && opt.feedback &&
              <p data-ev-id="ev_lesson_check_feedback" className="mt-1 ps-9 text-sm text-muted-foreground whitespace-pre-wrap">{inlineBold(opt.feedback)}</p>
              }
						</div>);
        })}
			</div>

			{/* Announced once, when the learner checks. */}
			<div data-ev-id="ev_lesson_check_result" aria-live="polite" className="mt-4">
				{checked && verdict &&
        <div data-ev-id="ev_7929849d88" className="rounded-lg border border-border p-4">
						<p data-ev-id="ev_lesson_check_verdict" className="flex items-center gap-2 font-medium text-foreground">
							{verdict === 'correct' ?
            <CheckCircle className="h-5 w-5 text-primary" /> :
            verdict === 'partial' ?
            <AlertCircle className="h-5 w-5 text-yellow-500" /> :
            <XCircle className="h-5 w-5 text-destructive" />}
							{verdict === 'correct' ? dict.quiz.correct : verdict === 'partial' ? dict.quiz.partlyCorrect : dict.quiz.incorrect}
						</p>
						<p data-ev-id="ev_lesson_check_answer" className="mt-2 text-sm text-foreground">
							<span data-ev-id="ev_bde16da1ab" className="font-medium">{(multi ? dict.quiz.checkCorrectAnswers : dict.quiz.correctAnswer) + ": "}</span>
							{check.options.filter((_, i) => correctSet.has(i)).map((o) => o.text.replace(/\*\*/g, '')).join('; ')}
						</p>
						<p data-ev-id="ev_lesson_check_explanation" className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{inlineBold(check.explanation)}</p>
					</div>
        }
			</div>

			<div data-ev-id="ev_ca815576d9" className="mt-4">
				{!checked ?
        <button
          data-ev-id="ev_lesson_check_submit"
          type="button"
          disabled={picked.length === 0}
          onClick={() => {setChecked(true);onAnswered?.(blockKey);}}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
						{dict.quiz.checkAnswer}
					</button> :
        <button
          data-ev-id="ev_lesson_check_again"
          type="button"
          onClick={() => {setPicked([]);setChecked(false);}}
          className="px-4 py-2 border border-border text-foreground rounded-lg hover:border-primary/50 transition-colors">
						{dict.quiz.checkTryAgain}
					</button>
        }
			</div>
		</fieldset>);
}