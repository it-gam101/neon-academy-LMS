/**
 * Pure completeness model for lesson blocks.
 * No React, no supabase — usable by the publish gate and testable in isolation.
 */

import { isAllowedVideoUrl, isAllowedMediaUrl } from '@/lib/contentSafety';

export type ProblemCode =
  | 'missing_translation_he' // English present, Hebrew empty
  | 'missing_translation_en' // Hebrew present, English empty
  | 'empty_block'            // both languages empty AND non-media — renders nothing
  | 'missing_url'            // video/image/pdf with no url — renders nothing
  | 'bad_url';               // video/image/pdf whose url fails the allowlist — renders nothing

export interface BlockProblem {
  blockId: string;
  code: ProblemCode;
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
