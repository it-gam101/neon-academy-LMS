/**
 * ⚠️ ROUTING RULES:
 * - Router is in main.tsx. Do NOT add another <BrowserRouter> here or anywhere.
 * - Use <Routes> + <Route> components ONLY. Do NOT use useRoutes().
 * - STATIC IMPORTS ONLY — no React.lazy() or dynamic import().
 * - Import from 'react-router' — NOT 'react-router-dom' (does not exist).
 */
import { Routes, Route } from 'react-router';

// Pages
import Index from '@/pages/Index';
import Catalogue from '@/pages/Catalogue';
import MyLearning from '@/pages/MyLearning';
import Team from '@/pages/Team';
import Studio from '@/pages/Studio';
import StudioEditor from '@/pages/StudioEditor';
import HRAnalytics from '@/pages/HRAnalytics';
import Admin from '@/pages/Admin';
import Profile from '@/pages/Profile';
import SettingsPage from '@/pages/Settings';
import CoursePage from '@/pages/CoursePage';
import ModulePage from '@/pages/ModulePage';
import QuizPage from '@/pages/QuizPage';
import NotFound from '@/pages/NotFound';

// Auth pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallback from '@/pages/auth/AuthCallback';

export default function App() {
	return (
		<Routes>
			{/* Main pages */}
			<Route path="/" element={<Index />} />
			<Route path="/catalogue" element={<Catalogue />} />
			<Route path="/my-learning" element={<MyLearning />} />
			<Route path="/team" element={<Team />} />
			<Route path="/studio" element={<Studio />} />
			<Route path="/studio/:courseId" element={<StudioEditor />} />
			<Route path="/hr-analytics" element={<HRAnalytics />} />
			<Route path="/admin" element={<Admin />} />
			<Route path="/profile" element={<Profile />} />
			<Route path="/settings" element={<SettingsPage />} />
			
			{/* Course viewing */}
			<Route path="/course/:courseId" element={<CoursePage />} />
			<Route path="/course/:courseId/module/:moduleId" element={<ModulePage />} />
			<Route path="/course/:courseId/quiz/:moduleId" element={<QuizPage />} />
			
			{/* Auth pages */}
			<Route path="/auth/login" element={<Login />} />
			<Route path="/auth/signup" element={<Signup />} />
			<Route path="/auth/reset-password" element={<ResetPassword />} />
			<Route path="/auth/callback" element={<AuthCallback />} />
			
			{/* 404 */}
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}
