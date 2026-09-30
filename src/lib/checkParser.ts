/**
 * Item 109 step 2 — parser for the lesson `check` interaction.
 * Separated from the component to satisfy react-refresh/only-export-components.
 */

type Locale = 'en' | 'he';
type LocaleMap = Record<string, unknown>;

export interface CheckData {
	questionType: 'single' | 'multi' | 'true_false';
	question: string;
	options: { text: string; feedback: string | null }[];
	correct: number | number[];
	explanation: string;
}

// Contract invariant 5: the canonical true/false pair, index 0 true, compared as exact strings.
const TRUE_FALSE: Record<Locale, [string, string]> = { en: ['True', 'False'], he: ['נכון', 'לא נכון'] };

const isObj = (v: unknown): v is LocaleMap => typeof v === 'object' && v !== null && !Array.isArray(v);
const textIn = (v: unknown, locale: Locale): string | null => {
	if (!isObj(v)) return null;
	const s = v[locale];
	return typeof s === 'string' && s.trim() !== '' ? s : null;
};

/** Returns the check for the learner's locale, or null when it is malformed — the caller then renders the prose. */
export function parseCheck(raw: unknown, locale: Locale): CheckData | null {
	if (!isObj(raw) || raw.type !== 'check') return null;
	const questionType = raw.question_type;
	if (questionType !== 'single' && questionType !== 'multi' && questionType !== 'true_false') return null;
	if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > 6) return null;
	const n = raw.options.length;

	const options: CheckData['options'] = [];
	for (const o of raw.options) {
		if (!isObj(o)) return null;
		const text = textIn(o.text, locale);
		if (text === null) return null; // a required string is empty
		options.push({ text, feedback: textIn(o.feedback, locale) }); // empty feedback is simply not shown
	}

	if (questionType === 'true_false') {
		if (n !== 2) return null;
		for (const l of ['en', 'he'] as Locale[]) {
			const [t, f] = raw.options as LocaleMap[];
			if (!isObj(t.text) || !isObj(f.text) || t.text[l] !== TRUE_FALSE[l][0] || f.text[l] !== TRUE_FALSE[l][1]) return null;
		}
	}

	const inRange = (i: unknown): i is number => Number.isInteger(i) && (i as number) >= 0 && (i as number) < n;
	let correct: number | number[];
	if (questionType === 'multi') {
		const c = raw.correct;
		if (!Array.isArray(c) || c.length === 0 || !c.every(inRange) || new Set(c).size !== c.length) return null;
		correct = c as number[];
	} else {
		if (!inRange(raw.correct)) return null;
		correct = raw.correct;
	}

	const question = textIn(raw.question, locale);
	const explanation = textIn(raw.explanation, locale);
	if (question === null || explanation === null) return null;

	return { questionType, question, options, correct, explanation };
}
