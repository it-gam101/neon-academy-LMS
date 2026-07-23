export type Locale = 'en' | 'he';

export interface Dictionary {
	// App
	appName: string;
	tagline: string;
	
	// Dashboard
	dashboard: {
		welcome: string;
		continueLearning: string;
		continueWhereLeft: string;
		viewAllCourses: string;
		newInCatalogue: string;
		noInProgress: string;
		noInProgressDescription: string;
		noNewCourses: string;
		noNewCoursesDescription: string;
	};
	
	// Navigation
	nav: {
		catalogue: string;
		myLearning: string;
		team: string;
		studio: string;
		hrAnalytics: string;
		admin: string;
	};
	
	// Auth
	auth: {
		login: string;
		signup: string;
		logout: string;
		email: string;
		password: string;
		fullName: string;
		forgotPassword: string;
		resetPassword: string;
		newPassword: string;
		confirmPassword: string;
		sendResetLink: string;
		backToLogin: string;
		noAccount: string;
		haveAccount: string;
		orContinueWith: string;
		google: string;
		loggingIn: string;
		signingUp: string;
		sending: string;
		resetting: string;
		resetLinkSent: string;
		resetLinkSentDescription: string;
		passwordUpdated: string;
		passwordUpdatedDescription: string;
		invalidResetLink: string;
		invalidResetLinkDescription: string;
		passwordMismatch: string;
		passwordMinLength: string;
		accountDeactivated: string;
		accountDeactivatedDescription: string;
		contactAdmin: string;
		tryDifferentAccount: string;
	};
	
	// Profile
	profile: {
		profile: string;
		settings: string;
		language: string;
		english: string;
		hebrew: string;
	};
	
	// SCORM
	scorm: {
		launch: string;
		resume: string;
		loadingPlayer: string;
		packageNotFound: string;
		invalidPackageUrl: string;
		runtimeError: string;
		scormPackage: string;
	};
	
	// Sandbox
	sandbox: {
		title: string;
		subtitle: string;
		guestName: string;
		inspectorTitle: string;
		noData: string;
		relaunch: string;
	};
	
	// Roles
	roles: {
		super_admin: string;
		hr_manager: string;
		team_manager: string;
		instructor: string;
		employee: string;
	};
	
	// Common
	common: {
		loading: string;
		error: string;
		save: string;
		cancel: string;
		delete: string;
		edit: string;
		create: string;
		search: string;
		filter: string;
		noResults: string;
		comingSoon: string;
		back: string;
		next: string;
		previous: string;
		submit: string;
		close: string;
		confirm: string;
		actions: string;
		status: string;
		name: string;
		department: string;
		active: string;
		inactive: string;
		yes: string;
		no: string;
		all: string;
		select: string;
		export: string;
		download: string;
		upload: string;
		refresh: string;
		view: string;
		preview: string;
		publish: string;
		unpublish: string;
		archive: string;
		draft: string;
		published: string;
		archived: string;
		required: string;
		optional: string;
		minutes: string;
		hours: string;
		days: string;
		ago: string;
		in: string;
		overdue: string;
		today: string;
		tomorrow: string;
		yesterday: string;
		points: string;
		score: string;
		passed: string;
		failed: string;
		attempts: string;
		remaining: string;
		of: string;
		total: string;
		average: string;
		completed: string;
		pending: string;
		accessDenied: string;
		notFound: string;
		pageNotFound: string;
		goHome: string;
		errorOccurred: string;
		tryAgain: string;
		saveSnapshot: string;
		exportCsv: string;
		profileLoadError: string;
		retry: string;
	};
	
	// Tooltips
	tooltips: {
		languageToggle: string;
		profileMenu: string;
		notifications: string;
		filterByCategory: string;
		searchCourses: string;
		markComplete: string;
		continueLearning: string;
		viewDetails: string;
		editCourse: string;
		deleteCourse: string;
		assignCourse: string;
		changeDueDate: string;
		revokeEnrollment: string;
	};
	
	// Catalogue
	catalogue: {
		title: string;
		description: string;
		allCategories: string;
		searchPlaceholder: string;
		noCourses: string;
		noCoursesDescription: string;
		estimatedTime: string;
		mandatory: string;
		enroll: string;
		enrolled: string;
		continueCourse: string;
		viewCourse: string;
		progress: string;
		modules: string;
		lessonCount: string;
		quizCount: string;
	};
	
	// Course
	course: {
		overview: string;
		modules: string;
		progress: string;
		completeModule: string;
		markComplete: string;
		startLesson: string;
		continueLesson: string;
		completedLesson: string;
		startQuiz: string;
		retakeQuiz: string;
		quizPassed: string;
		quizFailed: string;
		passScore: string;
		attemptsAllowed: string;
		attemptsUsed: string;
		timeLimit: string;
		noTimeLimit: string;
		nextModule: string;
		previousModule: string;
		backToCourse: string;
		courseCompleted: string;
		courseCompletedMessage: string;
		yourScore: string;
		notStarted: string;
		inProgress: string;
		lesson: string;
		quiz: string;
		scormPackage: string;
		moduleProgress: string;
		allModulesCompleted: string;
		dueDateLabel: string;
		noDueDate: string;
	};
	
	// Quiz
	quiz: {
		question: string;
		questionOf: string;
		timeRemaining: string;
		selectOne: string;
		selectAll: string;
		trueOrFalse: string;
		nextQuestion: string;
		previousQuestion: string;
		submitQuiz: string;
		confirmSubmit: string;
		confirmSubmitMessage: string;
		results: string;
		youPassed: string;
		youFailed: string;
		yourScoreIs: string;
		passingScore: string;
		attemptsRemaining: string;
		noAttemptsRemaining: string;
		reviewAnswers: string;
		retryQuiz: string;
		backToCourse: string;
		correct: string;
		incorrect: string;
		yourAnswer: string;
		correctAnswer: string;
		timeUp: string;
		timeUpMessage: string;
		maxAttemptsReached: string;
		maxAttemptsMessage: string;
		noQuestionsTitle: string;
		noQuestionsDescription: string;
	};
	
	// My Learning
	myLearning: {
		title: string;
		description: string;
		inProgressTab: string;
		completedTab: string;
		overdueTab: string;
		noCourses: string;
		noCoursesDescription: string;
		noInProgress: string;
		noInProgressDescription: string;
		noCompleted: string;
		noCompletedDescription: string;
		noOverdue: string;
		noOverdueDescription: string;
		continueWhere: string;
		lastActivity: string;
		completedOn: string;
		dueIn: string;
		overdueBy: string;
		nextModule: string;
	};
	
	// Team
	team: {
		title: string;
		description: string;
		directReports: string;
		noReports: string;
		noReportsDescription: string;
		enrolled: string;
		completed: string;
		overdue: string;
		viewLearning: string;
		assignCourse: string;
		bulkAssign: string;
		selectUsers: string;
		selectCourse: string;
		setDueDate: string;
		assign: string;
		assigning: string;
		assigned: string;
		assignmentSuccess: string;
		assignmentError: string;
		editDueDate: string;
		revokeEnrollment: string;
		confirmRevoke: string;
		confirmRevokeMessage: string;
		revokeSuccess: string;
		learningDetails: string;
		backToTeam: string;
		noEnrollments: string;
	};
	
