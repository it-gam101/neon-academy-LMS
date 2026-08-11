import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Image, FileText, Trash2, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { functionErrorMessage } from '@/lib/functionError';

interface MediaAsset {
  id: string;
  owner_id: string | null;
  kind: 'image' | 'pdf';
  r2_key: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string, locale: 'en' | 'he'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function ImageThumbnail({ url, filename }: {url: string;filename: string;}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Image className="w-12 h-12 text-muted-foreground" />;
  }

  return (
    <img data-ev-id="ev_1f5614baca"
    src={url}
    alt={filename}
    className="w-full h-full object-cover"
    onError={() => setFailed(true)} />);


}

export default function MediaLibrary() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { profile } = useProfile();
  const BackArrow = locale === 'he' ? ArrowRight : ArrowLeft;

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [ownerNames, setOwnerNames] = useState<Map<string, string>>(new Map());
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = profile?.role === 'super_admin';

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.
      from('media_assets').
      select('*').
      order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load media assets:', error);
        showToast('error', (error as {message?: string;})?.message || dict.common.error);
      } else {
        setAssets(data as MediaAsset[] || []);
      }

      setLoading(false);
    };

    fetchAssets();
  }, [dict.common.error]);

  // Fetch owner names for super_admin
  useEffect(() => {
    if (!supabase || !isSuperAdmin || assets.length === 0) {
      setOwnerNames(new Map());
      return;
    }

    const ownerIds = [...new Set(assets.map((a) => a.owner_id).filter(Boolean))] as string[];
    if (ownerIds.length === 0) return;

    const fetchOwners = async () => {
      const { data } = await supabase.
      from('profiles').
      select('id, full_name').
      in('id', ownerIds);

      if (data) {
        const nameMap = new Map<string, string>();
        data.forEach((p) => nameMap.set(p.id, p.full_name || ''));
        setOwnerNames(nameMap);
      }
    };

    fetchOwners();
  }, [isSuperAdmin, assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesKind = kindFilter === 'all' || asset.kind === kindFilter;
      const matchesSearch = !searchQuery || asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesKind && matchesSearch;
    });
  }, [assets, kindFilter, searchQuery]);

  const handleDelete = async () => {
    if (!supabase || !deleteTarget) return;

    setDeleting(true);

    try {
      const { error } = await supabase.functions.invoke('media-delete', {
        body: { id: deleteTarget.id }
      });

      if (error) {
        const msg = await functionErrorMessage(error, dict.common.error);
        console.error('Delete error:', error);
        showToast('error', msg);
      } else {
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        showToast('success', dict.media.deleted);
      }
    } catch (err) {
      const msg = await functionErrorMessage(err, dict.common.error);
      console.error('Delete exception:', err);
      showToast('error', msg);
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div data-ev-id="ev_6827118908" className="max-w-6xl mx-auto">
				<LoadingSkeleton variant="text" count={2} />
				<div data-ev-id="ev_9398c3b089" className="mt-8">
					<LoadingSkeleton variant="list" count={6} />
				</div>
			</div>);

  }

  return (
    <div data-ev-id="ev_563cb95a1d" className="max-w-6xl mx-auto">
			{/* Header */}
			<div data-ev-id="ev_206d1e50aa" className="flex items-center justify-between mb-8">
				<div data-ev-id="ev_3ea3e307af">
					<div data-ev-id="ev_9ee233bf4d" className="flex items-center gap-3 mb-2">
						<Link to="/studio" className="text-muted-foreground hover:text-foreground transition-colors">
							<BackArrow className="w-5 h-5" />
						</Link>
						<h1 data-ev-id="ev_56eb286770" className="text-3xl font-bold text-foreground">{dict.media.title}</h1>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div data-ev-id="ev_4de62d9ea8" className="flex flex-col sm:flex-row gap-4 mb-6">
				{/* Search */}
				<div data-ev-id="ev_781b12b6a2" className="relative flex-1 max-w-md">
					<Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<input data-ev-id="ev_b720f70981"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={dict.common.search}
          className="w-full ps-10 pe-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />

				</div>

				{/* Kind filter */}
				<div data-ev-id="ev_033a0b251a" className="flex items-center bg-muted rounded-lg p-1">
					<button data-ev-id="ev_c47da7cc8a"
          onClick={() => setKindFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          kindFilter === 'all' ?
          'bg-background text-foreground shadow-sm' :
          'text-muted-foreground hover:text-foreground'}`
          }>

						{dict.common.all}
					</button>
					<button data-ev-id="ev_fd95fb4535"
          onClick={() => setKindFilter('image')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          kindFilter === 'image' ?
          'bg-background text-foreground shadow-sm' :
          'text-muted-foreground hover:text-foreground'}`
          }>

						{dict.media.images}
					</button>
					<button data-ev-id="ev_e5ddb0cff4"
          onClick={() => setKindFilter('pdf')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          kindFilter === 'pdf' ?
          'bg-background text-foreground shadow-sm' :
          'text-muted-foreground hover:text-foreground'}`
          }>

						{dict.media.pdfs}
					</button>
				</div>
			</div>

			{/* Content */}
			{assets.length === 0 ?
      <EmptyState
        icon={Image}
        title={dict.media.empty}
        description="" /> :

      filteredAssets.length === 0 ?
      <EmptyState
        icon={Search}
        title={dict.common.noResults}
        description="" /> :


      <div data-ev-id="ev_12d901e7a4" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredAssets.map((asset) =>
        <div data-ev-id="ev_d6f1f04d27"
        key={asset.id}
        className="bg-card border border-border rounded-lg overflow-hidden group">

							{/* Preview */}
							<div data-ev-id="ev_78ab794bd3" className="aspect-square bg-muted flex items-center justify-center relative">
								{asset.kind === 'image' ?
            <ImageThumbnail url={asset.url} filename={asset.filename} /> :

            <FileText className="w-12 h-12 text-muted-foreground" />
            }

								{/* Delete button overlay */}
								<button data-ev-id="ev_dd21be1b92"
            onClick={() => setDeleteTarget(asset)}
            className="absolute top-2 end-2 p-1.5 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title={dict.common.delete}>

									<Trash2 className="w-4 h-4" />
								</button>
							</div>

							{/* Info */}
							<div data-ev-id="ev_72b08fd34c" className="p-3">
								<p data-ev-id="ev_62eac70006" className="text-sm font-medium text-foreground truncate" title={asset.filename}>
									{asset.filename}
								</p>
								<p data-ev-id="ev_03461e5a5b" className="text-xs text-muted-foreground mt-1">
									{formatFileSize(asset.size_bytes)} · {formatDate(asset.created_at, locale)}
								</p>
								{isSuperAdmin && asset.owner_id && ownerNames.get(asset.owner_id) &&
            <p data-ev-id="ev_007df96659" className="text-xs text-muted-foreground mt-1">
										{dict.media.uploadedBy}: {ownerNames.get(asset.owner_id)}
									</p>
            }
							</div>
						</div>
        )}
				</div>
      }

			{/* Delete confirmation */}
			<ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={dict.media.deleteTitle}
        message={dict.media.deleteMessage}
        confirmLabel={deleting ? dict.common.loading : dict.common.delete}
        destructive />

		</div>);

}