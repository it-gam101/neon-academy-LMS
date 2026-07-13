import { Link } from 'react-router';
import { ShieldX, Home } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import type { UserRole } from '@/contexts/auth-context';

function getRoleHomePath(role: UserRole): string {
	switch (role) {
		case 'employee':
			return '/my-learning';
		case 'team_manager':
			return '/team';
		case 'instructor':
			return '/studio';
		case 'hr_manager':
			return '/hr-analytics';
		case 'super_admin':
			return '/admin';
		default:
			return '/my-learning';
	}
}

export default function AccessDenied() {
	const { t } = useLocale();
	const { profile } = useAuth();

	const homePath = profile?.role ? getRoleHomePath(profile.role) : '/';

	return (
		<AppShell>
			<div data-ev-id="ev_access_denied_page" className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
				<div data-ev-id="ev_ad_icon" className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
					<ShieldX className="w-10 h-10 text-destructive" />
				</div>
				<h1 data-ev-id="ev_ad_title" className="text-3xl font-bold text-foreground mb-3">
					{t.common.accessDenied}
				</h1>
				<p data-ev-id="ev_ad_desc" className="text-muted-foreground mb-8 max-w-md">
					{t.errors.noAccess}
				</p>
				<Link
					to={homePath}
					className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
				>
					<Home className="w-5 h-5" />
					{t.common.goHome}
				</Link>
			</div>
		</AppShell>
	);
}
