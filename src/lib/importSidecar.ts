import { supabase } from '@/integrations/supabase/client';
import type { Vc4elPlan } from '@/lib/vc4elSource';
import { buildImportPlan } from '@/lib/vc4elImport';
import type { Json } from '@/integrations/supabase/types';

/**
 * Writes a vc4el sidecar into Academy's own tables (modules, quizzes,
 * quiz_questions) and fills ONLY empty course fields.
 *
 * Item 105: lifted OUT of ScormUploadModal unchanged so a second caller can
 * reuse it — attaching an ALREADY-UPLOADED package from the library. The only
 * edits are the two the closure used to supply: `courseId` and the refusal
 * message now arrive as options.
 *
 * THROWS on any refusal. Both callers catch and must never let that failure
 * undo the SCORM work that already succeeded.
 */
export async function importSidecarContent(
  plan: Vc4elPlan,
  opts: { courseId: string; storageBaseUrl: string; refusedMessage: string }
): Promise<{ modules: number; questions: number }> {
  const { courseId, storageBaseUrl, refusedMessage } = opts;

  if (!supabase || !courseId) throw new Error('Not ready');
  if (!storageBaseUrl) throw new Error('No storage base URL for the package');

  // sort_order must start past EVERY existing module, including the SCORM one
  // that was just added.
  const { data: existing, error: orderError } = await supabase.
  from('modules').
  select('sort_order').
  eq('course_id', courseId).
  order('sort_order', { ascending: false }).
  limit(1);
  if (orderError) throw orderError;
  const startSortOrder = ((existing?.[0]?.sort_order ?? 0) as number) + 1;

  const importPlan = buildImportPlan(plan, { storageBaseUrl, startSortOrder });

  // Fill ONLY empty course fields. Never overwrite what the author typed.
  const { data: courseRow } = await supabase.
  from('courses').
  select('title_en, title_he, description_en, description_he, estimated_minutes').
  eq('id', courseId).
  single();

  if (courseRow) {
    const cf = importPlan.courseFields;
    const patch: Record<string, unknown> = {};
    if (!courseRow.title_en?.trim() && cf.title_en) patch.title_en = cf.title_en;
    if (!courseRow.title_he?.trim() && cf.title_he) patch.title_he = cf.title_he;
    if (!courseRow.description_en && cf.description_en) patch.description_en = cf.description_en;
    if (!courseRow.description_he && cf.description_he) patch.description_he = cf.description_he;
    if (courseRow.estimated_minutes == null && cf.estimated_minutes != null) patch.estimated_minutes = cf.estimated_minutes;

    if (Object.keys(patch).length > 0) {
      const { data, error } = await supabase.from('courses').update(patch).eq('id', courseId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(refusedMessage);
    }
  }

  for (const m of importPlan.modules) {
    const { data: modRow, error: modError } = await supabase.
    from('modules').
    insert({
      course_id: courseId,
      title_en: m.title_en,
      title_he: m.title_he,
      module_type: m.module_type,
      sort_order: m.sort_order,
      content_json: m.content_json as unknown as Json
    }).
    select().
    single();
    if (modError) throw modError;
    if (!modRow) throw new Error(refusedMessage);

    if (m.module_type === 'quiz' && m.quiz) {
      const { data: quizRow, error: quizError } = await supabase.
      from('quizzes').
      insert({
        module_id: modRow.id,
        pass_score: m.quiz.pass_score,
        attempts_allowed: m.quiz.attempts_allowed,
        time_limit_minutes: m.quiz.time_limit_minutes,
        shuffle_questions: m.quiz.shuffle_questions
      }).
      select().
      single();
      if (quizError) throw quizError;
      if (!quizRow) throw new Error(refusedMessage);

      if (m.questions.length > 0) {
        const { data: qRows, error: qError } = await supabase.
        from('quiz_questions').
        insert(m.questions.map((q) => ({
          quiz_id: quizRow.id,
          question_type: q.question_type,
          question_en: q.question_en,
          question_he: q.question_he,
          options: q.options as unknown as Json,
          correct: q.correct as unknown as Json,
          points: q.points,
          sort_order: q.sort_order,
          explanation_en: q.explanation_en,
          explanation_he: q.explanation_he
        }))).
        select();
        if (qError) throw qError;
        if (!qRows || qRows.length === 0) throw new Error(refusedMessage);
      }
    }
  }

  return importPlan.counts;
}
