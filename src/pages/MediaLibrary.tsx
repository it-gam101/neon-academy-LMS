import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Image, FileText, Trash2, Search, ArrowLeft, ArrowRight, Package } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { functionErrorMessage } from '@/lib/functionError';
import { withTimeout } from '@/utils/fetchWithTimeout';

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

interface ScormPackage {
  id: string;
  title: string;
  scorm_version: string;
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'packages'>('files');
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [moduleUsage, setModuleUsage] = useState<Map<string, number>>(new Map());
  const [registrationUsage, setRegistrationUsage] = useState<Map<string, number>>(new Map());
  const [deletePackageTarget, setDeletePackageTarget] = useState<ScormPackage | null>(null);
  const [deletingPackage, setDeletingPackage] = useState(false);
  const [deletePackageError, setDeletePackageError] = useState<string | null>(null);

  const isSuperAdmin = profile?.role === 'super_admin';
  const isHrManager = profile?.role === 'hr_manager';
  const canManagePackages = isSuperAdmin || isHrManager;

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

  // Fetch SCORM packages and usage counts for super_admin/hr_manager
  useEffect(() => {
    if (!supabase || !canManagePackages) return;

    const fetchPackages = async () => {
      setPackagesLoading(true);

      const { data: pkgData, error: pkgErr } = await supabase
        .from('scorm_packages')
        .select('id, title, scorm_version, size_bytes, created_at')
        .order('created_at', { ascending: false });

      if (pkgErr) {
        console.error('Failed to load SCORM packages:', pkgErr);
      } else {
        setPackages((pkgData as ScormPackage[]) || []);
      }

      // Fetch module usage counts
      const { data: modData } = await supabase
        .from('modules')
        .select('scorm_package_id');

      const modMap = new Map<string, number>();
      (modData || []).forEach((m: { scorm_package_id: string | null }) => {
        if (m.scorm_package_id) {
          modMap.set(m.scorm_package_id, (modMap.get(m.scorm_package_id) || 0) + 1);
        }
      });
      setModuleUsage(modMap);

      // Fetch registration usage counts
      const { data: regData } = await supabase
        .from('scorm_registrations')
        .select('package_id');

      const regMap = new Map<string, number>();
      (regData || []).forEach((r: { package_id: string | null }) => {
        if (r.package_id) {
          regMap.set(r.package_id, (regMap.get(r.package_id) || 0) + 1);
        }
      });
      setRegistrationUsage(regMap);

      setPackagesLoading(false);
    };

    fetchPackages();
  }, [canManagePackages]);

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
    setDeleteError(null);

    try {
      const { error } = await withTimeout(
        supabase.functions.invoke('media-delete', {
          body: { id: deleteTarget.id }
        }),
        10000
      );

      if (error) {
        const msg = await functionErrorMessage(error, dict.common.error);
        console.error('Delete error:', error);
        setDeleteError(msg);
        return;
      }
      
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast('success', dict.media.deleted);
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error && err.message === 'TIMEOUT'
        ? dict.errors.connectionTimeout
        : await functionErrorMessage(err, dict.common.error);
      console.error('handleDelete failed:', err);
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!supabase || !deletePackageTarget) return;

    setDeletingPackage(true);
    setDeletePackageError(null);

