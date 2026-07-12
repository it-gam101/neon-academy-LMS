import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
import { sticklightAuth } from '@/integrations/auth/sticklight-auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthDivider } from '@/components/auth/AuthDivider';

export default function Signup() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (password.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleGoogleSignup = async () => {
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
    <AuthLayout title={t.auth.signup}>
			<form data-ev-id="ev_810f898ffd" onSubmit={handleEmailSignup} className="flex flex-col gap-4">
				{error &&
        <div data-ev-id="ev_94c84caeeb" className="p-3 rounded-md bg-destructive-muted text-destructive text-sm">
						{error}
					</div>
        }
				
				<AuthInput
          id="fullName"
          type="text"
          label={t.auth.fullName}
          value={fullName}
          onChange={setFullName}
          icon={<User className="w-4 h-4" />}
          autoComplete="name"
          required />

				
				<AuthInput
          id="email"
          type="email"
          label={t.auth.email}
          value={email}
          onChange={setEmail}
          icon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required />

				
				<div data-ev-id="ev_956b7c48b2" className="relative">
					<AuthInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t.auth.password}
            value={password}
            onChange={setPassword}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required />

					<button data-ev-id="ev_4f75f373ea"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-inline-end-3 top-[38px] text-foreground-muted hover:text-foreground transition-colors focus-ring rounded"
          tabIndex={-1}>

						{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
					</button>
				</div>
				
				<AuthButton type="submit" isLoading={isLoading}>
					{isLoading ? t.auth.signingUp : t.auth.signup}
				</AuthButton>
			</form>
			
			<AuthDivider text={t.auth.orContinueWith} />
			
			<GoogleButton onClick={handleGoogleSignup} label={t.auth.google} />
			
			<p data-ev-id="ev_9903bd4736" className="text-center text-sm text-foreground-muted mt-4">
				{t.auth.haveAccount}{' '}
				<Link
          to="/auth/login"
          className="text-primary hover:text-primary-hover transition-colors focus-ring rounded px-1">

					{t.auth.login}
				</Link>
			</p>
		</AuthLayout>);

}