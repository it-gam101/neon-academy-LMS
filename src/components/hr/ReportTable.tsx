import type { ReactNode } from 'react';
import { Download } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { Badge } from '@/components/ui/Badge';
import { downloadReportCsv, reportColumns, reportTitle, type ReportColumn, type ReportRow, type ReportType } from '@/lib/reports';

interface ReportTableProps {
	type: ReportType;
	rows: ReportRow[];
	/** A line under the title (a saved snapshot: when, and by whom). */
	subtitle?: string;
	/** The date in the CSV's file name; today when omitted. */
	fileDate?: string;
	/** Buttons beside Export CSV. */
	actions?: ReactNode;
}

const cellClass = (column: ReportColumn, row: ReportRow) => {
	if (column.id === 'title' || column.id === 'department') return 'px-4 py-3 text-foreground';
	if (column.id === 'completed') return 'px-4 py-3 text-primary';
	if (column.id === 'overdue' && (row.overdue ?? 0) > 0) return 'px-4 py-3 text-destructive';
	return 'px-4 py-3 text-muted-foreground';
};

/**
 * Dispatch H1: the HR report table — the live report and a reopened saved snapshot draw the same columns, and Export
 * CSV writes exactly those columns (lib/reports). Text is chosen in the reader's language when drawn.
 */
export function ReportTable({ type, rows, subtitle, fileDate, actions }: ReportTableProps) {
	const { locale } = useLocale();
	const dict = getDictionary(locale);
	const columns = reportColumns(type, dict, locale);

	return (
		<div data-ev-id="ev_hr_report" className="bg-card border border-border rounded-lg overflow-hidden">
			<div data-ev-id="ev_hr_report_head" className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
				<div data-ev-id="ev_hr_report_titles">
					<h3 data-ev-id="ev_hr_report_title" className="font-medium text-foreground">{reportTitle(type, dict)}</h3>
					{subtitle && <p data-ev-id="ev_hr_report_subtitle" className="text-sm text-muted-foreground">{subtitle}</p>}
				</div>
				<div data-ev-id="ev_hr_report_actions" className="flex items-center gap-2">
					<button data-ev-id="ev_hr_report_csv"
					onClick={() => downloadReportCsv(type, rows, dict, locale, fileDate)}
					className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
						<Download className="w-4 h-4" />
						{dict.common.exportCsv}
					</button>
					{actions}
				</div>
			</div>

			<div data-ev-id="ev_hr_report_scroll" className="overflow-x-auto">
				<table data-ev-id="ev_hr_report_table" className="w-full">
					<thead data-ev-id="ev_hr_report_thead" className="bg-muted">
						<tr data-ev-id="ev_hr_report_headrow">
							{columns.map((column) =>
							<th data-ev-id="ev_hr_report_th" key={column.id} className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{column.label}</th>
							)}
						</tr>
					</thead>
					<tbody data-ev-id="ev_hr_report_tbody" className="divide-y divide-border">
						{rows.length === 0 ?
						<tr data-ev-id="ev_hr_report_empty">
								<td data-ev-id="ev_hr_report_empty_cell" colSpan={columns.length} className="px-4 py-6 text-center text-sm text-muted-foreground">{dict.hrAnalytics.reportEmpty}</td>
							</tr> :
						rows.map((row, i) =>
						<tr data-ev-id="ev_hr_report_row" key={i}>
								{columns.map((column) => {
								const text = column.value(row);
								if (column.id === 'rate' && text !== null) {
									const rate = row.rate ?? 0;
									return (
										<td data-ev-id="ev_hr_report_td" key={column.id} className="px-4 py-3">
											<Badge variant={rate >= 70 ? 'success' : rate >= 40 ? 'warning' : 'danger'}>{text}</Badge>
										</td>);

								}
								return <td data-ev-id="ev_hr_report_td" key={column.id} className={cellClass(column, row)}>{text ?? '-'}</td>;
							})}
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>);

}
