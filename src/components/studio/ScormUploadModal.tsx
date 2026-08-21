import { useState, useRef } from 'react';
import { X, Package, Upload, CheckCircle, AlertCircle, Loader2, FileArchive } from 'lucide-react';
import { unzipSync } from 'fflate';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { syncCourseType } from '@/lib/courseType';

type Module = Tables<'modules'>;

interface ScormUploadModalProps {
  courseId: string;
  sortOrder: number;
  onClose: () => void;
  onUploaded: (module: Module) => void;
}

type UploadState = 'idle' | 'parsing' | 'uploading' | 'registering' | 'success' | 'error';

interface ManifestInfo {
  scormVersion: '1.2' | '2004_3rd' | '2004_4th';
  entryPoint: string;
  schemaversion: string;
}

const CONCURRENCY_LIMIT = 4;

export function ScormUploadModal({ courseId, sortOrder, onClose, onUploaded }: ScormUploadModalProps) {
  const { locale } = useLocale();
  const { session } = useAuth();
  const dict = getDictionary(locale);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [packageTitle, setPackageTitle] = useState('');
  const [manifestInfo, setManifestInfo] = useState<ManifestInfo | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [unzippedFiles, setUnzippedFiles] = useState<Record<string, Uint8Array> | null>(null);
  const [packageRoot, setPackageRoot] = useState<string>('');

  // SCORM 1.2 uses adlcp:scormtype, SCORM 2004 uses adlcp:scormType.
  // XML getAttribute is case-sensitive, so match on the local name instead.
  const getScormType = (resource: Element): string | null => {
    for (const attr of Array.from(resource.attributes)) {
      const local = attr.name.split(':').pop()?.toLowerCase();
      if (local === 'scormtype') return attr.value;
    }
    return null;
  };

  // Parse SCORM version from schemaversion element
  const parseScormVersion = (schemaversion: string): '1.2' | '2004_3rd' | '2004_4th' => {
    const v = schemaversion.toLowerCase();
    if (v.includes('1.2')) return '1.2';
    if (v.includes('2004') && v.includes('4th')) return '2004_4th';
    if (v.includes('2004') || v.includes('cam 1.3')) return '2004_3rd';
    return '1.2'; // default
  };

  // Parse imsmanifest.xml and extract entry point
  const parseManifest = (xmlContent: string): ManifestInfo | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'text/xml');

      // Check for parse errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) return null;

      // Get schema version
      const schemaversionEl = doc.querySelector('schemaversion');
      const schemaversion = schemaversionEl?.textContent?.trim() || '1.2';
      const scormVersion = parseScormVersion(schemaversion);

      // Find entry point - prefer resource with scormtype="sco"
      const resources = doc.querySelectorAll('resource');
      let entryPoint: string | null = null;

      for (const resource of resources) {
        const scormType = getScormType(resource);
        if (scormType?.toLowerCase() === 'sco') {
          const href = resource.getAttribute('href');
          if (href) {
            entryPoint = href;
            break;
          }
        }
      }

      // Fallback to first resource with href
      if (!entryPoint) {
        for (const resource of resources) {
          const href = resource.getAttribute('href');
          if (href) {
            entryPoint = href;
            break;
          }
        }
      }

      if (!entryPoint) return null;

      return { scormVersion, entryPoint, schemaversion };
    } catch {
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setState('parsing');

    // Default title from filename without extension
    const defaultTitle = file.name.replace(/\.zip$/i, '');
    setPackageTitle(defaultTitle);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Unzip
      let unzipped: Record<string, Uint8Array>;
      try {
        unzipped = unzipSync(uint8Array);
      } catch {
        setError(dict.studioUpload.invalidZip);
        setState('error');
        return;
      }

      // Find imsmanifest.xml at ANY depth, determine package root
      let manifestPath: string | null = null;
      let manifestContent: string | null = null;
      let root = '';

      for (const [path, data] of Object.entries(unzipped)) {
        const filename = path.split('/').pop()?.toLowerCase();
        if (filename === 'imsmanifest.xml' && data.length > 0) {
          manifestPath = path;
          manifestContent = new TextDecoder().decode(data);
          // The directory containing imsmanifest.xml is the package root
          const lastSlash = path.lastIndexOf('/');
          root = lastSlash > 0 ? path.substring(0, lastSlash + 1) : '';
          break;
        }
      }

      if (!manifestPath || !manifestContent) {
        setError(dict.studioUpload.noManifest);
        setState('error');
        return;
      }

      // Parse manifest
      const info = parseManifest(manifestContent);
      if (!info) {
        setError(dict.studioUpload.noEntryPoint);
        setState('error');
        return;
      }

      setManifestInfo(info);
      setUnzippedFiles(unzipped);
      setPackageRoot(root);
      setState('idle');
    } catch (err) {
      console.error('File processing error:', err);
      setError(dict.studioUpload.invalidZip);
      setState('error');
    }
  };

  const handleUpload = async () => {
    if (!unzippedFiles || !manifestInfo || !session?.access_token || !supabase) return;

    setState('uploading');
    setError(null);

    let createdModuleId: string | null = null;

    try {
      // 1. Create the module row FIRST so we have a moduleId
      const { data: moduleData, error: moduleError } = await supabase.
      from('modules').
      insert({
        course_id: courseId,
        title_en: packageTitle,
        title_he: packageTitle,
        module_type: 'scorm_package',
        sort_order: sortOrder,
        content_json: null
      }).
      select().
      single();

      if (moduleError || !moduleData) {
        const msg = moduleError?.message || 'Failed to create module';
        console.error('Module creation error:', moduleError);
        setError(msg);
        setState('error');
        return;
      }

      createdModuleId = moduleData.id;

      // 2. Build file list for presigning (strip package root prefix)
      const filesToUpload: Array<{path: string;size: number;data: Uint8Array;}> = [];
      let totalSize = 0;

      for (const [path, data] of Object.entries(unzippedFiles)) {
        // Skip directory entries (paths ending in / or zero-byte dirs)
        if (path.endsWith('/') || data.length === 0) continue;

        // Strip package root prefix
        let relativePath = path;
        if (packageRoot && path.startsWith(packageRoot)) {
          relativePath = path.substring(packageRoot.length);
        }

        if (relativePath) {
          filesToUpload.push({ path: relativePath, size: data.length, data });
          totalSize += data.length;
        }
      }

      setUploadProgress({ uploaded: 0, total: filesToUpload.length });

      // 3. Call presign endpoint
      const presignRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scorm-presign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            files: filesToUpload.map((f) => ({ path: f.path, size: f.size })),
            totalSize
          })
        }
      );

      const presignData = await presignRes.json();
      if (!presignRes.ok || presignData.error) {
        const msg = presignData.error || 'Presign failed';
        console.error('Presign error:', presignData);
        throw new Error(msg);
      }

      const { packageId, uploads } = presignData as {packageId: string;uploads: Array<{path: string;url: string;}>;};

      // 4. Upload files with concurrency limit
      const urlMap = new Map(uploads.map((u) => [u.path, u.url]));
      let uploadedCount = 0;

      const uploadFile = async (file: {path: string;data: Uint8Array;}) => {
        const url = urlMap.get(file.path);
        if (!url) throw new Error(`No presigned URL for ${file.path}`);

        // PUT with NO extra headers - they break the signature
        // Create a new Uint8Array copy to get a clean ArrayBuffer
        const bodyData = new Uint8Array(file.data).buffer;
        const res = await fetch(url, {
          method: 'PUT',
          body: bodyData as ArrayBuffer
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Upload failed for ${file.path}: ${res.status} ${text}`);
        }

        uploadedCount++;
        setUploadProgress({ uploaded: uploadedCount, total: filesToUpload.length });
      };

      // Process in batches with concurrency limit
      const queue = [...filesToUpload];
      while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY_LIMIT);
        await Promise.all(batch.map(uploadFile));
      }

      // 5. Call finalize endpoint
      setState('registering');

      const finalizeRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scorm-finalize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            packageId,
            title: packageTitle,
            scormVersion: manifestInfo.scormVersion,
            entryPoint: manifestInfo.entryPoint,
            manifestJson: {
              schemaversion: manifestInfo.schemaversion,
              entryPoint: manifestInfo.entryPoint,
              fileCount: filesToUpload.length
            },
            sizeBytes: totalSize,
            moduleId: createdModuleId
          })
        }
      );

      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok || finalizeData.error) {
        const msg = finalizeData.error || 'Finalize failed';
        console.error('Finalize error:', finalizeData);
        throw new Error(msg);
      }

      setState('success');

      // Sync course type since we added a SCORM module
      await syncCourseType(courseId);

      // Return the module to parent
      onUploaded(moduleData);
    } catch (err) {
      console.error('SCORM upload error:', err);
      const msg =
        (err as { message?: string } | null)?.message ||
        (typeof err === 'string' ? err : JSON.stringify(err)) ||
        dict.studioUpload.uploadFailed;
      setError(msg);
      setState('error');

      // Clean up the module if it was created
      if (createdModuleId && supabase) {
        try {
          await supabase.from('modules').delete().eq('id', createdModuleId);
        } catch (cleanupErr) {
          console.error('Failed to clean up module:', cleanupErr);
        }
      }
    }
  };

  const canUpload = manifestInfo && unzippedFiles && packageTitle.trim() && state === 'idle';

  return (
    <div data-ev-id="ev_7f7858894d" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div data-ev-id="ev_acef3fbde6"
      className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-xl"
      dir={locale === 'he' ? 'rtl' : 'ltr'}>

				{/* Header */}
				<div data-ev-id="ev_5459e922dd" className="flex items-center justify-between px-6 py-4 border-b border-border">
					<div data-ev-id="ev_57eadd6305" className="flex items-center gap-2">
						<Package className="w-5 h-5 text-primary" />
						<h2 data-ev-id="ev_daf392ee82" className="text-lg font-semibold text-foreground">{dict.studioUpload.title}</h2>
					</div>
					<button data-ev-id="ev_154283dd65"
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          disabled={state === 'uploading' || state === 'registering'}>

						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div data-ev-id="ev_ffb4d97d8a" className="px-6 py-4 space-y-4">
					{/* File input */}
					{!selectedFile &&
          <div data-ev-id="ev_3a1824f2e7"
          className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}>

							<FileArchive className="w-12 h-12 text-muted-foreground" />
							<p data-ev-id="ev_9e63a51590" className="text-sm text-muted-foreground">{dict.studioUpload.selectFile}</p>
							<input data-ev-id="ev_e9022e475a"
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileSelect} />

						</div>
          }

					{/* Parsing state */}
					{state === 'parsing' &&
          <div data-ev-id="ev_946fcf3041" className="flex items-center gap-3 text-muted-foreground">
							<Loader2 className="w-5 h-5 animate-spin" />
							<span data-ev-id="ev_4ace4cb042">{dict.studioUpload.parsingManifest}</span>
						</div>
          }

					{/* File selected, show details */}
					{selectedFile && manifestInfo && state !== 'parsing' &&
          <>
							{/* Package title */}
							<div data-ev-id="ev_35d129f10b">
								<label data-ev-id="ev_3ce1c769d8" className="block text-sm font-medium text-foreground mb-1">
									{dict.studioUpload.packageTitle}
								</label>
								<input data-ev-id="ev_db7b52b1d3"
              type="text"
              value={packageTitle}
              onChange={(e) => setPackageTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={state !== 'idle'} />

							</div>

							{/* Manifest info */}
							<div data-ev-id="ev_20aabfeed8" className="p-3 bg-muted rounded-lg space-y-1">
								<p data-ev-id="ev_bdff03090a" className="text-sm text-foreground">
									<span data-ev-id="ev_2e2fe7d7f5" className="text-muted-foreground">{dict.studioUpload.versionLabel}</span>{' '}
									<span data-ev-id="ev_e8d7701c84" className="font-medium" dir="ltr">{manifestInfo.scormVersion}</span>
								</p>
								<p data-ev-id="ev_89400e83a8" className="text-sm text-foreground">
									<span data-ev-id="ev_f681d59910" className="text-muted-foreground">{dict.studioUpload.entryLabel}</span>{' '}
									<span data-ev-id="ev_80c1e01904" className="font-mono text-xs" dir="ltr">{manifestInfo.entryPoint}</span>
								</p>
							</div>
						</>
          }

					{/* Upload progress */}
					{state === 'uploading' &&
          <div data-ev-id="ev_348b032691" className="space-y-2">
							<div data-ev-id="ev_feeb492332" className="flex items-center gap-3 text-foreground">
								<Loader2 className="w-5 h-5 animate-spin text-primary" />
								<span data-ev-id="ev_e49bc5cbde">{dict.studioUpload.uploadingFiles}</span>
							</div>
							<div data-ev-id="ev_bcc801bb56" className="h-2 bg-muted rounded-full overflow-hidden">
								<div data-ev-id="ev_be9c9c1b08"
              className="h-full bg-primary transition-all"
              style={{ width: `${uploadProgress.total ? uploadProgress.uploaded / uploadProgress.total * 100 : 0}%` }} />

							</div>
							<p data-ev-id="ev_3eeaec2326" className="text-sm text-muted-foreground text-center" dir="ltr">
								{uploadProgress.uploaded} / {uploadProgress.total}
							</p>
						</div>
          }

					{/* Registering */}
					{state === 'registering' &&
          <div data-ev-id="ev_a73fa080af" className="flex items-center gap-3 text-foreground">
							<Loader2 className="w-5 h-5 animate-spin text-primary" />
							<span data-ev-id="ev_ece98f8bc7">{dict.studioUpload.registering}</span>
						</div>
          }

					{/* Success */}
					{state === 'success' &&
          <div data-ev-id="ev_52a2dd1df9" className="flex items-center gap-3 text-green-500">
							<CheckCircle className="w-5 h-5" />
							<span data-ev-id="ev_b9c45cbcc1">{dict.studioUpload.success}</span>
						</div>
          }

					{/* Error */}
					{error &&
          <div data-ev-id="ev_80c2c475ba" className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
							<AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
							<p data-ev-id="ev_c48ca5a5a6" className="text-sm text-destructive">{error}</p>
						</div>
          }
				</div>

				{/* Footer */}
				<div data-ev-id="ev_39052cee3d" className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
					{state !== 'success' &&
          <>
							<button data-ev-id="ev_2cf9cadabc"
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            disabled={state === 'uploading' || state === 'registering'}>

								{dict.studioUpload.cancel}
							</button>
							<button data-ev-id="ev_6ad36fa3e7"
            onClick={handleUpload}
            disabled={!canUpload}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

								<Upload className="w-4 h-4" />
								{dict.studioUpload.upload}
							</button>
						</>
          }
					{state === 'success' &&
          <button data-ev-id="ev_fdc65138f9"
          onClick={onClose}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							{dict.common.close}
						</button>
          }
				</div>
			</div>
		</div>);

}