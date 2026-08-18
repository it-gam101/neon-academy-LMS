/**
 * Pure completeness model for lesson blocks, quizzes, and courses.
 * No React, no supabase — usable by the publish gate and testable in isolation.
 */

import { isAllowedVideoUrl, isAllowedMediaUrl } from '@/lib/contentSafety';

export type ProblemCode =
  // Block-level
  | 'missing_translation_he' // English present, Hebrew empty
  | 'missing_translation_en' // Hebrew present, English empty
  | 'empty_block'            // both languages empty AND non-media — renders nothing
  | 'missing_url'            // video/image/pdf with no url — renders nothing
  | 'bad_url'                // video/image/pdf whose url fails the allowlist — renders nothing
  // Module-level
  | 'module_title_translation' // module title missing one language
  | 'no_modules'               // course has no modules at all
  | 'no_blocks'                // lesson module with an empty block list
  | 'no_questions'             // quiz module with no questions
  // Quiz question-level
  | 'question_translation'     // question text missing one language
  | 'too_few_options'          // fewer than 2 options
  | 'no_correct'               // answer key missing or out of range
  | 'option_translation';      // an option missing one language

export interface BlockProblem {
  blockId: string;
  code: ProblemCode;
}

export interface CourseProblem {
  code: ProblemCode;
  moduleId: string;
  moduleTitle: string;        // resolved in the caller's locale
  blockId?: string;           // set for block-level problems
  questionIndex?: number;     // 0-based, for quiz problems
}

/**
 * Content block shape for completeness checks.
 * Compatible with LessonBlockEditor's ContentBlock without importing it.
 */
export interface ContentBlock {
  id: string;
  type: 'heading' | 'text' | 'video' | 'image' | 'pdf';
  content: { en: string; he: string };
  url?: string;
}

/**
 * Quiz question shape for completeness checks.
 * Loosely typed since DB stores options/correct as JSON.
 */
export interface QuizQuestionLike {
  question_en?: string | null;
  question_he?: string | null;
  question_type?: string | null;
  options?: unknown;
  correct?: unknown;
}

/**
 * Module shape for course completeness checks.
 */
export interface ModuleLike {
  id: string;
  title_en: string;
  title_he: string;
  module_type: string;
  content_json?: unknown;
}

/**
 * Quiz data for course completeness checks.
 */
export interface QuizDataLike {
  module_id: string;
  quiz_questions?: QuizQuestionLike[];
}

/**
 * Input for courseProblems function.
 */
export interface CourseInput {
  modules: ModuleLike[];
  quizzes: QuizDataLike[];
  locale: 'en' | 'he';
}

/**
 * Returns all problem codes for a single block.
 */
export function blockProblems(block: ContentBlock): ProblemCode[] {
  const problems: ProblemCode[] = [];
  const { type, content, url } = block;
  const enEmpty = !content.en.trim();
  const heEmpty = !content.he.trim();

  // Translation checks — only flag if exactly one side is non-empty
  if (!enEmpty && heEmpty) {
    problems.push('missing_translation_he');
  }
  if (!heEmpty && enEmpty) {
    problems.push('missing_translation_en');
  }

  // Type-specific checks
  if (type === 'heading' || type === 'text') {
    // Both sides empty → empty_block (renders nothing for learners)
    if (enEmpty && heEmpty) {
      problems.push('empty_block');
    }
  } else {
    // Media blocks: video, image, pdf
    const hasUrl = url && url.trim();
    if (!hasUrl) {
      // No URL → missing_url (renders nothing for learners)
      problems.push('missing_url');
    } else {
      // URL present — validate it
      if (type === 'video') {
        if (!isAllowedVideoUrl(url!)) {
          problems.push('bad_url');
        }
      } else {
        // image or pdf
        if (!isAllowedMediaUrl(url!)) {
          problems.push('bad_url');
        }
      }
    }
    // Note: empty captions are NOT flagged — captions are optional
  }

  return problems;
}

/**
 * Returns all problems across a list of blocks, tagged with blockId.
 */
export function lessonProblems(blocks: ContentBlock[]): BlockProblem[] {
  const result: BlockProblem[] = [];
  for (const block of blocks) {
    for (const code of blockProblems(block)) {
      result.push({ blockId: block.id, code });
    }
  }
  return result;
}

/**
 * Returns all problems for a quiz's questions.
 */
