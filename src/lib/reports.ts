/**
 * Dispatch H1 — HR reports (2026-10-15): ONE definition of each report's columns — the label, the order and the text of
 * every cell — used by the report on screen, by a reopened saved snapshot, and by Export CSV, so the three cannot
 * disagree.
 *
 * Rows keep BOTH course titles, and `department: null` for "no department": the language is chosen when a row is drawn
 * or exported, never when it is built — a language switch redraws the report, and a snapshot saved in Hebrew opens in
 * English. Snapshots saved before H1 carry one `title` in the language they were saved in, and a TOTAL `attempts`:
 * they still open — the title shows as saved, and the attempts column shows "-" rather than a total under an average.
 */
import type { Dictionary, Locale } from '@/i18n/dictionary';

export type ReportType = 'completion' | 'compliance' | 'engagement';

export interface ReportRow {
	title_en?: string;
	title_he?: string;
	/** Compliance: the learners' department; null = none recorded. */
	department?: string | null;
	enrolled?: number;
	completed?: number;
	overdue?: number;
	rate?: number;
	avgScore?: number | null;
	avgTime?: number | null;
	/** Engagement: quiz attempts ÷ the learners who attempted, to one decimal; null = nobody attempted. */
	avgAttempts?: number | null;
	/** Snapshots saved before H1: the title, in the language it was saved in. */
	title?: string;
}

export interface ReportColumn {
	id: 'title' | 'department' | 'enrolled' | 'completed' | 'rate' | 'overdue' | 'avgScore' | 'avgAttempts';
	label: string;
	/** The cell's text; null = no value ("-" on screen, an empty cell in the CSV). */
	value: (row: ReportRow) => string | null;
}

export function isReportType(value: unknown): value is ReportType {
	return value === 'completion' || value === 'compliance' || value === 'engagement';
}

export function reportTitle(type: ReportType, dict: Dictionary): string {
	if (type === 'completion') return dict.hrAnalytics.completionSummary;
	if (type === 'compliance') return dict.hrAnalytics.complianceReport;
	return dict.hrAnalytics.courseEngagement;
}

const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const count = (n: unknown): string | null => isNumber(n) ? String(n) : null;
const percent = (n: unknown): string | null => isNumber(n) ? `${n}%` : null;

/** The report's columns, in the table's order, in the reader's language. */
export function reportColumns(type: ReportType, dict: Dictionary, locale: Locale): ReportColumn[] {
	const h = dict.hrAnalytics;
	const title: ReportColumn = {
		id: 'title',
		label: h.courseCol,
		value: (r) => (locale === 'he' ? r.title_he || r.title_en : r.title_en || r.title_he) || r.title || null
	};
	if (type === 'engagement') {
		// No "Avg. Time" column (Isaac, 2026-10-14): nothing records time spent yet, so it read "-" for every course.
		// Rows still carry `avgTime`; when time spent is recorded, the column returns here, after Avg. Score.
		return [
		title,
		{ id: 'avgScore', label: h.avgScore, value: (r) => percent(r.avgScore) },
		{ id: 'avgAttempts', label: h.avgAttempts, value: (r) => isNumber(r.avgAttempts) ? r.avgAttempts.toFixed(1) : null }];

	}
	const first: ReportColumn = type === 'compliance' ?
	{ id: 'department', label: h.departmentCol, value: (r) => r.department || dict.common.noDepartment } :
	title;
	return [
	first,
	{ id: 'enrolled', label: h.enrollmentCount, value: (r) => count(r.enrolled) },
	{ id: 'completed', label: h.completedCount, value: (r) => count(r.completed) },
	{ id: 'rate', label: h.completionRateCol, value: (r) => percent(r.rate) },
	{ id: 'overdue', label: h.overdueCountCol, value: (r) => count(r.overdue) }];

}

// A cell that Excel would run as a formula stays text (CSV injection: course titles are written by instructors and
// opened by HR in Excel). Quoting follows RFC 4180: a cell holding a comma, a quote or a line break is quoted, and its
// quotes are doubled.
function csvCell(text: string): string {
	const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
	return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The report as Excel opens it correctly: the table's labels and order, a byte-order mark (else Excel reads the
 * UTF-8 as Windows-1252 and Hebrew turns to gibberish), and CRLF line ends. */
export function reportCsv(type: ReportType, rows: ReportRow[], dict: Dictionary, locale: Locale): string {
	const columns = reportColumns(type, dict, locale);
	const lines = [
	columns.map((c) => csvCell(c.label)).join(','),
	...rows.map((row) => columns.map((c) => csvCell(c.value(row) ?? '')).join(','))];

	return String.fromCharCode(0xfeff) + lines.join('\r\n') + '\r\n';
}

const pad = (n: number) => String(n).padStart(2, '0');

export function downloadReportCsv(type: ReportType, rows: ReportRow[], dict: Dictionary, locale: Locale, date: string | Date = new Date()) {
	const d = new Date(date);
	const blob = new Blob([reportCsv(type, rows, dict, locale)], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${type}-report-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}
