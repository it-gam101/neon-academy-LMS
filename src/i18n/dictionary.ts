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
		openMenu: string;
		menuTitle: string;
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
		/** Dispatch 4d: the name of the eye button on password fields (it also reports pressed = shown). */
		showPassword: string;
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
		changePassword: string;
		savePassword: string;
		passwordsDoNotMatch: string;
		memberSince: string;
		avatarUrl: string;
		managedByAdmin: string;
		profileUpdated: string;
		uploadAvatar: string;
		uploadingAvatar: string;
		uploadedNotSaved: string;
		orPasteUrl: string;
		avatarTooLarge: string;
	};
	
	// SCORM
	scorm: {
		launch: string;
		resume: string;
		loadingPlayer: string;
		packageNotFound: string;
		invalidPackageUrl: string;
		runtimeError: string;
		progressNotSaved: string;
		scormPackage: string;
		finishedCompleted: string;
		finishedPassed: string;
		finishedFailed: string;
		finishedSaved: string;
		finishedSavedBody: string;
		finishedScore: string;
		finishedStay: string;
	};
	
	// Sandbox
	sandbox: {
		title: string;
		subtitle: string;
		inspectorTitle: string;
		noData: string;
		relaunch: string;
		packagePicker: string;
		defaultPackage: string;
		packageLoadError: string;
		noPackagesYet: string;
		backToAcademy: string;
	};
	
	// Studio Upload
	studioUpload: {
		addScorm: string;
		title: string;
		selectFile: string;
		packageTitle: string;
		uploading: string;
		parsingManifest: string;
		uploadingFiles: string;
		registering: string;
		success: string;
		noManifest: string;
		noEntryPoint: string;
		invalidZip: string;
		uploadFailed: string;
		cancel: string;
		upload: string;
		versionLabel: string;
		entryLabel: string;
		uploadNew: string;
		chooseExisting: string;
		noPackages: string;
		sidecarDetected: string;
		sidecarLanguages: string;
		sidecarModules: string;
		sidecarQuestions: string;
		sidecarIssues: string;
		sidecarUnreadable: string;
		sidecarUploadUnaffected: string;
		importHow: string;
		importAsPackage: string;
		importAsPackageDetail: string;
		importAsModules: string;
		importAsModulesDetail: string;
		importPackageKept: string;
		importNeedsCourse: string;
		libraryImportPackageKept: string;
		interactionsNotShown: string;
		importedContent: string;
		importFailed: string;
	};
	
	// Studio Blocks
	studioBlocks: {
		editContent: string;
		blocks: string;
		addHeading: string;
		addText: string;
		addVideo: string;
		blockHeading: string;
		blockText: string;
		blockVideo: string;
		videoUrl: string;
		videoEmbedWarning: string;
		videoUrlConverted: string;
		videoUrlHelperText: string;
		caption: string;
		moveUp: string;
		moveDown: string;
		deleteBlock: string;
		confirmDeleteBlock: string;
		incomplete: string;
		missingHebrew: string;
		missingEnglish: string;
		noBlocks: string;
		saveBlocks: string;
		blocksSaved: string;
		saveFailed: string;
		formattingHint: string;
		addImage: string;
		addPdf: string;
		blockImage: string;
		blockPdf: string;
		mediaUrl: string;
		openPdf: string;
		invalidUrl: string;
		/** Dispatch 4a: "Block 2: the address must start with https://" — which block, and what is wrong with it. */
		blockNumber: string;
		invalidVideoUrl: string;
		invalidMediaUrl: string;
		discardChangesTitle: string;
		discardChangesMessage: string;
		discardConfirm: string;
		unsupportedHost: string;
		imageLoadFailed: string;
		openInNewTab: string;
		uploadFile: string;
		uploading: string;
		uploadFailed: string;
		orUseUrl: string;
		collapseAll: string;
		expandAll: string;
		/** Dispatch 4c: the name of ONE block's collapse arrow (the toolbar has collapseAll/expandAll). */
		collapseBlock: string;
		expandBlock: string;
		emptyBlock: string;
		noFileYet: string;
		dragHandle: string;
		autosaving: string;
		autosaved: string;
		needsHebrew: string;
		needsEnglish: string;
		warnEmpty: string;
		warnNoUrl: string;
		warnBadUrl: string;
	};
	
	// Media Library
	media: {
		title: string;
		images: string;
		pdfs: string;
		empty: string;
		chooseFromLibrary: string;
		deleteTitle: string;
		deleteMessage: string;
		deleted: string;
		uploadedBy: string;
		tabFiles: string;
		tabPackages: string;
		usedByModules: string;
		learnerRecords: string;
		packageInUse: string;
		deletePackageTitle: string;
		deletePackageMessage: string;
		packageDeleted: string;
		uploadPackage: string;
		packagesEmpty: string;
		packagesEmptyDesc: string;
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
		changeRefused: string;
		save: string;
		cancel: string;
		delete: string;
		remove: string;
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
		/** Dispatch v1a (version 1.0): strings that were written in the code. */
		questionsShort: string;
		unexpectedError: string;
		noDepartment: string;
		breadcrumbLabel: string;
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
		/** Item 109g: the simulator's turn counter ("Turn 2 of 4") and its replay button. */
		simulatorTurn: string;
		simulatorRestart: string;
		/** Dispatch 2: a learner who is not enrolled reads freely, but acting starts with enrolling. */
		enrollToTrack: string;
		enrollToTakeQuiz: string;
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
		newContentSinceCompleted: string;
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
		questions: string;
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
		partlyCorrect: string;
		checkEyebrow: string;
		checkAnswer: string;
		checkTryAgain: string;
		checkCorrectAnswers: string;
		unfinishedIntro: string;
		unfinishedAfterPass: string;
		unfinishedLessonHint: string;
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
		assignPartial: string;
		assignAllSkipped: string;
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
		/** Dispatch 3: upload the course image, or paste a link to one. */
		uploadCourseImage: string;
		/** Dispatch 8: what makes a good course image, and the non-blocking reminder before publishing. */
		courseImageHint: string;
		recommendCourseImage: string;
		addCourseImage: string;
		orPasteImageLink: string;
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
		deleteModuleWarning: string;
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
		/** Dispatch v1a (version 1.0): strings that were written in the code. */
		questionDeleted: string;
		questionTextMissing: string;
		optionsMissing: string;
		questionSaved: string;
		questionAdded: string;
		noQuestionsHint: string;
		pointsShort: string;
		newQuestion: string;
		newQuestionBadge: string;
		confirmDeleteQuestion: string;
		questionPlaceholder: string;
		enrolledLearners: string;
		timeLimitHelp: string;
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
		dangerZone: string;
		archiveCourse: string;
		archiveCourseDescription: string;
		confirmArchive: string;
		courseArchived: string;
		deleteCourseDescription: string;
		confirmDeleteCourse: string;
		deleteWarningWithEnrollments: string;
		typeTitleToConfirm: string;
		deleteBlockedNotAdmin: string;
		courseDeleted: string;
		deleteFailed: string;
		editModuleTitle: string;
		moduleTitleSaved: string;
		scopeMine: string;
		scopeAll: string;
		owner: string;
		unknownOwner: string;
		readyToPublish: string;
		blockersCount: string;
		blockerFix: string;
		blockerCheckFailed: string;
		blockerNoModules: string;
		blockerModuleTitle: string;
		blockerNoBlocks: string;
		blockerNoQuestions: string;
		blockerQuestionText: string;
		blockerFewOptions: string;
		blockerOptionText: string;
		blockerNoCorrect: string;
		previewBanner: string;
		previewBackToEdit: string;
		previewNoProgress: string;
		previewDesktop: string;
		previewMobile: string;
		scormCannotPlayHere: string;
		scormCannotPlayHereBody: string;
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
		deleteCategory: string;
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
		/** Dispatch 4f: Audit Log actions and entities in words (an unknown value shows as stored). */
		auditActions: {
			course_deleted: string;
			course_published: string;
			enrollment_assigned: string;
			enrollments_completed_by_module_delete: string;
			manager_changed: string;
			role_changed: string;
			user_registered: string;
			report_generated: string;
		};
		auditEntities: {
			courses: string;
			enrollments: string;
			modules: string;
			profiles: string;
			report_snapshots: string;
		};
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
		uploadLogo: string;
		uploadingLogo: string;
		defaultLocale: string;
		settingsSaved: string;
		newRegistrations: string;
		newRegistrationsCta: string;
		newBadge: string;
	};
	
	// Breadcrumbs
	breadcrumbs: {
		home: string;
	};
	
	// Errors
	errors: {
		connectionTimeout: string;
		sessionExpired: string;
		failedToLoad: string;
		retry: string;
		noAccess: string;
		/** Dispatch 1a: what went wrong, said in words the reader can act on (lib/errorText.ts). */
		network: string;
		notFound: string;
		invalidCredentials: string;
		emailNotConfirmed: string;
		alreadyRegistered: string;
		tooManyAttempts: string;
		samePassword: string;
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
		vc4elSite: string;
		enlargeImage: string;
		toggleZoom: string;
		/** Dispatch 4f: under an enlarged image — how to return to the page. */
		lightboxHint: string;
		/** Dispatch v1a (version 1.0): strings that were written in the code. */
		altCatalogue: string;
		altMyLearning: string;
		altScormPlayer: string;
		altHrAnalytics: string;
		altStudio: string;
		altAssignCourse: string;
		backToOverview: string;
		trySandbox: string;
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
			openMenu: 'Open menu',
			menuTitle: 'Menu',
		},
		
		auth: {
			login: 'Log In',
			signup: 'Sign Up',
			logout: 'Log Out',
			email: 'Email',
			password: 'Password',
			fullName: 'Full Name',
			forgotPassword: 'Forgot password?',
			showPassword: 'Show password',
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
			changePassword: 'Change password',
			savePassword: 'Update password',
			passwordsDoNotMatch: 'Passwords do not match',
			memberSince: 'Member since',
			avatarUrl: 'Avatar image URL',
			managedByAdmin: 'Managed by your administrator',
			profileUpdated: 'Profile updated',
			uploadAvatar: 'Upload an image',
			uploadingAvatar: 'Uploading…',
			uploadedNotSaved: 'Uploaded — press Save to apply',
			orPasteUrl: 'or paste a link',
			avatarTooLarge: 'Image must be under 2 MB',
		},
		
		scorm: {
			launch: 'Launch',
			resume: 'Resume',
			loadingPlayer: 'Loading SCORM player...',
			packageNotFound: 'SCORM package not found',
			invalidPackageUrl: 'Invalid package URL',
			runtimeError: 'SCORM runtime error',
			progressNotSaved: 'Your progress was not saved. Check your connection and try again.',
			scormPackage: 'SCORM Package',
			finishedCompleted: 'Module completed',
			finishedPassed: 'You passed',
			finishedFailed: 'Not passed this time',
			finishedSaved: 'Your progress is saved',
			finishedSavedBody: 'You can continue from where you left off.',
			finishedScore: 'Score: {score}%',
			finishedStay: 'Stay on this page',
		},
		
		sandbox: {
			title: 'SCORM Sandbox',
			subtitle: 'Test SCORM packages without logging in - no data is saved',
			inspectorTitle: 'Live CMI Inspector',
			noData: 'No CMI data yet - interact with the content',
			relaunch: 'Relaunch',
			packagePicker: 'Package',
			defaultPackage: 'MBTI Micro-Course (default)',
			packageLoadError: 'Failed to load packages',
			noPackagesYet: 'No packages of your own yet — upload one',
			backToAcademy: 'Back to Academy',
		},
		
		studioUpload: {
			addScorm: 'Add SCORM',
			title: 'Upload SCORM Package',
			selectFile: 'Click to select a SCORM .zip file',
			packageTitle: 'Package Title',
			uploading: 'Uploading...',
			parsingManifest: 'Parsing manifest...',
			uploadingFiles: 'Uploading files...',
			registering: 'Registering package...',
			success: 'Package uploaded successfully',
			noManifest: 'No imsmanifest.xml found in the zip file',
			noEntryPoint: 'Could not find entry point in manifest',
			invalidZip: 'Invalid or corrupted zip file',
			uploadFailed: 'Upload failed',
			cancel: 'Cancel',
			upload: 'Upload',
			versionLabel: 'SCORM:',
			entryLabel: 'Entry:',
			uploadNew: 'Upload a new package',
			chooseExisting: 'Choose an existing package',
			noPackages: 'No packages available yet',
			sidecarDetected: 'Course source detected',
			sidecarLanguages: 'Languages:',
			sidecarModules: 'Modules:',
			sidecarQuestions: 'Quiz questions:',
			sidecarIssues: 'Issues found in the course source:',
			sidecarUnreadable: 'Course source found, but it could not be read',
			sidecarUploadUnaffected: 'The SCORM package itself will upload and play normally.',
			importHow: 'How should this be imported?',
			importAsPackage: 'Play the SCORM package as delivered',
			importAsPackageDetail: 'One module. Exactly what a third-party LMS sees.',
			importAsModules: 'Import as editable modules',
			importAsModulesDetail: '{count} modules, each counted separately toward completion.',
			importPackageKept: 'The uploaded package stays in your library either way.',
			importNeedsCourse: 'This package carries editable course content. Import it as modules by uploading from inside a course — a library upload stores the package only.',
			libraryImportPackageKept: 'The package stays in your library either way, and can still be added to other courses.',
			interactionsNotShown: 'Interactive elements in this package: {count}. Imported as editable modules, they are kept but not yet displayed — learners see the text version instead. To show them as designed, play the package as delivered.',
			importedContent: 'Imported:',
			importFailed: 'The package uploaded and works. Its content could not be imported.',
		},
		
		studioBlocks: {
			editContent: 'Edit Content',
			blocks: 'blocks',
			addHeading: 'Heading',
			addText: 'Text',
			addVideo: 'Video',
			blockHeading: 'Heading',
			blockText: 'Text',
			blockVideo: 'Video',
			videoUrl: 'Video URL (embed)',
			videoEmbedWarning: 'Use an embed URL (e.g. youtube.com/embed/...), not a watch URL',
			videoUrlConverted: 'Converted to embed URL',
			videoUrlHelperText: 'Paste any YouTube link — a share link works and will be converted automatically. Final form: https://www.youtube.com/embed/VIDEO_ID',
			caption: 'Caption',
			moveUp: 'Move up',
			moveDown: 'Move down',
			deleteBlock: 'Delete block',
			confirmDeleteBlock: 'Click again to confirm',
			incomplete: 'Incomplete',
			missingHebrew: 'blocks missing Hebrew',
			missingEnglish: 'blocks missing English',
			noBlocks: 'No content blocks yet. Add a heading, text, or video.',
			saveBlocks: 'Save Content',
			blocksSaved: 'Content saved',
			saveFailed: 'Failed to save content',
			formattingHint: 'Supports **bold** and line breaks',
			addImage: 'Image',
			addPdf: 'PDF',
			blockImage: 'Image',
			blockPdf: 'PDF',
			mediaUrl: 'File URL',
			openPdf: 'Open PDF in a new tab',
			invalidUrl: 'This URL is not allowed. Videos must be a youtube.com/embed link; files must be an https address.',
			blockNumber: 'Block {n}',
			invalidVideoUrl: 'use a YouTube embed link (https://www.youtube.com/embed/…)',
			invalidMediaUrl: 'the address must start with https://',
			discardChangesTitle: 'Discard changes?',
			discardChangesMessage: 'Your unsaved changes to this lesson will be lost.',
			discardConfirm: 'Discard',
			unsupportedHost: 'This host blocks embedding, so the file will not display inside the course. Use a direct link to the file itself.',
			imageLoadFailed: 'The image could not be loaded.',
			openInNewTab: 'Open in a new tab',
			uploadFile: 'Upload a file',
			uploading: 'Uploading…',
			uploadFailed: 'Upload failed',
			orUseUrl: 'or paste a link',
			collapseAll: 'Collapse all',
			expandAll: 'Expand all',
			collapseBlock: 'Collapse block',
			expandBlock: 'Expand block',
			emptyBlock: 'Empty',
			noFileYet: 'No file selected',
			dragHandle: 'Drag to reorder',
			autosaving: 'Saving…',
			autosaved: 'Saved',
			needsHebrew: 'Hebrew text missing',
			needsEnglish: 'English text missing',
			warnEmpty: 'Empty — learners will not see this block',
			warnNoUrl: 'No file or link — learners will not see this block',
			warnBadUrl: 'Link not allowed — learners will not see this block',
		},
		
		media: {
			title: 'Media Library',
			images: 'Images',
			pdfs: 'PDFs',
			empty: 'No files uploaded yet',
			chooseFromLibrary: 'Choose from library',
			deleteTitle: 'Delete file?',
			deleteMessage: 'This permanently deletes the file. Lessons that already use it will stop displaying it.',
			deleted: 'File deleted',
			uploadedBy: 'Uploaded by',
			tabFiles: 'Files',
			tabPackages: 'SCORM Packages',
			usedByModules: 'Used by modules',
			learnerRecords: 'Learner records',
			packageInUse: 'In use — cannot be deleted. Remove it from all modules first; learner records must be preserved.',
			deletePackageTitle: 'Delete SCORM package?',
			deletePackageMessage: 'This permanently deletes the package and all its files. Only unused packages can be deleted.',
			packageDeleted: 'Package deleted',
			uploadPackage: 'Upload package',
			packagesEmpty: 'No SCORM packages yet',
			packagesEmptyDesc: 'Upload a SCORM package here, or from inside a course. Packages uploaded here can be opened in the Sandbox and attached to a course later.',
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
			changeRefused: 'The change was refused — you may not have permission.',
			save: 'Save',
			cancel: 'Cancel',
			delete: 'Delete',
			remove: 'Remove',
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
			questionsShort: 'Q',
			unexpectedError: 'An unexpected error occurred. Try refreshing the page or going back.',
			noDepartment: 'No department',
			breadcrumbLabel: 'Breadcrumb',
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
			simulatorTurn: 'Turn',
			simulatorRestart: 'Start again',
			enrollToTrack: 'Enroll to track your progress',
			enrollToTakeQuiz: 'Enroll in this course to take the quiz',
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
			newContentSinceCompleted: 'Modules added since you completed this course: {count}',
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
			questions: 'Questions',
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
			partlyCorrect: 'Partly correct',
			checkEyebrow: 'Check yourself',
			checkAnswer: 'Check',
			checkTryAgain: 'Try again',
			checkCorrectAnswers: 'Correct answers',
			unfinishedIntro: 'Not finished yet in this course: {count}. The course is completed when every part is finished and this quiz is passed. You can take the quiz now and finish the rest afterwards.',
			unfinishedAfterPass: 'The quiz is passed, but the course is not complete yet. Finish these to complete it:',
			unfinishedLessonHint: 'A lesson counts as finished once you press "{mark}" at its end.',
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
			assignPartial: 'Enrolled {enrolled}. {skipped} already had this course.',
			assignAllSkipped: 'Everyone selected already has this course.',
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
			thumbnailUrl: 'Course image',
			uploadCourseImage: 'Upload an image',
			courseImageHint: 'Any photo works: it is reduced to 1280 px and saved as a compressed WebP. Wide images look best (about 16:9); cards crop the edges, so keep the subject in the middle.',
			recommendCourseImage: 'Recommended: add a course image. Courses with an image stand out in the Catalogue and on learners\' home page.',
			addCourseImage: 'Add image',
			orPasteImageLink: 'or paste a link',
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
			deleteModuleWarning: 'This will also permanently delete learner progress records for this module:',
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
			questionDeleted: 'Question deleted',
			questionTextMissing: 'Please fill in the question text in both languages',
			optionsMissing: 'Please fill in all options in both languages',
			questionSaved: 'Question saved',
			questionAdded: 'Question added',
			noQuestionsHint: 'No questions yet. Click "{button}" to start.',
			pointsShort: 'pts',
			newQuestion: 'New question',
			newQuestionBadge: 'New',
			confirmDeleteQuestion: 'Delete this question?',
			questionPlaceholder: 'Question in English...',
			enrolledLearners: '{count} enrolled learner(s)',
			timeLimitHelp: 'Leave empty for no time limit',
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
			dangerZone: 'Danger Zone',
			archiveCourse: 'Archive Course',
			archiveCourseDescription: 'Archiving removes this course from the catalogue but keeps all learner progress intact.',
			confirmArchive: 'Are you sure you want to archive this course?',
			courseArchived: 'Course archived',
			deleteCourseDescription: 'Permanently delete this course and all its modules.',
			confirmDeleteCourse: 'Delete Course?',
			deleteWarningWithEnrollments: 'This will permanently delete all learner progress, quiz attempts and scores for {count} enrolled learner(s). This action cannot be undone.',
			typeTitleToConfirm: 'Type the course title to confirm:',
			deleteBlockedNotAdmin: 'This course has enrolled learners. Only super admins can delete courses with active enrollments.',
			courseDeleted: 'Course deleted',
			deleteFailed: 'Failed to delete course',
			editModuleTitle: 'Edit Module Title',
			moduleTitleSaved: 'Module title saved',
			scopeMine: 'Mine',
			scopeAll: 'All Courses',
			owner: 'Owner',
			unknownOwner: 'Unknown',
			readyToPublish: 'Ready to publish',
			blockersCount: 'Must be fixed before publishing:',
			blockerFix: 'Fix',
			blockerCheckFailed: 'Could not check this course — try again',
			blockerNoModules: 'The course has no modules',
			blockerModuleTitle: 'Module title missing a translation',
			blockerNoBlocks: 'Lesson has no content blocks',
			blockerNoQuestions: 'Quiz has no questions',
			blockerQuestionText: 'Question missing a translation',
			blockerFewOptions: 'Question needs at least two options',
			blockerOptionText: 'An answer option is missing a translation',
			blockerNoCorrect: 'Question has no valid correct answer',
			previewBanner: 'Preview — you are seeing this course as a learner. Nothing is recorded.',
			previewBackToEdit: 'Back to editing',
			previewNoProgress: 'Disabled in preview',
			previewDesktop: 'Desktop',
			previewMobile: 'Mobile',
			scormCannotPlayHere: 'SCORM package cannot be played here',
			scormCannotPlayHereBody: 'SCORM packages run only from My Learning, where an enrolment exists to record progress and score. Preview will not open the player, so nothing is recorded by mistake.',
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
			deleteCategory: 'Delete Category?',
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
			auditActions: {
				course_deleted: 'Course deleted',
				course_published: 'Course published',
				enrollment_assigned: 'Course assigned',
				enrollments_completed_by_module_delete: 'Enrollments completed after a module was deleted',
				manager_changed: 'Manager changed',
				role_changed: 'Role changed',
				user_registered: 'User registered',
				report_generated: 'Report generated',
			},
			auditEntities: {
				courses: 'Course',
				enrollments: 'Enrollment',
				modules: 'Module',
				profiles: 'User',
				report_snapshots: 'Report',
			},
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
			uploadLogo: 'Upload logo',
			uploadingLogo: 'Uploading…',
			defaultLocale: 'Default language',
			settingsSaved: 'Settings saved',
			newRegistrations: 'New registrations this week',
			newRegistrationsCta: 'Review new users',
			newBadge: 'New',
		},
		
		breadcrumbs: {
			home: 'Home',
		},
		
		errors: {
			connectionTimeout: 'Connection timed out',
			sessionExpired: 'Your session has expired. Please sign in again.',
			failedToLoad: 'Failed to load data',
			retry: 'Retry',
			noAccess: 'You don\'t have access to this content',
			network: 'Couldn\'t reach the server. Check your connection and try again.',
			notFound: 'This item doesn\'t exist, or you don\'t have access to it.',
			invalidCredentials: 'The email or password is incorrect.',
			emailNotConfirmed: 'Please confirm your email address first — the link is in your inbox.',
			alreadyRegistered: 'An account with this email already exists. Try signing in.',
			tooManyAttempts: 'Too many attempts. Please wait a minute and try again.',
			samePassword: 'The new password must be different from the current one.',
		},
		
		landing: {
			heroTitle: 'Corporate learning that speaks both your languages',
			heroSub: 'Neon Academy is a modern learning management system for teams that train in English and Hebrew - courses, quizzes, SCORM content, team assignments and compliance reporting, in one clean, fast platform.',
			trust1: 'Bilingual EN·HE with true RTL',
			trust2: 'SCORM 1.2 & 2004',
			trust3: 'Built on Sticklight',
			talkToUs: 'Talk to us',
			showcaseCaption: 'One catalogue, every language, every device. Employees browse, self-enroll and pick up exactly where they left off.',
			feature1Title: 'Bilingual by design, not by afterthought.',
			feature1Body: 'Every screen, course and report exists in English and Hebrew – with true right-to-left mirroring, not a stretched translation. One click switches the entire experience, and each employee learns in the language they think in.',
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
			vc4elSite: 'vibe-coding4elearning.com',
			enlargeImage: 'Enlarge image',
			toggleZoom: 'Toggle zoom',
			lightboxHint: 'To return to the page, press Esc or click outside the image.',
			altCatalogue: 'Course catalogue',
			altMyLearning: 'My Learning screen',
			altScormPlayer: 'SCORM player',
			altHrAnalytics: 'HR Analytics dashboard',
			altStudio: 'Content studio',
			altAssignCourse: 'Assign course to team',
			backToOverview: 'Back to overview',
			trySandbox: 'Try the SCORM sandbox',
		},
	},
	
	he: {
		appName: 'אקדמיית ניאון',
		tagline: 'מערכת ניהול למידה ארגונית',
		
		dashboard: {
			welcome: 'שלום',
			continueLearning: 'המשך הלמידה',
			continueWhereLeft: 'ממשיכים מהמקום שבו עצרתם',
			viewAllCourses: 'צפייה בכל הקורסים',
			newInCatalogue: 'חדש בקטלוג',
			noInProgress: 'אין קורסים בתהליך',
			noInProgressDescription: 'הירשמו לקורס מהקטלוג כדי להתחיל.',
			noNewCourses: 'אין קורסים חדשים',
			noNewCoursesDescription: 'בדקו שוב מאוחר יותר לתוכן חדש.',
		},
		
		nav: {
			catalogue: 'קטלוג',
			myLearning: 'הלמידה שלי',
			team: 'צוות',
			studio: 'סטודיו',
			hrAnalytics: 'אנליטיקת HR',
			admin: 'ניהול',
			openMenu: 'פתיחת התפריט',
			menuTitle: 'תפריט',
		},
		
		auth: {
			login: 'התחברות',
			signup: 'הרשמה',
			logout: 'התנתקות',
			email: 'אימייל',
			password: 'סיסמה',
			fullName: 'שם מלא',
			forgotPassword: 'שכחת סיסמה?',
			showPassword: 'הצגת סיסמה',
			resetPassword: 'איפוס סיסמה',
			newPassword: 'סיסמה חדשה',
			confirmPassword: 'אימות סיסמה',
			sendResetLink: 'שליחת קישור איפוס',
			backToLogin: 'חזרה להתחברות',
			noAccount: 'אין לך חשבון?',
			haveAccount: 'כבר יש לך חשבון?',
			orContinueWith: 'או התחברות עם',
			google: 'גוגל',
			loggingIn: 'התחברות...',
			signingUp: 'הרשמה...',
			sending: 'שליחה...',
			resetting: 'איפוס...',
			resetLinkSent: 'קישור איפוס נשלח',
			resetLinkSentDescription: 'בדקו את תיבת האימייל לקישור לאיפוס הסיסמה.',
			passwordUpdated: 'הסיסמה עודכנה',
			passwordUpdatedDescription: 'הסיסמה שלך עודכנה בהצלחה.',
			invalidResetLink: 'קישור איפוס לא תקין',
			invalidResetLinkDescription: 'קישור איפוס הסיסמה פג תוקף או לא תקין.',
			passwordMismatch: 'הסיסמאות אינן תואמות',
			passwordMinLength: 'הסיסמה חייבת להכיל לפחות 8 תווים',
			accountDeactivated: 'החשבון הושבת',
			accountDeactivatedDescription: 'החשבון הושבת. לקבלת סיוע יש לפנות למנהלי המערכת.',
			contactAdmin: 'פנייה למנהלי המערכת',
			tryDifferentAccount: 'התחברות בחשבון אחר',
		},
		
		profile: {
			profile: 'פרופיל',
			settings: 'הגדרות',
			language: 'שפה',
			english: 'English',
			hebrew: 'עברית',
			changePassword: 'שינוי סיסמה',
			savePassword: 'עדכון סיסמה',
			passwordsDoNotMatch: 'הסיסמאות אינן תואמות',
			memberSince: 'תאריך הצטרפות',
			avatarUrl: 'כתובת תמונת פרופיל',
			managedByAdmin: 'מנוהל על ידי מנהל המערכת',
			profileUpdated: 'הפרופיל עודכן',
			uploadAvatar: 'העלאת תמונה',
			uploadingAvatar: 'העלאה…',
			uploadedNotSaved: 'הועלה — לחצו שמירה כדי להחיל',
			orPasteUrl: 'או הדביקו קישור',
			avatarTooLarge: 'התמונה חייבת להיות קטנה מ-2 MB',
		},
		
		scorm: {
			launch: 'הפעלה',
			resume: 'המשך',
			loadingPlayer: 'נגן ה-SCORM בטעינה...',
			packageNotFound: 'חבילת SCORM לא נמצאה',
			invalidPackageUrl: 'כתובת חבילה לא תקינה',
			runtimeError: 'שגיאת זמן ריצה של SCORM',
			progressNotSaved: 'ההתקדמות שלך לא נשמרה. בדקו את החיבור ונסו שוב.',
			scormPackage: 'חבילת SCORM',
			finishedCompleted: 'היחידה הושלמה',
			finishedPassed: 'עברתם בהצלחה',
			finishedFailed: 'הפעם לא עברתם',
			finishedSaved: 'ההתקדמות שלכם נשמרה',
			finishedSavedBody: 'תוכלו להמשיך מהמקום שבו עצרתם.',
			finishedScore: 'ציון: {score}%',
			finishedStay: 'להישאר בדף זה',
		},
		
		sandbox: {
			title: 'ארגז חול SCORM',
			subtitle: 'בדיקת חבילות SCORM ללא התחברות - הנתונים לא נשמרים',
			inspectorTitle: 'צג CMI חי',
			noData: 'אין נתוני CMI עדיין - יש לקיים אינטראקציה עם התוכן',
			relaunch: 'הפעלה מחדש',
			packagePicker: 'חבילה',
			defaultPackage: 'קורס MBTI מקוצר (ברירת מחדל)',
			packageLoadError: 'טעינת החבילות נכשלה',
			noPackagesYet: 'אין עדיין חבילות משלכם — העלו חבילה',
			backToAcademy: 'חזרה לאקדמיה',
		},
		
		studioUpload: {
			addScorm: 'הוספת SCORM',
			title: 'העלאת חבילת SCORM',
			selectFile: 'לחצו לבחירת קובץ SCORM מסוג .zip',
			packageTitle: 'שם החבילה',
			uploading: 'העלאה...',
			parsingManifest: 'קריאת המניפסט...',
			uploadingFiles: 'העלאת הקבצים...',
			registering: 'רישום החבילה...',
			success: 'החבילה הועלתה בהצלחה',
			noManifest: 'לא נמצא קובץ imsmanifest.xml בקובץ ה-zip',
			noEntryPoint: 'לא ניתן למצוא נקודת כניסה במניפסט',
			invalidZip: 'קובץ zip לא תקין או פגום',
			uploadFailed: 'ההעלאה נכשלה',
			cancel: 'ביטול',
			upload: 'העלאה',
			versionLabel: 'SCORM:',
			entryLabel: 'נקודת כניסה:',
			uploadNew: 'העלאת חבילה חדשה',
			chooseExisting: 'בחירת חבילה קיימת',
			noPackages: 'אין חבילות זמינות עדיין',
			sidecarDetected: 'זוהה מקור קורס',
			sidecarLanguages: 'שפות:',
			sidecarModules: 'מודולים:',
			sidecarQuestions: 'שאלות במבחן:',
			sidecarIssues: 'נמצאו בעיות במקור הקורס:',
			sidecarUnreadable: 'נמצא מקור קורס, אך לא ניתן לקרוא אותו',
			sidecarUploadUnaffected: 'חבילת ה-SCORM עצמה תועלה ותפעל כרגיל.',
			importHow: 'כיצד לייבא את החבילה?',
			importAsPackage: 'הפעלת חבילת ה-SCORM כפי שנמסרה',
			importAsPackageDetail: 'מודול אחד. בדיוק מה שמערכת LMS חיצונית רואה.',
			importAsModules: 'ייבוא כמודולים הניתנים לעריכה',
			importAsModulesDetail: '{count} מודולים, כל אחד נספר בנפרד לצורך השלמת הקורס.',
			importPackageKept: 'החבילה שהועלתה נשמרת בספרייה שלך בכל מקרה.',
			importNeedsCourse: 'חבילה זו כוללת תוכן קורס הניתן לעריכה. כדי לייבא אותו כמודולים, העלו אותה מתוך קורס — העלאה לספרייה שומרת את החבילה בלבד.',
			libraryImportPackageKept: 'החבילה נשארת בספרייה שלכם בכל מקרה, וניתן להוסיף אותה גם לקורסים אחרים.',
			interactionsNotShown: 'רכיבים אינטראקטיביים בחבילה: {count}. בייבוא כמודולים הניתנים לעריכה הם נשמרים אך עדיין אינם מוצגים — הלומדים יראו במקומם את גרסת הטקסט. כדי להציגם כפי שעוצבו, הפעילו את החבילה כפי שנמסרה.',
			importedContent: 'יובאו:',
			importFailed: 'החבילה הועלתה ופועלת. לא ניתן היה לייבא את התוכן שלה.',
		},
		
		studioBlocks: {
			editContent: 'עריכת תוכן',
			blocks: 'בלוקים',
			addHeading: 'כותרת',
			addText: 'טקסט',
			addVideo: 'וידאו',
			blockHeading: 'כותרת',
			blockText: 'טקסט',
			blockVideo: 'וידאו',
			videoUrl: 'כתובת וידאו (הטמעה)',
			videoEmbedWarning: 'יש להשתמש בכתובת הטמעה (למשל youtube.com/embed/...), לא בכתובת צפייה',
			videoUrlConverted: 'הומר לכתובת הטמעה',
			videoUrlHelperText: 'הדביקו כתובת YouTube כלשהי — גם קישור שיתוף יעבוד ויומר אוטומטית. צורה סופית: https://www.youtube.com/embed/VIDEO_ID',
			caption: 'כיתוב',
			moveUp: 'הזזה למעלה',
			moveDown: 'הזזה למטה',
			deleteBlock: 'מחיקת בלוק',
			confirmDeleteBlock: 'לחצו שוב לאישור',
			incomplete: 'לא הושלם',
			missingHebrew: 'בלוקים חסרי עברית',
			missingEnglish: 'בלוקים חסרי אנגלית',
			noBlocks: 'אין בלוקי תוכן עדיין. הוסיפו כותרת, טקסט או וידאו.',
			saveBlocks: 'שמירת התוכן',
			blocksSaved: 'התוכן נשמר',
			saveFailed: 'שמירת התוכן נכשלה',
			formattingHint: 'תומך ב-**מודגש** ומעברי שורה',
			addImage: 'תמונה',
			addPdf: 'PDF',
			blockImage: 'תמונה',
			blockPdf: 'PDF',
			mediaUrl: 'כתובת הקובץ',
			openPdf: 'פתיחת ה-PDF בלשונית חדשה',
			invalidUrl: 'כתובת זו אינה מותרת. סרטונים חייבים להיות קישור youtube.com/embed; קבצים חייבים להיות בכתובת https.',
			blockNumber: 'בלוק {n}',
			invalidVideoUrl: 'יש להשתמש בקישור הטמעה של YouTube (https://www.youtube.com/embed/…)',
			invalidMediaUrl: 'הכתובת חייבת להתחיל ב־https',
			discardChangesTitle: 'לבטל את השינויים?',
			discardChangesMessage: 'השינויים שלא נשמרו בשיעור זה יאבדו.',
			discardConfirm: 'ביטול השינויים',
			unsupportedHost: 'מארח זה חוסם הטמעה, ולכן הקובץ לא יוצג בתוך הקורס. השתמשו בקישור ישיר לקובץ עצמו.',
			imageLoadFailed: 'לא ניתן היה לטעון את התמונה.',
			openInNewTab: 'פתיחה בלשונית חדשה',
			uploadFile: 'העלאת קובץ',
			uploading: 'העלאה…',
			uploadFailed: 'ההעלאה נכשלה',
			orUseUrl: 'או הדביקו קישור',
			collapseAll: 'כיווץ הכול',
			expandAll: 'הרחבת הכול',
			collapseBlock: 'כיווץ בלוק',
			expandBlock: 'הרחבת בלוק',
			emptyBlock: 'ריק',
			noFileYet: 'לא נבחר קובץ',
			dragHandle: 'גררו לשינוי הסדר',
			autosaving: 'שמירה…',
			autosaved: 'נשמר',
			needsHebrew: 'חסר טקסט בעברית',
			needsEnglish: 'חסר טקסט באנגלית',
			warnEmpty: 'ריק — הלומדים לא יראו בלוק זה',
			warnNoUrl: 'אין קובץ או קישור — הלומדים לא יראו בלוק זה',
			warnBadUrl: 'הקישור אינו מותר — הלומדים לא יראו בלוק זה',
		},
		
		media: {
			title: 'ספריית מדיה',
			images: 'תמונות',
			pdfs: 'קובצי PDF',
			empty: 'עדיין לא הועלו קבצים',
			chooseFromLibrary: 'בחירה מהספרייה',
			deleteTitle: 'למחוק את הקובץ?',
			deleteMessage: 'פעולה זו מוחקת את הקובץ לצמיתות. שיעורים שכבר משתמשים בו יפסיקו להציג אותו.',
			deleted: 'הקובץ נמחק',
			uploadedBy: 'הועלה על ידי',
			tabFiles: 'קבצים',
			tabPackages: 'חבילות SCORM',
			usedByModules: 'בשימוש במודולים',
			learnerRecords: 'רשומות לומדים',
			packageInUse: 'בשימוש — לא ניתן למחוק. הסירו אותה תחילה מכל המודולים; יש לשמר את רשומות הלומדים.',
			deletePackageTitle: 'למחוק את חבילת ה-SCORM?',
			deletePackageMessage: 'פעולה זו מוחקת לצמיתות את החבילה ואת כל קבציה. ניתן למחוק חבילות שאינן בשימוש בלבד.',
			packageDeleted: 'החבילה נמחקה',
			uploadPackage: 'העלאת חבילה',
			packagesEmpty: 'אין עדיין חבילות SCORM',
			packagesEmptyDesc: 'ניתן להעלות חבילת SCORM כאן או מתוך קורס. חבילות שהועלו כאן ניתנות לפתיחה בארגז החול ולשיוך לקורס בהמשך.',
		},
		
		roles: {
			super_admin: 'מנהל ראשי',
			hr_manager: 'משאבי אנוש',
			team_manager: 'מנהל צוות',
			instructor: 'מדריך',
			employee: 'עובד',
		},
		
		common: {
			loading: 'טעינה...',
			error: 'אירעה שגיאה',
			changeRefused: 'השינוי נדחה — ייתכן שאין לך הרשאה.',
			save: 'שמירה',
			cancel: 'ביטול',
			delete: 'מחיקה',
			remove: 'הסרה',
			edit: 'עריכה',
			create: 'יצירה',
			search: 'חיפוש',
			filter: 'סינון',
			noResults: 'לא נמצאו תוצאות',
			comingSoon: 'בקרוב',
			back: 'חזרה',
			next: 'הבא',
			previous: 'הקודם',
			submit: 'שליחה',
			close: 'סגירה',
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
			select: 'בחירה',
			export: 'ייצוא',
			download: 'הורדה',
			upload: 'העלאה',
			refresh: 'רענון',
			view: 'צפייה',
			preview: 'תצוגה מקדימה',
			publish: 'פרסום',
			unpublish: 'ביטול פרסום',
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
			tryAgain: 'ניסיון נוסף',
			saveSnapshot: 'שמירת תמונת מצב',
			exportCsv: 'ייצוא CSV',
			profileLoadError: 'לא ניתן לטעון את הפרופיל שלך',
			questionsShort: 'שאלות',
			unexpectedError: 'אירעה שגיאה בלתי צפויה. אפשר לרענן את הדף או לחזור למסך הקודם.',
			noDepartment: 'ללא מחלקה',
			breadcrumbLabel: 'נתיב ניווט',
			retry: 'ניסיון נוסף',
		},
		
		tooltips: {
			languageToggle: 'החלפת שפה',
			profileMenu: 'תפריט פרופיל',
			notifications: 'התראות',
			filterByCategory: 'סינון לפי קטגוריה',
			searchCourses: 'חיפוש קורסים',
			markComplete: 'סימון כהושלם',
			continueLearning: 'המשך למידה',
			viewDetails: 'צפייה בפרטים',
			editCourse: 'עריכת קורס',
			deleteCourse: 'מחיקת קורס',
			assignCourse: 'הקצאת קורס',
			changeDueDate: 'שינוי תאריך יעד',
			revokeEnrollment: 'ביטול הרשמה',
		},
		
		catalogue: {
			title: 'קטלוג קורסים',
			description: 'קורסים ותוכניות הכשרה זמינים',
			allCategories: 'כל הקטגוריות',
			searchPlaceholder: 'חיפוש קורסים...',
			noCourses: 'אין קורסים זמינים',
			noCoursesDescription: 'תוכן הכשרה חדש יופיע כאן בקרוב.',
			estimatedTime: 'זמן משוער',
			mandatory: 'חובה',
			enroll: 'הרשמה',
			enrolled: 'נרשמת',
			continueCourse: 'המשך',
			viewCourse: 'צפייה בקורס',
			progress: 'התקדמות',
			modules: 'מודולים',
			lessonCount: 'שיעורים',
			quizCount: 'מבחנים',
		},
		
		course: {
			overview: 'סקירה',
			modules: 'מודולים',
			progress: 'התקדמות',
			completeModule: 'השלמת המודול',
			markComplete: 'סימון כהושלם',
			startLesson: 'התחלת השיעור',
			continueLesson: 'המשך',
			completedLesson: 'הושלם',
			simulatorTurn: 'שלב',
			simulatorRestart: 'להתחיל מחדש',
			enrollToTrack: 'הירשמו כדי לשמור את ההתקדמות',
			enrollToTakeQuiz: 'הירשמו לקורס כדי לגשת למבחן',
			startQuiz: 'התחלת המבחן',
			retakeQuiz: 'ניסיון נוסף',
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
			newContentSinceCompleted: 'יחידות שנוספו מאז שהשלמתם את הקורס: {count}',
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
			questions: 'שאלות',
			questionOf: 'מתוך',
			timeRemaining: 'זמן נותר',
			selectOne: 'יש לבחור תשובה אחת',
			selectAll: 'יש לבחור את כל התשובות המתאימות',
			trueOrFalse: 'נכון או לא נכון',
			nextQuestion: 'הבא',
			previousQuestion: 'הקודם',
			submitQuiz: 'הגשת המבחן',
			confirmSubmit: 'להגיש את המבחן?',
			confirmSubmitMessage: 'לאחר ההגשה לא ניתן לשנות את התשובות.',
			results: 'תוצאות',
			youPassed: 'עברת!',
			youFailed: 'לא עברת',
			yourScoreIs: 'הציון שלך הוא',
			passingScore: 'ציון מעבר',
			attemptsRemaining: 'ניסיונות נותרים',
			noAttemptsRemaining: 'לא נותרו ניסיונות',
			reviewAnswers: 'סקירת תשובות',
			retryQuiz: 'ניסיון נוסף',
			backToCourse: 'חזרה לקורס',
			correct: 'נכון',
			incorrect: 'שגוי',
			partlyCorrect: 'נכון חלקית',
			checkEyebrow: 'בדקו את עצמכם',
			checkAnswer: 'בדיקה',
			checkTryAgain: 'נסו שוב',
			checkCorrectAnswers: 'התשובות הנכונות',
			unfinishedIntro: 'טרם הושלמו בקורס: {count}. הקורס יושלם כאשר כל חלקיו יושלמו והמבחן הזה יעבור בהצלחה. אפשר לגשת למבחן עכשיו ולהשלים את השאר אחר כך.',
			unfinishedAfterPass: 'המבחן עבר בהצלחה, אך הקורס עדיין לא הושלם. כדי להשלים אותו יש לסיים את:',
			unfinishedLessonHint: 'שיעור נחשב כמושלם לאחר לחיצה על „{mark}“ בסופו.',
			yourAnswer: 'התשובה שלך',
			correctAnswer: 'התשובה הנכונה',
			timeUp: 'הזמן נגמר!',
			timeUpMessage: 'המבחן שלך הוגש אוטומטית.',
			maxAttemptsReached: 'הגעת למקסימום ניסיונות',
			maxAttemptsMessage: 'ניצלת את כל הניסיונות הזמינים למבחן זה.',
			noQuestionsTitle: 'אין שאלות עדיין',
			noQuestionsDescription: 'למבחן זה אין עדיין שאלות. לפרטים יש לפנות לצוות ההדרכה.',
		},
		
		myLearning: {
			title: 'הלמידה שלי',
			description: 'מעקב אחר הקורסים וההתקדמות שלך',
			inProgressTab: 'בתהליך',
			completedTab: 'הושלמו',
			overdueTab: 'באיחור',
			noCourses: 'אין קורסים עדיין',
			noCoursesDescription: 'בקטלוג אפשר להירשם לקורסים.',
			noInProgress: 'אין קורסים בתהליך',
			noInProgressDescription: 'קורסים שהתחלתם יופיעו כאן.',
			noCompleted: 'אין קורסים שהושלמו',
			noCompletedDescription: 'קורסים שסיימתם יופיעו כאן.',
			noOverdue: 'אין קורסים באיחור',
			noOverdueDescription: 'כל הכבוד על ההתמדה!',
			continueWhere: 'ממשיכים מהמקום שבו עצרתם',
			lastActivity: 'פעילות אחרונה',
			completedOn: 'הושלם ב',
			dueIn: 'יעד בעוד',
			overdueBy: 'באיחור של',
			nextModule: 'המודול הבא',
		},
		
		team: {
			title: 'סקירת צוות',
			description: 'מעקב וניהול של פעילויות הלמידה בצוות',
			directReports: 'כפיפים ישירים',
			noReports: 'אין כפיפים ישירים',
			noReportsDescription: 'אין חברי צוות שמשויכים אליך.',
			enrolled: 'רשומים',
			completed: 'הושלמו',
			overdue: 'באיחור',
			viewLearning: 'צפייה בלמידה',
			assignCourse: 'הקצאת קורס',
			bulkAssign: 'הקצאה מרובה',
			selectUsers: 'בחירת חברי צוות',
			selectCourse: 'בחירת קורס',
			setDueDate: 'קביעת תאריך יעד',
			assign: 'הקצאה',
			assigning: 'הקצאה...',
			assigned: 'הוקצה',
			assignmentSuccess: 'הקורס הוקצה בהצלחה',
			assignPartial: 'נרשמו {enrolled}. ל-{skipped} כבר היה הקורס.',
			assignAllSkipped: 'לכל מי שנבחר כבר יש את הקורס הזה.',
			assignmentError: 'הקצאת הקורס נכשלה',
			editDueDate: 'עריכת תאריך יעד',
			revokeEnrollment: 'ביטול הרשמה',
			confirmRevoke: 'לבטל הרשמה?',
			confirmRevokeMessage: 'פעולה זו מסירה את ההרשמה לקורס, ולא ניתן לבטל אותה.',
			revokeSuccess: 'ההרשמה בוטלה',
			learningDetails: 'פרטי למידה',
			backToTeam: 'חזרה לצוות',
			noEnrollments: 'אין הרשמות',
		},
		
		studio: {
			title: 'סטודיו תוכן',
			description: 'יצירה וניהול של הקורסים שלך',
			myCourses: 'הקורסים שלי',
			createCourse: 'יצירת קורס',
			noCourses: 'אין קורסים עדיין',
			noCoursesDescription: 'כדי להתחיל, יש ליצור את הקורס הראשון.',
			courseDetails: 'פרטי קורס',
			titleEn: 'כותרת (אנגלית)',
			titleHe: 'כותרת (עברית)',
			descriptionEn: 'תיאור (אנגלית)',
			descriptionHe: 'תיאור (עברית)',
			category: 'קטגוריה',
			thumbnailUrl: 'תמונת הקורס',
			uploadCourseImage: 'העלאת תמונה',
			courseImageHint: 'כל תמונה מתאימה: היא מוקטנת ל־1280 פיקסלים ונשמרת כקובץ WebP דחוס. תמונות רחבות נראות הכי טוב (כ־16:9); הכרטיסים חותכים את השוליים, לכן כדאי למקם את הנושא במרכז.',
			recommendCourseImage: 'מומלץ להוסיף תמונה לקורס. קורסים עם תמונה בולטים בקטלוג ובדף הבית של הלומדים.',
			addCourseImage: 'הוספת תמונה',
			orPasteImageLink: 'או הדביקו קישור',
			estimatedMinutes: 'דקות משוערות',
			isMandatory: 'קורס חובה',
			dueDays: 'ימים להשלמה מרגע ההרשמה',
			dueDaysHelp: 'אם השדה ריק, לא ייקבע תאריך יעד אוטומטי',
			moduleManager: 'ניהול מודולים',
			addModule: 'הוספת מודול',
			addLesson: 'הוספת שיעור',
			addQuiz: 'הוספת מבחן',
			moduleTitle: 'כותרת מודול',
			moduleTitleEn: 'כותרת (אנגלית)',
			moduleTitleHe: 'כותרת (עברית)',
			reorderModules: 'גררו לסידור מחדש',
			deleteModule: 'מחיקת מודול',
			confirmDeleteModule: 'למחוק את המודול?',
			deleteModuleWarning: 'פעולה זו תמחק לצמיתות גם רשומות התקדמות של לומדים עבור מודול זה:',
			lessonContent: 'תוכן השיעור',
			addTextBlock: 'הוספת טקסט',
			addHeadingBlock: 'הוספת כותרת',
			addVideoBlock: 'הוספת וידאו',
			videoUrl: 'כתובת וידאו',
			contentEn: 'תוכן (אנגלית)',
			contentHe: 'תוכן (עברית)',
			quizSettings: 'הגדרות מבחן',
			passScore: 'ציון מעבר (%)',
			attemptsAllowed: 'ניסיונות מותרים',
			timeLimitMinutes: 'מגבלת זמן (דקות)',
			shuffleQuestions: 'ערבוב שאלות',
			questions: 'שאלות',
			addQuestion: 'הוספת שאלה',
			questionType: 'סוג שאלה',
			singleChoice: 'בחירה יחידה',
			multipleChoice: 'בחירה מרובה',
			trueFalse: 'נכון / לא נכון',
			questionTextEn: 'שאלה (אנגלית)',
			questionTextHe: 'שאלה (עברית)',
			options: 'אפשרויות',
			optionEn: 'אפשרות (אנגלית)',
			optionHe: 'אפשרות (עברית)',
			addOption: 'הוספת אפשרות',
			correctAnswer: 'תשובה נכונה',
			correctAnswers: 'תשובות נכונות',
			questionPoints: 'נקודות',
			questionDeleted: 'השאלה נמחקה',
			questionTextMissing: 'נא למלא את טקסט השאלה בשתי השפות',
			optionsMissing: 'נא למלא את כל האפשרויות בשתי השפות',
			questionSaved: 'השאלה נשמרה',
			questionAdded: 'השאלה נוספה',
			noQuestionsHint: 'אין שאלות עדיין. לחצו על „{button}“ כדי להתחיל.',
			pointsShort: 'נק׳',
			newQuestion: 'שאלה חדשה',
			newQuestionBadge: 'חדשה',
			confirmDeleteQuestion: 'למחוק את השאלה?',
			questionPlaceholder: 'השאלה בעברית...',
			enrolledLearners: '{count} לומדים רשומים',
			timeLimitHelp: 'אם השדה ריק, למבחן לא תהיה מגבלת זמן',
			saveDraft: 'שמירת טיוטה',
			publishCourse: 'פרסום הקורס',
			unpublishCourse: 'ביטול פרסום',
			previewAsLearner: 'תצוגה מקדימה ללומדים',
			confirmPublish: 'לפרסם את הקורס?',
			confirmPublishMessage: 'קורס זה יהפוך לזמין ללומדים. ניתן לבטל את הפרסום מאוחר יותר אם יש צורך.',
			publishSuccess: 'הקורס פורסם בהצלחה',
			courseSaved: 'הקורס נשמר',
			editCourse: 'עריכת קורס',
			backToStudio: 'חזרה לסטודיו',
			dangerZone: 'אזור סכנה',
			archiveCourse: 'העברה לארכיון',
			archiveCourseDescription: 'העברה לארכיון מסירה את הקורס מהקטלוג אך שומרת על כל התקדמות הלומדים.',
			confirmArchive: 'להעביר את הקורס לארכיון?',
			courseArchived: 'הקורס הועבר לארכיון',
			deleteCourseDescription: 'מחיקה לצמיתות של הקורס ושל כל המודולים שלו.',
			confirmDeleteCourse: 'למחוק קורס?',
			deleteWarningWithEnrollments: 'פעולה זו תמחק לצמיתות את כל התקדמות הלמידה, ניסיונות המבחן והציונים של הלומדים הרשומים ({count}). לא ניתן לבטל פעולה זו.',
			typeTitleToConfirm: 'לאישור, יש להקליד את שם הקורס:',
			deleteBlockedNotAdmin: 'לקורס זה יש לומדים רשומים. רק מנהלים ראשיים יכולים למחוק קורסים עם הרשמות פעילות.',
			courseDeleted: 'הקורס נמחק',
			deleteFailed: 'מחיקת הקורס נכשלה',
			editModuleTitle: 'עריכת כותרת המודול',
			moduleTitleSaved: 'כותרת המודול נשמרה',
			scopeMine: 'שלי',
			scopeAll: 'כל הקורסים',
			owner: 'בעלים',
			unknownOwner: 'לא ידוע',
			readyToPublish: 'מוכן לפרסום',
			blockersCount: 'יש לתקן לפני הפרסום:',
			blockerFix: 'תיקון',
			blockerCheckFailed: 'לא ניתן היה לבדוק את הקורס — נסו שוב',
			blockerNoModules: 'לקורס אין מודולים',
			blockerModuleTitle: 'חסר תרגום לכותרת המודול',
			blockerNoBlocks: 'לשיעור אין בלוקי תוכן',
			blockerNoQuestions: 'למבחן אין שאלות',
			blockerQuestionText: 'חסר תרגום לשאלה',
			blockerFewOptions: 'לשאלה נדרשות לפחות שתי אפשרויות',
			blockerOptionText: 'לאחת מאפשרויות התשובה חסר תרגום',
			blockerNoCorrect: 'לשאלה אין תשובה נכונה תקפה',
			previewBanner: 'תצוגה מקדימה — כך הקורס נראה ללומדים. שום דבר אינו נשמר.',
			previewBackToEdit: 'חזרה לעריכה',
			previewNoProgress: 'מושבת בתצוגה מקדימה',
			previewDesktop: 'מחשב',
			previewMobile: 'נייד',
			scormCannotPlayHere: 'לא ניתן להפעיל כאן חבילת SCORM',
			scormCannotPlayHereBody: 'חבילות SCORM פועלות רק מתוך "הלמידה שלי", שם קיימת הרשמה שמתעדת התקדמות וציון. התצוגה המקדימה לא תפתח את הנגן, כך שלא יירשם מידע בטעות.',
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
			assignEnrollments: 'הקצאת הרשמות',
			selectUsersOrDept: 'בחירת משתמשים או מחלקה',
			filterByDepartment: 'סינון לפי מחלקה',
			allDepartments: 'כל המחלקות',
			entireDepartment: 'כל המחלקה',
			selectedUsers: 'משתמשים נבחרים',
			completionSummary: 'סיכום השלמות',
			completionSummaryDesc: 'שיעורי הרשמה והשלמה לפי קורס',
			complianceReport: 'דוח ציות',
			complianceReportDesc: 'השלמת קורסי חובה לפי מחלקה',
			courseEngagement: 'מעורבות בקורסים',
			courseEngagementDesc: 'ציונים, זמן שהושקע ומדדי ניסיונות',
			generateReport: 'הפקת דוח',
			generating: 'הפקה...',
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
			selectManager: 'בחירת מנהל',
			noManager: 'ללא מנהל',
			isActive: 'פעיל',
			userUpdated: 'המשתמש עודכן בהצלחה',
			categoryManagement: 'ניהול קטגוריות',
			addCategory: 'הוספת קטגוריה',
			editCategory: 'עריכת קטגוריה',
			categoryNameEn: 'שם (אנגלית)',
			categoryNameHe: 'שם (עברית)',
			sortOrder: 'סדר מיון',
			deleteCategory: 'למחוק קטגוריה?',
			confirmDeleteCategory: 'למחוק את הקטגוריה הזו?',
			categorySaved: 'הקטגוריה נשמרה',
			categoryDeleted: 'הקטגוריה נמחקה',
			auditLogTitle: 'יומן ביקורת',
			filterByAction: 'סינון לפי פעולה',
			filterByEntity: 'סינון לפי ישות',
			filterByDate: 'סינון לפי תאריך',
			allActions: 'כל הפעולות',
			allEntities: 'כל הישויות',
			actor: 'משתמש',
			action: 'פעולה',
			entity: 'ישות',
			auditActions: {
				course_deleted: 'קורס נמחק',
				course_published: 'קורס פורסם',
				enrollment_assigned: 'קורס הוקצה',
				enrollments_completed_by_module_delete: 'הרשמות הושלמו לאחר מחיקת מודול',
				manager_changed: 'המנהל שונה',
				role_changed: 'התפקיד שונה',
				user_registered: 'הרשמה חדשה',
				report_generated: 'דוח הופק',
			},
			auditEntities: {
				courses: 'קורס',
				enrollments: 'הרשמה',
				modules: 'מודול',
				profiles: 'משתמש',
				report_snapshots: 'דוח',
			},
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
			uploadLogo: 'העלאת לוגו',
			uploadingLogo: 'העלאה…',
			defaultLocale: 'שפת ברירת מחדל',
			settingsSaved: 'ההגדרות נשמרו',
			newRegistrations: 'הרשמות חדשות השבוע',
			newRegistrationsCta: 'סקירת משתמשים חדשים',
			newBadge: 'חדש',
		},
		
		breadcrumbs: {
			home: 'בית',
		},
		
		errors: {
			connectionTimeout: 'הזמן הקצוב לחיבור עבר',
			sessionExpired: 'החיבור שלך פג. יש להתחבר מחדש.',
			failedToLoad: 'טעינת הנתונים נכשלה',
			retry: 'ניסיון נוסף',
			noAccess: 'אין לך גישה לתוכן זה',
			network: 'אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב.',
			notFound: 'הפריט לא קיים, או שאין לך גישה אליו.',
			invalidCredentials: 'האימייל או הסיסמה שגויים.',
			emailNotConfirmed: 'יש לאשר קודם את כתובת האימייל — הקישור נמצא בתיבת הדואר שלכם.',
			alreadyRegistered: 'כבר קיים חשבון עם האימייל הזה. נסו להתחבר.',
			tooManyAttempts: 'יותר מדי ניסיונות. המתינו דקה ונסו שוב.',
			samePassword: 'הסיסמה החדשה חייבת להיות שונה מהנוכחית.',
		},
		
		landing: {
			heroTitle: 'למידה ארגונית שמדברת בשתי השפות שלכם',
			heroSub: 'אקדמיית ניאון היא מערכת ניהול למידה מודרנית לצוותים שלומדים בעברית ובאנגלית - קורסים, בחנים, תוכן SCORM, שיבוצי הדרכה אישיים וצוותיים, דוחות התקדמות, הכול בפלטפורמה אחת נקייה ומהירה.',
			trust1: 'דו-לשונית עברית·אנגלית עם RTL אמיתי',
			trust2: 'SCORM 1.2 ו-2004',
			trust3: 'נבנתה על Sticklight',
			talkToUs: 'דברו איתנו',
			showcaseCaption: 'קטלוג אחד, כל שפה, כל מכשיר. העובדים מעיינים, נרשמים בעצמם וממשיכים בדיוק מהנקודה שבה עצרו.',
			feature1Title: 'דו-לשוניות מהיסוד, לא כתוספת.',
			feature1Body: 'כל מסך, קורס ודוח קיימים בעברית ובאנגלית - עם שיקוף מלא מימין לשמאל, לא תרגום מתוח. לחיצה אחת מחליפה את כל החוויה, והעובדים לומדים בשפה שבה הם חושבים.',
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
			vc4elSite: 'vibe-coding4elearning.com',
			enlargeImage: 'הגדלת תמונה',
			toggleZoom: 'מיקוד תצוגה',
			lightboxHint: 'כדי לחזור לדף, הקישו Esc או לחצו מחוץ לתמונה.',
			altCatalogue: 'קטלוג קורסים',
			altMyLearning: 'מסך הלמידה שלי',
			altScormPlayer: 'נגן SCORM',
			altHrAnalytics: 'לוח בקרה HR',
			altStudio: 'סטודיו יצירת תוכן',
			altAssignCourse: 'שיבוץ קורס לצוות',
			backToOverview: 'חזרה לעמוד הראשי',
			trySandbox: 'התנסו בארגז החול של SCORM',
		},
	},
};

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}
