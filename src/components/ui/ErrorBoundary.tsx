import { Component, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallbackPath?: string;
	fallbackLabel?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Global error boundary that catches React render errors.
 * Prevents white screen of death by showing a bilingual error page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			const { fallbackPath = '/', fallbackLabel } = this.props;
			// Detect locale from localStorage or default to English
			const locale = typeof window !== 'undefined' 
				? localStorage.getItem('neon-academy-locale') || 'en' 
				: 'en';
			const isHebrew = locale === 'he';

			return (
				<div 
					data-ev-id="ev_error_boundary"
					dir={isHebrew ? 'rtl' : 'ltr'}
					className="min-h-screen bg-background flex items-center justify-center p-4"
				>
					<div data-ev-id="ev_error_card" className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
						<div data-ev-id="ev_error_icon" className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
							<AlertTriangle className="w-8 h-8 text-destructive" />
						</div>
						<h1 data-ev-id="ev_error_title" className="text-2xl font-bold text-foreground mb-3">
							{isHebrew ? 'משהו השתבש' : 'Something went wrong'}
						</h1>
						<p data-ev-id="ev_error_desc" className="text-muted-foreground mb-6">
							{isHebrew 
								? 'אירעה שגיאה בלתי צפויה. נסה לרענן את הדף או לחזור למסך הקודם.'
								: 'An unexpected error occurred. Try refreshing the page or going back.'}
						</p>
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<pre data-ev-id="ev_error_details" className="text-xs text-destructive bg-destructive/5 p-4 rounded-lg mb-6 text-start overflow-auto max-h-32">
								{this.state.error.message}
							</pre>
						)}
						<div data-ev-id="ev_error_actions" className="flex flex-col gap-3">
							<button
								data-ev-id="ev_error_retry"
								onClick={this.handleRetry}
								className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
							>
								<RefreshCw className="w-4 h-4" />
								{isHebrew ? 'נסה שוב' : 'Try again'}
							</button>
							<Link
								to={fallbackPath}
								className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
							>
								<Home className="w-4 h-4" />
								{fallbackLabel || (isHebrew ? 'חזרה לדף הבית' : 'Back to home')}
							</Link>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
