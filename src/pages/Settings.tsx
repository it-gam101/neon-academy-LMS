import { Settings } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

import { EmptyState } from '@/components/ui/EmptyState';

export default function SettingsPage() {
  const { t } = useLocale();

  return (
    <div data-ev-id="ev_settings_page">
			<div data-ev-id="ev_3aef82d8e4" className="mb-6">
				<h1 data-ev-id="ev_7f62155c60" className="text-2xl font-bold text-foreground mb-2">
					{t.profile.settings}
				</h1>
			</div>
			
			<EmptyState
        icon={Settings}
        title={t.common.comingSoon}
        description={t.profile.settings} />

		</div>);

}