import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/hooks/useLocale';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        navigate('/');
        return;
      }

      // Get session from URL hash (Supabase JS extracts automatically)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Check URL hash for recovery type
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const type = params.get('type');

          if (type === 'recovery') {
            navigate('/auth/reset-password' + hash, { replace: true });
            return;
          }
        }
      }

      navigate('/', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div data-ev-id="ev_611daf89c3" className="min-h-screen bg-background flex items-center justify-center">
			<div data-ev-id="ev_4f0478130f" className="flex flex-col items-center gap-4">
				<Loader2 className="w-8 h-8 text-primary animate-spin" />
				<p data-ev-id="ev_9a747f1822" className="text-foreground-muted">{t.common.loading}</p>
			</div>
		</div>);

}