/**
 * Item 106. One definition of "this module is done" for every reader, matching the two
 * writers that roll a course up (scorm-commit and useCourseModules.markModuleProgress) and
 * the database trigger that re-evaluates enrollments when a module is deleted.
 *
 * `!== false` and NEVER `=== true`: passed is NULL for a lesson (not applicable) and for
 * legacy rows (unknown), and those must keep counting. A FAILED module never counts.
 */
export function isModuleDone(progress: { status: string; passed?: boolean | null } | null | undefined): boolean {
	return progress?.status === 'completed' && progress?.passed !== false;
}

/**
 * Item 106, policy C: a completion is sticky, but the learner should see that the course has
 * gained content since. Counts modules created after the completion. Removals are not
 * counted — the marker means "there is something new", nothing else.
 */
export function countModulesAddedSince(
	modules: { created_at: string }[] | null | undefined,
	completedAt: string | null | undefined
): number {
	if (!modules || !completedAt) return 0;
	const since = new Date(completedAt).getTime();
	if (Number.isNaN(since)) return 0;
	return modules.filter((m) => new Date(m.created_at).getTime() > since).length;
}
