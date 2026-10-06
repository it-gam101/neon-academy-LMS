/**
 * Item 109 step 2, renderer 3 — parser for the lesson `hotspot` interaction (vc4el-source contract v2).
 * Kept apart from the component for react-refresh/only-export-components.
 *
 * NOT an image hotspot: a TEXT-SPAN comparison of two columns, as Spark's player renders it. Each region names
 * an exact substring of each column's text, in the same locale. An unmatched span is a data defect, not a reason
 * to fail: that text stays unhighlighted (contract, "hotspot").
 */

type Locale = 'en' | 'he';
type LocaleMap = Record<string, unknown>;

export interface HotspotRegion {
	label: string;
	announcementSpan: string;
	invitationSpan: string;
	body: string;
}

export interface HotspotColumn {
	label: string;
	text: string;
}

export interface HotspotData {
	prompt: string;
	announcement: HotspotColumn;
	invitation: HotspotColumn;
	regions: HotspotRegion[];
	complete: string;
	fallbackNote: string;
}

/** A run of a column's text: highlighted for one region, or plain (`region` null). */
export interface HotspotPiece {
	text: string;
	region: number | null;
}

const isObj = (v: unknown): v is LocaleMap => typeof v === 'object' && v !== null && !Array.isArray(v);
// Spans and column texts are matched EXACTLY, so they are never trimmed; labels and prose are.
const rawIn = (v: unknown, locale: Locale): string => {
	if (!isObj(v)) return '';
	const s = v[locale];
	return typeof s === 'string' ? s : '';
};
const textIn = (v: unknown, locale: Locale): string => rawIn(v, locale).trim();

const columnOf = (v: unknown, locale: Locale): HotspotColumn | null => {
	if (!isObj(v)) return null;
	const text = rawIn(v.text, locale);
	return text.trim() ? { label: textIn(v.label, locale), text } : null;
};

/** Returns the hotspot for the learner's locale, or null when it is malformed — the caller then renders the prose. */
export function parseHotspot(raw: unknown, locale: Locale): HotspotData | null {
	if (!isObj(raw) || raw.type !== 'hotspot' || !isObj(raw.columns)) return null;
	if (!Array.isArray(raw.regions) || raw.regions.length < 1 || raw.regions.length > 32) return null;
	const announcement = columnOf(raw.columns.announcement, locale);
	const invitation = columnOf(raw.columns.invitation, locale);
	if (!announcement || !invitation) return null;

	const regions: HotspotRegion[] = [];
	for (const r of raw.regions) {
		if (!isObj(r)) return null;
		const region = {
			label: textIn(r.label, locale),
			announcementSpan: rawIn(r.announcementSpan, locale),
			invitationSpan: rawIn(r.invitationSpan, locale),
			body: textIn(r.body, locale)
		};
		// A move the learner cannot name or read about cannot be worked: render the prose instead.
		if (!region.label || !region.body) return null;
		regions.push(region);
	}

	return {
		prompt: textIn(raw.prompt, locale),
		announcement,
		invitation,
		regions,
		complete: textIn(raw.complete, locale),
		fallbackNote: textIn(raw.fallbackNote, locale)
	};
}

/**
 * Splits a column's text into plain and highlighted pieces, as Spark's `renderHotspot` does. `missed` lists the
 * regions with no highlight in this column: the span is empty, not found, or overlaps an earlier one (the earlier
 * wins — splitting the text twice would repeat words the learner reads).
 */
export function segmentColumn(text: string, regions: HotspotRegion[], spanKey: 'announcementSpan' | 'invitationSpan'): {pieces: HotspotPiece[];missed: number[];} {
	const hits: { at: number; len: number; region: number }[] = [];
	const missed: number[] = [];
	regions.forEach((r, i) => {
		const needle = r[spanKey];
		const at = needle ? text.indexOf(needle) : -1;
		if (at < 0) missed.push(i);
		else hits.push({ at, len: needle.length, region: i });
	});
	hits.sort((a, b) => a.at - b.at);

	const pieces: HotspotPiece[] = [];
	let cursor = 0;
	for (const hit of hits) {
		if (hit.at < cursor) {
			missed.push(hit.region);
			continue;
		}
		if (hit.at > cursor) pieces.push({ text: text.slice(cursor, hit.at), region: null });
		pieces.push({ text: text.slice(hit.at, hit.at + hit.len), region: hit.region });
		cursor = hit.at + hit.len;
	}
	if (cursor < text.length) pieces.push({ text: text.slice(cursor), region: null });
	return { pieces, missed };
}
