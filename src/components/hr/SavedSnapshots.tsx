import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { formatDateTime } from '@/utils/formatDate';
import { ErrorText } from '@/components/ui/ErrorText';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ReportTable } from '@/components/hr/ReportTable';
import { isReportType, reportTitle, type ReportRow, type ReportType } from '@/lib/reports';

// The newest first; when there are more, the note under the list says only these are shown.
const SNAPSHOT_LIMIT = 50;

interface Snapshot {
	id: string;
	type: ReportType;
	savedAt: string;
	savedBy: string | null;
	rows: ReportRow[];
}

interface SnapshotRead {
	id: string;
	report_type: string;
	generated_at: string;
	data: unknown;
	saver: {full_name: string | null;email: string | null;} | null;
}

const rowsOf = (data: unknown): ReportRow[] =>
Array.isArray(data) ? data.filter((r): r is ReportRow => typeof r === 'object' && r !== null && !Array.isArray(r)) : [];

const toggleId = (id: string) => `hr-snapshot-toggle-${id}`;

/**
 * Dispatch H1: HR → Reports → Saved snapshots. Save Snapshot wrote `report_snapshots` and nothing read it; this lists
 * them (when, which report, who saved it) and reopens one as the same table, with the same Export CSV. `version`
 * changes after each save, so a new snapshot appears without a reload.
 */
export function SavedSnapshots({ version }: {version: number;}) {
	const { locale } = useLocale();
	const dict = getDictionary(locale);
	const h = dict.hrAnalytics;
	const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<{cause: unknown;} | null>(null);
	// Rule 6: hold the open snapshot's ID and derive the snapshot — the list is read again after every save.
	const [openId, setOpenId] = useState<string | null>(null);
	const viewRef = useRef<HTMLDivElement>(null);
	const open = snapshots.find((s) => s.id === openId) ?? null;

	useEffect(() => {
		if (!supabase) return;
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			setLoadError(null);
			try {
				const { data, error } = await withTimeout(
					supabase.
					from('report_snapshots').
					select('id, report_type, generated_at, data, saver:profiles!report_snapshots_generated_by_fkey(full_name, email)').
					order('generated_at', { ascending: false }).
					limit(SNAPSHOT_LIMIT),
					10000
				);
				if (error) throw error;
				if (cancelled) return;
				const read = (data ?? []) as unknown as SnapshotRead[];
				setSnapshots(read.flatMap((s) => isReportType(s.report_type) ? [{
					id: s.id,
					type: s.report_type,
					savedAt: s.generated_at,
					savedBy: s.saver?.full_name || s.saver?.email || null,
					rows: rowsOf(s.data)
				}] : []));
			} catch (err) {
				console.error('SavedSnapshots: load failed', err);
				if (!cancelled) setLoadError({ cause: err });
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [version]);

	useEffect(() => {
		if (openId) viewRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [openId]);

	const closeView = () => {
		const id = openId;
		setOpenId(null);
		if (id) document.getElementById(toggleId(id))?.focus();
	};

	const savedLine = (s: Snapshot) => h.snapshotSavedLine.
	replace('{date}', () => formatDateTime(s.savedAt, locale)).
	replace('{name}', () => s.savedBy ?? '—');

	return (
		<section data-ev-id="ev_hr_snapshots" aria-labelledby="hr-snapshots-heading" className="space-y-4">
			<div data-ev-id="ev_hr_snapshots_intro">
				<h2 data-ev-id="ev_hr_snapshots_heading" id="hr-snapshots-heading" className="text-lg font-semibold text-foreground">{h.savedSnapshots}</h2>
				<p data-ev-id="ev_hr_snapshots_desc" className="text-sm text-muted-foreground">{h.savedSnapshotsDesc}</p>
			</div>

			{loadError &&
			<div data-ev-id="ev_hr_snapshots_error" role="alert" className="px-3 py-2 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive">
					<ErrorText error={loadError.cause} />
				</div>
			}

			{loading && snapshots.length === 0 ?
			<LoadingSkeleton variant="table" count={2} /> :
			snapshots.length === 0 ?
			!loadError && <p data-ev-id="ev_hr_snapshots_empty" className="text-sm text-muted-foreground">{h.noSnapshots}</p> :

			<div data-ev-id="ev_hr_snapshots_list" className="bg-card border border-border rounded-lg overflow-hidden">
					<div data-ev-id="ev_hr_snapshots_scroll" className="relative overflow-x-auto">
						<table data-ev-id="ev_hr_snapshots_table" className="w-full">
							<thead data-ev-id="ev_hr_snapshots_thead" className="bg-muted">
								<tr data-ev-id="ev_hr_snapshots_headrow">
									<th data-ev-id="ev_hr_snapshots_th_date" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{h.snapshotSavedOnCol}</th>
									<th data-ev-id="ev_hr_snapshots_th_report" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{h.snapshotReportCol}</th>
									<th data-ev-id="ev_hr_snapshots_th_by" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{h.snapshotSavedByCol}</th>
									<th data-ev-id="ev_hr_snapshots_th_action" className="px-4 py-3"><span data-ev-id="ev_hr_snapshots_th_action_label" className="sr-only">{dict.common.actions}</span></th>
								</tr>
							</thead>
							<tbody data-ev-id="ev_hr_snapshots_tbody" className="divide-y divide-border">
								{snapshots.map((s) => {
								const isOpen = s.id === openId;
								return (
									<tr data-ev-id="ev_hr_snapshots_row" key={s.id} className={isOpen ? 'bg-primary/5' : undefined}>
											<td data-ev-id="ev_hr_snapshots_date" className="px-4 py-3 text-foreground">{formatDateTime(s.savedAt, locale)}</td>
											<td data-ev-id="ev_hr_snapshots_report" className="px-4 py-3 text-muted-foreground">{reportTitle(s.type, dict)}</td>
											<td data-ev-id="ev_hr_snapshots_by" className="px-4 py-3 text-muted-foreground">{s.savedBy ?? '—'}</td>
											<td data-ev-id="ev_hr_snapshots_action" className="px-4 py-3 text-end">
												<button data-ev-id="ev_hr_snapshots_toggle"
													id={toggleId(s.id)}
													aria-expanded={isOpen}
													aria-label={`${isOpen ? dict.common.close : dict.common.view}: ${reportTitle(s.type, dict)}, ${formatDateTime(s.savedAt, locale)}`}
													onClick={() => setOpenId(isOpen ? null : s.id)}
													className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
													{isOpen ? dict.common.close : dict.common.view}
												</button>
											</td>
										</tr>);

							})}
							</tbody>
						</table>
					</div>
				</div>
			}

			{snapshots.length >= SNAPSHOT_LIMIT &&
			<p data-ev-id="ev_hr_snapshots_limit" className="text-xs text-muted-foreground">{h.snapshotsLimit.replace('{count}', String(SNAPSHOT_LIMIT))}</p>
			}

			{open &&
			<div data-ev-id="ev_hr_snapshot_view" ref={viewRef}>
					<ReportTable
					type={open.type}
					rows={open.rows}
					subtitle={savedLine(open)}
					fileDate={open.savedAt}
					actions={
					<button data-ev-id="ev_hr_snapshot_close"
					onClick={closeView}
					className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
								{dict.common.close}
							</button>
					} />
				</div>
			}
		</section>);

}
