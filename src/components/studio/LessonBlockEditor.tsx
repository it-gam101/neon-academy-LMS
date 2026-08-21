import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, AlertTriangle, Type, AlignLeft, Video, Check as CheckIcon, Image, FileText, Upload, Loader2, ChevronsUpDown, ChevronsDownUp, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { functionErrorMessage } from '@/lib/functionError';
import type { Json } from '@/integrations/supabase/types';
import { stripHtmlToText, isAllowedVideoUrl, isAllowedMediaUrl, isNonEmbeddableHost } from '@/lib/contentSafety';
import { lessonProblems, blockProblems, type ProblemCode } from '@/lib/completeness';

interface ContentBlock {
  id: string;
  type: 'heading' | 'text' | 'video' | 'image' | 'pdf';
  content: {en: string;he: string;};
  url?: string;
}

interface LessonBlockEditorProps {
  moduleId: string;
  onBlockCountChange?: (count: number) => void;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  focusBlockId?: string; // If set, expand and scroll this block into view on mount
}

interface SortableBlockProps {
  block: ContentBlock;
  children: (props: {
    listeners: ReturnType<typeof useSortable>['listeners'];
    attributes: ReturnType<typeof useSortable>['attributes'];
    isDragging: boolean;
  }) => React.ReactNode;
}

function SortableBlock({ block, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined
  };

  return (
    <div data-ev-id="ev_04253dd058" ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging })}
    </div>);

}

// Normalise legacy string content to bilingual object
function normaliseContent(content: {en: string;he: string;} | string | undefined): {en: string;he: string;} {
  if (!content) return { en: '', he: '' };
  if (typeof content === 'string') return { en: content, he: content };
  return { en: content.en || '', he: content.he || '' };
}

// Check if URL looks like a non-embed YouTube URL that can't be parsed
function isUnparseableYouTubeUrl(url: string): boolean {
  // If it looks like YouTube but we can't extract an ID, warn
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com')) {
    const id = extractYouTubeId(url);
    return !id;
  }
  return false;
}

// Extract YouTube video ID from any recognised URL shape.
// URL-parsed rather than regexed so `v` need not be the first query param.
function extractYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, '');
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com' && host !== 'youtu.be') {
    return null;
  }
  const valid = (id: string | null | undefined): string | null =>
    id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;

  if (host === 'youtu.be') return valid(u.pathname.split('/')[1]);

  const v = u.searchParams.get('v');
  if (v) return valid(v);

  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
    return valid(parts[1]);
  }
  return null;
}

// Extract start time in seconds from t= or start= (accepts 90, 90s, 1m30s, 1h2m3s)
function extractStartTime(url: string): number | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const raw = u.searchParams.get('t') ?? u.searchParams.get('start');
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return parseInt(m[1] || '0', 10) * 3600 + parseInt(m[2] || '0', 10) * 60 + parseInt(m[3] || '0', 10);
}

function convertToEmbedUrl(url: string): {converted: string;wasConverted: boolean;} {
  const trimmed = url.trim();
  if (!trimmed) return { converted: '', wasConverted: false };

  // Already exactly what we emit — leave it alone, params and all
  if (isAllowedVideoUrl(trimmed)) return { converted: trimmed, wasConverted: false };

  const videoId = extractYouTubeId(trimmed);
  if (!videoId) return { converted: trimmed, wasConverted: false };

  const startTime = extractStartTime(trimmed);
  let embedUrl = `https://www.youtube.com/embed/${videoId}`;
  if (startTime) embedUrl += `?start=${startTime}`;

  return { converted: embedUrl, wasConverted: true };
}

