import { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatDate';
import { functionErrorMessage } from '@/lib/functionError';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { resizeImageToBlob } from '@/lib/resizeImage';
import { ensureSession } from '@/lib/ensureSession';

export default function Profile() {
  const { locale, t } = useLocale();
  const { profile, profileError, refreshProfile } = useAuth();

  // Form state for editable fields only
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview error state (for pending avatar)
  const [previewFailed, setPreviewFailed] = useState(false);

  // Manager name (fetched separately, not via embed)
  const [managerName, setManagerName] = useState<string | null>(null);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setJustUploaded(false);
      setPreviewFailed(false);
    }
  }, [profile]);

  // Fetch manager name with a PLAIN QUERY, not a PostgREST embed
  useEffect(() => {
    if (!profile?.manager_id || !supabase) {
      setManagerName(null);
      return;
    }

    const fetchManager = async () => {
      const { data, error } = await supabase.
      from('profiles').
      select('full_name, email').
      eq('id', profile.manager_id!).
      maybeSingle();

      if (error) {
        console.error('Failed to fetch manager:', error);
        setManagerName(null);
      } else if (data) {
        setManagerName(data.full_name || data.email || null);
      } else {
        setManagerName(null);
      }
    };

    fetchManager();
  }, [profile?.manager_id]);

  // Check if form has changes
  const hasChanges = profile && (
  fullName.trim() !== (profile.full_name || '') ||
  avatarUrl.trim() !== (profile.avatar_url || ''));


  const handleSave = async () => {
    if (!supabase || !profile) return;

    // Capture the PREVIOUS avatar_url BEFORE we update and refresh
    const previousAvatarUrl = profile.avatar_url;

    setSaving(true);
    try {
      // Only update full_name and avatar_url — role, manager_id, department are READ-ONLY
      const { data, error } = await withTimeout(
        supabase.
        from('profiles').
        update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null // Empty string becomes null
        }).
        eq('id', profile.id).
        select(),
        10000
      );

      if (error) {
        console.error('Profile update error:', error);
        showToast('error', (error as {message?: string;})?.message || t.common.error);
      } else if (!data || data.length === 0) {
        // RLS-blocked UPDATE returns success with ZERO rows
        showToast('error', t.common.error);
      } else {
        showToast('success', t.profile.profileUpdated);
        await refreshProfile();

        // Clean up the old avatar object if it was an avatar we uploaded
        // ⚠️ Cleanup failure must NEVER fail the save — fire and forget
        const newAvatarUrl = avatarUrl.trim() || null;
        if (
          previousAvatarUrl &&
          previousAvatarUrl !== newAvatarUrl
        ) {
          try {
            const oldUrl = new URL(previousAvatarUrl);
            const oldKey = oldUrl.pathname.slice(1); // Remove leading slash
            
            // Only delete if it's one of our avatar objects (not an external link)
            if (oldKey.startsWith('avatars/')) {
              supabase.functions.invoke('media-delete', {
                body: { purpose: 'avatar', key: oldKey }
              }).then(({ error: deleteError }) => {
                if (deleteError) {
                  console.error('Failed to delete old avatar (non-blocking):', deleteError);
                }
              }).catch((err) => {
                console.error('Failed to delete old avatar (non-blocking):', err);
              });
            }
          } catch {
            // URL parse failed — skip cleanup (external link or invalid)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error && err.message === 'TIMEOUT'
        ? t.errors.connectionTimeout
        : err instanceof Error ? err.message : t.common.error;
      console.error('handleSave failed:', err);
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar file upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploadError(null);
    setUploading(true);
    setJustUploaded(false);

    try {
      // A failed refresh makes supabase-js send the ANON KEY, and the Edge Function then
      // answers "Invalid or expired token" — which reads like a token problem when the user
      // is simply signed out. Say the true thing instead. BACKLOG item 104.
      if (!(await ensureSession())) {
        setUploadError(t.errors.sessionExpired);
        return;
      }

      // 1. Resize the image (use RESIZED blob's type and size for presign)
      const resizedBlob = await resizeImageToBlob(file, 256);

      // 2. Get presigned URL from media-presign with purpose: 'avatar'
      const { data: presignData, error: presignError } = await withTimeout(
        supabase.functions.invoke('media-presign', {
          body: {
            purpose: 'avatar',
            filename: file.name,
            mimeType: resizedBlob.type,
            size: resizedBlob.size
          }
        }),
        10000
      );

      if (presignError) {
        const msg = await functionErrorMessage(presignError, t.common.error);
        console.error('Presign error:', presignError);
        setUploadError(msg);
        return;
      }

      if (!presignData?.uploadUrl || !presignData?.publicUrl) {
        console.error('Invalid presign response:', presignData);
        setUploadError(presignData?.error || t.common.error);
        return;
      }

      // 3. Upload to R2
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: resizedBlob,
        headers: { 'Content-Type': resizedBlob.type }
      });

      if (!uploadResponse.ok) {
        console.error('Upload failed:', uploadResponse.status, uploadResponse.statusText);
        setUploadError(t.common.error);
        return;
      }

      // 4. Success — set the URL in state (does NOT save, user must press Save)
      setAvatarUrl(presignData.publicUrl);
      setJustUploaded(true);
      setPreviewFailed(false);

    } catch (err) {
      const msg = err instanceof Error && err.message === 'TIMEOUT'
        ? t.errors.connectionTimeout
        : await functionErrorMessage(err, t.common.error);
      console.error('handleAvatarUpload failed:', err);
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Avatar display logic (same pattern as ProfileMenu)
  const displayName = profile?.full_name || profile?.email || 'User';
  const initials = displayName.
  split(' ').
  map((n) => n[0]).
  join('').
  toUpperCase().
  slice(0, 2);

  // Loading state
  if (!profile && !profileError) {
    return (
      <div data-ev-id="ev_profile_page">
        <div data-ev-id="ev_bbc84ed216" className="mb-6">
          <h1 data-ev-id="ev_8a83cdf80e" className="text-2xl font-bold text-foreground mb-2">
            {t.profile.profile}
          </h1>
        </div>
        <LoadingSkeleton variant="text" count={6} />
      </div>);

  }

  // Error state
  if (profileError) {
    return (
      <div data-ev-id="ev_profile_page">
        <div data-ev-id="ev_bbc84ed216" className="mb-6">
          <h1 data-ev-id="ev_8a83cdf80e" className="text-2xl font-bold text-foreground mb-2">
            {t.profile.profile}
          </h1>
        </div>
        <ErrorState error={profileError} />
      </div>);

  }

  return (
    <div data-ev-id="ev_profile_page">
      <div data-ev-id="ev_bbc84ed216" className="mb-6">
        <h1 data-ev-id="ev_8a83cdf80e" className="text-2xl font-bold text-foreground mb-2">
          {t.profile.profile}
        </h1>
      </div>

      {/* Read-only identity block */}
      <div data-ev-id="ev_identity_card" className="bg-card border border-border rounded-lg p-6 mb-6">
        <div data-ev-id="ev_identity_header" className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          {profile?.avatar_url ?
          <img
            data-ev-id="ev_profile_avatar"
            src={profile.avatar_url}
            alt=""
            className="w-16 h-16 rounded-full object-cover" /> :


          <div data-ev-id="ev_profile_initials" className="w-16 h-16 rounded-full bg-primary-muted flex items-center justify-center">
              <span data-ev-id="ev_initials_text" className="text-lg font-medium text-primary">{initials}</span>
            </div>
          }

          <div data-ev-id="ev_identity_info" className="flex-1">
            <p data-ev-id="ev_profile_email" className="text-lg font-medium text-foreground">{profile?.email}</p>
            {profile?.role &&
            <Badge variant="default" size="md">
                {t.roles[profile.role]}
              </Badge>
            }
          </div>
        </div>

        <div data-ev-id="ev_identity_fields" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department (read-only) */}
          <div data-ev-id="ev_field_dept">
            <p data-ev-id="ev_dept_label" className="text-sm font-medium text-muted-foreground mb-1">{t.common.department}</p>
            <p data-ev-id="ev_dept_value" className="text-foreground">{profile?.department || '—'}</p>
            <p data-ev-id="ev_dept_hint" className="text-xs text-muted-foreground mt-1">{t.profile.managedByAdmin}</p>
          </div>

          {/* Manager (read-only, fetched via plain query) */}
          <div data-ev-id="ev_field_manager">
            <p data-ev-id="ev_manager_label" className="text-sm font-medium text-muted-foreground mb-1">{t.admin.manager}</p>
            <p data-ev-id="ev_manager_value" className="text-foreground">
              {profile?.manager_id ? managerName || '—' : t.admin.noManager}
            </p>
          </div>

          {/* Member since */}
          <div data-ev-id="ev_field_member_since">
            <p data-ev-id="ev_since_label" className="text-sm font-medium text-muted-foreground mb-1">{t.profile.memberSince}</p>
            <p data-ev-id="ev_since_value" className="text-foreground">
              {profile?.created_at ? formatDate(profile.created_at, locale) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Editable fields form — full_name and avatar_url ONLY */}
      <div data-ev-id="ev_edit_form" className="bg-card border border-border rounded-lg p-6">
        <div data-ev-id="ev_form_fields" className="flex flex-col gap-4 max-w-md">
          {/* Full name */}
          <div data-ev-id="ev_field_name">
            <label data-ev-id="ev_name_label" htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
              {t.common.name}
            </label>
            <input
              data-ev-id="ev_name_input"
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

          </div>

          {/* Avatar section */}
          <div data-ev-id="ev_field_avatar">
            <label data-ev-id="ev_avatar_label" className="block text-sm font-medium text-foreground mb-2">
              {t.profile.avatarUrl}
            </label>
            
            {/* Preview of pending avatar */}
            <div data-ev-id="ev_avatar_preview_section" className="flex items-center gap-4 mb-3">
              {avatarUrl && !previewFailed ?
              <img
                data-ev-id="ev_avatar_preview"
                src={avatarUrl}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
                onError={() => setPreviewFailed(true)} /> :


              <div data-ev-id="ev_avatar_preview_initials" className="w-12 h-12 rounded-full bg-primary-muted flex items-center justify-center">
                  <span data-ev-id="ev_e8f6f80a58" className="text-sm font-medium text-primary">{initials}</span>
                </div>
              }
              {justUploaded &&
              <span data-ev-id="ev_upload_success" className="text-sm text-primary">
                  {t.profile.uploadedNotSaved}
                </span>
              }
            </div>
            
            {/* Upload button */}
            <div data-ev-id="ev_avatar_upload" className="mb-2">
              <input data-ev-id="ev_0d47a766c3"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarUpload}
              disabled={uploading || saving}
              className="hidden"
              id="avatarFileInput" />

              <label data-ev-id="ev_a2889482d7"
              htmlFor="avatarFileInput"
              className={`inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
              uploading || saving ? 'opacity-50 cursor-not-allowed' : ''}`
              }>

                <Upload className="w-4 h-4" />
                {uploading ? t.profile.uploadingAvatar : t.profile.uploadAvatar}
              </label>
            </div>
            
            {/* Upload error */}
            {uploadError &&
            <p data-ev-id="ev_upload_error" className="text-sm text-destructive mb-2">
                {uploadError}
              </p>
            }
            
            {/* Separator */}
            <p data-ev-id="ev_or_paste" className="text-xs text-muted-foreground mb-2">
              {t.profile.orPasteUrl}
            </p>
            
            {/* URL input */}
            <input
              data-ev-id="ev_avatar_input"
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setJustUploaded(false);
                setPreviewFailed(false);
              }}
              placeholder="https://..."
              disabled={uploading}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />

          </div>

          {/* Save button */}
          <div data-ev-id="ev_form_actions" className="pt-2">
            <button
              data-ev-id="ev_save_btn"
              onClick={handleSave}
              disabled={saving || uploading || !hasChanges}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

              {saving ? t.common.loading : t.common.save}
            </button>
          </div>
        </div>
      </div>
    </div>);

}