/**
 * Neon Academy — vc4el-source sidecar parser (slice 9d).
 *
 * PURE. No network, no DOM, no Supabase. Takes the parsed sidecar JSON plus the
 * list of paths present in the archive, and returns either a refusal or an
 * import plan.
 *
 * CONTRACT RULES THIS ENCODES (vc4el-source contract, v2):
 *  - A v2 consumer MUST accept v1, treating it as locales: ["en","he"].
 *  - MUST reject a version above the one it supports, with a surfaced message.
 *  - CONTAINS, not EQUALS: import when `locales` contains every locale WE
 *    require. Locales we cannot store are IGNORED, never a reason to reject.
 *  - Degradation is of the FEATURE, never the upload: every refusal here must
 *    still leave a working plain SCORM upload behind.
 *  - Consumers MUST ignore unknown keys, and MUST NOT key on generator.name.
 *
 * THE TRAP THAT LOOKS LIKE CARE: do NOT validate a one-to-one mapping of
 * packagePath -> archive file. The generator deduplicates by content hash, so
 * one file legitimately backs several blocks. The invariant is "every
 * packagePath resolves, and every bundled media file is referenced at least
 * once" — a bijection check REJECTS A CORRECT PACKAGE.
 */

export const REQUIRED_LOCALES = ['en', 'he'];
export const MAX_VERSION = 2;

export type Vc4elRefusalCode =
	| 'absent'
	| 'unparseable'
	| 'version_too_new'
	| 'missing_required_locale';

export interface Vc4elRefusal {
	ok: false;
	code: Vc4elRefusalCode;
	detail: string;
}

export interface Vc4elNote {
	code: string;
	locales?: string[];
	detail: string;
}

export interface Vc4elBlock {
	type: string;
	content: Record<string, string>;
	packagePath?: string | null;
	url?: string;
}

export type Vc4elQuestion = {
	question_type: 'single' | 'multi' | 'true_false';
	sort_order: number;
	points: number;
	sourceModule: number | null;
	options: Record<string, unknown>[];
	correct: number | number[] | null;
} & Record<string, unknown>;

export interface Vc4elQuiz {
	pass_score: number;
	attempts_allowed: number;
	time_limit_minutes: number | null;
	shuffle_questions: boolean;
	questions: Vc4elQuestion[];
}

export type Vc4elModule = {
	module_type: 'lesson' | 'quiz';
	sort_order: number;
	quiz?: Vc4elQuiz;
	content_json?: { blocks: Vc4elBlock[] };
} & Record<string, unknown>;

export type Vc4elCourse = {
	estimated_minutes: number | null;
} & Record<string, unknown>;

export interface Vc4elPlan {
	ok: true;
	version: number;
	locales: string[];
	ignoredLocales: string[];
	course: Vc4elCourse;
	modules: Vc4elModule[];
	problems: Vc4elNote[];
	warnings: Vc4elNote[];
}

export type Vc4elResult = Vc4elPlan | Vc4elRefusal;

export interface Vc4elParseOptions {
	requiredLocales?: string[];
	maxVersion?: number;
	/** Archive paths RELATIVE TO THE PACKAGE ROOT. null = skip media resolution. */
	archivePaths?: string[] | null;
}

interface ParseCtx {
	required: string[];
	problems: Vc4elNote[];
	mediaRefs: { path: string; block: Vc4elBlock }[];
}

const isObj = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const numOrNull = (v: unknown): number | null =>
	typeof v === 'number' && Number.isFinite(v) ? v : null;
const refuse = (code: Vc4elRefusalCode, detail: string): Vc4elRefusal => ({ ok: false, code, detail });

/** Strip anything that is not the permitted mini-markdown subset. */
export function stripHtml(text: unknown): string {
	if (typeof text !== 'string') return '';
	// Remove tags outright rather than escaping them: Academy renders block text
	// through dangerouslySetInnerHTML, and this content is machine-authored.
	return text.replace(/<[^>]*>/g, '');
}

const YOUTUBE_EMBED = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{6,}(\?|$)/;
const HTTPS_ABS = /^https:\/\/.+/;

