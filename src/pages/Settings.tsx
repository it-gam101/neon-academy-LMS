import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { ErrorText } from '@/components/ui/ErrorText';
import { errorMessage } from '@/lib/errorText';

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);

  // Item 120: change your own login e-mail. Supabase mails a confirmation link (to the new address, and possibly to
  // the current one too); the address changes only once it is opened, and window 1's trigger then updates the profile.
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSentTo(null);

    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t.profile.emailInvalid);
      return;
    }
    if (email === (user?.email ?? '').toLowerCase()) {
      setEmailError(t.profile.emailSame);
      return;
    }

    if (!supabase || savingEmail) return;

    setSavingEmail(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/settings` }),
        10000
      );

      if (error) {
        console.error('Email update error:', error);
        setEmailError(error.message || t.common.error);
        return;
      }

      setEmailSentTo(email);
      setNewEmail('');
    } catch (err) {
      const msg = errorMessage(err, t.common.error);
      console.error('handleChangeEmail failed:', err);
      setEmailError(msg);
    } finally {
      setSavingEmail(false);
    }
  };

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
      const msg = errorMessage(err, t.common.error);
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
          aria-pressed={locale === 'en'}
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
          aria-pressed={locale === 'he'}
          className={
          locale === 'he' ?
          'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors' :
          'px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors'
          }>

						{t.profile.hebrew}
					</button>
				</div>
			</div>

			{/* Section C - Email address (item 120) */}
			<div data-ev-id="ev_settings_email" className="bg-card border border-border rounded-xl p-6 mb-6">
				<h2 data-ev-id="ev_settings_email_title" className="text-lg font-semibold text-foreground mb-4">{t.profile.emailSection}</h2>
				<p data-ev-id="ev_settings_email_current" className="text-sm text-muted-foreground mb-2">
					<span data-ev-id="ev_settings_email_current_label">{t.profile.currentEmail}</span>{' '}
					<span data-ev-id="ev_settings_email_current_value" dir="ltr" className="text-foreground font-medium">{user?.email ?? ''}</span>
				</p>
				{user?.new_email && !emailSentTo &&
				<p data-ev-id="ev_settings_email_pending" className="text-sm text-muted-foreground mb-2">
					<span data-ev-id="ev_settings_email_pending_label">{t.profile.emailPending}</span>{' '}
					<span data-ev-id="ev_settings_email_pending_value" dir="ltr" className="text-foreground">{user.new_email}</span>
				</p>
				}
				<form data-ev-id="ev_settings_email_form" onSubmit={handleChangeEmail} noValidate className="flex flex-col gap-4 max-w-md mt-4">
					<div data-ev-id="ev_settings_email_field">
						<label data-ev-id="ev_settings_email_label" htmlFor="newEmail" className="block text-sm font-medium text-foreground mb-1">
							{t.profile.newEmail}
						</label>
						<input data-ev-id="ev_settings_email_input"
						id="newEmail"
						type="email"
						dir="ltr"
						autoComplete="email"
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
						className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
					</div>
					{emailError &&
					<p data-ev-id="ev_settings_email_error" className="text-sm text-destructive"><ErrorText error={emailError} /></p>
					}
					{emailSentTo &&
					<p data-ev-id="ev_settings_email_sent" className="text-sm text-foreground">
						{t.profile.emailChangeSent.split('{email}')[0]}
						<span data-ev-id="ev_settings_email_sent_value" dir="ltr" className="font-medium">{emailSentTo}</span>
						{t.profile.emailChangeSent.split('{email}')[1]}
					</p>
					}
					<button data-ev-id="ev_settings_email_submit"
					type="submit"
					disabled={savingEmail}
					className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
						{savingEmail ? t.common.loading : t.profile.changeEmail}
					</button>
				</form>
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
          <p data-ev-id="ev_e25eae8886" className="text-sm text-destructive"><ErrorText error={passwordError} /></p>
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