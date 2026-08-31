/**
 * Neon Academy — vc4el-source import mapper (slice 9d-B).
 *
 * PURE. Turns a parsed sidecar plan into the exact rows Academy's tables take.
 * No network, no Supabase, no DOM.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *  - It does not clamp unknown block types. ModulePage's switch has a
 *    `default:` that renders text, so an unrecognised type degrades to its
 *    words rather than to nothing. Clamping would throw away provenance for
 *    no gain.
 *  - It does not store `packagePath`. Academy's ContentBlock has no such field;
 *    the resolved absolute `url` already carries the information.
 *  - It does not decide whether to overwrite course fields. It returns them;
 *    the caller applies fill-only-empty.
 */

import type { Vc4elPlan, Vc4elBlock, Vc4elModule } from './vc4elSource';

export interface ImportOptions {
	/** `scorm_packages.storage_base_url`. A trailing slash is tolerated. */
	storageBaseUrl: string;
	/** First `sort_order` to use. Must be past every existing module. */
	startSortOrder: number;
}

export interface ImportBlock {
	type: string;
	content: { en: string; he: string };
	url?: string;
}

export interface ImportQuestionRow {
	question_type: string;
	question_en: string;
	question_he: string;
	options: unknown[];
	correct: unknown;
	points: number;
	sort_order: number;
	explanation_en: string | null;
	explanation_he: string | null;
}

export interface ImportQuizRow {
	pass_score: number;
	attempts_allowed: number;
	time_limit_minutes: number | null;
	shuffle_questions: boolean;
}

export interface ImportModuleRow {
	title_en: string;
	title_he: string;
	module_type: 'lesson' | 'quiz';
	sort_order: number;
	content_json: { blocks: ImportBlock[] } | null;
	quiz: ImportQuizRow | null;
	questions: ImportQuestionRow[];
}

export interface ImportCourseFields {
	title_en: string;
	title_he: string;
	description_en: string | null;
	description_he: string | null;
	estimated_minutes: number | null;
}

export interface ImportPlan {
	courseFields: ImportCourseFields;
	modules: ImportModuleRow[];
	counts: { modules: number; questions: number };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strOrNull = (v: unknown): string | null =>
	typeof v === 'string' && v.trim().length > 0 ? v : null;

export function buildImportPlan(plan: Vc4elPlan, opts: ImportOptions): ImportPlan {
	const base = opts.storageBaseUrl.replace(/\/+$/, '');

	const modules = plan.modules.map((m, i) => mapModule(m, opts.startSortOrder + i, base));

	return {
		courseFields: {
			title_en: str(plan.course.title_en),
			title_he: str(plan.course.title_he),
			description_en: strOrNull(plan.course.description_en),
			description_he: strOrNull(plan.course.description_he),
			estimated_minutes: plan.course.estimated_minutes,
		},
		modules,
		counts: {
			modules: modules.length,
			questions: modules.reduce((n, m) => n + m.questions.length, 0),
		},
	};
}

function mapModule(m: Vc4elModule, sortOrder: number, base: string): ImportModuleRow {
	const row: ImportModuleRow = {
		title_en: str(m.title_en),
		title_he: str(m.title_he),
		module_type: m.module_type,
		sort_order: sortOrder,
		content_json: null,
		quiz: null,
		questions: [],
	};

	if (m.module_type === 'quiz' && m.quiz) {
		row.quiz = {
			pass_score: m.quiz.pass_score,
			attempts_allowed: m.quiz.attempts_allowed,
			time_limit_minutes: m.quiz.time_limit_minutes,
			shuffle_questions: m.quiz.shuffle_questions,
		};
		row.questions = m.quiz.questions.map((q, qi) => ({
			question_type: q.question_type,
			question_en: str(q.question_en),
			question_he: str(q.question_he),
			// Spread, never remap — per-option `feedback` and any extra locale ride along.
			options: q.options,
			// Polymorphic by contract: number for single/true_false, number[] for multi.
			correct: q.correct,
			points: q.points,
			sort_order: typeof q.sort_order === 'number' ? q.sort_order : qi,
			explanation_en: strOrNull(q.explanation_en),
			explanation_he: strOrNull(q.explanation_he),
		}));
	} else {
		const blocks = m.content_json ? m.content_json.blocks : [];
		row.content_json = { blocks: blocks.map((b) => mapBlock(b, base)) };
	}

	return row;
}

function mapBlock(b: Vc4elBlock, base: string): ImportBlock {
	const out: ImportBlock = {
		type: b.type,
		content: { en: str(b.content.en), he: str(b.content.he) },
	};

	// A bundled file wins over an absolute url. `packagePath` is null when the
	// parser could not resolve it against the archive — then there is no url at
	// all, and ModulePage renders its own "image could not be loaded" panel.
	if (typeof b.packagePath === 'string' && b.packagePath.length > 0) {
		out.url = `${base}/${b.packagePath}`;
	} else if (typeof b.url === 'string' && b.url.length > 0) {
		out.url = b.url;
	}

	return out;
}