export function parseVc4elSource(raw: unknown, opts: Vc4elParseOptions = {}): Vc4elResult {
	const required = opts.requiredLocales ?? REQUIRED_LOCALES;
	const maxVersion = opts.maxVersion ?? MAX_VERSION;
	const archivePaths = opts.archivePaths ?? null; // null = skip media resolution

	if (raw == null) return refuse('absent', 'No vc4el-source.json in the package.');
	if (!isObj(raw)) return refuse('unparseable', 'Sidecar is not a JSON object.');

	// version
	const version = raw.vc4elSource;
	if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
		return refuse('unparseable', `vc4elSource is not a positive integer: ${JSON.stringify(version)}`);
	}
	if (version > maxVersion) {
		return refuse('version_too_new', `Package declares vc4elSource ${version}; this LMS supports up to ${maxVersion}.`);
	}

	// locales: v1 has none and means ["en","he"]
	let locales: string[];
	if (version === 1) {
		locales = ['en', 'he'];
	} else {
		if (!Array.isArray(raw.locales) || raw.locales.length === 0) {
			return refuse('unparseable', 'locales must be a non-empty array.');
		}
		locales = raw.locales.filter((l): l is string => typeof l === 'string');
	}

	// CONTAINS, not EQUALS.
	const missing = required.filter((l) => !locales.includes(l));
	if (missing.length) {
		return refuse(
			'missing_required_locale',
			`Package provides [${locales.join(', ')}]; this LMS requires [${required.join(', ')}].`
		);
	}
	const ignored = locales.filter((l) => !required.includes(l));

	const problems: Vc4elNote[] = [];
	const warnings: Vc4elNote[] = [];

	if (ignored.length) {
		warnings.push({
			code: 'locales_ignored',
			locales: ignored,
			detail:
				`This package also contains ${ignored.join(', ').toUpperCase()}. ` +
				`Only ${required.join('/').toUpperCase()} will be imported, and re-exporting from here will not restore it.`,
		});
	}

	// course
	if (!isObj(raw.course)) return refuse('unparseable', 'course is missing.');
	const rawCourse = raw.course;
	const course: Vc4elCourse = { estimated_minutes: numOrNull(rawCourse.estimated_minutes) };
	for (const l of required) {
		course[`title_${l}`] = stripHtml(rawCourse[`title_${l}`] ?? '');
		course[`description_${l}`] = stripHtml(rawCourse[`description_${l}`] ?? '') || null;
		if (!nonEmpty(course[`title_${l}`])) {
			problems.push({ code: 'course_title', locales: [l], detail: `course.title_${l} is empty.` });
		}
	}

	// modules
	if (!Array.isArray(raw.modules)) return refuse('unparseable', 'modules is missing or not an array.');

	const mediaRefs: ParseCtx['mediaRefs'] = [];
	const ctx: ParseCtx = { required, problems, mediaRefs };
	const modules = raw.modules.map((m, i) => parseModule(m, i, ctx));

	// sourceModule anchors resolve by sort_order against LESSON modules only.
	const lessonOrders = new Set(
		modules.filter((m) => m.module_type === 'lesson').map((m) => m.sort_order)
	);
	for (const m of modules) {
		if (!m.quiz) continue;
		for (const q of m.quiz.questions) {
			if (q.sourceModule == null) continue; // absent is legal and different from unresolvable
			if (!lessonOrders.has(q.sourceModule)) {
				const label = typeof q.question_en === 'string' ? q.question_en.slice(0, 40) : '';
				problems.push({
					code: 'bad_source_ref',
					detail: `question "${label}…" points at sort_order ${q.sourceModule}, which is not a lesson module.`,
				});
				// DROP the anchor, do NOT reject the import. v1 packages in the wild
				// may already carry one, and the contract leaves consumer behaviour
				// unstated — dropping is the graceful reading.
				q.sourceModule = null;
			}
		}
	}

	// media resolution (needs the archive listing)
	if (archivePaths) {
		const present = new Set(archivePaths);
		const referenced = new Set<string>();
		for (const ref of mediaRefs) {
			if (present.has(ref.path)) {
				referenced.add(ref.path);
			} else {
				// Case-variant paths land here too — R2 keys are case-sensitive.
				problems.push({ code: 'unresolved', detail: `packagePath "${ref.path}" is not in the archive.` });
				ref.block.packagePath = null;
			}
		}
		const mediaLike = archivePaths.filter((p) => /\.(png|jpe?g|gif|svg|webp|pdf|mp4|webm)$/i.test(p));
		const orphans = mediaLike.filter((p) => !referenced.has(p));
		if (orphans.length) {
			problems.push({ code: 'orphans', detail: `bundled but referenced by nothing: ${orphans.join(', ')}` });
		}
	}

	return { ok: true, version, locales, ignoredLocales: ignored, course, modules, problems, warnings };
}

function parseModule(m: unknown, i: number, ctx: ParseCtx): Vc4elModule {
	const { required, problems } = ctx;
	const src = isObj(m) ? m : {};
	const out: Vc4elModule = {
		module_type: src.module_type === 'quiz' ? 'quiz' : 'lesson',
		sort_order: Number.isInteger(src.sort_order) ? (src.sort_order as number) : i,
	};
	for (const l of required) {
		out[`title_${l}`] = stripHtml(src[`title_${l}`] ?? '');
		if (!nonEmpty(out[`title_${l}`])) {
			problems.push({ code: 'module_title', locales: [l], detail: `module ${out.sort_order} title_${l} is empty.` });
		}
	}

	if (out.module_type === 'quiz' && isObj(src.quiz)) {
		const rawQuiz = src.quiz;
		out.quiz = {
			pass_score: numOrNull(rawQuiz.pass_score) ?? 70,
			attempts_allowed: numOrNull(rawQuiz.attempts_allowed) ?? 3,
			time_limit_minutes: numOrNull(rawQuiz.time_limit_minutes),
			shuffle_questions: !!rawQuiz.shuffle_questions,
			questions: (Array.isArray(rawQuiz.questions) ? rawQuiz.questions : []).map((q, qi) =>
				parseQuestion(q, qi, ctx)
			),
		};
	} else {
		const contentJson = isObj(src.content_json) ? src.content_json : {};
		const blocks = Array.isArray(contentJson.blocks) ? contentJson.blocks : [];
		out.content_json = { blocks: blocks.map((b) => parseBlock(b, out.sort_order, ctx)) };
	}
	return out;
}

