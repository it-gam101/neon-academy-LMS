import { useState, useRef } from 'react';
import { X, Package, Upload, CheckCircle, AlertCircle, Loader2, FileArchive } from 'lucide-react';
import { unzipSync } from 'fflate';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { syncCourseType } from '@/lib/courseType';
import { parseVc4elSource, type Vc4elResult, type Vc4elPlan } from '@/lib/vc4elSource';
import { buildImportPlan } from '@/lib/vc4elImport';
import type { Json } from '@/integrations/supabase/types';

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
  // Slice 9d-A: sidecar detection is REPORT-ONLY. null = no sidecar in this package.
  const [sidecar, setSidecar] = useState<Vc4elResult | null>(null);
  // 9d-B: the author opts in to importing the sidecar as editable modules.
  const [importContent, setImportContent] = useState(true);
  const [importResult, setImportResult] = useState<{modules: number;questions: number;} | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
    setSidecar(null);
    setImportResult(null);
    setImportError(null);
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

      // vc4el course source (slice 9d-A: DETECT AND REPORT ONLY — no database writes).
      // Best-effort by design. A sidecar that is missing, malformed, or from a newer
      // generator must NEVER stop a plain SCORM upload. That is why nothing in this
      // block calls setError() or setState('error'), and why it is wrapped in try/catch.
      let parsed: Vc4elResult | null = null;
      try {
        const sidecarBytes = unzipped[`${root}vc4el-source.json`];
        if (sidecarBytes && sidecarBytes.length > 0) {
          // packagePath values are relative to the PACKAGE ROOT, so the archive
          // listing handed to the parser must be relative to it too.
          const archivePaths = Object.keys(unzipped).
          filter((p) => p.startsWith(root) && !p.endsWith('/')).
          map((p) => p.slice(root.length));
          parsed = parseVc4elSource(
            JSON.parse(new TextDecoder().decode(sidecarBytes)),
            { archivePaths }
          );
        }
      } catch (err) {
        console.error('vc4el-source parse failed:', err);
        parsed = {
          ok: false,
          code: 'unparseable',
          detail: (err as {message?: string;})?.message || 'Sidecar could not be read.'
        };
      }
      setSidecar(parsed);

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

  // Writes the sidecar into Academy's own tables. Throws on any refusal; the
  // caller catches and never lets that failure touch the SCORM upload.
  const importSidecarContent = async (plan: Vc4elPlan, storageBaseUrl: string) => {
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
        if (!data || data.length === 0) throw new Error(dict.common.changeRefused);
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
      if (!modRow) throw new Error(dict.common.changeRefused);

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
        if (!quizRow) throw new Error(dict.common.changeRefused);

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
          if (!qRows || qRows.length === 0) throw new Error(dict.common.changeRefused);
        }
      }
    }

    return importPlan.counts;
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

      // Sidecar import. Its failure must NEVER undo the SCORM upload, so it has
      // its own try/catch and never rethrows — the outer catch deletes the module.
      if (sidecar && sidecar.ok && importContent) {
        try {
          const counts = await importSidecarContent(
            sidecar,
            (finalizeData as {storage_base_url?: string;})?.storage_base_url || ''
          );
          setImportResult(counts);
        } catch (importErr) {
          console.error('vc4el-source import failed:', importErr);
          setImportError(
            (importErr as {message?: string;})?.message || dict.studioUpload.importFailed
          );
        }
      }

      // Sync course type since we added a SCORM module
      await syncCourseType(courseId);

      // Return the module to parent
      onUploaded(moduleData);
    } catch (err) {
      console.error('SCORM upload error:', err);
      const msg =
      (err as {message?: string;} | null)?.message || (
      typeof err === 'string' ? err : JSON.stringify(err)) ||
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

							{/* vc4el course source — REPORT ONLY in 9d-A. Never gates the upload. */}
							{sidecar && sidecar.ok &&
            <div data-ev-id="ev_7fdef921ab" className="p-3 bg-muted rounded-lg space-y-2">
									<div data-ev-id="ev_23e018765a" className="flex items-center gap-2">
										<CheckCircle className="w-4 h-4 text-primary" />
										<span data-ev-id="ev_6f10070fb3" className="text-sm font-medium text-foreground">{dict.studioUpload.sidecarDetected}</span>
									</div>
									<p data-ev-id="ev_5cfb4830aa" className="text-sm text-foreground">
										<span data-ev-id="ev_a7d80c1279" className="text-muted-foreground">{dict.studioUpload.sidecarLanguages}</span>{' '}
										<span data-ev-id="ev_78b626bc1e" dir="ltr">{sidecar.locales.join(', ').toUpperCase()}</span>
									</p>
									<p data-ev-id="ev_91eb3f2ee3" className="text-sm text-foreground">
										<span data-ev-id="ev_64d8435297" className="text-muted-foreground">{dict.studioUpload.sidecarModules}</span>{' '}
										{sidecar.modules.length}
										<span data-ev-id="ev_a30b3eea06" className="text-muted-foreground ms-3">{dict.studioUpload.sidecarQuestions}</span>{' '}
										{sidecar.modules.reduce((n, m) => n + (m.quiz ? m.quiz.questions.length : 0), 0)}
									</p>
									<label data-ev-id="ev_e7f3ed8fb8" className="flex items-center gap-2 cursor-pointer">
										<input data-ev-id="ev_7cca2900f6"
                type="checkbox"
                checked={importContent}
                onChange={(e) => setImportContent(e.target.checked)}
                disabled={state !== 'idle'}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary" />
										<span data-ev-id="ev_bb839eaa1d" className="text-sm text-foreground">{dict.studioUpload.importContent}</span>
									</label>
									{sidecar.warnings.length > 0 &&
              <ul data-ev-id="ev_77fb5a0946" className="space-y-1">
											{sidecar.warnings.map((w, i) =>
                <li data-ev-id="ev_4d1544e41c" key={i} className="text-xs text-muted-foreground/80" dir="ltr">{w.detail}</li>
                )}
										</ul>
              }
									{sidecar.problems.length > 0 &&
              <div data-ev-id="ev_8419af3b7e" className="space-y-1">
											<p data-ev-id="ev_b9175f7b57" className="text-xs font-medium text-foreground">{dict.studioUpload.sidecarIssues}</p>
											<ul data-ev-id="ev_abd267fb45" className="max-h-32 overflow-y-auto space-y-1">
												{sidecar.problems.map((p, i) =>
                  <li data-ev-id="ev_21fa95ff57" key={i} className="text-xs text-muted-foreground/80" dir="ltr">{p.detail}</li>
                  )}
											</ul>
											<p data-ev-id="ev_1c46bc0760" className="text-xs text-muted-foreground">{dict.studioUpload.sidecarUploadUnaffected}</p>
										</div>
              }
								</div>
            }

							{sidecar && sidecar.ok === false && sidecar.code !== 'absent' &&
            <div data-ev-id="ev_70ea8867ca" className="p-3 bg-muted rounded-lg space-y-2">
									<div data-ev-id="ev_7112893192" className="flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-muted-foreground" />
										<span data-ev-id="ev_6215b407de" className="text-sm font-medium text-foreground">{dict.studioUpload.sidecarUnreadable}</span>
									</div>
									<p data-ev-id="ev_bf2e98819e" className="text-xs text-muted-foreground/80" dir="ltr">{sidecar.detail}</p>
									<p data-ev-id="ev_1a0252c721" className="text-xs text-muted-foreground">{dict.studioUpload.sidecarUploadUnaffected}</p>
								</div>
            }
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

					{state === 'success' && importResult &&
          <div data-ev-id="ev_62da6649ef" className="p-3 bg-muted rounded-lg">
							<p data-ev-id="ev_f74dacb9f5" className="text-sm text-foreground">
								<span data-ev-id="ev_2cac80b64b" className="text-muted-foreground">{dict.studioUpload.importedContent}</span>{' '}
								<span data-ev-id="ev_cd78b349b3" className="text-muted-foreground">{dict.studioUpload.sidecarModules}</span>{' '}
								{importResult.modules}
								<span data-ev-id="ev_4c9fda16ce" className="text-muted-foreground ms-3">{dict.studioUpload.sidecarQuestions}</span>{' '}
								{importResult.questions}
							</p>
						</div>
          }

					{state === 'success' && importError &&
          <div data-ev-id="ev_2d0e1855a6" className="p-3 bg-muted rounded-lg space-y-1">
							<p data-ev-id="ev_7195797774" className="text-sm text-foreground">{dict.studioUpload.importFailed}</p>
							<p data-ev-id="ev_0f0787c185" className="text-xs text-muted-foreground/80" dir="ltr">{importError}</p>
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