export function quizProblems(questions: QuizQuestionLike[]): { index: number; code: ProblemCode }[] {
  const result: { index: number; code: ProblemCode }[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Question translation check
    const enEmpty = !q.question_en?.trim();
    const heEmpty = !q.question_he?.trim();
    if ((enEmpty && !heEmpty) || (!enEmpty && heEmpty)) {
      result.push({ index: i, code: 'question_translation' });
    }

    // Options check
    const opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length < 2) {
      result.push({ index: i, code: 'too_few_options' });
    } else {
      // Check each option for translation
      for (const opt of opts) {
        if (typeof opt === 'object' && opt !== null) {
          const o = opt as { en?: string; he?: string };
          const optEnEmpty = !o.en?.trim();
          const optHeEmpty = !o.he?.trim();
          if ((optEnEmpty && !optHeEmpty) || (!optEnEmpty && optHeEmpty)) {
            result.push({ index: i, code: 'option_translation' });
            break; // One flag per question is enough
          }
        }
      }
    }

    // Correct answer check
    const qType = q.question_type;
    const correct = q.correct;
    const optCount = opts.length;

    if (qType === 'single' || qType === 'true_false') {
      // Must be a number within 0..optCount-1
      if (typeof correct !== 'number' || correct < 0 || correct >= optCount) {
        result.push({ index: i, code: 'no_correct' });
      }
    } else if (qType === 'multi') {
      // Must be a non-empty array of numbers within 0..optCount-1
      if (!Array.isArray(correct) || correct.length === 0) {
        result.push({ index: i, code: 'no_correct' });
      } else {
        const valid = correct.every(
          (c) => typeof c === 'number' && c >= 0 && c < optCount
        );
        if (!valid) {
          result.push({ index: i, code: 'no_correct' });
        }
      }
    } else {
      // Unknown question type — treat as no correct answer
      result.push({ index: i, code: 'no_correct' });
    }
  }

  return result;
}

/**
 * Returns all problems for a course.
 */
export function courseProblems(input: CourseInput): CourseProblem[] {
  const { modules, quizzes, locale } = input;
  const result: CourseProblem[] = [];

  // Build quiz lookup by module_id
  const quizByModule = new Map<string, QuizDataLike>();
  for (const q of quizzes) {
    quizByModule.set(q.module_id, q);
  }

  // No modules at all
  if (modules.length === 0) {
    result.push({
      code: 'no_modules',
      moduleId: '',
      moduleTitle: '',
    });
    return result;
  }

  for (const mod of modules) {
    const moduleTitle = locale === 'he' ? mod.title_he : mod.title_en;

    // Module title translation check
    const titleEnEmpty = !mod.title_en.trim();
    const titleHeEmpty = !mod.title_he.trim();
    if ((titleEnEmpty && !titleHeEmpty) || (!titleEnEmpty && titleHeEmpty)) {
      result.push({
        code: 'module_title_translation',
        moduleId: mod.id,
        moduleTitle,
      });
    }

    if (mod.module_type === 'lesson') {
      // Parse content_json for blocks
      const contentJson = mod.content_json as { blocks?: unknown[] } | null | undefined;
      const rawBlocks = Array.isArray(contentJson?.blocks) ? contentJson!.blocks : [];

      if (rawBlocks.length === 0) {
        result.push({
          code: 'no_blocks',
          moduleId: mod.id,
          moduleTitle,
        });
      } else {
        // Normalize and check blocks
        const blocks: ContentBlock[] = rawBlocks.map((b) => {
          const raw = b as { id?: string; type?: string; content?: unknown; url?: string };
          return {
            id: raw.id ?? crypto.randomUUID(),
            type: (raw.type ?? 'text') as ContentBlock['type'],
            content: normalizeContent(raw.content),
            url: raw.url,
          };
        });

        const blockProbs = lessonProblems(blocks);
        for (const bp of blockProbs) {
          result.push({
            code: bp.code,
            moduleId: mod.id,
            moduleTitle,
            blockId: bp.blockId,
          });
        }
      }
    } else if (mod.module_type === 'quiz') {
      const quizData = quizByModule.get(mod.id);
      const questions = quizData?.quiz_questions ?? [];

      if (questions.length === 0) {
        result.push({
          code: 'no_questions',
          moduleId: mod.id,
          moduleTitle,
        });
      } else {
        const qProbs = quizProblems(questions);
        for (const qp of qProbs) {
          result.push({
            code: qp.code,
            moduleId: mod.id,
            moduleTitle,
            questionIndex: qp.index,
          });
        }
      }
    }
    // SCORM modules have no completeness checks
  }

  return result;
}

/**
 * Helper to normalize content field.
 */
function normalizeContent(content: unknown): { en: string; he: string } {
  if (typeof content === 'string') {
    return { en: content, he: content };
  }
  if (typeof content === 'object' && content !== null) {
    const c = content as { en?: string; he?: string };
    return {
      en: typeof c.en === 'string' ? c.en : '',
      he: typeof c.he === 'string' ? c.he : '',
    };
  }
  return { en: '', he: '' };
}
