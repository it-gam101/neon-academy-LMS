import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { getDictionary } from '@/i18n/dictionary';

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordError(t.profile.passwordsDoNotMatch);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t.auth.passwordMinLength);
      return;
    }

    if (!supabase) return;

    const dict = getDictionary(locale);
    setSaving(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        10000
      );

      if (error) {
        console.error('Password update error:', error);
        setPasswordError(error.message || t.common.error);
        return;
      }

      showToast('success', t.auth.passwordUpdated);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error && err.message === 'TIMEOUT'
        ? dict.errors.connectionTimeout
        : err instanceof Error ? err.message
        : (err as { message?: string })?.message || t.common.error;
      console.error('handleChangePassword failed:', err);
      setPasswordError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-ev-id="ev_settings_page">
			<div data-ev-id="ev_3aef82d8e4" className="mb-6">
				<h1 data-ev-id="ev_7f62155c60" className="text-2xl font-bold text-foreground mb-2">
					{t.profile.settings}
				</h1>
			</div>
			
			{/* Section A - Language */}
			<div data-ev-id="ev_bbe4c72626" className="bg-card border border-border rounded-xl p-6 mb-6">
				<h2 data-ev-id="ev_45307de9a7" className="text-lg font-semibold text-foreground mb-4">{t.profile.language}</h2>
				<div data-ev-id="ev_19d8aff319" className="flex gap-3">
					<button data-ev-id="ev_986062f63a"
          type="button"
          onClick={() => setLocale('en')}
          className={
          locale === 'en' ?
          'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors' :
          'px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors'
          }>

						{t.profile.english}
					</button>
					<button data-ev-id="ev_5ab06dd8ff"
          type="button"
          onClick={() => setLocale('he')}
          className={
          locale === 'he' ?
          'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors' :
          'px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors'
          }>

						{t.profile.hebrew}
					</button>
				</div>
			</div>

			{/* Section B - Change Password */}
			<div data-ev-id="ev_e83b6ac4ce" className="bg-card border border-border rounded-xl p-6">
				<h2 data-ev-id="ev_cf174eace6" className="text-lg font-semibold text-foreground mb-4">{t.profile.changePassword}</h2>
				<form data-ev-id="ev_e3388f10ae" onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
					<div data-ev-id="ev_6098c6124d">
						<label data-ev-id="ev_bced241b64" className="block text-sm font-medium text-foreground mb-1">
							{t.auth.newPassword}
						</label>
						<input data-ev-id="ev_185310d75f"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

					</div>
					<div data-ev-id="ev_1b927cd615">
						<label data-ev-id="ev_12d9bc10c9" className="block text-sm font-medium text-foreground mb-1">
							{t.auth.confirmPassword}
						</label>
						<input data-ev-id="ev_58e1a8a833"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

					</div>
					<p data-ev-id="ev_7074d2a99c" className="text-sm text-muted-foreground">{t.auth.passwordMinLength}</p>
					{passwordError &&
          <p data-ev-id="ev_e25eae8886" className="text-sm text-danger">{passwordError}</p>
          }
					<button data-ev-id="ev_6a77eaa7ec"
          type="submit"
          disabled={saving}
          className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">

						{saving ? t.common.loading : t.profile.savePassword}
					</button>
				</form>
			</div>
		</div>);

}