import { ExternalLink, Mail } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useOrgSettings } from '@/hooks/useOrgSettings';

/**
 * Item 115: the organisation's support contact (Admin → Organization), shown wherever the app tells someone to contact
 * their administrator. Renders nothing while neither is set. The e-mail address is shown as text too (left-to-right),
 * for a reader with no mail program set up. `compact` is the inline form, for a hint line.
 */
export function SupportContact({ compact = false }: {compact?: boolean;}) {
	const { t } = useLocale();
	const { supportEmail, supportUrl } = useOrgSettings();
	if (!supportEmail && !supportUrl) return null;

	if (compact) {
		return (
			<span data-ev-id="ev_support_inline" className="ms-2 inline-flex flex-wrap gap-x-3 gap-y-1">
				{supportEmail && <a data-ev-id="ev_support_inline_mail" href={`mailto:${supportEmail}`} className="text-primary hover:underline">{t.auth.contactAdmin}</a>}
				{supportUrl && <a data-ev-id="ev_support_inline_page" href={supportUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t.auth.supportPage}</a>}
			</span>);

	}

	return (
		<div data-ev-id="ev_support_contact" className="flex flex-col items-center gap-2">
			{supportEmail &&
			<>
					<a data-ev-id="ev_support_mail"
				href={`mailto:${supportEmail}`}
				className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
						<Mail className="w-4 h-4" />
						{t.auth.contactAdmin}
					</a>
					<span data-ev-id="ev_support_address" dir="ltr" className="text-sm text-muted-foreground break-all">{supportEmail}</span>
				</>
			}
			{supportUrl &&
			<a data-ev-id="ev_support_page"
			href={supportUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
					{t.auth.supportPage}
					<ExternalLink className="w-3.5 h-3.5" />
				</a>
			}
		</div>);

}
