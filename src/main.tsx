import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { AppProviders } from './providers';
import { ToastContainer } from '@/components/ui/Toast';
import './index.css';

/**
 * ⚠️ ROUTER LIVES HERE — Do NOT add <BrowserRouter>, <Router>, or <MemoryRouter> anywhere else.
 * All route definitions go in App.tsx using <Routes> and <Route>.
 */
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AppProviders>
			<BrowserRouter>
				<App />
			</BrowserRouter>
			{/* Mounts the single subscriber for showToast(). Without this every
			    showToast() call in the app is a silent no-op. */}
			<ToastContainer />
		</AppProviders>
	</StrictMode>,
);
