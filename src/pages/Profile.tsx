import { User } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';

import { EmptyState } from '@/components/ui/EmptyState';

export default function Profile() {
  const { t } = useLocale();
  const { profile } = useAuth();

  return (
    <div data-ev-id="ev_profile_page">
			<div data-ev-id="ev_bbc84ed216" className="mb-6">
				<h1 data-ev-id="ev_8a83cdf80e" className="text-2xl font-bold text-foreground mb-2">
					{t.profile.profile}
				</h1>
				{profile &&
        <p data-ev-id="ev_dcf72f4b57" className="text-foreground-muted">
						{profile.email}
					</p>
        }
			</div>
			
			<EmptyState
        icon={User}
        title={t.common.comingSoon}
        description={t.profile.profile} />

		</div>);

}