function parseBlock(b: unknown, moduleOrder: number, ctx: ParseCtx): Vc4elBlock {
	const { required, problems, mediaRefs } = ctx;
	const src = isObj(b) ? b : {};
	const rawContent = isObj(src.content) ? src.content : {};
	const out: Vc4elBlock = { type: typeof src.type === 'string' ? src.type : 'text', content: {} };

	for (const l of required) {
		const v = stripHtml(rawContent[l] ?? '');
		out.content[l] = v;
		// Invariant 2: a declared locale present but EMPTY is a broken export.
		if (!nonEmpty(v)) {
			problems.push({
				code: 'block_content',
				locales: [l],
				detail: `module ${moduleOrder}, ${out.type} block is empty in ${l}.`,
			});
		}
	}

	if (nonEmpty(src.packagePath)) {
		out.packagePath = src.packagePath;
		mediaRefs.push({ path: src.packagePath, block: out });
	}

	if (nonEmpty(src.url)) {
		const url = src.url.trim();
		const ok = out.type === 'video' ? YOUTUBE_EMBED.test(url) : HTTPS_ABS.test(url);
		if (ok) out.url = url;
		else problems.push({ code: 'bad_url', detail: `${out.type} block url rejected by the allowlist: ${url}` });
	}
	return out;
}

function parseQuestion(q: unknown, qi: number, ctx: ParseCtx): Vc4elQuestion {
	const { required, problems } = ctx;
	const src = isObj(q) ? q : {};
	const qType = src.question_type;
	const out: Vc4elQuestion = {
		question_type:
			qType === 'single' || qType === 'multi' || qType === 'true_false' ? qType : 'single',
		sort_order: Number.isInteger(src.sort_order) ? (src.sort_order as number) : qi,
		points: numOrNull(src.points) ?? 1,
		// Absent is LEGAL and is a different shape from present-but-unresolvable.
		sourceModule: Number.isInteger(src.sourceModule) ? (src.sourceModule as number) : null,
		options: [],
		correct: null,
	};

	for (const l of required) {
		out[`question_${l}`] = stripHtml(src[`question_${l}`] ?? '');
		if (!nonEmpty(out[`question_${l}`])) {
			problems.push({ code: 'question_text', locales: [l], detail: `question ${out.sort_order} is empty in ${l}.` });
		}
		// Explanations: all declared locales or none. Absent entirely is fine.
		const ex = src[`explanation_${l}`];
		out[`explanation_${l}`] = nonEmpty(ex) ? stripHtml(ex) : null;
	}

	const opts = Array.isArray(src.options) ? src.options : [];
	if (opts.length < 2 || opts.length > 6) {
		problems.push({ code: 'option_count', detail: `question ${out.sort_order} has ${opts.length} options (2–6 required).` });
	}
	// Preserve unknown keys per option — the generator nests per-option `feedback`
	// here. Mapping to {en,he} would destroy it silently.
	out.options = opts.map((o) => {
		const source = isObj(o) ? o : {};
		const kept: Record<string, unknown> = { ...source };
		for (const l of required) kept[l] = stripHtml(source[l] ?? '');
		return kept;
	});

	// `correct` is polymorphic: number for single/true_false, number[] for multi.
	const c = src.correct;
	if (out.question_type === 'multi') {
		const picked = Array.isArray(c) ? c.filter((n): n is number => Number.isInteger(n)) : [];
		out.correct = picked;
		if (!picked.length) problems.push({ code: 'no_correct', detail: `question ${out.sort_order} has no correct answer.` });
	} else {
		out.correct = Number.isInteger(c) ? (c as number) : null;
		if (out.correct == null) problems.push({ code: 'no_correct', detail: `question ${out.sort_order} has no correct answer.` });
	}
	const maxIdx = out.options.length - 1;
	for (const idx of ([] as number[]).concat(out.correct ?? [])) {
		if (idx < 0 || idx > maxIdx) {
			problems.push({ code: 'correct_out_of_range', detail: `question ${out.sort_order}: correct index ${idx} exceeds ${maxIdx}.` });
		}
	}
	return out;
}
