import { useEffect } from 'react';
import { Link } from 'react-router';
import { UserX } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function Deactivated() {
  const { t } = useLocale();
  const { clearDeactivated } = useAuth();

  // Item 113: the notice is now on screen, so release the flag. Otherwise "Try a different
  // account" followed by an ACTIVE sign-in would be sent straight back here.
  useEffect(() => {
    clearDeactivated();
  }, [clearDeactivated]);

  return (
    <AuthLayout title={t.auth.accountDeactivated}>
			<div data-ev-id="ev_deactivated_content" className="text-center">
				<div data-ev-id="ev_deactivated_icon" className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
					<UserX className="w-10 h-10 text-destructive" />
				</div>
				<p data-ev-id="ev_deactivated_msg" className="text-muted-foreground mb-6">
					{t.auth.accountDeactivatedDescription}
				</p>
				<div data-ev-id="ev_deactivated_actions" className="flex flex-col gap-3">
					<Link data-ev-id="ev_2be6856eff"
          to="/auth/login"
          className="text-sm text-primary hover:underline">

						{t.auth.tryDifferentAccount}
					</Link>
				</div>
			</div>
		</AuthLayout>);

}