	// Studio
	studio: {
		title: string;
		description: string;
		myCourses: string;
		createCourse: string;
		noCourses: string;
		noCoursesDescription: string;
		courseDetails: string;
		titleEn: string;
		titleHe: string;
		descriptionEn: string;
		descriptionHe: string;
		category: string;
		thumbnailUrl: string;
		estimatedMinutes: string;
		isMandatory: string;
		dueDays: string;
		dueDaysHelp: string;
		moduleManager: string;
		addModule: string;
		addLesson: string;
		addQuiz: string;
		moduleTitle: string;
		moduleTitleEn: string;
		moduleTitleHe: string;
		reorderModules: string;
		deleteModule: string;
		confirmDeleteModule: string;
		lessonContent: string;
		addTextBlock: string;
		addHeadingBlock: string;
		addVideoBlock: string;
		videoUrl: string;
		contentEn: string;
		contentHe: string;
		quizSettings: string;
		passScore: string;
		attemptsAllowed: string;
		timeLimitMinutes: string;
		shuffleQuestions: string;
		questions: string;
		addQuestion: string;
		questionType: string;
		singleChoice: string;
		multipleChoice: string;
		trueFalse: string;
		questionTextEn: string;
		questionTextHe: string;
		options: string;
		optionEn: string;
		optionHe: string;
		addOption: string;
		correctAnswer: string;
		correctAnswers: string;
		questionPoints: string;
		saveDraft: string;
		publishCourse: string;
		unpublishCourse: string;
		previewAsLearner: string;
		confirmPublish: string;
		confirmPublishMessage: string;
		publishSuccess: string;
		courseSaved: string;
		editCourse: string;
		backToStudio: string;
	};
	
	// HR Analytics
	hrAnalytics: {
		title: string;
		description: string;
		overview: string;
		enrollments: string;
		reports: string;
		// KPIs
		completionRate: string;
		overdueCount: string;
		activeLearners: string;
		topCourses: string;
		last30Days: string;
		// Enrollment assignment
		assignEnrollments: string;
		selectUsersOrDept: string;
		filterByDepartment: string;
		allDepartments: string;
		entireDepartment: string;
		selectedUsers: string;
		// Reports
		completionSummary: string;
		completionSummaryDesc: string;
		complianceReport: string;
		complianceReportDesc: string;
		courseEngagement: string;
		courseEngagementDesc: string;
		generateReport: string;
		generating: string;
		enrollmentCount: string;
		completedCount: string;
		completionRateCol: string;
		overdueCountCol: string;
		avgScore: string;
		avgTime: string;
		avgAttempts: string;
		departmentCol: string;
		courseCol: string;
		snapshotSaved: string;
	};
	
	// Admin
	admin: {
		title: string;
		description: string;
		users: string;
		categories: string;
		auditLog: string;
		orgSettings: string;
		// Users
		userManagement: string;
		searchUsers: string;
		editUser: string;
		role: string;
		manager: string;
		selectManager: string;
		noManager: string;
		isActive: string;
		userUpdated: string;
		// Categories
		categoryManagement: string;
		addCategory: string;
		editCategory: string;
		categoryNameEn: string;
		categoryNameHe: string;
		sortOrder: string;
		confirmDeleteCategory: string;
		categorySaved: string;
		categoryDeleted: string;
		// Audit Log
		auditLogTitle: string;
		filterByAction: string;
		filterByEntity: string;
		filterByDate: string;
		allActions: string;
		allEntities: string;
		actor: string;
		action: string;
		entity: string;
		timestamp: string;
		details: string;
		// Actions
		roleChanged: string;
		managerChanged: string;
		coursePublished: string;
		enrollmentAssigned: string;
		reportGenerated: string;
		// Org Settings
		orgSettingsTitle: string;
		orgName: string;
		logoUrl: string;
		defaultLocale: string;
		settingsSaved: string;
	};
	
	// Breadcrumbs
	breadcrumbs: {
		home: string;
	};
	
	// Errors
	errors: {
		connectionTimeout: string;
		failedToLoad: string;
		retry: string;
		noAccess: string;
	};
	
	// Landing page
	landing: {
		heroTitle: string;
		heroSub: string;
		trust1: string;
		trust2: string;
		trust3: string;
		talkToUs: string;
		showcaseCaption: string;
		feature1Title: string;
		feature1Body: string;
		feature2Title: string;
		feature2Body: string;
		feature3Title: string;
		feature3Body: string;
		secondary1Caption: string;
		secondary2Caption: string;
		roadmapLabel: string;
		roadmap1: string;
		roadmap2: string;
		roadmap3: string;
		roadmap4: string;
		ctaTitle: string;
		ctaSub: string;
		footerText: string;
		enlargeImage: string;
		toggleZoom: string;
		backToOverview: string;
	};
}

