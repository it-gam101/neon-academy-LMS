import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { UserRole } from '@/contexts/auth-context';

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: UserRole[];
}

/**
 * Route guard that:
 * 1. Redirects deactivated users to deactivation screen
 * 2. Redirects unauthenticated users to login
 * 3. Redirects unauthorized roles to AccessDenied
 * 4. Shows loading state during auth check
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading, profile, isDeactivated } = useAuth();

	// Show loading during initial auth check
	if (isLoading) {
		return (
			<div data-ev-id="ev_protected_loading" className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-primary animate-spin" />
			</div>
		);
	}

	// Redirect to deactivation screen if user was deactivated
	if (isDeactivated) {
		return <Navigate to="/auth/deactivated" replace />;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/auth/login" replace />;
	}

	// Check role access if allowedRoles specified
	if (allowedRoles && profile?.role) {
		if (!allowedRoles.includes(profile.role)) {
			return <Navigate to="/access-denied" replace />;
		}
	}

	// If no allowedRoles specified but we need profile to check, wait for it
	if (allowedRoles && !profile) {
		return (
			<div data-ev-id="ev_protected_profile_loading" className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-primary animate-spin" />
			</div>
		);
	}

	return <AppShell>{children}</AppShell>;
}
