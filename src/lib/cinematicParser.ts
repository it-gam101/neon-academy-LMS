/**
 * Item 109 step 2, renderer 2 — parser for the lesson `cinematic-scroll` interaction
 * (vc4el-source contract v2). Kept apart from the component for react-refresh/only-export-components.
 *
 * Rendered as STATIC stacked panels, as Spark's player does (Isaac's ruling 2026-09-24: static first).
 */

type Locale = 'en' | 'he';
type LocaleMap = Record<string, unknown>;

export interface CinematicState {
	image: string | null;
	alt: string;
	eyebrow: string;
	title: string;
	body: string;
}

export interface CinematicData {
	states: CinematicState[];
}

const isObj = (v: unknown): v is LocaleMap => typeof v === 'object' && v !== null && !Array.isArray(v);
const textIn = (v: unknown, locale: Locale): string => {
	if (!isObj(v)) return '';
	const s = v[locale];
	return typeof s === 'string' ? s.trim() : '';
};

// An image arrives as an absolute https URL: the import resolves the package path to the package's own
// storage. Anything else is missing media for that state, and the panel's words stand alone
// (contract, "Media inside an interaction").
const imageOf = (v: unknown): string | null => typeof v === 'string' && /^https:\/\/\S+$/.test(v) ? v : null;

/** Returns the tour for the learner's locale, or null when it is malformed — the caller then renders the prose. */
export function parseCinematic(raw: unknown, locale: Locale): CinematicData | null {
	if (!isObj(raw) || raw.type !== 'cinematic-scroll') return null;
	if (!Array.isArray(raw.states) || raw.states.length < 1 || raw.states.length > 64) return null;

	const states: CinematicState[] = [];
	for (const s of raw.states) {
		if (!isObj(s)) return null;
		states.push({
			image: imageOf(s.image),
			alt: textIn(s.alt, locale),
			eyebrow: textIn(s.eyebrow, locale),
			title: textIn(s.title, locale),
			body: textIn(s.body, locale)
		});
	}

	// A tour with no words at all in the learner's language says nothing: render the prose instead.
	if (!states.some((s) => s.title || s.body)) return null;
	return { states };
}
