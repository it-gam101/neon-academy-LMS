import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

type ResetState = 'request' | 'sent' | 'reset' | 'success' | 'error';

export default function ResetPassword() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [state, setState] = useState<ResetState>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in recovery mode (user clicked email link)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');
      const errorCode = params.get('error_code');

      if (errorCode) {
        setState('error');
      } else if (accessToken && type === 'recovery') {
        setState('reset');
      }
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (authError) {
      setError(authError.message);
    } else {
      setState('sent');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (newPassword.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      setState('success');
      setIsLoading(false);
      // Redirect to home after 2 seconds
      setTimeout(() => navigate('/'), 2000);
    }
  };

  // Request reset link form
  if (state === 'request') {
    return (
      <AuthLayout title={t.auth.resetPassword}>
				<form data-ev-id="ev_735c56dbb3" onSubmit={handleRequestReset} className="flex flex-col gap-4">
					{error &&
          <div data-ev-id="ev_a5370ba851" className="p-3 rounded-md bg-destructive-muted text-destructive text-sm">
							{error}
						</div>
          }
					
					<AuthInput
            id="email"
            type="email"
            label={t.auth.email}
            value={email}
            onChange={setEmail}
            icon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required />

					
					<AuthButton type="submit" isLoading={isLoading}>
						{isLoading ? t.auth.sending : t.auth.sendResetLink}
					</AuthButton>
				</form>
				
				<p data-ev-id="ev_7cebbc84c3" className="text-center text-sm text-foreground-muted mt-4">
					<Link
            to="/auth/login"
            className="text-primary hover:text-primary-hover transition-colors focus-ring rounded px-1">

						{t.auth.backToLogin}
					</Link>
				</p>
			</AuthLayout>);

  }

  // Link sent confirmation
  if (state === 'sent') {
    return (
      <AuthLayout title={t.auth.resetLinkSent}>
				<div data-ev-id="ev_3affe2825d" className="flex flex-col items-center gap-4 py-4">
					<CheckCircle className="w-16 h-16 text-primary" />
					<p data-ev-id="ev_95f7916582" className="text-foreground-muted text-center">
						{t.auth.resetLinkSentDescription}
					</p>
				</div>
				<p data-ev-id="ev_1d3685b526" className="text-center text-sm text-foreground-muted mt-4">
					<Link
            to="/auth/login"
            className="text-primary hover:text-primary-hover transition-colors focus-ring rounded px-1">

						{t.auth.backToLogin}
					</Link>
				</p>
			</AuthLayout>);

  }

  // Set new password form
  if (state === 'reset') {
    return (
      <AuthLayout title={t.auth.resetPassword}>
				<form data-ev-id="ev_8945a3c38a" onSubmit={handleResetPassword} className="flex flex-col gap-4">
					{error &&
          <div data-ev-id="ev_4f2162cd84" className="p-3 rounded-md bg-destructive-muted text-destructive text-sm">
							{error}
						</div>
          }
					
					<div data-ev-id="ev_85970deb57" className="relative">
						<AuthInput
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              label={t.auth.newPassword}
              value={newPassword}
              onChange={setNewPassword}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required />

						<button data-ev-id="ev_50b751bc16"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-inline-end-3 top-[38px] text-foreground-muted hover:text-foreground transition-colors focus-ring rounded"
            tabIndex={-1}>

							{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						</button>
					</div>
					
					<AuthInput
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            label={t.auth.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required />

					
					<AuthButton type="submit" isLoading={isLoading}>
						{isLoading ? t.auth.resetting : t.auth.resetPassword}
					</AuthButton>
				</form>
			</AuthLayout>);

  }

  // Success state
  if (state === 'success') {
    return (
      <AuthLayout title={t.auth.passwordUpdated}>
				<div data-ev-id="ev_719de222a4" className="flex flex-col items-center gap-4 py-4">
					<CheckCircle className="w-16 h-16 text-primary" />
					<p data-ev-id="ev_fdad106487" className="text-foreground-muted text-center">
						{t.auth.passwordUpdatedDescription}
					</p>
				</div>
			</AuthLayout>);

  }

  // Error state (invalid/expired link)
  return (
    <AuthLayout title={t.auth.invalidResetLink}>
			<div data-ev-id="ev_45bbd72f02" className="flex flex-col items-center gap-4 py-4">
				<AlertCircle className="w-16 h-16 text-destructive" />
				<p data-ev-id="ev_17eac98016" className="text-foreground-muted text-center">
					{t.auth.invalidResetLinkDescription}
				</p>
			</div>
			<p data-ev-id="ev_ed87a0ba91" className="text-center text-sm text-foreground-muted mt-4">
				<Link
          to="/auth/reset-password"
          onClick={() => setState('request')}
          className="text-primary hover:text-primary-hover transition-colors focus-ring rounded px-1">

					{t.auth.sendResetLink}
				</Link>
			</p>
		</AuthLayout>);

}