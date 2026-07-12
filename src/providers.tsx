import { type ReactNode } from 'react';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * ⚠️ App-wide providers. These wrap <BrowserRouter> in main.tsx.
 * LocaleProvider: Manages EN/HE locale and RTL direction
 * AuthProvider: Manages authentication state and user profile
 */
export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<LocaleProvider>
			<AuthProvider>
				{children}
			</AuthProvider>
		</LocaleProvider>
	);
}
