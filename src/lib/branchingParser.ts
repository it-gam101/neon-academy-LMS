/**
 * Item 109 step 2, renderer 4 — parser for the lesson `branching` interaction (vc4el-source contract v2).
 * Kept apart from the component for react-refresh/only-export-components.
 *
 * ⚠️ `reaction` is the contract's one non-uniform shape: a locale map with one extra key,
 * `{ speaker: {en, he}, en, he }`. It is normalised here to `{ speaker, text }`, as Spark does — read as a plain
 * locale map, `speaker` would render as if it were a language.
 */

type Locale = 'en' | 'he';
type LocaleMap = Record<string, unknown>;

export interface BranchReaction {
	speaker: string;
	text: string;
}

export interface BranchOption {
	choice: string;
	reaction: BranchReaction;
	debrief: string;
}

export interface BranchingData {
	setup: string;
	prompt: string;
	branches: BranchOption[];
	trunkReturn: string;
	/** Offered only once every branch has been tried; null when the author wrote none. */
	finale: (BranchOption & {unlock: string;}) | null;
}

const isObj = (v: unknown): v is LocaleMap => typeof v === 'object' && v !== null && !Array.isArray(v);
const textIn = (v: unknown, locale: Locale): string => {
	if (!isObj(v)) return '';
	const s = v[locale];
	return typeof s === 'string' ? s.trim() : '';
};

// Indexed by locale, never walked by key: that is what keeps `speaker` out of the text.
const reactionOf = (v: unknown, locale: Locale): BranchReaction =>
isObj(v) ? { speaker: textIn(v.speaker, locale), text: textIn(v, locale) } : { speaker: '', text: '' };

/** A choice the learner cannot read cannot be taken: null, and the caller decides what that means. */
const optionOf = (v: unknown, locale: Locale): BranchOption | null => {
	if (!isObj(v)) return null;
	const choice = textIn(v.choice, locale);
	if (!choice) return null;
	return { choice, reaction: reactionOf(v.reaction, locale), debrief: textIn(v.debrief, locale) };
};

/** Returns the branching for the learner's locale, or null when it is malformed — the caller then renders the prose. */
export function parseBranching(raw: unknown, locale: Locale): BranchingData | null {
	if (!isObj(raw) || raw.type !== 'branching') return null;
	if (!Array.isArray(raw.branches) || raw.branches.length < 1 || raw.branches.length > 8) return null;

	const branches: BranchOption[] = [];
	for (const b of raw.branches) {
		const option = optionOf(b, locale);
		if (!option) return null;
		branches.push(option);
	}

	// A finale whose choice is missing in this language could never be opened, so it is treated as absent:
	// the branching is then worked once every branch has been tried, exactly as one authored without a finale.
	const finaleOption = optionOf(raw.finale, locale);
	const finale = finaleOption && isObj(raw.finale) ? { ...finaleOption, unlock: textIn(raw.finale.unlock, locale) } : null;

	return {
		setup: textIn(raw.setup, locale),
		prompt: textIn(raw.prompt, locale),
		branches,
		trunkReturn: textIn(raw.trunkReturn, locale),
		finale
	};
}