    try {
      const { error } = await withTimeout(
        supabase.functions.invoke('scorm-package-delete', {
          body: { id: deletePackageTarget.id }
        }),
        10000
      );

      if (error) {
        const msg = await functionErrorMessage(error, dict.common.error);
        console.error('Delete package error:', error);
        setDeletePackageError(msg);
        return;
      }

      setPackages((prev) => prev.filter((p) => p.id !== deletePackageTarget.id));
      showToast('success', dict.media.packageDeleted);
      setDeletePackageTarget(null);
    } catch (err) {
      const msg = err instanceof Error && err.message === 'TIMEOUT'
        ? dict.errors.connectionTimeout
        : await functionErrorMessage(err, dict.common.error);
      console.error('handleDeletePackage failed:', err);
      setDeletePackageError(msg);
    } finally {
      setDeletingPackage(false);
    }
  };

  const openDeleteDialog = (asset: MediaAsset) => {
    setDeleteError(null);
    setDeleteTarget(asset);
  };

  const closeDeleteDialog = () => {
    setDeleteError(null);
    setDeleteTarget(null);
  };

  const openDeletePackageDialog = (pkg: ScormPackage) => {
    setDeletePackageError(null);
    setDeletePackageTarget(pkg);
  };

  const closeDeletePackageDialog = () => {
    setDeletePackageError(null);
    setDeletePackageTarget(null);
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

			{/* Tab row for super_admin/hr_manager */}
			{canManagePackages &&
      <div data-ev-id="ev_media_tabs" className="flex items-center bg-muted rounded-lg p-1 mb-6">
					<button data-ev-id="ev_tab_files"
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
          activeTab === 'files' ?
          'bg-background text-foreground shadow-sm' :
          'text-muted-foreground hover:text-foreground'}`
          }>

						{dict.media.tabFiles}
					</button>
					<button data-ev-id="ev_tab_packages"
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
          activeTab === 'packages' ?
          'bg-background text-foreground shadow-sm' :
          'text-muted-foreground hover:text-foreground'}`
          }>

						{dict.media.tabPackages}
					</button>
				</div>
      }

			{/* Files tab content */}
			{(!canManagePackages || activeTab === 'files') &&
      <>
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
            onClick={() => openDeleteDialog(asset)}
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
      </>
      }

			{/* SCORM Packages tab */}
			{canManagePackages && activeTab === 'packages' &&
      <div data-ev-id="ev_packages_section">
					{packagesLoading ?
          <LoadingSkeleton variant="list" count={4} /> :
          packages.length === 0 ?
          <EmptyState
            icon={Package}
            title={dict.common.noResults}
            description="" /> :

          <div data-ev-id="ev_packages_list" className="flex flex-col gap-3">
							{packages.map((pkg) => {
              const modCount = moduleUsage.get(pkg.id) || 0;
              const regCount = registrationUsage.get(pkg.id) || 0;
              const inUse = modCount > 0 || regCount > 0;

              return (
                <div data-ev-id="ev_package_row"
                key={pkg.id}
                className="p-4 bg-card border border-border rounded-lg flex items-center justify-between gap-4">

										<div data-ev-id="ev_package_info" className="flex-1 min-w-0">
											<p data-ev-id="ev_package_title" className="font-medium text-foreground truncate">{pkg.title}</p>
											<p data-ev-id="ev_package_meta" className="text-xs text-muted-foreground mt-1">
												{pkg.scorm_version} · {formatFileSize(pkg.size_bytes)} · {formatDate(pkg.created_at, locale)}
											</p>
											<p data-ev-id="ev_package_usage" className="text-xs text-muted-foreground mt-1">
												{dict.media.usedByModules}: {modCount} · {dict.media.learnerRecords}: {regCount}
											</p>
										</div>

										<div data-ev-id="ev_package_actions" className="flex items-center gap-3">
											{inUse &&
                      <span data-ev-id="ev_package_in_use" className="text-xs text-muted-foreground max-w-[200px]">
													{dict.media.packageInUse}
												</span>
                      }
											<button data-ev-id="ev_delete_package"
                      onClick={() => openDeletePackageDialog(pkg)}
                      disabled={inUse}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={dict.common.delete}>

												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>);

            })}
						</div>
          }
				</div>
      }

			{/* File delete confirmation */}
			<Modal
        isOpen={!!deleteTarget}
        onClose={closeDeleteDialog}
        title={dict.media.deleteTitle}
        footer={
          <div data-ev-id="ev_delete_footer" className="flex gap-3 justify-end">
            <button data-ev-id="ev_delete_cancel"
              type="button"
              onClick={closeDeleteDialog}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
              {dict.common.cancel}
            </button>
            <button data-ev-id="ev_delete_confirm"
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50">
              {deleting ? dict.common.loading : dict.common.delete}
            </button>
          </div>
        }>

				<p data-ev-id="ev_delete_msg" className="text-foreground">{dict.media.deleteMessage}</p>
				{deleteError &&
        <p data-ev-id="ev_delete_error" className="text-sm text-destructive mt-3">{deleteError}</p>
        }
			</Modal>

			{/* Package delete confirmation */}
			<Modal
        isOpen={!!deletePackageTarget}
        onClose={closeDeletePackageDialog}
        title={dict.media.deletePackageTitle}
        footer={
          <div data-ev-id="ev_delete_pkg_footer" className="flex gap-3 justify-end">
            <button data-ev-id="ev_delete_pkg_cancel"
              type="button"
              onClick={closeDeletePackageDialog}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
              {dict.common.cancel}
            </button>
            <button data-ev-id="ev_delete_pkg_confirm"
              type="button"
              onClick={handleDeletePackage}
              disabled={deletingPackage}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50">
              {deletingPackage ? dict.common.loading : dict.common.delete}
            </button>
          </div>
        }>

				<p data-ev-id="ev_delete_pkg_msg" className="text-foreground">{dict.media.deletePackageMessage}</p>
				{deletePackageError &&
        <p data-ev-id="ev_delete_pkg_error" className="text-sm text-destructive mt-3">{deletePackageError}</p>
        }
			</Modal>

		</div>);

}