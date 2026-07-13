import { Link } from 'react-router';
import { UserX, Mail } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function Deactivated() {
  const { t } = useLocale();

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
					<a data-ev-id="ev_fa89f6bf60"
          href="mailto:support@company.com"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

						<Mail className="w-4 h-4" />
						{t.auth.contactAdmin}
					</a>
					<Link
            to="/auth/login"
            className="text-sm text-primary hover:underline">

						{t.auth.tryDifferentAccount}
					</Link>
				</div>
			</div>
		</AuthLayout>);

}