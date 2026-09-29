/**
 * Item 116. The vc4el-source contract's "Scoring" section (v2, 2026-09-29), in ONE place.
 *
 * Every grader in the Academy calls this — the graded submit (useQuiz), the author's preview and
 * the review screen (QuizPage), and the lesson `check` renderer — so a learner can never be scored
 * two ways. Spark's player implements the same text; the worked cases in the contract are the test.
 *
 *  - single / true_false: f = 1 if the selected index equals `correct`, otherwise 0.
 *  - multi: f = max(0, (R - W) / K) — K correct options, R of them selected, W wrong ones selected.
 *  - unanswered: f = 0.
 *  - quiz score % = round(100 x sum(f x points) / sum(points)), rounded ONCE, an exact half UP.
 *
 * Scores already recorded under all-or-nothing are NOT regraded (contract: do not backfill).
 */

export type QuestionVerdict = 'correct' | 'partial' | 'incorrect';

export function questionFraction(questionType: string, correct: unknown, answer: unknown): number {
	if (questionType === 'multi') {
		if (!Array.isArray(correct) || correct.length === 0) return 0;
		const key = new Set(correct.map(Number));
		const picked = new Set(Array.isArray(answer) ? answer.map(Number) : []);
		let right = 0;
		let wrong = 0;
		for (const i of picked) {
			if (key.has(i)) right++;
			else wrong++;
		}
		return Math.max(0, (right - wrong) / key.size);
	}
	if (answer === undefined || answer === null) return 0;
	return String(answer) === String(correct) ? 1 : 0;
}

export function verdictOf(fraction: number): QuestionVerdict {
	if (fraction >= 1) return 'correct';
	return fraction > 0 ? 'partial' : 'incorrect';
}

export function scoreQuiz(
	questions: { id: string; question_type: string; correct: unknown; points: number | null }[],
	answers: Record<string, unknown>
): number {
	let earned = 0;
	let total = 0;
	for (const q of questions) {
		const points = q.points || 1;
		total += points;
		earned += questionFraction(q.question_type, q.correct, answers[q.id]) * points;
	}
	// + 1e-9: a true .5 can arrive as .49999... in floating point and must still round UP.
	return total > 0 ? Math.round((100 * earned) / total + 1e-9) : 0;
}
