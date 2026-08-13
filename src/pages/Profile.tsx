import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatDate';

export default function Profile() {
  const { locale, t } = useLocale();
  const { profile, profileError, refreshProfile } = useAuth();

  // Form state for editable fields only
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Manager name (fetched separately, not via embed)
  const [managerName, setManagerName] = useState<string | null>(null);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Fetch manager name with a PLAIN QUERY, not a PostgREST embed
  useEffect(() => {
    if (!profile?.manager_id || !supabase) {
      setManagerName(null);
      return;
    }

    const fetchManager = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', profile.manager_id!)
        .maybeSingle();

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
    avatarUrl.trim() !== (profile.avatar_url || '')
  );

  const handleSave = async () => {
    if (!supabase || !profile) return;

    setSaving(true);

    // Only update full_name and avatar_url — role, manager_id, department are READ-ONLY
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null // Empty string becomes null
      })
      .eq('id', profile.id)
      .select();

    if (error) {
      console.error('Profile update error:', error);
      showToast('error', (error as { message?: string })?.message || t.common.error);
    } else if (!data || data.length === 0) {
      // RLS-blocked UPDATE returns success with ZERO rows
      showToast('error', t.common.error);
    } else {
      showToast('success', t.profile.profileUpdated);
      await refreshProfile();
    }

    setSaving(false);
  };

  // Avatar display logic (same pattern as ProfileMenu)
  const displayName = profile?.full_name || profile?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
      </div>
    );
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
      </div>
    );
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
          {profile?.avatar_url ? (
            <img
              data-ev-id="ev_profile_avatar"
              src={profile.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div data-ev-id="ev_profile_initials" className="w-16 h-16 rounded-full bg-primary-muted flex items-center justify-center">
              <span data-ev-id="ev_initials_text" className="text-lg font-medium text-primary">{initials}</span>
            </div>
          )}

          <div data-ev-id="ev_identity_info" className="flex-1">
            <p data-ev-id="ev_profile_email" className="text-lg font-medium text-foreground">{profile?.email}</p>
            {profile?.role && (
              <Badge variant="default" size="md">
                {t.roles[profile.role]}
              </Badge>
            )}
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
              {profile?.manager_id ? (managerName || '—') : t.admin.noManager}
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
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Avatar URL */}
          <div data-ev-id="ev_field_avatar">
            <label data-ev-id="ev_avatar_label" htmlFor="avatarUrl" className="block text-sm font-medium text-foreground mb-1">
              {t.profile.avatarUrl}
            </label>
            <input
              data-ev-id="ev_avatar_input"
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Save button */}
          <div data-ev-id="ev_form_actions" className="pt-2">
            <button
              data-ev-id="ev_save_btn"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t.common.loading : t.common.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}