import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle, Type, AlignLeft, Video } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import type { Json } from '@/integrations/supabase/types';

interface ContentBlock {
  type: 'heading' | 'text' | 'video';
  content: {en: string;he: string;};
  url?: string;
}

interface LessonBlockEditorProps {
  moduleId: string;
  onBlockCountChange?: (count: number) => void;
}

// Normalise legacy string content to bilingual object
function normaliseContent(content: {en: string;he: string;} | string | undefined): {en: string;he: string;} {
  if (!content) return { en: '', he: '' };
  if (typeof content === 'string') return { en: content, he: content };
  return { en: content.en || '', he: content.he || '' };
}

// Check if URL looks like a non-embed YouTube URL
function isWatchUrl(url: string): boolean {
  return url.includes('watch?v=') || url.includes('youtu.be/');
}

export function LessonBlockEditor({ moduleId, onBlockCountChange }: LessonBlockEditorProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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
        // Normalise all blocks
        const normalised: ContentBlock[] = rawBlocks.map((b) => ({
          type: b.type as 'heading' | 'text' | 'video',
          content: normaliseContent(b.content as {en: string;he: string;} | string),
          url: b.url
        }));
        setBlocks(normalised);
        onCountChangeRef.current?.(normalised.length);
      }

      setLoading(false);
    };

    fetchContent();
  }, [moduleId, dict.common.error]);

  // Notify parent of count changes
  useEffect(() => {
    onCountChangeRef.current?.(blocks.length);
  }, [blocks.length]);

  const handleAddBlock = (type: 'heading' | 'text' | 'video') => {
    setBlocks((prev) => [
    ...prev,
    { type, content: { en: '', he: '' }, url: type === 'video' ? '' : undefined }]
    );
  };

  const handleUpdateBlock = (index: number, updates: Partial<ContentBlock>) => {
    setBlocks((prev) => prev.map((b, i) => i === index ? { ...b, ...updates } : b));
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

    setBlocks((prev) => {
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  const handleDeleteBlock = (index: number) => {
    const block = blocks[index];
    const hasContent = block.content.en || block.content.he || block.url;

    if (hasContent && deleteConfirm !== index) {
      setDeleteConfirm(index);
      return;
    }

    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!supabase || !moduleId) return;
    setSaving(true);

    const { data, error } = await supabase.
    from('modules').
    update({ content_json: { blocks } as unknown as Json }).
    eq('id', moduleId).
    select();

    if (error) {
      const msg = (error as {message?: string;})?.message || JSON.stringify(error);
      console.error('Save error:', error);
      showToast('error', msg);
    } else if (!data || data.length === 0) {
      showToast('error', dict.studioBlocks.saveFailed || dict.common.error);
    } else {
      showToast('success', dict.studioBlocks.blocksSaved);
    }

    setSaving(false);
  };

  // Calculate incomplete blocks
  const missingEnglish = blocks.filter((b) => b.content.he && !b.content.en).length;
  const missingHebrew = blocks.filter((b) => b.content.en && !b.content.he).length;

  if (loading) {
    return (
      <div data-ev-id="ev_471aee6140" className="flex items-center justify-center py-8 text-muted-foreground">
				{dict.common.loading}
			</div>);

  }

  return (
    <div data-ev-id="ev_9b89a00d51" className="flex flex-col gap-4">
			{/* Incompleteness summary */}
			{(missingEnglish > 0 || missingHebrew > 0) &&
      <div data-ev-id="ev_10e1bb5fb5" className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
					<AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
					<span data-ev-id="ev_4a9d35af38" className="text-amber-500">
						{missingHebrew > 0 &&
          <span data-ev-id="ev_cd54f301c7">{missingHebrew} {dict.studioBlocks.missingHebrew}</span>
          }
						{missingHebrew > 0 && missingEnglish > 0 && ' • '}
						{missingEnglish > 0 &&
          <span data-ev-id="ev_c485db0374">{missingEnglish} {dict.studioBlocks.missingEnglish}</span>
          }
					</span>
				</div>
      }

			{/* Block list */}
			{blocks.length === 0 ?
      <p data-ev-id="ev_598a5dad8f" className="text-center text-muted-foreground py-8">
					{dict.studioBlocks.noBlocks}
				</p> :

      <div data-ev-id="ev_7efba52169" className="flex flex-col gap-3">
					{blocks.map((block, index) => {
          const isIncomplete =
          block.content.en && !block.content.he ||
          block.content.he && !block.content.en;

          return (
            <div data-ev-id="ev_4de0529002"
            key={index}
            className={`p-4 bg-background border rounded-lg ${
            isIncomplete ? 'border-amber-500/50' : 'border-border'}`
            }>

								{/* Block header */}
								<div data-ev-id="ev_c438205030" className="flex items-center justify-between mb-3">
									<div data-ev-id="ev_a7d61a501f" className="flex items-center gap-2">
										{block.type === 'heading' && <Type className="w-4 h-4 text-primary" />}
										{block.type === 'text' && <AlignLeft className="w-4 h-4 text-primary" />}
										{block.type === 'video' && <Video className="w-4 h-4 text-primary" />}
										<span data-ev-id="ev_9254071c3e" className="text-sm font-medium text-foreground">
											{block.type === 'heading' && dict.studioBlocks.blockHeading}
											{block.type === 'text' && dict.studioBlocks.blockText}
											{block.type === 'video' && dict.studioBlocks.blockVideo}
										</span>
										{isIncomplete &&
                  <span data-ev-id="ev_a51894aa23" className="text-xs text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded">
												{dict.studioBlocks.incomplete}
											</span>
                  }
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
                  onClick={() => handleDeleteBlock(index)}
                  className={`p-1.5 transition-colors ${
                  deleteConfirm === index ?
                  'text-destructive bg-destructive/10 rounded' :
                  'text-muted-foreground hover:text-destructive'}`
                  }
                  title={deleteConfirm === index ? dict.studioBlocks.confirmDeleteBlock : dict.studioBlocks.deleteBlock}>

											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>

								{/* Video URL field */}
								{block.type === 'video' &&
              <div data-ev-id="ev_d34addcec9" className="mb-3">
										<label data-ev-id="ev_77da9332c0" className="block text-xs font-medium text-muted-foreground mb-1">
											{dict.studioBlocks.videoUrl}
										</label>
										<input data-ev-id="ev_ca1bcc5589"
                type="url"
                value={block.url || ''}
                onChange={(e) => handleUpdateBlock(index, { url: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                dir="ltr"
                placeholder="https://www.youtube.com/embed/..." />

										{block.url && isWatchUrl(block.url) &&
                <p data-ev-id="ev_ec908263ea" className="mt-1 text-xs text-amber-500 flex items-center gap-1">
												<AlertTriangle className="w-3 h-3" />
												{dict.studioBlocks.videoEmbedWarning}
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
							</div>);

        })}
				</div>
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

				<div data-ev-id="ev_99c8ddf16c" className="flex-1" />

				<button data-ev-id="ev_cc2ae891f5"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">

					{saving ? dict.common.loading : dict.studioBlocks.saveBlocks}
				</button>
			</div>
		</div>);

}