export function LessonBlockEditor({ moduleId, onBlockCountChange, onSaved, onDirtyChange, focusBlockId }: LessonBlockEditorProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [convertedUrls, setConvertedUrls] = useState<Set<number>>(new Set());
  const [urlError, setUrlError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{index: number;message: string;} | null>(null);
  const [libraryOpen, setLibraryOpen] = useState<{index: number;kind: 'image' | 'pdf';} | null>(null);
  const [libraryAssets, setLibraryAssets] = useState<Array<{id: string;url: string;filename: string;kind: 'image' | 'pdf';}>>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  // Refs for block elements (for scrollIntoView)
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Dirty tracking for unsaved changes guard
  const savedSnapshotRef = useRef<string>('[]');
  // Refs for autosave unmount flush
  const blocksRef = useRef<ContentBlock[]>([]);
  const pendingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callback in ref to avoid re-triggering fetch
  const onCountChangeRef = useRef(onBlockCountChange);
  useEffect(() => {
    onCountChangeRef.current = onBlockCountChange;
  }, [onBlockCountChange]);

  // Fetch existing content
  useEffect(() => {
    const fetchContent = async () => {
      if (!supabase || !moduleId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.
      from('modules').
      select('content_json').
      eq('id', moduleId).
      single();

      if (error) {
        console.error('Failed to load content:', error);
        showToast('error', (error as {message?: string;})?.message || dict.common.error);
      } else if (data?.content_json) {
        const json = data.content_json as {blocks?: Array<{type: string;content: unknown;url?: string;}>;};
        const rawBlocks = json.blocks || [];
        // Normalise all blocks, generating ids for legacy blocks that have none
        const normalised: ContentBlock[] = rawBlocks.map((b) => ({
          id: (b as {id?: string;}).id ?? crypto.randomUUID(),
          type: b.type as 'heading' | 'text' | 'video' | 'image' | 'pdf',
          content: normaliseContent(b.content as {en: string;he: string;} | string),
          url: b.url
        }));
        setBlocks(normalised);
        savedSnapshotRef.current = JSON.stringify(normalised);
        onCountChangeRef.current?.(normalised.length);
      }

      setLoading(false);
    };

    fetchContent();
  }, [moduleId, dict.common.error]);

  // Compute dirty state and notify parent
  const isDirty = JSON.stringify(blocks) !== savedSnapshotRef.current;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Notify parent of count changes
  useEffect(() => {
    onCountChangeRef.current?.(blocks.length);
  }, [blocks.length]);

  // Auto-reset delete confirmation after 3 seconds
  useEffect(() => {
    if (deleteConfirm === null) return;
    const t = setTimeout(() => setDeleteConfirm(null), 3000);
    return () => clearTimeout(t);
  }, [deleteConfirm]);

  // Fetch library assets when modal opens
  useEffect(() => {
    if (!libraryOpen || !supabase) return;

    const fetchLibraryAssets = async () => {
      const { data, error } = await supabase.
      from('media_assets').
      select('id, url, filename, kind').
      eq('kind', libraryOpen.kind).
      order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load library assets:', error);
        setLibraryAssets([]);
      } else {
        setLibraryAssets((data || []) as Array<{id: string;url: string;filename: string;kind: 'image' | 'pdf';}>);
      }
    };

    fetchLibraryAssets();
  }, [libraryOpen]);

  // Keep blocksRef in sync
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Persistence function used by both explicit Save and autosave
  const persistBlocks = useCallback(async (blocksToSave: ContentBlock[], opts: {silent: boolean;}) => {
    if (!supabase || !moduleId) return { success: false, error: 'Not ready' };

    // Strip HTML from content on save
    const sanitizedBlocks = blocksToSave.map((block) => ({
      ...block,
      content: {
        en: stripHtmlToText(block.content.en),
        he: stripHtmlToText(block.content.he)
      }
    }));

    const { data, error } = await supabase.
    from('modules').
    update({ content_json: { blocks: sanitizedBlocks } as unknown as Json }).
    eq('id', moduleId).
    select();

    if (error) {
      const msg = (error as {message?: string;})?.message || JSON.stringify(error);
      console.error('Save error:', error);
      return { success: false, error: msg };
    } else if (!data || data.length === 0) {
      return { success: false, error: dict.studioBlocks.saveFailed || dict.common.error };
    } else {
      savedSnapshotRef.current = JSON.stringify(sanitizedBlocks);
      return { success: true, error: null };
    }
  }, [moduleId, dict.studioBlocks.saveFailed, dict.common.error]);

  // Autosave effect (debounced 1500ms)
  useEffect(() => {
    // Don't autosave while loading initial content
    if (loading) return;
    // Don't autosave if nothing changed
    if (JSON.stringify(blocks) === savedSnapshotRef.current) {
      pendingRef.current = false;
      return;
    }

    pendingRef.current = true;

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Don't start if save already in flight
      if (saveInFlightRef.current) {
        // Schedule another after the current one settles
        pendingRef.current = true;
        return;
      }

      saveInFlightRef.current = true;
      pendingRef.current = false;
      setSaveStatus('saving');
      setSaveError(null);

      const result = await persistBlocks(blocksRef.current, { silent: true });

      saveInFlightRef.current = false;

      if (result.success) {
        setSaveStatus('saved');
        // Clear saved indicator after 2 seconds
        if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current);
        savedIndicatorTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setSaveError(result.error || dict.common.error);
        console.error('Autosave failed:', result.error);
      }

      // If more changes came in while saving, schedule another autosave
      if (pendingRef.current) {
        debounceTimerRef.current = setTimeout(() => {
          // Trigger re-check
          pendingRef.current = true;
        }, 1500);
      }
    }, 1500);
  }, [blocks, loading, persistBlocks, dict.common.error]);

  // Cleanup on unmount: flush pending autosave
  useEffect(() => {
    return () => {
      // Clear timers
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current);

      // Flush pending save using refs (NOT closures)
      if (pendingRef.current && !saveInFlightRef.current) {
        const currentBlocks = blocksRef.current;
        if (JSON.stringify(currentBlocks) !== savedSnapshotRef.current) {
          // Fire and forget - cannot await in cleanup
          persistBlocks(currentBlocks, { silent: true });
        }
      }
    };
  }, [persistBlocks]);

  // Focus block effect: expand, scroll into view, and highlight
  useEffect(() => {
    if (!focusBlockId || loading || blocks.length === 0) return;

    // Ensure block is expanded (not collapsed)
    setCollapsed((prev) => {
      if (prev.has(focusBlockId)) {
        const next = new Set(prev);
        next.delete(focusBlockId);
        return next;
      }
      return prev;
    });

    // Small delay to let DOM update after expand
    const timer = setTimeout(() => {
      const el = blockRefs.current.get(focusBlockId);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setHighlightedBlockId(focusBlockId);
        // Remove highlight after 2 seconds
        setTimeout(() => setHighlightedBlockId(null), 2000);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [focusBlockId, loading, blocks.length]);

  const handleAddBlock = (type: 'heading' | 'text' | 'video' | 'image' | 'pdf') => {
    setDeleteConfirm(null);
    setBlocks((prev) => [
    ...prev,
    { id: crypto.randomUUID(), type, content: { en: '', he: '' }, url: type === 'video' || type === 'image' || type === 'pdf' ? '' : undefined }]
    );
  };

  const handleUpdateBlock = (index: number, updates: Partial<ContentBlock>) => {
    setDeleteConfirm(null);
    setBlocks((prev) => prev.map((b, i) => i === index ? { ...b, ...updates } : b));
  };

  const handleVideoUrlChange = (index: number, url: string) => {
    const { converted, wasConverted } = convertToEmbedUrl(url);
    handleUpdateBlock(index, { url: converted });

    if (wasConverted) {
      setConvertedUrls((prev) => new Set(prev).add(index));
      // Clear the converted indicator after a few seconds
      setTimeout(() => {
        setConvertedUrls((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 3000);
    }
  };

  const handleUpdateContent = (index: number, lang: 'en' | 'he', value: string) => {
    setBlocks((prev) =>
    prev.map((b, i) =>
    i === index ? { ...b, content: { ...b.content, [lang]: value } } : b
    )
    );
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    setDeleteConfirm(null);
    setBlocks((prev) => {
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!supabase) return;

    setUploadingIndex(index);
    setUploadError(null);

    try {
      // Call media-presign
      const { data: presignData, error: presignError } = await supabase.functions.invoke('media-presign', {
        body: {
          filename: file.name,
          mimeType: file.type,
          size: file.size
        }
      });

      if (presignError || !presignData?.uploadUrl) {
        console.error('Presign error:', presignError || presignData);
        const msg = presignError ? await functionErrorMessage(presignError, dict.studioBlocks.uploadFailed) : presignData?.error || dict.studioBlocks.uploadFailed;
        setUploadError({ index, message: msg });
        setUploadingIndex(null);
        return;
      }

      // PUT the file to R2
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        console.error('Upload to R2 failed:', uploadResponse.status, uploadResponse.statusText);
        setUploadError({ index, message: dict.studioBlocks.uploadFailed });
        setUploadingIndex(null);
        return;
      }

      // Call media-finalize
      const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('media-finalize', {
        body: {
          key: presignData.key,
          filename: presignData.filename || file.name,
          mimeType: file.type,
          size: file.size
        }
      });

      if (finalizeError || !finalizeData?.url) {
        console.error('Finalize error:', finalizeError || finalizeData);
        const msg = finalizeError ? await functionErrorMessage(finalizeError, dict.studioBlocks.uploadFailed) : finalizeData?.error || dict.studioBlocks.uploadFailed;
        setUploadError({ index, message: msg });
        setUploadingIndex(null);
        return;
      }

      // Set the block's URL to the public URL
      handleUpdateBlock(index, { url: finalizeData.url });
      setUploadingIndex(null);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = await functionErrorMessage(err, dict.studioBlocks.uploadFailed);
      setUploadError({ index, message: msg });
      setUploadingIndex(null);
    }
  };

  const handleDeleteBlock = (blockId: string, index: number) => {
    const block = blocks[index];
    const hasContent = block.content.en || block.content.he || block.url;

    if (hasContent && deleteConfirm !== blockId) {
      setDeleteConfirm(blockId);
      return;
    }

    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setDeleteConfirm(null);
  };

  const toggleCollapse = (blockId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsed(new Set(blocks.map((b) => b.id)));
  };

  const expandAll = () => {
    setCollapsed(new Set());
  };

  const getBlockSummary = (block: ContentBlock): string => {
    if (block.type === 'heading' || block.type === 'text') {
      const content = locale === 'he' ? block.content.he : block.content.en;
      if (!content) return dict.studioBlocks.emptyBlock;
      return content.length > 60 ? content.slice(0, 60) + '…' : content;
    }
    if (block.type === 'video' || block.type === 'image' || block.type === 'pdf') {
      if (!block.url) return dict.studioBlocks.noFileYet;
      const parts = block.url.split('/');
      return parts[parts.length - 1] || dict.studioBlocks.noFileYet;
    }
    return dict.studioBlocks.emptyBlock;
  };

  const CollapsedChevron = locale === 'he' ? ChevronLeft : ChevronRight;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setDeleteConfirm(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!supabase || !moduleId) return;
    setUrlError(null);

    // Validate URLs before saving (explicit Save blocks on invalid URLs)
    for (const block of blocks) {
      if (block.type === 'video' && block.url && !isAllowedVideoUrl(block.url)) {
        setUrlError(dict.studioBlocks.invalidUrl);
        return;
      }
      if ((block.type === 'image' || block.type === 'pdf') && block.url && !isAllowedMediaUrl(block.url)) {
        setUrlError(dict.studioBlocks.invalidUrl);
        return;
      }
    }

    setSaving(true);

    // Cancel pending autosave since we're doing an explicit save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingRef.current = false;

    const result = await persistBlocks(blocks, { silent: false });

    if (!result.success) {
      showToast('error', result.error || dict.common.error);
    } else {
      showToast('success', dict.studioBlocks.blocksSaved);
      setSaveStatus('idle');
      setSaveError(null);
      onSaved?.();
    }

    setSaving(false);
  };

  // Compute all problems from the pure completeness model (derived state, never mutates blocks)
  const allProblems = lessonProblems(blocks);
  const problemsByBlock = new Map<string, ProblemCode[]>();
  const countByCode = new Map<ProblemCode, number>();
  for (const p of allProblems) {
    // Per-block
    const arr = problemsByBlock.get(p.blockId) ?? [];
    arr.push(p.code);
    problemsByBlock.set(p.blockId, arr);
    // Per-code count
    countByCode.set(p.code, (countByCode.get(p.code) ?? 0) + 1);
  }

  // Helper to map code to dict key
  const problemLabel = (code: ProblemCode): string => {
    switch (code) {
      case 'missing_translation_he':return dict.studioBlocks.needsHebrew;
      case 'missing_translation_en':return dict.studioBlocks.needsEnglish;
      case 'empty_block':return dict.studioBlocks.warnEmpty;
      case 'missing_url':return dict.studioBlocks.warnNoUrl;
      case 'bad_url':return dict.studioBlocks.warnBadUrl;
    }
  };

  if (loading) {
    return (
      <div data-ev-id="ev_471aee6140" className="flex items-center justify-center py-8 text-muted-foreground">
				{dict.common.loading}
			</div>);

  }

  return (
    <div data-ev-id="ev_9b89a00d51" className="flex flex-col gap-4">
			{/* Problem summary — lists counts per problem code, nothing when no problems */}
			{allProblems.length > 0 &&
      <div data-ev-id="ev_10e1bb5fb5" className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
					<AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
					<span data-ev-id="ev_4a9d35af38" className="text-amber-500">
						{(['missing_translation_he', 'missing_translation_en', 'empty_block', 'missing_url', 'bad_url'] as ProblemCode[]).
          filter((code) => (countByCode.get(code) ?? 0) > 0).
          map((code, idx, arr) =>
          <span data-ev-id="ev_a61a7cd218" key={code}>
            {countByCode.get(code)} {problemLabel(code)}
            {idx < arr.length - 1 && ' • '}
          </span>
          )}
					</span>
				</div>
      }

			{/* Collapse/Expand all buttons */}
			{blocks.length > 0 &&
      <div data-ev-id="ev_collapse_expand_btns" className="flex items-center gap-2">
					<button data-ev-id="ev_collapse_all"
        type="button"
        onClick={collapseAll}
        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">

						<ChevronsDownUp className="w-3.5 h-3.5" />
						{dict.studioBlocks.collapseAll}
					</button>
					<button data-ev-id="ev_expand_all"
        type="button"
        onClick={expandAll}
        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">

						<ChevronsUpDown className="w-3.5 h-3.5" />
						{dict.studioBlocks.expandAll}
					</button>
				</div>
      }

			{/* Block list */}
			{blocks.length === 0 ?
      <p data-ev-id="ev_598a5dad8f" className="text-center text-muted-foreground py-8">
					{dict.studioBlocks.noBlocks}
				</p> :

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div data-ev-id="ev_7efba52169" className="flex flex-col gap-3">
					{blocks.map((block, index) => {
              const blockCodes = problemsByBlock.get(block.id) ?? [];
              const hasProblems = blockCodes.length > 0;
              const isCollapsed = collapsed.has(block.id);

              return (
                <SortableBlock key={block.id} block={block}>
              {({ listeners, attributes, isDragging }) =>
                  <div data-ev-id="ev_4de0529002"
                  ref={(el) => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  className={`p-4 bg-background border rounded-lg transition-shadow ${
                  hasProblems ? 'border-amber-500/50' : 'border-border'}${
                  deleteConfirm === block.id ? ' ring-2 ring-destructive' : ''}${
                  highlightedBlockId === block.id ? ' ring-2 ring-primary' : ''}${
                  isDragging ? ' opacity-50' : ''}`
                  }>

								{/* Block header */}
								<div data-ev-id="ev_c438205030" className={`flex items-center justify-between${isCollapsed ? '' : ' mb-3'}`}>
									<div data-ev-id="ev_a7d61a501f" className="flex items-center gap-2 min-w-0 flex-1">
										{/* Drag handle */}
										<button data-ev-id="ev_drag_handle"
                        type="button"
                        {...listeners}
                        {...attributes}
                        className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                        aria-label={dict.studioBlocks.dragHandle}>

											<GripVertical className="w-4 h-4" />
										</button>
										<button data-ev-id="ev_collapse_toggle"
                        type="button"
                        onClick={() => toggleCollapse(block.id)}
                        className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">

											{isCollapsed ? <CollapsedChevron className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
										</button>
										{block.type === 'heading' && <Type className="w-4 h-4 text-primary flex-shrink-0" />}
										{block.type === 'text' && <AlignLeft className="w-4 h-4 text-primary flex-shrink-0" />}
										{block.type === 'video' && <Video className="w-4 h-4 text-primary flex-shrink-0" />}
										{block.type === 'image' && <Image className="w-4 h-4 text-primary flex-shrink-0" />}
										{block.type === 'pdf' && <FileText className="w-4 h-4 text-primary flex-shrink-0" />}
										<button data-ev-id="ev_type_label_toggle"
                        type="button"
                        onClick={() => toggleCollapse(block.id)}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors flex-shrink-0">

											{block.type === 'heading' && dict.studioBlocks.blockHeading}
											{block.type === 'text' && dict.studioBlocks.blockText}
											{block.type === 'video' && dict.studioBlocks.blockVideo}
											{block.type === 'image' && dict.studioBlocks.blockImage}
											{block.type === 'pdf' && dict.studioBlocks.blockPdf}
										</button>
										{isCollapsed &&
                        <span data-ev-id="ev_block_summary" className="text-sm text-muted-foreground truncate">
												{getBlockSummary(block)}
											</span>
                        }
										{/* Problem indicators — visible when collapsed */}
										{blockCodes.map((code) => (
                        <span key={code} data-ev-id="ev_block_problem" className="text-xs text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded flex-shrink-0">
												{problemLabel(code)}
											</span>
                        ))}
									</div>
									<div data-ev-id="ev_8e46275211" className="flex items-center gap-1">
										<button data-ev-id="ev_fd204f6ed8"
                        onClick={() => handleMoveBlock(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={dict.studioBlocks.moveUp}>

											<ChevronUp className="w-4 h-4" />
										</button>
										<button data-ev-id="ev_0e918061b8"
                        onClick={() => handleMoveBlock(index, 'down')}
                        disabled={index === blocks.length - 1}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={dict.studioBlocks.moveDown}>

											<ChevronDown className="w-4 h-4" />
										</button>
										<button data-ev-id="ev_0d1f5896a2"
                        onClick={() => handleDeleteBlock(block.id, index)}
                        className={`p-1.5 transition-colors ${
                        deleteConfirm === block.id ?
                        'text-destructive bg-destructive/10 rounded' :
                        'text-muted-foreground hover:text-destructive'}`
                        }
                        title={dict.studioBlocks.deleteBlock}>

											<Trash2 className="w-4 h-4" />
										</button>
										{deleteConfirm === block.id &&
                        <span data-ev-id="ev_2437f5c5fb" className="text-xs text-destructive ms-1">{dict.studioBlocks.confirmDeleteBlock}</span>
                        }
									</div>
								</div>

								{/* Block body - hidden when collapsed */}
								{!isCollapsed &&
                    <>
								{/* Video URL field */}
								{block.type === 'video' &&
                      <div data-ev-id="ev_d34addcec9" className="mb-3">
										<label data-ev-id="ev_77da9332c0" className="block text-xs font-medium text-muted-foreground mb-1">
											{dict.studioBlocks.videoUrl}
										</label>
										<input data-ev-id="ev_ca1bcc5589"
                        type="url"
                        value={block.url || ''}
                        onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                        onBlur={(e) => handleVideoUrlChange(index, e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        dir="ltr"
                        placeholder="https://www.youtube.com/embed/..." />

										{convertedUrls.has(index) &&
                        <p data-ev-id="ev_4051070cbc" className="mt-1 text-xs text-primary flex items-center gap-1">
												<CheckIcon className="w-3 h-3" />
												{dict.studioBlocks.videoUrlConverted}
											</p>
                        }
										{block.url && !convertedUrls.has(index) && isUnparseableYouTubeUrl(block.url) &&
                        <p data-ev-id="ev_ec908263ea" className="mt-1 text-xs text-amber-500 flex items-center gap-1">
												<AlertTriangle className="w-3 h-3" />
												{dict.studioBlocks.videoEmbedWarning}
											</p>
                        }
										<p data-ev-id="ev_790f059bb4" className="mt-1 text-xs text-muted-foreground">
											{dict.studioBlocks.videoUrlHelperText}
										</p>
										{block.url && isNonEmbeddableHost(block.url) &&
                        <p data-ev-id="ev_video_unsupported_host" className="mt-1 text-sm text-destructive">
												{dict.studioBlocks.unsupportedHost}
											</p>
                        }
									</div>
                      }

								{/* Media URL field for image and pdf */}
								{(block.type === 'image' || block.type === 'pdf') &&
                      <div data-ev-id="ev_media_url_field" className="mb-3">
										{/* File upload control */}
										<div data-ev-id="ev_5f68215120" className="flex items-center gap-3 mb-2">
											<label data-ev-id="ev_192f7afb84" className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium">
												{uploadingIndex === index ?
                            <>
														<Loader2 className="w-4 h-4 animate-spin" />
														{dict.studioBlocks.uploading}
													</> :

                            <>
														<Upload className="w-4 h-4" />
														{dict.studioBlocks.uploadFile}
													</>
                            }
												<input data-ev-id="ev_4c7f64f729"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                            className="hidden"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(index, file);
                              }
                              e.target.value = '';
                            }} />

											</label>
											<button data-ev-id="ev_c72a42e5ae"
                          type="button"
                          onClick={() => setLibraryOpen({ index, kind: block.type as 'image' | 'pdf' })}
                          disabled={uploadingIndex !== null}
                          className="px-3 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50">
												{dict.media.chooseFromLibrary}
											</button>
											<span data-ev-id="ev_37615337b0" className="text-xs text-muted-foreground">{dict.studioBlocks.orUseUrl}</span>
										</div>
										{uploadError?.index === index &&
                        <p data-ev-id="ev_5ea3d70d18" className="mb-2 text-sm text-destructive">
												{dict.studioBlocks.uploadFailed}: {uploadError.message}
											</p>
                        }
										<label data-ev-id="ev_media_url_label" className="block text-xs font-medium text-muted-foreground mb-1">
											{dict.studioBlocks.mediaUrl}
										</label>
										<input data-ev-id="ev_media_url_input"
                        type="url"
                        value={block.url || ''}
                        onChange={(e) => handleUpdateBlock(index, { url: e.target.value })}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        dir="ltr"
                        placeholder="https://..." />
										{block.url && isNonEmbeddableHost(block.url) &&
                        <p data-ev-id="ev_media_unsupported_host" className="mt-1 text-sm text-destructive">
												{dict.studioBlocks.unsupportedHost}
											</p>
                        }
									</div>
                      }

								{/* Content fields - side by side on wide, stacked on narrow */}
								<div data-ev-id="ev_b598b2379e" className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{/* English */}
									<div data-ev-id="ev_458ee31bef">
										<label data-ev-id="ev_425c34159d" className="block text-xs font-medium text-muted-foreground mb-1">
											{dict.profile.english}
										</label>
										{block.type === 'heading' ?
                          <input data-ev-id="ev_f7cc3fdb99"
                          type="text"
                          value={block.content.en}
                          onChange={(e) => handleUpdateContent(index, 'en', e.target.value)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          dir="ltr" /> :


                          <textarea data-ev-id="ev_44eb50b182"
                          value={block.content.en}
                          onChange={(e) => handleUpdateContent(index, 'en', e.target.value)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y"
                          dir="ltr" />

                          }
									</div>

									{/* Hebrew */}
									<div data-ev-id="ev_e76a848660">
										<label data-ev-id="ev_55cfe9bbfa" className="block text-xs font-medium text-muted-foreground mb-1">
											{dict.profile.hebrew}
										</label>
										{block.type === 'heading' ?
                          <input data-ev-id="ev_addb3d038d"
                          type="text"
                          value={block.content.he}
                          onChange={(e) => handleUpdateContent(index, 'he', e.target.value)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          dir="rtl" /> :


                          <textarea data-ev-id="ev_c320f834d1"
                          value={block.content.he}
                          onChange={(e) => handleUpdateContent(index, 'he', e.target.value)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y"
                          dir="rtl" />

                          }
									</div>
								</div>

								{/* Formatting hint for text blocks */}
								{block.type === 'text' &&
                      <p data-ev-id="ev_10be20b955" className="mt-2 text-xs text-muted-foreground">
										{dict.studioBlocks.formattingHint}
									</p>
                      }
              </>
                    }
							</div>
                  }
            </SortableBlock>);


            })}
				</div>
        </SortableContext>
      </DndContext>
      }

			{/* Add block buttons */}
			<div data-ev-id="ev_6d8f025a66" className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
				<button data-ev-id="ev_e96ac3b246"
        onClick={() => handleAddBlock('heading')}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

					<Plus className="w-4 h-4" />
					{dict.studioBlocks.addHeading}
				</button>
				<button data-ev-id="ev_6fefab9f15"
        onClick={() => handleAddBlock('text')}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

					<Plus className="w-4 h-4" />
					{dict.studioBlocks.addText}
				</button>
				<button data-ev-id="ev_e7ee3bc4e0"
        onClick={() => handleAddBlock('video')}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

					<Plus className="w-4 h-4" />
					{dict.studioBlocks.addVideo}
				</button>
				<button data-ev-id="ev_add_image_btn"
        onClick={() => handleAddBlock('image')}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

					<Image className="w-4 h-4" />
					{dict.studioBlocks.addImage}
				</button>
				<button data-ev-id="ev_add_pdf_btn"
        onClick={() => handleAddBlock('pdf')}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

					<FileText className="w-4 h-4" />
					{dict.studioBlocks.addPdf}
				</button>

				<div data-ev-id="ev_99c8ddf16c" className="flex-1" />

				{urlError &&
        <p data-ev-id="ev_url_error" className="text-sm text-destructive">{urlError}</p>
        }

				{/* Autosave status indicator */}
				{saveStatus === 'saving' &&
        <span data-ev-id="ev_save_status_saving" className="flex items-center gap-1 text-sm text-muted-foreground">
						<Loader2 className="w-4 h-4 animate-spin" />
						{dict.studioBlocks.autosaving}
					</span>
        }
				{saveStatus === 'saved' &&
        <span data-ev-id="ev_save_status_saved" className="flex items-center gap-1 text-sm text-muted-foreground">
						<CheckIcon className="w-4 h-4" />
						{dict.studioBlocks.autosaved}
					</span>
        }
				{saveStatus === 'error' && saveError &&
        <span data-ev-id="ev_save_status_error" className="text-sm text-destructive">
						{saveError}
					</span>
        }

				<button data-ev-id="ev_cc2ae891f5"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">

					{saving ? dict.common.loading : dict.studioBlocks.saveBlocks}
				</button>
			</div>

			{/* Library selection modal */}
			<Modal
        isOpen={!!libraryOpen}
        onClose={() => setLibraryOpen(null)}
        title={dict.media.chooseFromLibrary}>

				{libraryAssets.length === 0 ?
        <p data-ev-id="ev_a7a0f23d45" className="text-center text-muted-foreground py-8">{dict.media.empty}</p> :

        <div data-ev-id="ev_39ee1f2664" className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
						{libraryAssets.map((asset) =>
          <button data-ev-id="ev_06cf53ef2d"
          key={asset.id}
          type="button"
          onClick={() => {
            if (libraryOpen) {
              handleUpdateBlock(libraryOpen.index, { url: asset.url });
              setLibraryOpen(null);
            }
          }}
          className="bg-muted border border-border rounded-lg overflow-hidden hover:border-primary transition-colors text-start">

								<div data-ev-id="ev_83291b4ec8" className="aspect-square flex items-center justify-center bg-muted">
									{asset.kind === 'image' ?
              <img data-ev-id="ev_7788910be5" src={asset.url} alt={asset.filename} className="w-full h-full object-cover" /> :

              <FileText className="w-8 h-8 text-muted-foreground" />
              }
								</div>
								<p data-ev-id="ev_61ec305c00" className="p-2 text-xs truncate text-foreground">{asset.filename}</p>
							</button>
          )}
					</div>
        }
			</Modal>
		</div>);

}