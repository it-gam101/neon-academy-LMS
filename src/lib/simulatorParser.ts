/**
 * Item 109 step 2, renderer 5 — parser for the lesson `simulator` interaction (vc4el-source contract v2).
 * Kept apart from the component for react-refresh/only-export-components.
 *
 * A fixed number of turns; each turn a narration and a few choices, each choice carrying a TAG. The narration of a
 * turn is keyed by the tag chosen on the turn before (`start` on the first). After the last turn the endings are
 * tested IN ARRAY ORDER and the first match wins; `default` must exist and be last.
 *
 * ⚠️ `when` is DATA, never code: it is matched against the contract's exact grammar and nothing else —
 * `default`, or `<tag> >= <n>` (one space either side, `<n>` without sign or leading zeros, `<tag>` a key of `tags`).
 * Anything else makes the WHOLE simulator malformed, and the caller renders the prose. Never eval.
 */

type Locale = 'en' | 'he';
type LocaleMap = Record<string, unknown>;

export interface SimChoice {
	tag: string;
	text: string;
}

export interface SimStep {
	/** By `start` (first turn) or by the tag chosen on the turn before; '' when the author wrote none. */
	narration: Record<string, string>;
	choices: SimChoice[];
}

export interface SimEnding {
	/** null = `default`. */
	when: {tag: string;min: number;} | null;
	title: string;
	body: string;
}

export interface SimulatorData {
	/** Display name of each tag in the learner's language ('' when missing — the caller shows the tag itself). */
	tags: Record<string, string>;
	steps: SimStep[];
	endings: SimEnding[];
	summaryHeading: string;
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const WHEN = /^([A-Za-z0-9_-]{1,64}) >= (0|[1-9][0-9]*)$/;

const isObj = (v: unknown): v is LocaleMap => typeof v === 'object' && v !== null && !Array.isArray(v);
const textIn = (v: unknown, locale: Locale): string => {
	if (!isObj(v)) return '';
	const s = v[locale];
	return typeof s === 'string' ? s.trim() : '';
};

/** Returns the simulator for the learner's locale, or null when it is malformed — the caller then renders the prose. */
export function parseSimulator(raw: unknown, locale: Locale): SimulatorData | null {
	if (!isObj(raw) || raw.type !== 'simulator' || !isObj(raw.tags)) return null;
	const turns = raw.turns;
	if (typeof turns !== 'number' || !Number.isInteger(turns) || turns < 1 || turns > 12) return null;
	if (!Array.isArray(raw.steps) || raw.steps.length !== turns) return null;
	if (!Array.isArray(raw.endings) || raw.endings.length < 1 || raw.endings.length > 32) return null;

	const tagKeys = Object.keys(raw.tags);
	if (tagKeys.length < 1 || !tagKeys.every((k) => ID.test(k))) return null;
	// Exact membership: a Set and prototype-free maps, so a tag can never match an inherited name.
	const declared = new Set(tagKeys);
	const tags: Record<string, string> = Object.create(null);
	for (const k of tagKeys) tags[k] = textIn(raw.tags[k], locale);

	const steps: SimStep[] = [];
	for (const s of raw.steps) {
		if (!isObj(s) || !Array.isArray(s.choices) || s.choices.length < 1 || s.choices.length > 6) return null;
		const choices: SimChoice[] = [];
		for (const c of s.choices) {
			// A choice must carry a declared tag and be readable in the learner's language.
			if (!isObj(c) || typeof c.tag !== 'string' || !declared.has(c.tag)) return null;
			const text = textIn(c.text, locale);
			if (!text) return null;
			choices.push({ tag: c.tag, text });
		}
		const narration: Record<string, string> = Object.create(null);
		if (isObj(s.narration)) for (const k of Object.keys(s.narration)) narration[k] = textIn(s.narration[k], locale);
		steps.push({ narration, choices });
	}

	const endings: SimEnding[] = [];
	raw.endings.forEach((e) => {
		if (!isObj(e) || typeof e.when !== 'string') return;
		const m = WHEN.exec(e.when);
		const when = e.when === 'default' ? null : m && declared.has(m[1]) ? { tag: m[1], min: Number(m[2]) } : undefined;
		if (when === undefined) return;
		endings.push({ when, title: textIn(e.title, locale), body: textIn(e.body, locale) });
	});
	// Every ending valid, `default` last and only last.
	if (endings.length !== raw.endings.length) return null;
	if (endings[endings.length - 1].when !== null || endings.slice(0, -1).some((e) => e.when === null)) return null;

	return { tags, steps, endings, summaryHeading: textIn(raw.summaryHeading, locale) };
}

/** The ending for a finished path: the first in array order whose condition holds; `default` (last) always does. */
export function endingFor(sim: SimulatorData, path: string[]): SimEnding {
	const count = (tag: string) => path.filter((t) => t === tag).length;
	return sim.endings.find((e) => e.when === null || count(e.when.tag) >= e.when.min) ?? sim.endings[sim.endings.length - 1];
}
