/**
 * ⚠️ ROUTING RULES:
 * - Routes are defined here using <Routes> + <Route> from react-router
 * - <BrowserRouter> lives in main.tsx — NEVER add another router
 * - DO NOT use useRoutes() — use <Routes> + <Route> components only
 * - Static imports only — NO React.lazy() or dynamic import()
 */

import { Routes, Route, Navigate } from 'react-router';

// Layout components
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

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
import ScormPlayer from '@/pages/ScormPlayer';
import Sandbox from '@/pages/Sandbox';
import AccessDenied from '@/pages/AccessDenied';
import NotFound from '@/pages/NotFound';

// Auth pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallback from '@/pages/auth/AuthCallback';
import Deactivated from '@/pages/auth/Deactivated';

export default function App() {
	return (
		<ErrorBoundary>
			<Routes>
				{/* Public pages */}
				<Route path="/" element={<Index />} />
				<Route path="/sandbox" element={<Sandbox />} />
				
				{/* Authenticated pages - all roles */}
				<Route path="/catalogue" element={
					<ProtectedRoute>
						<Catalogue />
					</ProtectedRoute>
				} />
				<Route path="/my-learning" element={
					<ProtectedRoute>
						<MyLearning />
					</ProtectedRoute>
				} />
				<Route path="/profile" element={
					<ProtectedRoute>
						<Profile />
					</ProtectedRoute>
				} />
				<Route path="/settings" element={
					<ProtectedRoute>
						<SettingsPage />
					</ProtectedRoute>
				} />
				
				{/* Course viewing - all authenticated */}
				<Route path="/course/:courseId" element={
					<ProtectedRoute>
						<CoursePage />
					</ProtectedRoute>
				} />
				<Route path="/course/:courseId/module/:moduleId" element={
					<ProtectedRoute>
						<ModulePage />
					</ProtectedRoute>
				} />
				<Route path="/course/:courseId/quiz/:moduleId" element={
					<ProtectedRoute>
						<QuizPage />
					</ProtectedRoute>
				} />
				<Route path="/learn/:enrollmentId/scorm/:moduleId" element={
					<ProtectedRoute>
						<ScormPlayer />
					</ProtectedRoute>
				} />
				
				{/* Team - managers and above */}
				<Route path="/team" element={
					<ProtectedRoute allowedRoles={['super_admin', 'hr_manager', 'team_manager']}>
						<Team />
					</ProtectedRoute>
				} />
				
				{/* Studio - instructors and above */}
				<Route path="/studio" element={
					<ProtectedRoute allowedRoles={['super_admin', 'hr_manager', 'instructor']}>
						<Studio />
					</ProtectedRoute>
				} />
				<Route path="/studio/:courseId" element={
					<ProtectedRoute allowedRoles={['super_admin', 'hr_manager', 'instructor']}>
						<StudioEditor />
					</ProtectedRoute>
				} />
				
				{/* HR Analytics - HR and super_admin only */}
				<Route path="/hr-analytics" element={
					<ProtectedRoute allowedRoles={['super_admin', 'hr_manager']}>
						<HRAnalytics />
					</ProtectedRoute>
				} />
				{/* /hr alias - redirects to /hr-analytics (guard applied via redirect) */}
				<Route path="/hr" element={
					<ProtectedRoute allowedRoles={['super_admin', 'hr_manager']}>
						<Navigate to="/hr-analytics" replace />
					</ProtectedRoute>
				} />
				
				{/* Admin - super_admin only */}
				<Route path="/admin" element={
					<ProtectedRoute allowedRoles={['super_admin']}>
						<Admin />
					</ProtectedRoute>
				} />
				
				{/* Auth pages */}
				<Route path="/auth/login" element={<Login />} />
				<Route path="/auth/signup" element={<Signup />} />
				<Route path="/auth/reset-password" element={<ResetPassword />} />
				<Route path="/auth/callback" element={<AuthCallback />} />
				<Route path="/auth/deactivated" element={<Deactivated />} />
				
				{/* Access denied */}
				<Route path="/access-denied" element={<AccessDenied />} />
				
				{/* 404 */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</ErrorBoundary>
	);
}