export const dictionaries: Record<Locale, Dictionary> = {
	en: {
		appName: 'Neon Academy',
		tagline: 'Corporate Learning Management',
		
		dashboard: {
			welcome: 'Welcome',
			continueLearning: 'Continue Learning',
			continueWhereLeft: 'Pick up where you left off',
			viewAllCourses: 'View all courses',
			newInCatalogue: 'New in the Catalogue',
			noInProgress: 'No courses in progress',
			noInProgressDescription: 'Enroll in a course from the catalogue to get started.',
			noNewCourses: 'No new courses',
			noNewCoursesDescription: 'Check back later for new content.',
		},
		
		nav: {
			catalogue: 'Catalogue',
			myLearning: 'My Learning',
			team: 'Team',
			studio: 'Studio',
			hrAnalytics: 'HR Analytics',
			admin: 'Admin',
		},
		
		auth: {
			login: 'Log In',
			signup: 'Sign Up',
			logout: 'Log Out',
			email: 'Email',
			password: 'Password',
			fullName: 'Full Name',
			forgotPassword: 'Forgot password?',
			resetPassword: 'Reset Password',
			newPassword: 'New Password',
			confirmPassword: 'Confirm Password',
			sendResetLink: 'Send Reset Link',
			backToLogin: 'Back to login',
			noAccount: "Don't have an account?",
			haveAccount: 'Already have an account?',
			orContinueWith: 'or continue with',
			google: 'Google',
			loggingIn: 'Logging in...',
			signingUp: 'Signing up...',
			sending: 'Sending...',
			resetting: 'Resetting...',
			resetLinkSent: 'Reset Link Sent',
			resetLinkSentDescription: 'Check your email for a link to reset your password.',
			passwordUpdated: 'Password Updated',
			passwordUpdatedDescription: 'Your password has been successfully updated.',
			invalidResetLink: 'Invalid Reset Link',
			invalidResetLinkDescription: 'This password reset link has expired or is invalid.',
			passwordMismatch: 'Passwords do not match',
			passwordMinLength: 'Password must be at least 8 characters',
			accountDeactivated: 'Account Deactivated',
			accountDeactivatedDescription: 'Your account has been deactivated. Please contact your administrator for assistance.',
			contactAdmin: 'Contact Administrator',
			tryDifferentAccount: 'Try a different account',
		},
		
		profile: {
			profile: 'Profile',
			settings: 'Settings',
			language: 'Language',
			english: 'English',
			hebrew: 'עברית',
		},
		
		scorm: {
			launch: 'Launch',
			resume: 'Resume',
			loadingPlayer: 'Loading SCORM player...',
			packageNotFound: 'SCORM package not found',
			invalidPackageUrl: 'Invalid package URL',
			runtimeError: 'SCORM runtime error',
			scormPackage: 'SCORM Package',
		},
		
		sandbox: {
			title: 'SCORM Sandbox',
			subtitle: 'Test SCORM packages without logging in - no data is saved',
			guestName: 'Guest Learner',
			inspectorTitle: 'Live CMI Inspector',
			noData: 'No CMI data yet - interact with the content',
			relaunch: 'Relaunch',
		},
		
		roles: {
			super_admin: 'Super Admin',
			hr_manager: 'HR Manager',
			team_manager: 'Team Manager',
			instructor: 'Instructor',
			employee: 'Employee',
		},
		
		common: {
			loading: 'Loading...',
			error: 'An error occurred',
			save: 'Save',
			cancel: 'Cancel',
			delete: 'Delete',
			edit: 'Edit',
			create: 'Create',
			search: 'Search',
			filter: 'Filter',
			noResults: 'No results found',
			comingSoon: 'Coming Soon',
			back: 'Back',
			next: 'Next',
			previous: 'Previous',
			submit: 'Submit',
			close: 'Close',
			confirm: 'Confirm',
			actions: 'Actions',
			status: 'Status',
			name: 'Name',
			department: 'Department',
			active: 'Active',
			inactive: 'Inactive',
			yes: 'Yes',
			no: 'No',
			all: 'All',
			select: 'Select',
			export: 'Export',
			download: 'Download',
			upload: 'Upload',
			refresh: 'Refresh',
			view: 'View',
			preview: 'Preview',
			publish: 'Publish',
			unpublish: 'Unpublish',
			archive: 'Archive',
			draft: 'Draft',
			published: 'Published',
			archived: 'Archived',
			required: 'Required',
			optional: 'Optional',
			minutes: 'min',
			hours: 'hours',
			days: 'days',
			ago: 'ago',
			in: 'in',
			overdue: 'Overdue',
			today: 'Today',
			tomorrow: 'Tomorrow',
			yesterday: 'Yesterday',
			points: 'points',
			score: 'Score',
			passed: 'Passed',
			failed: 'Failed',
			attempts: 'attempts',
			remaining: 'remaining',
			of: 'of',
			total: 'Total',
			average: 'Average',
			completed: 'Completed',
			pending: 'Pending',
			accessDenied: 'Access Denied',
			notFound: 'Not Found',
			pageNotFound: 'Page not found',
			goHome: 'Go to Home',
			errorOccurred: 'Something went wrong',
			tryAgain: 'Try Again',
			saveSnapshot: 'Save Snapshot',
			exportCsv: 'Export CSV',
			profileLoadError: "Couldn't load your profile",
			retry: 'Retry',
		},
		
		tooltips: {
			languageToggle: 'Switch language',
			profileMenu: 'Profile menu',
			notifications: 'Notifications',
			filterByCategory: 'Filter by category',
			searchCourses: 'Search courses',
			markComplete: 'Mark as complete',
			continueLearning: 'Continue learning',
			viewDetails: 'View details',
			editCourse: 'Edit course',
			deleteCourse: 'Delete course',
			assignCourse: 'Assign course',
			changeDueDate: 'Change due date',
			revokeEnrollment: 'Revoke enrollment',
		},
		
		catalogue: {
			title: 'Course Catalogue',
			description: 'Browse available courses and training programs',
			allCategories: 'All Categories',
			searchPlaceholder: 'Search courses...',
			noCourses: 'No courses available',
			noCoursesDescription: 'Check back later for new training content.',
			estimatedTime: 'Estimated time',
			mandatory: 'Mandatory',
			enroll: 'Enroll',
			enrolled: 'Enrolled',
			continueCourse: 'Continue',
			viewCourse: 'View Course',
			progress: 'Progress',
			modules: 'modules',
			lessonCount: 'lessons',
			quizCount: 'quizzes',
		},
		
		course: {
			overview: 'Overview',
			modules: 'Modules',
			progress: 'Progress',
			completeModule: 'Complete Module',
			markComplete: 'Mark Complete',
			startLesson: 'Start Lesson',
			continueLesson: 'Continue',
			completedLesson: 'Completed',
			startQuiz: 'Start Quiz',
			retakeQuiz: 'Retake Quiz',
			quizPassed: 'Passed',
			quizFailed: 'Failed',
			passScore: 'Pass score',
			attemptsAllowed: 'Attempts allowed',
			attemptsUsed: 'Attempts used',
			timeLimit: 'Time limit',
			noTimeLimit: 'No time limit',
			nextModule: 'Next Module',
			previousModule: 'Previous Module',
			backToCourse: 'Back to Course',
			courseCompleted: 'Course Completed!',
			courseCompletedMessage: 'Congratulations! You have completed this course.',
			yourScore: 'Your score',
			notStarted: 'Not Started',
			inProgress: 'In Progress',
			lesson: 'Lesson',
			quiz: 'Quiz',
			scormPackage: 'SCORM Package',
			moduleProgress: 'Module Progress',
			allModulesCompleted: 'All modules completed',
			dueDateLabel: 'Due date',
			noDueDate: 'No due date',
		},
		
		quiz: {
			question: 'Question',
			questionOf: 'of',
			timeRemaining: 'Time remaining',
			selectOne: 'Select one answer',
			selectAll: 'Select all that apply',
			trueOrFalse: 'True or False',
			nextQuestion: 'Next',
			previousQuestion: 'Previous',
			submitQuiz: 'Submit Quiz',
			confirmSubmit: 'Submit Quiz?',
			confirmSubmitMessage: 'Are you sure you want to submit? You cannot change your answers after submission.',
			results: 'Results',
			youPassed: 'You Passed!',
			youFailed: 'Not Passed',
			yourScoreIs: 'Your score is',
			passingScore: 'Passing score',
			attemptsRemaining: 'Attempts remaining',
			noAttemptsRemaining: 'No attempts remaining',
			reviewAnswers: 'Review Answers',
			retryQuiz: 'Try Again',
			backToCourse: 'Back to Course',
			correct: 'Correct',
			incorrect: 'Incorrect',
			yourAnswer: 'Your answer',
			correctAnswer: 'Correct answer',
			timeUp: 'Time\'s Up!',
			timeUpMessage: 'Your quiz has been automatically submitted.',
			maxAttemptsReached: 'Maximum Attempts Reached',
			maxAttemptsMessage: 'You have used all available attempts for this quiz.',
			noQuestionsTitle: 'No Questions Yet',
			noQuestionsDescription: 'This quiz does not have any questions yet. Please contact your instructor.',
		},
		
		myLearning: {
			title: 'My Learning',
			description: 'Track your enrolled courses and learning progress',
			inProgressTab: 'In Progress',
			completedTab: 'Completed',
			overdueTab: 'Overdue',
			noCourses: 'No courses yet',
			noCoursesDescription: 'Visit the catalogue to enroll in courses.',
			noInProgress: 'No courses in progress',
			noInProgressDescription: 'Start a course to see it here.',
			noCompleted: 'No completed courses',
			noCompletedDescription: 'Finish a course to see it here.',
			noOverdue: 'No overdue courses',
			noOverdueDescription: 'Great job staying on track!',
			continueWhere: 'Continue where you left off',
			lastActivity: 'Last activity',
			completedOn: 'Completed on',
			dueIn: 'Due in',
			overdueBy: 'Overdue by',
			nextModule: 'Next module',
		},
		
		team: {
			title: 'Team Overview',
			description: 'Monitor and manage your team\'s learning activities',
			directReports: 'Direct Reports',
			noReports: 'No direct reports',
			noReportsDescription: 'You don\'t have any team members assigned to you.',
			enrolled: 'Enrolled',
			completed: 'Completed',
			overdue: 'Overdue',
			viewLearning: 'View Learning',
			assignCourse: 'Assign Course',
			bulkAssign: 'Bulk Assign',
			selectUsers: 'Select team members',
			selectCourse: 'Select course',
			setDueDate: 'Set due date',
			assign: 'Assign',
			assigning: 'Assigning...',
			assigned: 'Assigned',
			assignmentSuccess: 'Course assigned successfully',
			assignmentError: 'Failed to assign course',
			editDueDate: 'Edit Due Date',
			revokeEnrollment: 'Revoke Enrollment',
			confirmRevoke: 'Revoke Enrollment?',
			confirmRevokeMessage: 'This will remove the user from the course. This action cannot be undone.',
			revokeSuccess: 'Enrollment revoked',
			learningDetails: 'Learning Details',
			backToTeam: 'Back to Team',
			noEnrollments: 'No enrollments',
		},
		
		studio: {
			title: 'Content Studio',
			description: 'Create and manage your courses',
			myCourses: 'My Courses',
			createCourse: 'Create Course',
			noCourses: 'No courses yet',
			noCoursesDescription: 'Create your first course to get started.',
			courseDetails: 'Course Details',
			titleEn: 'Title (English)',
			titleHe: 'Title (Hebrew)',
			descriptionEn: 'Description (English)',
			descriptionHe: 'Description (Hebrew)',
			category: 'Category',
			thumbnailUrl: 'Thumbnail URL',
			estimatedMinutes: 'Estimated minutes',
			isMandatory: 'Mandatory course',
			dueDays: 'Due days after enrollment',
			dueDaysHelp: 'Leave empty for no automatic due date',
			moduleManager: 'Module Manager',
			addModule: 'Add Module',
			addLesson: 'Add Lesson',
			addQuiz: 'Add Quiz',
			moduleTitle: 'Module Title',
			moduleTitleEn: 'Title (English)',
			moduleTitleHe: 'Title (Hebrew)',
			reorderModules: 'Drag to reorder',
			deleteModule: 'Delete Module',
			confirmDeleteModule: 'Are you sure you want to delete this module?',
			lessonContent: 'Lesson Content',
			addTextBlock: 'Add Text',
			addHeadingBlock: 'Add Heading',
			addVideoBlock: 'Add Video',
			videoUrl: 'Video URL',
			contentEn: 'Content (English)',
			contentHe: 'Content (Hebrew)',
			quizSettings: 'Quiz Settings',
			passScore: 'Pass score (%)',
			attemptsAllowed: 'Attempts allowed',
			timeLimitMinutes: 'Time limit (minutes)',
			shuffleQuestions: 'Shuffle questions',
			questions: 'Questions',
			addQuestion: 'Add Question',
			questionType: 'Question type',
			singleChoice: 'Single choice',
			multipleChoice: 'Multiple choice',
			trueFalse: 'True / False',
			questionTextEn: 'Question (English)',
			questionTextHe: 'Question (Hebrew)',
			options: 'Options',
			optionEn: 'Option (English)',
			optionHe: 'Option (Hebrew)',
			addOption: 'Add Option',
			correctAnswer: 'Correct answer',
			correctAnswers: 'Correct answers',
			questionPoints: 'Points',
			saveDraft: 'Save Draft',
			publishCourse: 'Publish Course',
			unpublishCourse: 'Unpublish',
			previewAsLearner: 'Preview as Learner',
			confirmPublish: 'Publish Course?',
			confirmPublishMessage: 'This course will become available to learners. You can unpublish it later if needed.',
			publishSuccess: 'Course published successfully',
			courseSaved: 'Course saved',
			editCourse: 'Edit Course',
			backToStudio: 'Back to Studio',
		},
		
		hrAnalytics: {
			title: 'HR Analytics',
			description: 'Organization-wide learning metrics and reports',
			overview: 'Overview',
			enrollments: 'Enrollments',
			reports: 'Reports',
			completionRate: 'Completion Rate',
			overdueCount: 'Overdue',
			activeLearners: 'Active Learners',
			topCourses: 'Top Courses',
			last30Days: 'in the last 30 days',
			assignEnrollments: 'Assign Enrollments',
			selectUsersOrDept: 'Select users or department',
			filterByDepartment: 'Filter by department',
			allDepartments: 'All Departments',
			entireDepartment: 'Entire department',
			selectedUsers: 'Selected users',
			completionSummary: 'Completion Summary',
			completionSummaryDesc: 'Enrollment and completion rates by course',
			complianceReport: 'Compliance Report',
			complianceReportDesc: 'Mandatory course completion by department',
			courseEngagement: 'Course Engagement',
			courseEngagementDesc: 'Scores, time spent, and attempt metrics',
			generateReport: 'Generate Report',
			generating: 'Generating...',
			enrollmentCount: 'Enrolled',
			completedCount: 'Completed',
			completionRateCol: 'Rate',
			overdueCountCol: 'Overdue',
			avgScore: 'Avg. Score',
			avgTime: 'Avg. Time',
			avgAttempts: 'Avg. Attempts',
			departmentCol: 'Department',
			courseCol: 'Course',
			snapshotSaved: 'Report snapshot saved',
		},
		
		admin: {
			title: 'Administration',
			description: 'System settings and user management',
			users: 'Users',
			categories: 'Categories',
			auditLog: 'Audit Log',
			orgSettings: 'Organization',
			userManagement: 'User Management',
			searchUsers: 'Search users...',
			editUser: 'Edit User',
			role: 'Role',
			manager: 'Manager',
			selectManager: 'Select manager',
			noManager: 'No manager',
			isActive: 'Active',
			userUpdated: 'User updated successfully',
			categoryManagement: 'Category Management',
			addCategory: 'Add Category',
			editCategory: 'Edit Category',
			categoryNameEn: 'Name (English)',
			categoryNameHe: 'Name (Hebrew)',
			sortOrder: 'Sort order',
			confirmDeleteCategory: 'Are you sure you want to delete this category?',
			categorySaved: 'Category saved',
			categoryDeleted: 'Category deleted',
			auditLogTitle: 'Audit Log',
			filterByAction: 'Filter by action',
			filterByEntity: 'Filter by entity',
			filterByDate: 'Filter by date',
			allActions: 'All actions',
			allEntities: 'All entities',
			actor: 'User',
			action: 'Action',
			entity: 'Entity',
			timestamp: 'Timestamp',
			details: 'Details',
			roleChanged: 'Role changed',
			managerChanged: 'Manager changed',
			coursePublished: 'Course published',
			enrollmentAssigned: 'Enrollment assigned',
			reportGenerated: 'Report generated',
			orgSettingsTitle: 'Organization Settings',
			orgName: 'Organization name',
			logoUrl: 'Logo URL',
			defaultLocale: 'Default language',
			settingsSaved: 'Settings saved',
		},
		
		breadcrumbs: {
			home: 'Home',
		},
		
		errors: {
			connectionTimeout: 'Connection timed out',
			failedToLoad: 'Failed to load data',
			retry: 'Retry',
			noAccess: 'You don\'t have access to this content',
		},
		
		landing: {
			heroTitle: 'Corporate learning that speaks both your languages.',
			heroSub: 'Neon Academy is a modern learning management system for teams that train in English and Hebrew - courses, quizzes, SCORM content, team assignments and compliance reporting, in one clean, fast platform.',
			trust1: 'Bilingual EN·HE with true RTL',
			trust2: 'SCORM 1.2 & 2004',
			trust3: 'Built on Sticklight',
			talkToUs: 'Talk to us',
			showcaseCaption: 'One catalogue, every language, every device. Employees browse, self-enroll and pick up exactly where they left off.',
			feature1Title: 'Bilingual by design, not by afterthought.',
			feature1Body: 'Every screen, course and report exists in English and Hebrew - with true right-to-left mirroring, not a stretched translation. One click switches the entire experience, and each employee learns in the language they think in.',
			feature2Title: 'Bring the training you already own.',
			feature2Body: 'Neon Academy plays standard SCORM 1.2 and 2004 packages from any authoring tool - scores, completion and resume included. Your existing course library doesn\'t need rebuilding; it needs a better home.',
			feature3Title: 'Compliance answers before anyone asks.',
			feature3Body: 'Live dashboards for HR: completion rates, overdue mandatory training, engagement per course - with one-click CSV export and saved snapshots. Managers see their own team; HR sees the whole picture; everything is permission-controlled at the database level.',
			secondary1Caption: 'Build bilingual courses and quizzes in-house - no vendors, no waiting.',
			secondary2Caption: 'Managers assign courses with due dates and track their team in real time.',
			roadmapLabel: 'On the roadmap',
			roadmap1: 'Public SCORM testing sandbox',
			roadmap2: 'Instructor SCORM upload',
			roadmap3: 'xAPI support',
			roadmap4: 'Course certificates',
			ctaTitle: 'See it with your own content.',
			ctaSub: 'We\'ll walk you through Neon Academy with your courses and your org structure - in English, in Hebrew, or both.',
			footerText: 'Neon Academy is a vibe-coding4elearning (vc4el) product, built on Sticklight.',
			enlargeImage: 'Enlarge image',
			toggleZoom: 'Toggle zoom',
			backToOverview: 'Back to overview',
		},
	},
	
	he: {
		appName: 'אקדמיית ניאון',
		tagline: 'מערכת ניהול למידה ארגונית',
		
		dashboard: {
			welcome: 'שלום',
			continueLearning: 'המשך ללמוד',
			continueWhereLeft: 'המשך מהמקום שהפסקת',
			viewAllCourses: 'צפה בכל הקורסים',
			newInCatalogue: 'חדש בקטלוג',
			noInProgress: 'אין קורסים בתהליך',
			noInProgressDescription: 'הירשם לקורס מהקטלוג כדי להתחיל.',
			noNewCourses: 'אין קורסים חדשים',
			noNewCoursesDescription: 'בדוק שוב מאוחר יותר לתוכן חדש.',
		},
		
		nav: {
			catalogue: 'קטלוג',
			myLearning: 'הלמידה שלי',
			team: 'צוות',
			studio: 'סטודיו',
			hrAnalytics: 'אנליטיקת HR',
			admin: 'ניהול',
		},
		
		auth: {
			login: 'התחברות',
			signup: 'הרשמה',
			logout: 'התנתקות',
			email: 'אימייל',
			password: 'סיסמה',
			fullName: 'שם מלא',
			forgotPassword: 'שכחת סיסמה?',
			resetPassword: 'איפוס סיסמה',
			newPassword: 'סיסמה חדשה',
			confirmPassword: 'אימות סיסמה',
			sendResetLink: 'שלח קישור איפוס',
			backToLogin: 'חזרה להתחברות',
			noAccount: 'אין לך חשבון?',
			haveAccount: 'כבר יש לך חשבון?',
			orContinueWith: 'או המשך עם',
			google: 'גוגל',
			loggingIn: 'מתחבר...',
			signingUp: 'נרשם...',
			sending: 'שולח...',
			resetting: 'מאפס...',
			resetLinkSent: 'קישור איפוס נשלח',
			resetLinkSentDescription: 'בדוק את האימייל שלך לקישור לאיפוס הסיסמה.',
			passwordUpdated: 'הסיסמה עודכנה',
			passwordUpdatedDescription: 'הסיסמה שלך עודכנה בהצלחה.',
			invalidResetLink: 'קישור איפוס לא תקין',
			invalidResetLinkDescription: 'קישור איפוס הסיסמה פג תוקף או לא תקין.',
			passwordMismatch: 'הסיסמאות אינן תואמות',
			passwordMinLength: 'הסיסמה חייבת להכיל לפחות 8 תווים',
			accountDeactivated: 'החשבון הושבת',
			accountDeactivatedDescription: 'החשבון שלך הושבת. אנא פנה למנהל המערכת לקבלת סיוע.',
			contactAdmin: 'פנה למנהל',
			tryDifferentAccount: 'נסה חשבון אחר',
		},
		
		profile: {
			profile: 'פרופיל',
			settings: 'הגדרות',
			language: 'שפה',
			english: 'English',
			hebrew: 'עברית',
		},
		
		scorm: {
			launch: 'הפעל',
			resume: 'המשך',
			loadingPlayer: 'טוען נגן SCORM...',
			packageNotFound: 'חבילת SCORM לא נמצאה',
			invalidPackageUrl: 'כתובת חבילה לא תקינה',
			runtimeError: 'שגיאת זמן ריצה של SCORM',
			scormPackage: 'חבילת SCORM',
		},
		
		sandbox: {
			title: 'ארגז חול SCORM',
			subtitle: 'בדיקת חבילות SCORM ללא התחברות - הנתונים לא נשמרים',
			guestName: 'אורח',
			inspectorTitle: 'צג CMI חי',
			noData: 'אין נתוני CMI עדיין - יש לקיים אינטראקציה עם התוכן',
			relaunch: 'הפעל מחדש',
		},
		
		roles: {
			super_admin: 'מנהל ראשי',
			hr_manager: 'מנהל משאבי אנוש',
			team_manager: 'מנהל צוות',
			instructor: 'מדריך',
			employee: 'עובד',
		},
		
		common: {
			loading: 'טוען...',
			error: 'אירעה שגיאה',
			save: 'שמור',
			cancel: 'ביטול',
			delete: 'מחק',
			edit: 'ערוך',
			create: 'צור',
			search: 'חיפוש',
			filter: 'סינון',
			noResults: 'לא נמצאו תוצאות',
			comingSoon: 'בקרוב',
			back: 'חזרה',
			next: 'הבא',
			previous: 'הקודם',
			submit: 'שלח',
			close: 'סגור',
			confirm: 'אישור',
			actions: 'פעולות',
			status: 'סטטוס',
			name: 'שם',
			department: 'מחלקה',
			active: 'פעיל',
			inactive: 'לא פעיל',
			yes: 'כן',
			no: 'לא',
			all: 'הכל',
			select: 'בחר',
			export: 'ייצוא',
			download: 'הורדה',
			upload: 'העלאה',
			refresh: 'רענון',
			view: 'צפה',
			preview: 'תצוגה מקדימה',
			publish: 'פרסם',
			unpublish: 'בטל פרסום',
			archive: 'ארכיון',
			draft: 'טיוטה',
			published: 'פורסם',
			archived: 'בארכיון',
			required: 'חובה',
			optional: 'אופציונלי',
			minutes: 'דק׳',
			hours: 'שעות',
			days: 'ימים',
			ago: 'לפני',
			in: 'בעוד',
			overdue: 'באיחור',
			today: 'היום',
			tomorrow: 'מחר',
			yesterday: 'אתמול',
			points: 'נקודות',
			score: 'ציון',
			passed: 'עבר',
			failed: 'נכשל',
			attempts: 'ניסיונות',
			remaining: 'נותרו',
			of: 'מתוך',
			total: 'סה״כ',
			average: 'ממוצע',
			completed: 'הושלם',
			pending: 'ממתין',
			accessDenied: 'הגישה נדחתה',
			notFound: 'לא נמצא',
			pageNotFound: 'הדף לא נמצא',
			goHome: 'לדף הבית',
			errorOccurred: 'משהו השתבש',
			tryAgain: 'נסה שוב',
			saveSnapshot: 'שמור תמונת מצב',
			exportCsv: 'ייצוא CSV',
			profileLoadError: 'לא ניתן לטעון את הפרופיל שלך',
			retry: 'נסה שוב',
		},
		
		tooltips: {
			languageToggle: 'החלף שפה',
			profileMenu: 'תפריט פרופיל',
			notifications: 'התראות',
			filterByCategory: 'סינון לפי קטגוריה',
			searchCourses: 'חיפוש קורסים',
			markComplete: 'סמן כהושלם',
			continueLearning: 'המשך למידה',
			viewDetails: 'צפה בפרטים',
			editCourse: 'ערוך קורס',
			deleteCourse: 'מחק קורס',
			assignCourse: 'הקצה קורס',
			changeDueDate: 'שנה תאריך יעד',
			revokeEnrollment: 'בטל הרשמה',
		},
		
		catalogue: {
			title: 'קטלוג קורסים',
			description: 'עיין בקורסים ותוכניות הכשרה זמינים',
			allCategories: 'כל הקטגוריות',
			searchPlaceholder: 'חיפוש קורסים...',
			noCourses: 'אין קורסים זמינים',
			noCoursesDescription: 'חזור מאוחר יותר לתוכן הכשרה חדש.',
			estimatedTime: 'זמן משוער',
			mandatory: 'חובה',
			enroll: 'הירשם',
			enrolled: 'רשום',
			continueCourse: 'המשך',
			viewCourse: 'צפה בקורס',
			progress: 'התקדמות',
			modules: 'מודולים',
			lessonCount: 'שיעורים',
			quizCount: 'מבחנים',
		},
		
		course: {
			overview: 'סקירה',
			modules: 'מודולים',
			progress: 'התקדמות',
			completeModule: 'השלם מודול',
			markComplete: 'סמן כהושלם',
			startLesson: 'התחל שיעור',
			continueLesson: 'המשך',
			completedLesson: 'הושלם',
			startQuiz: 'התחל מבחן',
			retakeQuiz: 'נסה שוב',
			quizPassed: 'עבר',
			quizFailed: 'נכשל',
			passScore: 'ציון מעבר',
			attemptsAllowed: 'ניסיונות מותרים',
			attemptsUsed: 'ניסיונות שנוצלו',
			timeLimit: 'מגבלת זמן',
			noTimeLimit: 'ללא מגבלת זמן',
			nextModule: 'המודול הבא',
			previousModule: 'המודול הקודם',
			backToCourse: 'חזרה לקורס',
			courseCompleted: 'הקורס הושלם!',
			courseCompletedMessage: 'מזל טוב! השלמת את הקורס.',
			yourScore: 'הציון שלך',
			notStarted: 'לא התחיל',
			inProgress: 'בתהליך',
			lesson: 'שיעור',
			quiz: 'מבחן',
			scormPackage: 'חבילת SCORM',
			moduleProgress: 'התקדמות במודול',
			allModulesCompleted: 'כל המודולים הושלמו',
			dueDateLabel: 'תאריך יעד',
			noDueDate: 'ללא תאריך יעד',
		},
		
		quiz: {
			question: 'שאלה',
			questionOf: 'מתוך',
			timeRemaining: 'זמן נותר',
			selectOne: 'בחר תשובה אחת',
			selectAll: 'בחר את כל המתאימים',
			trueOrFalse: 'נכון או לא נכון',
			nextQuestion: 'הבא',
			previousQuestion: 'הקודם',
			submitQuiz: 'הגש מבחן',
			confirmSubmit: 'להגיש את המבחן?',
			confirmSubmitMessage: 'האם אתה בטוח שברצונך להגיש? לא ניתן לשנות תשובות לאחר ההגשה.',
			results: 'תוצאות',
			youPassed: 'עברת!',
			youFailed: 'לא עברת',
			yourScoreIs: 'הציון שלך הוא',
			passingScore: 'ציון מעבר',
			attemptsRemaining: 'ניסיונות נותרים',
			noAttemptsRemaining: 'לא נותרו ניסיונות',
			reviewAnswers: 'סקירת תשובות',
			retryQuiz: 'נסה שוב',
			backToCourse: 'חזרה לקורס',
			correct: 'נכון',
			incorrect: 'שגוי',
			yourAnswer: 'התשובה שלך',
			correctAnswer: 'התשובה הנכונה',
			timeUp: 'הזמן נגמר!',
			timeUpMessage: 'המבחן שלך הוגש אוטומטית.',
			maxAttemptsReached: 'הגעת למקסימום ניסיונות',
			maxAttemptsMessage: 'ניצלת את כל הניסיונות הזמינים למבחן זה.',
			noQuestionsTitle: 'אין שאלות עדיין',
			noQuestionsDescription: 'למבחן זה אין עדיין שאלות. אנא פנה למדריך.',
		},
		
		myLearning: {
			title: 'הלמידה שלי',
			description: 'עקוב אחר הקורסים וההתקדמות שלך',
			inProgressTab: 'בתהליך',
			completedTab: 'הושלמו',
			overdueTab: 'באיחור',
			noCourses: 'אין קורסים עדיין',
			noCoursesDescription: 'בקר בקטלוג כדי להירשם לקורסים.',
			noInProgress: 'אין קורסים בתהליך',
			noInProgressDescription: 'התחל קורס כדי לראות אותו כאן.',
			noCompleted: 'אין קורסים שהושלמו',
			noCompletedDescription: 'סיים קורס כדי לראות אותו כאן.',
			noOverdue: 'אין קורסים באיחור',
			noOverdueDescription: 'כל הכבוד על ההתמדה!',
			continueWhere: 'המשך מאיפה שהפסקת',
			lastActivity: 'פעילות אחרונה',
			completedOn: 'הושלם ב',
			dueIn: 'יעד בעוד',
			overdueBy: 'באיחור של',
			nextModule: 'המודול הבא',
		},
		
		team: {
			title: 'סקירת צוות',
			description: 'עקוב ונהל את פעילויות הלמידה של הצוות שלך',
			directReports: 'כפיפים ישירים',
			noReports: 'אין כפיפים ישירים',
			noReportsDescription: 'אין חברי צוות שמשויכים אליך.',
			enrolled: 'רשומים',
			completed: 'הושלמו',
			overdue: 'באיחור',
			viewLearning: 'צפה בלמידה',
			assignCourse: 'הקצה קורס',
			bulkAssign: 'הקצאה מרובה',
			selectUsers: 'בחר חברי צוות',
			selectCourse: 'בחר קורס',
			setDueDate: 'קבע תאריך יעד',
			assign: 'הקצה',
			assigning: 'מקצה...',
			assigned: 'הוקצה',
			assignmentSuccess: 'הקורס הוקצה בהצלחה',
			assignmentError: 'הקצאת הקורס נכשלה',
			editDueDate: 'ערוך תאריך יעד',
			revokeEnrollment: 'בטל הרשמה',
			confirmRevoke: 'לבטל הרשמה?',
			confirmRevokeMessage: 'פעולה זו תסיר את המשתמש מהקורס. לא ניתן לבטל פעולה זו.',
			revokeSuccess: 'ההרשמה בוטלה',
			learningDetails: 'פרטי למידה',
			backToTeam: 'חזרה לצוות',
			noEnrollments: 'אין הרשמות',
		},
		
		studio: {
			title: 'סטודיו תוכן',
			description: 'צור ונהל את הקורסים שלך',
			myCourses: 'הקורסים שלי',
			createCourse: 'צור קורס',
			noCourses: 'אין קורסים עדיין',
			noCoursesDescription: 'צור את הקורס הראשון שלך כדי להתחיל.',
			courseDetails: 'פרטי קורס',
			titleEn: 'כותרת (אנגלית)',
			titleHe: 'כותרת (עברית)',
			descriptionEn: 'תיאור (אנגלית)',
			descriptionHe: 'תיאור (עברית)',
			category: 'קטגוריה',
			thumbnailUrl: 'כתובת תמונה ממוזערת',
			estimatedMinutes: 'דקות משוערות',
			isMandatory: 'קורס חובה',
			dueDays: 'ימים להשלמה מרגע ההרשמה',
			dueDaysHelp: 'השאר ריק ללא תאריך יעד אוטומטי',
			moduleManager: 'ניהול מודולים',
			addModule: 'הוסף מודול',
			addLesson: 'הוסף שיעור',
			addQuiz: 'הוסף מבחן',
			moduleTitle: 'כותרת מודול',
			moduleTitleEn: 'כותרת (אנגלית)',
			moduleTitleHe: 'כותרת (עברית)',
			reorderModules: 'גרור לסידור מחדש',
			deleteModule: 'מחק מודול',
			confirmDeleteModule: 'האם אתה בטוח שברצונך למחוק מודול זה?',
			lessonContent: 'תוכן השיעור',
			addTextBlock: 'הוסף טקסט',
			addHeadingBlock: 'הוסף כותרת',
			addVideoBlock: 'הוסף וידאו',
			videoUrl: 'כתובת וידאו',
			contentEn: 'תוכן (אנגלית)',
			contentHe: 'תוכן (עברית)',
			quizSettings: 'הגדרות מבחן',
			passScore: 'ציון מעבר (%)',
			attemptsAllowed: 'ניסיונות מותרים',
			timeLimitMinutes: 'מגבלת זמן (דקות)',
			shuffleQuestions: 'ערבב שאלות',
			questions: 'שאלות',
			addQuestion: 'הוסף שאלה',
			questionType: 'סוג שאלה',
			singleChoice: 'בחירה יחידה',
			multipleChoice: 'בחירה מרובה',
			trueFalse: 'נכון / לא נכון',
			questionTextEn: 'שאלה (אנגלית)',
			questionTextHe: 'שאלה (עברית)',
			options: 'אפשרויות',
			optionEn: 'אפשרות (אנגלית)',
			optionHe: 'אפשרות (עברית)',
			addOption: 'הוסף אפשרות',
			correctAnswer: 'תשובה נכונה',
			correctAnswers: 'תשובות נכונות',
			questionPoints: 'נקודות',
			saveDraft: 'שמור טיוטה',
			publishCourse: 'פרסם קורס',
			unpublishCourse: 'בטל פרסום',
			previewAsLearner: 'תצוגה מקדימה כלומד',
			confirmPublish: 'לפרסם את הקורס?',
			confirmPublishMessage: 'קורס זה יהפוך לזמין ללומדים. ניתן לבטל את הפרסום מאוחר יותר אם יש צורך.',
			publishSuccess: 'הקורס פורסם בהצלחה',
			courseSaved: 'הקורס נשמר',
			editCourse: 'ערוך קורס',
			backToStudio: 'חזרה לסטודיו',
		},
		
		hrAnalytics: {
			title: 'אנליטיקת HR',
			description: 'מדדי למידה ודוחות ברמה ארגונית',
			overview: 'סקירה',
			enrollments: 'הרשמות',
			reports: 'דוחות',
			completionRate: 'שיעור השלמה',
			overdueCount: 'באיחור',
			activeLearners: 'לומדים פעילים',
			topCourses: 'קורסים מובילים',
			last30Days: 'ב-30 הימים האחרונים',
			assignEnrollments: 'הקצה הרשמות',
			selectUsersOrDept: 'בחר משתמשים או מחלקה',
			filterByDepartment: 'סנן לפי מחלקה',
			allDepartments: 'כל המחלקות',
			entireDepartment: 'כל המחלקה',
			selectedUsers: 'משתמשים נבחרים',
			completionSummary: 'סיכום השלמות',
			completionSummaryDesc: 'שיעורי הרשמה והשלמה לפי קורס',
			complianceReport: 'דוח ציות',
			complianceReportDesc: 'השלמת קורסי חובה לפי מחלקה',
			courseEngagement: 'מעורבות בקורסים',
			courseEngagementDesc: 'ציונים, זמן שהושקע ומדדי ניסיונות',
			generateReport: 'הפק דוח',
			generating: 'מפיק...',
			enrollmentCount: 'רשומים',
			completedCount: 'הושלמו',
			completionRateCol: 'שיעור',
			overdueCountCol: 'באיחור',
			avgScore: 'ציון ממוצע',
			avgTime: 'זמן ממוצע',
			avgAttempts: 'ניסיונות ממוצע',
			departmentCol: 'מחלקה',
			courseCol: 'קורס',
			snapshotSaved: 'תמונת מצב הדוח נשמרה',
		},
		
		admin: {
			title: 'ניהול מערכת',
			description: 'הגדרות מערכת וניהול משתמשים',
			users: 'משתמשים',
			categories: 'קטגוריות',
			auditLog: 'יומן ביקורת',
			orgSettings: 'ארגון',
			userManagement: 'ניהול משתמשים',
			searchUsers: 'חיפוש משתמשים...',
			editUser: 'עריכת משתמש',
			role: 'תפקיד',
			manager: 'מנהל',
			selectManager: 'בחר מנהל',
			noManager: 'ללא מנהל',
			isActive: 'פעיל',
			userUpdated: 'המשתמש עודכן בהצלחה',
			categoryManagement: 'ניהול קטגוריות',
			addCategory: 'הוסף קטגוריה',
			editCategory: 'ערוך קטגוריה',
			categoryNameEn: 'שם (אנגלית)',
			categoryNameHe: 'שם (עברית)',
			sortOrder: 'סדר מיון',
			confirmDeleteCategory: 'האם אתה בטוח שברצונך למחוק קטגוריה זו?',
			categorySaved: 'הקטגוריה נשמרה',
			categoryDeleted: 'הקטגוריה נמחקה',
			auditLogTitle: 'יומן ביקורת',
			filterByAction: 'סנן לפי פעולה',
			filterByEntity: 'סנן לפי ישות',
			filterByDate: 'סנן לפי תאריך',
			allActions: 'כל הפעולות',
			allEntities: 'כל הישויות',
			actor: 'משתמש',
			action: 'פעולה',
			entity: 'ישות',
			timestamp: 'זמן',
			details: 'פרטים',
			roleChanged: 'תפקיד שונה',
			managerChanged: 'מנהל שונה',
			coursePublished: 'קורס פורסם',
			enrollmentAssigned: 'הרשמה הוקצתה',
			reportGenerated: 'דוח הופק',
			orgSettingsTitle: 'הגדרות ארגון',
			orgName: 'שם הארגון',
			logoUrl: 'כתובת לוגו',
			defaultLocale: 'שפת ברירת מחדל',
			settingsSaved: 'ההגדרות נשמרו',
		},
		
		breadcrumbs: {
			home: 'בית',
		},
		
		errors: {
			connectionTimeout: 'הזמן הקצוב לחיבור עבר',
			failedToLoad: 'טעינת הנתונים נכשלה',
			retry: 'נסה שוב',
			noAccess: 'אין לך גישה לתוכן זה',
		},
		
		landing: {
			heroTitle: 'למידה ארגונית שמדברת בשתי השפות שלכם.',
			heroSub: 'אקדמיית ניאון היא מערכת ניהול למידה מודרנית לצוותים שלומדים בעברית ובאנגלית - קורסים, בחנים, תוכן SCORM, שיבוצי הדרכה אישיים וצוותיים, דוחות התקדמות, הכול בפלטפורמה אחת נקייה ומהירה.',
			trust1: 'דו-לשונית עברית·אנגלית עם RTL אמיתי',
			trust2: 'SCORM 1.2 ו-2004',
			trust3: 'נבנתה על Sticklight',
			talkToUs: 'דברו איתנו',
			showcaseCaption: 'קטלוג אחד, כל שפה, כל מכשיר. העובדים מעיינים, נרשמים בעצמם וממשיכים בדיוק מהנקודה שבה עצרו.',
			feature1Title: 'דו-לשוניות מהיסוד, לא כתוספת.',
			feature1Body: 'כל מסך, קורס ודוח קיימים בעברית ובאנגלית - עם שיקוף מלא מימין לשמאל, לא תרגום מתוח. לחיצה אחת מחליפה את כל החוויה, וכל עובד לומד בשפה שבה הוא חושב.',
			feature2Title: 'הביאו את ההדרכות שכבר יש לכם.',
			feature2Body: 'אקדמיית ניאון מריצה חבילות SCORM 1.2 ו-2004 סטנדרטיות מכל כלי פיתוח תוכן - כולל ציונים, השלמה והמשך מאותה נקודה. ספריית הקורסים הקיימת שלכם לא צריכה להיבנות מחדש; היא צריכה בית טוב יותר.',
			feature3Title: 'מענה לדרישות ציות עוד לפני שנשאלתם.',
			feature3Body: 'לוחות בקרה חיים למשאבי אנוש: שיעורי השלמה, הדרכות חובה באיחור, מעורבות לפי קורס - עם ייצוא CSV בלחיצה ותמונות-מצב שמורות. מנהלים רואים את הצוות שלהם, משאבי אנוש רואים את התמונה המלאה - והכול נאכף ברמת בסיס הנתונים.',
			secondary1Caption: 'בונים קורסים ובחנים דו-לשוניים בתוך הארגון - בלי ספקים ובלי המתנה.',
			secondary2Caption: 'מנהלים משבצים קורסים וקובעים להם תאריכי יעד והם יכולים, בזמן אמת, לעקוב אחר התקדמות הלומדים.',
			roadmapLabel: 'בקרוב במפת הדרכים',
			roadmap1: 'ארגז חול ציבורי לבדיקת SCORM',
			roadmap2: 'העלאת SCORM למדריכים',
			roadmap3: 'תמיכה ב-xAPI',
			roadmap4: 'תעודות סיום',
			ctaTitle: 'תראו את זה עם התוכן שלכם.',
			ctaSub: 'נלווה אתכם בסיור באקדמיית ניאון עם הקורסים והמבנה הארגוני שלכם - בעברית, באנגלית, או בשתיהן.',
			footerText: 'אקדמיית ניאון היא מוצר של vibe-coding4elearning (vc4el), בנוי על Sticklight.',
			enlargeImage: 'הגדלת תמונה',
			toggleZoom: 'מיקוד תצוגה',
			backToOverview: 'חזרה לעמוד הראשי',
		},
	},
};

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}
