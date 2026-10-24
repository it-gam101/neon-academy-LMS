import { useEffect, useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useLatest } from '@/hooks/useLatest';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { errorMessage } from '@/lib/errorText';
import { Modal } from '@/components/ui/Modal';
import { callAdminUsers, type DeleteUserResult } from '@/lib/adminUsers';
import type { Tables } from '@/integrations/supabase/helpers';

type Profile = Tables<'profiles'>;

interface DeleteUserDialogProps {
	user: Profile | null;
	onClose: () => void;
	onDeleted: (userId: string, result: DeleteUserResult) => void;
}

interface Scope {
	enrolled: number;
	completed: number;
	courses: number;
	team: number;
}

// Items 108 + 120, window 4: deleting an account through the admin-users function (window 2). The dialog says what will
// happen before anything does — the person's enrollments, the courses they created and the people they manage, all
// readable by a super_admin. "Keep" is preselected (Isaac, 2026-09-28); Delete stays disabled until the person's
// e-mail is typed exactly (Isaac, 2026-10-24). Failures show inside the dialog (Modal's error slot, rule 9b).
export function DeleteUserDialog({ user, onClose, onDeleted }: DeleteUserDialogProps) {
	const { t } = useLocale();
	const tRef = useLatest(t);
	const [scope, setScope] = useState<Scope | null>(null);
	const [loadingScope, setLoadingScope] = useState(false);
	const [mode, setMode] = useState<'keep' | 'erase'>('keep');
	const [typed, setTyped] = useState('');
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setScope(null);
		setMode('keep');
		setTyped('');
		setError(null);
		if (!user || !supabase) return;
		let cancelled = false;

		const loadScope = async () => {
			setLoadingScope(true);
			try {
				const [enrollments, courses, team] = await Promise.all([
					withTimeout(supabase.from('enrollments').select('status').eq('user_id', user.id).then((r) => r), 10000),
					withTimeout(supabase.from('courses').select('id').eq('created_by', user.id).then((r) => r), 10000),
					withTimeout(supabase.from('profiles').select('id').eq('manager_id', user.id).then((r) => r), 10000)
				]);
				const failed = enrollments.error || courses.error || team.error;
				if (failed) throw failed;
				if (!cancelled) {
					setScope({
						enrolled: enrollments.data.length,
						completed: enrollments.data.filter((e) => e.status === 'completed').length,
						courses: courses.data.length,
						team: team.data.length
					});
				}
			} catch (err) {
				console.error('DeleteUserDialog scope read failed:', err);
				if (!cancelled) setError(errorMessage(err, tRef.current.common.error));
			} finally {
				setLoadingScope(false);
			}
		};

		void loadScope();
		return () => {
			cancelled = true;
		};
	}, [user, tRef]);

	const emailMatches = !!user?.email && typed.trim().toLowerCase() === user.email.toLowerCase();

	const handleDelete = async () => {
		if (!user || deleting || !emailMatches) return;
		setError(null);
		setDeleting(true);
		try {
			const res = await withTimeout(callAdminUsers<DeleteUserResult>({ action: 'delete', user_id: user.id, mode }, t), 30000);
			if (res.ok === false) {
				setError(res.message);
				return;
			}
			onDeleted(user.id, res.data);
		} catch (err) {
			console.error('DeleteUserDialog delete failed:', err);
			setError(errorMessage(err, t.common.error));
		} finally {
			setDeleting(false);
		}
	};

	const [confirmBefore, confirmAfter] = t.admin.typeToConfirm.split('{email}');

	const footer =
	<div data-ev-id="ev_delete_user_footer" className="flex gap-3 justify-end">
			<button data-ev-id="ev_delete_user_cancel"
		type="button"
		onClick={onClose}
		disabled={deleting}
		className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed">
				{t.common.cancel}
			</button>
			<button data-ev-id="ev_delete_user_confirm"
		type="button"
		onClick={handleDelete}
		disabled={!emailMatches || deleting || loadingScope || !scope}
		className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed">
				{deleting ? t.common.loading : t.admin.deleteAccountConfirm}
			</button>
		</div>;

	return (
		<Modal isOpen={!!user} onClose={deleting ? () => {} : onClose} title={t.admin.deleteAccountTitle} footer={footer} error={error}>
			{user &&
			<div data-ev-id="ev_delete_user_body" className="space-y-4 text-foreground">
					<p data-ev-id="ev_delete_user_who" className="text-sm">
						<span data-ev-id="ev_delete_user_name" className="font-medium">{user.full_name}</span>{' '}
						<span data-ev-id="ev_delete_user_email" dir="ltr" className="text-muted-foreground">{user.email}</span>
					</p>

					{loadingScope ?
				<p data-ev-id="ev_delete_user_scope_loading" className="text-sm text-muted-foreground">{t.common.loading}</p> :
				 scope &&
				<ul data-ev-id="ev_delete_user_scope" className="list-disc ps-5 space-y-1 text-sm">
							<li data-ev-id="ev_delete_user_scope_enrollments">{t.admin.scopeEnrollments.replace('{count}', String(scope.enrolled)).replace('{completed}', String(scope.completed))}</li>
							<li data-ev-id="ev_delete_user_scope_courses">{t.admin.scopeCourses.replace('{count}', String(scope.courses))}</li>
							<li data-ev-id="ev_delete_user_scope_team">{t.admin.scopeTeam.replace('{count}', String(scope.team))}</li>
						</ul>
				}

					<fieldset data-ev-id="ev_delete_user_mode" className="space-y-2">
						<legend data-ev-id="ev_delete_user_mode_legend" className="text-sm font-medium mb-2">{t.admin.deleteModeLegend}</legend>
						<label data-ev-id="ev_delete_user_mode_keep" className="flex items-start gap-2 cursor-pointer">
							<input data-ev-id="ev_delete_user_mode_keep_input"
						type="radio"
						name="deleteMode"
						value="keep"
						checked={mode === 'keep'}
						onChange={() => setMode('keep')}
						disabled={deleting}
						className="mt-1" />
							<span data-ev-id="ev_delete_user_mode_keep_text">
								<span data-ev-id="ev_delete_user_mode_keep_title" className="block text-sm font-medium">{t.admin.modeKeep}</span>
								<span data-ev-id="ev_delete_user_mode_keep_help" className="block text-xs text-muted-foreground">{t.admin.modeKeepHelp}</span>
							</span>
						</label>
						<label data-ev-id="ev_delete_user_mode_erase" className="flex items-start gap-2 cursor-pointer">
							<input data-ev-id="ev_delete_user_mode_erase_input"
						type="radio"
						name="deleteMode"
						value="erase"
						checked={mode === 'erase'}
						onChange={() => setMode('erase')}
						disabled={deleting}
						className="mt-1" />
							<span data-ev-id="ev_delete_user_mode_erase_text">
								<span data-ev-id="ev_delete_user_mode_erase_title" className="block text-sm font-medium">{t.admin.modeErase}</span>
								<span data-ev-id="ev_delete_user_mode_erase_help" className="block text-xs text-muted-foreground">{t.admin.modeEraseHelp}</span>
							</span>
						</label>
					</fieldset>

					<p data-ev-id="ev_delete_user_always" className="text-sm text-muted-foreground">{t.admin.deleteAlways}</p>

					<div data-ev-id="ev_delete_user_confirm_field">
						<label data-ev-id="ev_delete_user_confirm_label" htmlFor="deleteConfirmEmail" className="block text-sm font-medium mb-1">
							{confirmBefore}
							<span data-ev-id="ev_delete_user_confirm_email" dir="ltr" className="font-mono">{user.email}</span>
							{confirmAfter}
						</label>
						<input data-ev-id="ev_delete_user_confirm_input"
					id="deleteConfirmEmail"
					type="text"
					dir="ltr"
					autoComplete="off"
					value={typed}
					onChange={(e) => setTyped(e.target.value)}
					disabled={deleting}
					className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
					</div>
				</div>
			}
		</Modal>);

}
