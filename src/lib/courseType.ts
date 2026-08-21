import { supabase } from '@/integrations/supabase/client';

/**
 * Recompute courses.course_type from the course's modules.
 * Call after any module add or delete. Best-effort: never surface as a
 * failure of the caller's primary action, but always log a refusal.
 */
export async function syncCourseType(courseId: string): Promise<void> {
  if (!supabase || !courseId) return;

  const { data: mods, error: readError } = await supabase.
    from('modules').
    select('module_type').
    eq('course_id', courseId);

  if (readError) {
    console.error('syncCourseType: failed to read modules', readError);
    return;
  }

  const nextType = (mods ?? []).some((m) => m.module_type === 'scorm_package') ? 'scorm' : 'native';

  const { data, error } = await supabase.
    from('courses').
    update({ course_type: nextType }).
    eq('id', courseId).
    select();

  if (error) {
    console.error('syncCourseType: update failed', error);
  } else if (!data || data.length === 0) {
    console.error('syncCourseType: update refused by RLS (0 rows) for course', courseId);
  }
}
