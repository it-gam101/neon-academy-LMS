import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
import { sticklightAuth } from '@/integrations/auth/sticklight-auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthDivider } from '@/components/auth/AuthDivider';

export default function Login() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    const result = await sticklightAuth.signInWithOAuth('google');

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.tokens) {
      await supabase.auth.setSession(result.tokens);
      navigate('/');
    }
  };

  return (
    <AuthLayout title={t.auth.login}>
			<form data-ev-id="ev_7862c01c10" onSubmit={handleEmailLogin} className="flex flex-col gap-4">
				{error &&
        <div data-ev-id="ev_3685d890d1" className="p-3 rounded-md bg-destructive-muted text-destructive text-sm">
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

				
				<div data-ev-id="ev_d44a871b02" className="relative">
					<AuthInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t.auth.password}
            value={password}
            onChange={setPassword}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
            required />

					<button data-ev-id="ev_d2bfa7e83f"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-inline-end-3 top-[38px] text-foreground-muted hover:text-foreground transition-colors focus-ring rounded"
          tabIndex={-1}>

						{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
					</button>
				</div>
				
				<div data-ev-id="ev_a514888b0b" className="flex justify-end">
					<Link
            to="/auth/reset-password"
            className="text-sm text-primary hover:text-primary-hover transition-colors focus-ring rounded px-1">

						{t.auth.forgotPassword}
					</Link>
				</div>
				
				<AuthButton type="submit" isLoading={isLoading}>
					{isLoading ? t.auth.loggingIn : t.auth.login}
				</AuthButton>
			</form>
			
			<AuthDivider text={t.auth.orContinueWith} />
			
			<GoogleButton onClick={handleGoogleLogin} label={t.auth.google} />
			
			<p data-ev-id="ev_70c978eeb5" className="text-center text-sm text-foreground-muted mt-4">
				{t.auth.noAccount}{' '}
				<Link
          to="/auth/signup"
          className="text-primary hover:text-primary-hover transition-colors focus-ring rounded px-1">

					{t.auth.signup}
				</Link>
			</p>
		</AuthLayout>);

}