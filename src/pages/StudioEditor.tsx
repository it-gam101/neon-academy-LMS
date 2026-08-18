import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ArrowRight, Save, Eye, Send, Plus, Trash2, BookOpen, FileQuestion, Settings, Package, Archive, AlertTriangle, Pencil, ChevronUp, ChevronDown, Edit, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/Toast';
import type { Tables } from '@/integrations/supabase/helpers';
import { useProfile } from '@/hooks/useProfile';
import { QuizQuestionEditor } from '@/components/studio/QuizQuestionEditor';
import { ScormUploadModal } from '@/components/studio/ScormUploadModal';
import { LessonBlockEditor } from '@/components/studio/LessonBlockEditor';
import { courseProblems, type CourseProblem, type ProblemCode } from '@/lib/completeness';

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Category = Tables<'course_categories'>;
type Quiz = Tables<'quizzes'>;

export default function StudioEditor() {
  const { courseId } = useParams<{courseId: string;}>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const BackArrow = locale === 'he' ? ArrowRight : ArrowLeft;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishBlockers, setPublishBlockers] = useState<CourseProblem[] | null>(null);
  const [publishCheckFailed, setPublishCheckFailed] = useState(false);
  const [checkingPublish, setCheckingPublish] = useState(false);
  const [focusBlockId, setFocusBlockId] = useState<string | undefined>(undefined);

  // SCORM upload state
  const [showScormUploadModal, setShowScormUploadModal] = useState(false);
  const [showScormChooser, setShowScormChooser] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<Array<{id: string;title: string;scorm_version: string;created_at: string;}>>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [addingFromLibrary, setAddingFromLibrary] = useState(false);

  // Profile for permission checks
  const { profile } = useProfile();

  // Danger zone state
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [moduleDeleteWarningCount, setModuleDeleteWarningCount] = useState<number | null>(null);

  // Quiz settings state
  const [showQuizSettingsModal, setShowQuizSettingsModal] = useState(false);
  const [editingQuizModuleId, setEditingQuizModuleId] = useState<string | null>(null);
  const [quizSettings, setQuizSettings] = useState<Quiz | null>(null);
  const [savingQuizSettings, setSavingQuizSettings] = useState(false);
  const [quizQuestionCounts, setQuizQuestionCounts] = useState<Record<string, number>>({});

  // Lesson editor dirty tracking
  const [lessonEditorDirty, setLessonEditorDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Lesson content state
  const [showLessonEditorModal, setShowLessonEditorModal] = useState(false);
  const [editingLessonModuleId, setEditingLessonModuleId] = useState<string | null>(null);
  const [lessonBlockCounts, setLessonBlockCounts] = useState<Record<string, number>>({});
  const [reordering, setReordering] = useState(false);

  // Module title editing state
  const [showModuleTitleModal, setShowModuleTitleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitleEn, setModuleTitleEn] = useState('');
  const [moduleTitleHe, setModuleTitleHe] = useState('');
  const [savingModuleTitle, setSavingModuleTitle] = useState(false);

  // Stable callback for question count updates
  const handleQuestionCountChange = useCallback((count: number) => {
    if (editingQuizModuleId) {
      setQuizQuestionCounts((prev) => ({ ...prev, [editingQuizModuleId]: count }));
    }
  }, [editingQuizModuleId]);

  // Stable callback for lesson block count updates
  const handleBlockCountChange = useCallback((count: number) => {
    if (editingLessonModuleId) {
      setLessonBlockCounts((prev) => ({ ...prev, [editingLessonModuleId]: count }));
    }
  }, [editingLessonModuleId]);

  // Form state
  const [titleEn, setTitleEn] = useState('');
  const [titleHe, setTitleHe] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionHe, setDescriptionHe] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [dueDays, setDueDays] = useState('');

  useEffect(() => {
    if (!supabase || !courseId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch course
      const { data: courseData } = await supabase.
      from('courses').
      select('*').
      eq('id', courseId).
      single();

      if (courseData) {
        setCourse(courseData);
        setTitleEn(courseData.title_en);
        setTitleHe(courseData.title_he);
        setDescriptionEn(courseData.description_en || '');
        setDescriptionHe(courseData.description_he || '');
        setCategoryId(courseData.category_id || '');
        setThumbnailUrl(courseData.thumbnail_url || '');
        setEstimatedMinutes(courseData.estimated_minutes?.toString() || '');
        setIsMandatory(courseData.is_mandatory);
        setDueDays(courseData.due_days?.toString() || '');
      }

      // Fetch modules
      const { data: modulesData } = await supabase.
      from('modules').
      select('*').
      eq('course_id', courseId).
      order('sort_order');

      if (modulesData) setModules(modulesData);

      // Fetch categories
      const { data: categoriesData } = await supabase.
      from('course_categories').
      select('*').
      order('sort_order');

      if (categoriesData) setCategories(categoriesData);

      setLoading(false);
    };

    fetchData();
  }, [courseId]);

  // Fetch enrollment count for danger zone
  useEffect(() => {
    if (!supabase || !courseId) return;

    const fetchEnrollmentCount = async () => {
      const { count, error } = await supabase.
      from('enrollments').
      select('id', { count: 'exact', head: true }).
      eq('course_id', courseId);

      if (!error && count !== null) {
        setEnrollmentCount(count);
      }
    };

    fetchEnrollmentCount();
  }, [courseId]);

  const handleSave = async () => {
    if (!supabase || !courseId) return;
    setSaving(true);

    const { error } = await supabase.
    from('courses').
    update({
      title_en: titleEn,
      title_he: titleHe,
      description_en: descriptionEn || null,
      description_he: descriptionHe || null,
      category_id: categoryId || null,
      thumbnail_url: thumbnailUrl || null,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      is_mandatory: isMandatory,
      due_days: dueDays ? parseInt(dueDays) : null,
      updated_at: new Date().toISOString()
    }).
    eq('id', courseId);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', dict.studio.courseSaved);
    }
    setSaving(false);
  };

  // Opens the publish modal and computes blockers
  const handleOpenPublishModal = async () => {
    if (!supabase) return;
    setShowPublishModal(true);
    setCheckingPublish(true);
    setPublishBlockers(null);
    setPublishCheckFailed(false);

    try {
      // Fetch quiz data only for quiz modules
      const quizModuleIds = modules.filter((m) => m.module_type === 'quiz').map((m) => m.id);
      let quizzes: Array<{module_id: string;quiz_questions: unknown[];}> = [];

      if (quizModuleIds.length > 0) {
        const { data, error } = await supabase.
        from('quizzes').
        select('id, module_id, quiz_questions(*)').
        in('module_id', quizModuleIds);

        if (error) {
          console.error('Failed to fetch quiz data:', error);
          setPublishCheckFailed(true);
          setCheckingPublish(false);
          return;
        }
        quizzes = (data ?? []).map((q) => ({
          module_id: q.module_id,
          quiz_questions: q.quiz_questions ?? []
        }));
      }

      // Compute blockers
      const blockers = courseProblems({
        modules: modules.map((m) => ({
          id: m.id,
          title_en: m.title_en,
          title_he: m.title_he,
          module_type: m.module_type,
          content_json: m.content_json
        })),
        quizzes,
        locale
      });

      setPublishBlockers(blockers);
    } catch (err) {
      console.error('Publish check failed:', err);
      setPublishCheckFailed(true);
    }
    setCheckingPublish(false);
  };

  // Returns the user-facing label for a problem code
  const getBlockerLabel = (code: ProblemCode): string => {
    switch (code) {
      case 'no_modules':return dict.studio.blockerNoModules;
      case 'module_title_translation':return dict.studio.blockerModuleTitle;
      case 'no_blocks':return dict.studio.blockerNoBlocks;
      case 'no_questions':return dict.studio.blockerNoQuestions;
      case 'question_translation':return dict.studio.blockerQuestionText;
      case 'too_few_options':return dict.studio.blockerFewOptions;
      case 'option_translation':return dict.studio.blockerOptionText;
      case 'no_correct':return dict.studio.blockerNoCorrect;
      // Block-level codes — reuse studioBlocks keys
      case 'missing_translation_he':return dict.studioBlocks.needsHebrew;
      case 'missing_translation_en':return dict.studioBlocks.needsEnglish;
      case 'empty_block':return dict.studioBlocks.warnEmpty;
      case 'missing_url':return dict.studioBlocks.warnNoUrl;
      case 'bad_url':return dict.studioBlocks.warnBadUrl;
    }
  };

  // Navigate to a blocker's source
  const handleFixBlocker = (blocker: CourseProblem) => {
    setShowPublishModal(false);

    if (blocker.blockId) {
      // Block-level: open lesson editor with focus
      setFocusBlockId(blocker.blockId);
      setEditingLessonModuleId(blocker.moduleId);
      setShowLessonEditorModal(true);
    } else if (blocker.questionIndex !== undefined) {
      // Quiz-level: open quiz editor
      handleOpenQuizSettings(blocker.moduleId);
    } else if (blocker.moduleId) {
      // Module-level: open module title editor
      const mod = modules.find((m) => m.id === blocker.moduleId);
      if (mod) {
        if (blocker.code === 'no_blocks') {
          handleOpenLessonEditor(blocker.moduleId);
        } else if (blocker.code === 'no_questions') {
          handleOpenQuizSettings(blocker.moduleId);
        } else {
          handleOpenModuleTitleEdit(mod);
        }
      }
    }
  };

  const handlePublish = async () => {
    if (!supabase || !courseId) return;

    // Fix: add .select() and check for empty result (RLS-blocked update)
    const { data, error } = await supabase.
    from('courses').
    update({ status: 'published', updated_at: new Date().toISOString() }).
    eq('id', courseId).
    select();

    if (error) {
      console.error('Publish error:', error);
      showToast('error', (error as {message?: string;})?.message || dict.common.error);
    } else if (!data || data.length === 0) {
      // RLS-blocked update returns success with zero rows
      showToast('error', dict.studio.deleteFailed);
    } else {
      showToast('success', dict.studio.publishSuccess);
      setCourse((prev) => prev ? { ...prev, status: 'published' } : null);
    }
    setShowPublishModal(false);
  };

  const handleAddModule = async (type: 'lesson' | 'quiz') => {
    if (!supabase || !courseId) return;

    const sortOrder = modules.length + 1;
    const { data, error } = await supabase.
    from('modules').
    insert({
      course_id: courseId,
      title_en: type === 'quiz' ? 'New Quiz' : 'New Lesson',
      title_he: type === 'quiz' ? 'מבחן חדש' : 'שיעור חדש',
      module_type: type,
      sort_order: sortOrder,
      content_json: type === 'lesson' ? { blocks: [] } : null
    }).
    select().
    single();

    if (error) {
      showToast('error', error.message);
    } else if (data) {
      setModules((prev) => [...prev, data]);

      // Create quiz record if it's a quiz module
      if (type === 'quiz') {
        await supabase.from('quizzes').insert({
          module_id: data.id,
          pass_score: 70,
          attempts_allowed: 3
        });
      }
    }
  };

  const handleOpenModuleDeleteConfirm = async (moduleId: string) => {
    if (!supabase) {
      setDeletingModuleId(moduleId);
      return;
    }

    // Fetch learner progress counts for this module
    let totalCount = 0;
    let hadError = false;

    const { count: progressCount, error: progressError } = await supabase.
    from('module_progress').
    select('id', { count: 'exact', head: true }).
    eq('module_id', moduleId);

    if (progressError) {
      console.error('Failed to count module_progress:', progressError);
      hadError = true;
    } else {
      totalCount += progressCount ?? 0;
    }

    const { count: regCount, error: regError } = await supabase.
    from('scorm_registrations').
    select('id', { count: 'exact', head: true }).
    eq('module_id', moduleId);

    if (regError) {
      console.error('Failed to count scorm_registrations:', regError);
      hadError = true;
    } else {
      totalCount += regCount ?? 0;
    }

    // If had error, show warning but don't imply zero
    if (hadError) {
      setModuleDeleteWarningCount(-1); // -1 indicates "show warning, unknown count"
    } else if (totalCount > 0) {
      setModuleDeleteWarningCount(totalCount);
    } else {
      setModuleDeleteWarningCount(null);
    }

    setDeletingModuleId(moduleId);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!supabase) return;

    const { error } = await supabase.
    from('modules').
    delete().
    eq('id', moduleId);

    if (error) {
      showToast('error', error.message);
    } else {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
    setDeletingModuleId(null);
    setModuleDeleteWarningCount(null);
  };

  const handleOpenScormChooser = async () => {
    if (!supabase) return;
    setLoadingPackages(true);
    setShowScormChooser(true);

    const { data, error } = await supabase.
    from('scorm_packages').
    select('id, title, scorm_version, created_at').
    eq('is_public_sandbox', false).
    order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load packages:', error);
      setAvailablePackages([]);
    } else {
      setAvailablePackages(data ?? []);
    }
    setLoadingPackages(false);
  };

  const handleSelectExistingPackage = async (pkg: {id: string;title: string;}) => {
    if (!supabase || !courseId) return;
    setAddingFromLibrary(true);

    const sortOrder = modules.length + 1;
    const { data, error } = await supabase.
    from('modules').
    insert({
      course_id: courseId,
      title_en: pkg.title,
      title_he: pkg.title,
      module_type: 'scorm_package',
      scorm_package_id: pkg.id,
      sort_order: sortOrder
    }).
    select().
    single();

    if (error) {
      console.error('Failed to add SCORM module:', error);
      showToast('error', error?.message || dict.common.error);
    } else if (!data) {
      // RLS blocked - insert returned no rows
      showToast('error', dict.common.error);
    } else {
      setModules((prev) => [...prev, data]);
      setShowScormChooser(false);
      showToast('success', dict.studioUpload.success);
    }
    setAddingFromLibrary(false);
  };

  const handleOpenQuizSettings = async (moduleId: string) => {
    if (!supabase) return;

    // Fetch quiz settings for this module
    const { data, error } = await supabase.
    from('quizzes').
    select('*').
    eq('module_id', moduleId).
    single();

    if (error || !data) {
      showToast('error', error?.message || 'Quiz not found');
      return;
    }

    setQuizSettings(data);
    setEditingQuizModuleId(moduleId);
    setShowQuizSettingsModal(true);
  };

  const handleSaveQuizSettings = async () => {
    if (!supabase || !quizSettings) return;
    setSavingQuizSettings(true);

    const { error } = await supabase.
    from('quizzes').
    update({
      pass_score: quizSettings.pass_score,
      attempts_allowed: quizSettings.attempts_allowed,
      time_limit_minutes: quizSettings.time_limit_minutes,
      shuffle_questions: quizSettings.shuffle_questions
    }).
    eq('id', quizSettings.id);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', dict.studio.courseSaved);
      setShowQuizSettingsModal(false);
    }
    setSavingQuizSettings(false);
  };

  const handleOpenLessonEditor = (moduleId: string) => {
    setEditingLessonModuleId(moduleId);
    setShowLessonEditorModal(true);
  };

  const handleOpenModuleTitleEdit = (mod: Module) => {
    setEditingModule(mod);
    setModuleTitleEn(mod.title_en);
    setModuleTitleHe(mod.title_he);
    setShowModuleTitleModal(true);
  };

  const handleSaveModuleTitle = async () => {
    if (!supabase || !editingModule) return;
    const trimmedEn = moduleTitleEn.trim();
    const trimmedHe = moduleTitleHe.trim();
    if (!trimmedEn || !trimmedHe) return;

    setSavingModuleTitle(true);

    const { data, error } = await supabase.
    from('modules').
    update({ title_en: trimmedEn, title_he: trimmedHe }).
    eq('id', editingModule.id).
    select();

    if (error) {
      const msg = (error as {message?: string;})?.message || JSON.stringify(error);
      console.error('Module title save error:', error);
      showToast('error', msg);
    } else if (!data || data.length === 0) {
      showToast('error', dict.studio.deleteFailed);
    } else {
      // Update local module list
      setModules((prev) =>
      prev.map((m) =>
      m.id === editingModule.id ? { ...m, title_en: trimmedEn, title_he: trimmedHe } : m
      )
      );
      showToast('success', dict.studio.moduleTitleSaved);
      setShowModuleTitleModal(false);
    }

    setSavingModuleTitle(false);
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    if (!supabase || !courseId) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    setReordering(true);

    const currentModule = modules[index];
    const targetModule = modules[newIndex];
    const currentOrder = currentModule.sort_order;
    const targetOrder = targetModule.sort_order;

    // Swap sort_orders
    const [result1, result2] = await Promise.all([
    supabase.from('modules').update({ sort_order: targetOrder }).eq('id', currentModule.id).select(),
    supabase.from('modules').update({ sort_order: currentOrder }).eq('id', targetModule.id).select()]
    );

    const error1 = result1.error;
    const error2 = result2.error;
    const data1 = result1.data;
    const data2 = result2.data;

    if (error1 || error2) {
      const msg = (error1 as {message?: string;})?.message || (error2 as {message?: string;})?.message || 'Reorder failed';
      console.error('Reorder error:', error1 || error2);
      showToast('error', msg);
    } else if (!data1 || data1.length === 0 || !data2 || data2.length === 0) {
      showToast('error', dict.studio.deleteFailed);
    } else {
      // Update local state
      setModules((prev) => {
        const newModules = [...prev];
        newModules[index] = { ...currentModule, sort_order: targetOrder };
        newModules[newIndex] = { ...targetModule, sort_order: currentOrder };
        return newModules.sort((a, b) => a.sort_order - b.sort_order);
      });
    }

    setReordering(false);
  };

  // Danger zone handlers
  const canManage = profile && course && (
  profile.role === 'super_admin' ||
  profile.role === 'hr_manager' ||
  course.created_by === profile.id);


  const handleArchive = async () => {
    if (!supabase || !courseId) return;
    setArchiving(true);

    const { data, error } = await supabase.
    from('courses').
    update({ status: 'archived', updated_at: new Date().toISOString() }).
    eq('id', courseId).
    select();

    if (error) {
      const msg = (error as {message?: string;})?.message || JSON.stringify(error);
      console.error('Archive error:', error);
      showToast('error', msg);
    } else if (!data || data.length === 0) {
      showToast('error', dict.studio.deleteFailed);
    } else {
      setCourse((prev) => prev ? { ...prev, status: 'archived' } : null);
      showToast('success', dict.studio.courseArchived);
    }
    setArchiving(false);
  };

  const handleDelete = async () => {
    if (!supabase || !courseId) return;
    setDeleting(true);

    const { data, error } = await supabase.
    from('courses').
    delete().
    eq('id', courseId).
    select();

    if (error) {
      const msg = (error as {message?: string;})?.message || JSON.stringify(error);
      console.error('Delete error:', error);
      showToast('error', msg);
      setDeleting(false);
    } else if (!data || data.length === 0) {
      showToast('error', dict.studio.deleteFailed);
      setDeleting(false);
    } else {
      showToast('success', dict.studio.courseDeleted);
      navigate('/studio');
    }
  };

  if (loading) {
    return (
      <div data-ev-id="ev_e27f4af65d" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<LoadingSkeleton variant="text" count={10} />
			</div>);

  }

  if (!course) {
    return (
      <div data-ev-id="ev_d702f214f4" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton to="/studio" label={dict.studio.backToStudio} />
        <ErrorState error={dict.common.notFound} />
      </div>);

  }

  const courseTitle = locale === 'he' ? course.title_he : course.title_en;

  return (
    <div data-ev-id="ev_76d7ff4176" className="min-h-screen bg-background">
      <div data-ev-id="ev_51ab3d06b9" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
          { label: dict.nav.studio, href: '/studio' },
          { label: courseTitle }]
          } />

        
        {/* Header */}
        <div data-ev-id="ev_a3727ad637" className="flex items-center justify-between mb-6">
          <BackButton to="/studio" label={dict.studio.backToStudio} />
					<div data-ev-id="ev_a96bc3a7b1" className="flex items-center gap-2">
						<Badge variant={course.status === 'published' ? 'success' : 'default'}>
							{course.status === 'published' ? dict.common.published : dict.common.draft}
						</Badge>
					</div>
				</div>

				{/* Course Details */}
				<div data-ev-id="ev_cbc7a81d45" className="bg-card border border-border rounded-lg p-6 mb-8">
					<h2 data-ev-id="ev_1c261f0cea" className="text-lg font-semibold text-foreground mb-4">{dict.studio.courseDetails}</h2>

					<div data-ev-id="ev_25a9e65661" className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div data-ev-id="ev_9bf93768b1">
							<label data-ev-id="ev_0e3d102753" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.titleEn}
							</label>
							<input data-ev-id="ev_de1eb42acb"
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr" />

						</div>

						<div data-ev-id="ev_f5a045023c">
							<label data-ev-id="ev_43225994d2" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.titleHe}
							</label>
							<input data-ev-id="ev_e1e27fb80b"
              type="text"
              value={titleHe}
              onChange={(e) => setTitleHe(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="rtl" />

						</div>

						<div data-ev-id="ev_205ec11220">
							<label data-ev-id="ev_af54cca024" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.descriptionEn}
							</label>
							<textarea data-ev-id="ev_0a4f83ceeb"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              dir="ltr" />

						</div>

						<div data-ev-id="ev_a06e1280ba">
							<label data-ev-id="ev_48dc3882ac" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.descriptionHe}
							</label>
							<textarea data-ev-id="ev_8eb97ab3f0"
              value={descriptionHe}
              onChange={(e) => setDescriptionHe(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              dir="rtl" />

						</div>

						<div data-ev-id="ev_caff4fb80c">
							<label data-ev-id="ev_88578b8ec0" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.category}
							</label>
							<select data-ev-id="ev_62f75b5e35"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">

								<option data-ev-id="ev_d671c909d6" value="">{dict.common.select}...</option>
								{categories.map((cat) =>
                <option data-ev-id="ev_b55ab3a53b" key={cat.id} value={cat.id}>
										{locale === 'he' ? cat.name_he : cat.name_en}
									</option>
                )}
							</select>
						</div>

						<div data-ev-id="ev_d2cadef5ea">
							<label data-ev-id="ev_f3b7f4bb61" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.thumbnailUrl}
							</label>
							<input data-ev-id="ev_d8340bac7c"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr" />

						</div>

						<div data-ev-id="ev_53f3cee8df">
							<label data-ev-id="ev_0c5e22b6c2" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.estimatedMinutes}
							</label>
							<input data-ev-id="ev_48494b6cda"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr" />

						</div>

						<div data-ev-id="ev_c903d49d1c">
							<label data-ev-id="ev_9cb276a779" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.dueDays}
							</label>
							<input data-ev-id="ev_550ffd6fa4"
              type="number"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
              placeholder={dict.studio.dueDaysHelp} />

						</div>

						<div data-ev-id="ev_de40a34189" className="flex items-center gap-2">
							<input data-ev-id="ev_e0a4de18b6"
              type="checkbox"
              id="isMandatory"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />

							<label data-ev-id="ev_f405750f7e" htmlFor="isMandatory" className="text-sm font-medium text-foreground">
								{dict.studio.isMandatory}
							</label>
						</div>
					</div>
				</div>

				{/* Modules */}
				<div data-ev-id="ev_95963cace7" className="bg-card border border-border rounded-lg p-6 mb-8">
					<div data-ev-id="ev_239993b0b4" className="flex items-center justify-between mb-4">
						<h2 data-ev-id="ev_e230417b1d" className="text-lg font-semibold text-foreground">{dict.studio.moduleManager}</h2>
						<div data-ev-id="ev_e29c860240" className="flex items-center gap-2">
							<button data-ev-id="ev_3d7cf3be7a"
              onClick={() => handleAddModule('lesson')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

								<BookOpen className="w-4 h-4" />
								{dict.studio.addLesson}
							</button>
							<button data-ev-id="ev_5a93129782"
              onClick={() => handleAddModule('quiz')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

								<FileQuestion className="w-4 h-4" />
								{dict.studio.addQuiz}
							</button>
							<button data-ev-id="ev_add_scorm_btn"
              onClick={handleOpenScormChooser}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

								<Package className="w-4 h-4" />
								{dict.studioUpload.addScorm}
							</button>
						</div>
					</div>

					{modules.length === 0 ?
          <p data-ev-id="ev_0c64ff2cae" className="text-center text-muted-foreground py-8">
							{dict.common.noResults}
						</p> :

          <div data-ev-id="ev_9877fe3599" className="space-y-2">
							{modules.map((mod, index) =>
            <div data-ev-id="ev_75a7e82da9"
            key={mod.id}
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">

									{/* Reorder buttons */}
									<div data-ev-id="ev_073cad7fe4" className="flex flex-col">
										<button data-ev-id="ev_be56e8ddc6"
                onClick={() => handleMoveModule(index, 'up')}
                disabled={index === 0 || reordering}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={dict.studioBlocks.moveUp}>

											<ChevronUp className="w-4 h-4" />
										</button>
										<button data-ev-id="ev_81a2065527"
                onClick={() => handleMoveModule(index, 'down')}
                disabled={index === modules.length - 1 || reordering}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={dict.studioBlocks.moveDown}>

											<ChevronDown className="w-4 h-4" />
										</button>
									</div>
									<div data-ev-id="ev_8dca9d6384" className="w-8 h-8 rounded bg-muted flex items-center justify-center">
										{mod.module_type === 'quiz' ?
                <FileQuestion className="w-4 h-4 text-muted-foreground" /> :
                mod.module_type === 'scorm_package' ?
                <Package className="w-4 h-4 text-muted-foreground" /> :

                <BookOpen className="w-4 h-4 text-muted-foreground" />
                }
									</div>
									<div data-ev-id="ev_0fd824dbbd" className="flex-1">
										<span data-ev-id="ev_7bc8188839" className="text-sm text-muted-foreground">
											{mod.module_type === 'quiz' ?
                  `${dict.course.quiz} ${index + 1}${quizQuestionCounts[mod.id] ? ` (${quizQuestionCounts[mod.id]} ${locale === 'he' ? 'שאלות' : 'Q'})` : ''}` :
                  mod.module_type === 'scorm_package' ?
                  `SCORM ${index + 1}` :
                  `${dict.course.lesson} ${index + 1}${lessonBlockCounts[mod.id] ? ` (${lessonBlockCounts[mod.id]} ${dict.studioBlocks.blocks})` : ''}`}
										</span>
										<p data-ev-id="ev_d6adc26529" className="font-medium text-foreground">
											{locale === 'he' ? mod.title_he : mod.title_en}
										</p>
									</div>
									{mod.module_type === 'quiz' &&
              <button data-ev-id="ev_quiz_settings_btn"
              onClick={() => handleOpenQuizSettings(mod.id)}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
              title={dict.studio.quizSettings}>
                <Settings className="w-4 h-4" />
              </button>
              }
									{mod.module_type === 'lesson' &&
              <button data-ev-id="ev_lesson_edit_btn"
              onClick={() => handleOpenLessonEditor(mod.id)}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
              title={dict.studioBlocks.editContent}>
                <Pencil className="w-4 h-4" />
              </button>
              }
									<button data-ev-id="ev_7f1e5297ce"
              onClick={() => handleOpenModuleTitleEdit(mod)}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
              title={dict.studio.editModuleTitle}>
                <Edit className="w-4 h-4" />
              </button>
									<button data-ev-id="ev_e2850d52d2"
              onClick={() => handleOpenModuleDeleteConfirm(mod.id)}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title={dict.studio.deleteModule}>

										<Trash2 className="w-4 h-4" />
									</button>
								</div>
            )}
						</div>
          }
				</div>

				{/* Actions */}
				<div data-ev-id="ev_a8097d2908" className="flex items-center justify-between">
					<Link
            to={course.status === 'published' ? `/course/${courseId}` : '#'}
            className={`flex items-center gap-2 px-4 py-2 text-foreground border border-border rounded-lg transition-colors ${
            course.status === 'published' ?
            'hover:bg-muted' :
            'opacity-50 cursor-not-allowed'}`
            }>

						<Eye className="w-4 h-4" />
						{dict.studio.previewAsLearner}
					</Link>

					<div data-ev-id="ev_2995b08d20" className="flex items-center gap-2">
						<button data-ev-id="ev_fecdcefa3d"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">

							<Save className="w-4 h-4" />
							{saving ? dict.common.loading : dict.studio.saveDraft}
						</button>

						{/* Readiness indicator badge — computed from modules only (no query). 
                 The full check including quizzes runs when the modal opens; if they differ, the modal is authoritative. */}
						{course.status !== 'published' && (() => {
              const headerBlockers = courseProblems({
                modules: modules.map((m) => ({
                  id: m.id,
                  title_en: m.title_en,
                  title_he: m.title_he,
                  module_type: m.module_type,
                  content_json: m.content_json
                })),
                quizzes: [], // Header badge is approximate; quiz checks run on modal open
                locale
              });
              const hasBlockers = headerBlockers.length > 0;
              return (
                <span data-ev-id="ev_publish_badge" className={`text-xs px-2 py-1 rounded-full ${
                hasBlockers ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`
                }>
                {hasBlockers ? `${dict.studio.blockersCount} ${headerBlockers.length}` : dict.studio.readyToPublish}
              </span>);

            })()}
						{course.status !== 'published' &&
            <button data-ev-id="ev_6e5e3cdd52"
            onClick={handleOpenPublishModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

								<Send className="w-4 h-4" />
								{dict.studio.publishCourse}
							</button>
            }
					</div>
				</div>

				{/* Danger Zone */}
				{canManage &&
        <div data-ev-id="ev_danger_zone" className="mt-8 p-6 bg-card border border-destructive/30 rounded-lg">
						<div data-ev-id="ev_dz_header" className="flex items-center gap-2 mb-4">
							<AlertTriangle className="w-5 h-5 text-destructive" />
							<h2 data-ev-id="ev_dz_title" className="text-lg font-semibold text-foreground">{dict.studio.dangerZone}</h2>
						</div>

						{enrollmentCount !== null &&
          <p data-ev-id="ev_dz_count" className="text-sm text-muted-foreground mb-4">
								{locale === 'he' ? `${enrollmentCount} לומדים רשומים` : `${enrollmentCount} enrolled learner(s)`}
							</p>
          }

						<div data-ev-id="ev_dz_actions" className="flex flex-col gap-4">
							{/* Archive option - always available */}
							<div data-ev-id="ev_dz_archive" className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
								<div data-ev-id="ev_dz_archive_info">
									<h3 data-ev-id="ev_dz_archive_title" className="font-medium text-foreground">{dict.studio.archiveCourse}</h3>
									<p data-ev-id="ev_dz_archive_desc" className="text-sm text-muted-foreground mt-1">
										{dict.studio.archiveCourseDescription}
									</p>
								</div>
								<button
                data-ev-id="ev_dz_archive_btn"
                onClick={handleArchive}
                disabled={archiving || course.status === 'archived'}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50">

									<Archive className="w-4 h-4" />
									{archiving ? dict.common.loading : course.status === 'archived' ? dict.common.archived : dict.studio.archiveCourse}
								</button>
							</div>

							{/* Delete option */}
							{enrollmentCount === 0 ?
            <div data-ev-id="ev_dz_delete" className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
									<div data-ev-id="ev_dz_delete_info">
										<h3 data-ev-id="ev_dz_delete_title" className="font-medium text-destructive">{dict.tooltips.deleteCourse}</h3>
										<p data-ev-id="ev_dz_delete_desc" className="text-sm text-muted-foreground mt-1">
											{dict.studio.deleteCourseDescription}
										</p>
									</div>
									<button
                data-ev-id="ev_dz_delete_btn"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">

										<Trash2 className="w-4 h-4" />
										{dict.tooltips.deleteCourse}
									</button>
								</div> :
            profile?.role === 'super_admin' ?
            <div data-ev-id="ev_dz_force_delete" className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
									<div data-ev-id="ev_dz_force_info">
										<h3 data-ev-id="ev_dz_force_title" className="font-medium text-destructive">{dict.tooltips.deleteCourse}</h3>
										<p data-ev-id="ev_dz_force_desc" className="text-sm text-muted-foreground mt-1">
											{dict.studio.deleteCourseDescription}
										</p>
									</div>
									<button
                data-ev-id="ev_dz_force_btn"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">

										<Trash2 className="w-4 h-4" />
										{dict.tooltips.deleteCourse}
									</button>
								</div> :

            <p data-ev-id="ev_dz_blocked" className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
									{dict.studio.deleteBlockedNotAdmin}
								</p>
            }
						</div>
					</div>
        }
			</div>

			{/* Publish confirmation modal */}
			<Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title={dict.studio.confirmPublish}
        footer={
        <>
						<button data-ev-id="ev_e2292c487a"
          onClick={() => setShowPublishModal(false)}
          className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_1a3c9684f5"
          onClick={handlePublish}
          disabled={checkingPublish || publishCheckFailed || publishBlockers !== null && publishBlockers.length > 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

							{dict.common.publish}
						</button>
					</>
        }>

				{/* Loading state */}
				{checkingPublish &&
        <div data-ev-id="ev_publish_checking" className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {dict.common.loading}
          </div>
        }

				{/* Check failed state */}
				{!checkingPublish && publishCheckFailed &&
        <div data-ev-id="ev_publish_failed" className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p data-ev-id="ev_20fe575dae" className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {dict.studio.blockerCheckFailed}
            </p>
          </div>
        }

				{/* Blockers list */}
				{!checkingPublish && !publishCheckFailed && publishBlockers !== null && publishBlockers.length > 0 &&
        <div data-ev-id="ev_publish_blockers" className="flex flex-col gap-2">
            <p data-ev-id="ev_8c1fef1da4" className="text-amber-500 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {dict.studio.blockersCount} {publishBlockers.length}
            </p>
            <div data-ev-id="ev_e28d32766a" className="max-h-64 overflow-y-auto flex flex-col gap-2">
              {publishBlockers.map((blocker, i) =>
            <div key={i} data-ev-id="ev_blocker_row" className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg">
                  <div data-ev-id="ev_27b4b88ed5" className="flex flex-col gap-0.5 min-w-0">
                    <span data-ev-id="ev_4f62acb8b4" className="text-sm font-medium text-foreground truncate">{blocker.moduleTitle || dict.studio.blockerNoModules}</span>
                    <span data-ev-id="ev_742e9db37c" className="text-xs text-muted-foreground">{getBlockerLabel(blocker.code)}</span>
                  </div>
                  {blocker.moduleId &&
              <button
                data-ev-id="ev_blocker_fix"
                onClick={() => handleFixBlocker(blocker)}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0 ms-2">
                      {dict.studio.blockerFix}
                    </button>
              }
                </div>
            )}
            </div>
          </div>
        }

				{/* Ready to publish */}
				{!checkingPublish && !publishCheckFailed && publishBlockers !== null && publishBlockers.length === 0 &&
        <p data-ev-id="ev_6cb6a55427" className="text-muted-foreground">{dict.studio.confirmPublishMessage}</p>
        }
			</Modal>

			{/* Quiz settings modal */}
			<Modal
        isOpen={showQuizSettingsModal}
        onClose={() => setShowQuizSettingsModal(false)}
        title={dict.studio.quizSettings}
        size="lg"
        footer={
        <>
						<button data-ev-id="ev_quiz_settings_cancel"
          onClick={() => setShowQuizSettingsModal(false)}
          className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_quiz_settings_save"
          onClick={handleSaveQuizSettings}
          disabled={savingQuizSettings}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
							{savingQuizSettings ? dict.common.loading : dict.common.save}
						</button>
					</>
        }>
				{quizSettings &&
        <div data-ev-id="ev_quiz_settings_form" className="flex flex-col gap-4">
						<div data-ev-id="ev_qs_pass_score">
							<label data-ev-id="ev_qs_pass_label" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.passScore} (%)
							</label>
							<input data-ev-id="ev_qs_pass_input"
            type="number"
            min="0"
            max="100"
            value={quizSettings.pass_score}
            onChange={(e) => setQuizSettings({ ...quizSettings, pass_score: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

						</div>
						<div data-ev-id="ev_qs_attempts">
							<label data-ev-id="ev_qs_attempts_label" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.attemptsAllowed}
							</label>
							<input data-ev-id="ev_qs_attempts_input"
            type="number"
            min="1"
            value={quizSettings.attempts_allowed}
            onChange={(e) => setQuizSettings({ ...quizSettings, attempts_allowed: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

						</div>
						<div data-ev-id="ev_qs_time">
							<label data-ev-id="ev_qs_time_label" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.timeLimitMinutes}
							</label>
							<input data-ev-id="ev_qs_time_input"
            type="number"
            min="0"
            placeholder={dict.course.noTimeLimit}
            value={quizSettings.time_limit_minutes || ''}
            onChange={(e) => setQuizSettings({ ...quizSettings, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

							<p data-ev-id="ev_qs_time_hint" className="text-xs text-muted-foreground mt-1">
								{locale === 'he' ? 'השאר ריק למבחן ללא מגבלת זמן' : 'Leave empty for no time limit'}
							</p>
						</div>
						<div data-ev-id="ev_qs_shuffle">
							<label data-ev-id="ev_qs_shuffle_label" className="flex items-center gap-2 cursor-pointer">
								<input data-ev-id="ev_qs_shuffle_input"
              type="checkbox"
              checked={quizSettings.shuffle_questions || false}
              onChange={(e) => setQuizSettings({ ...quizSettings, shuffle_questions: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />

								<span data-ev-id="ev_b2670c3733" className="text-sm font-medium text-foreground">{dict.studio.shuffleQuestions}</span>
							</label>
						</div>

						{/* Questions Editor */}
						<div data-ev-id="ev_40c2ebd41a" className="pt-4 border-t border-border">
							<QuizQuestionEditor
              quizId={quizSettings.id}
              onQuestionCountChange={handleQuestionCountChange} />

						</div>
					</div>
        }
			</Modal>

			{/* SCORM upload modal */}
			{showScormUploadModal &&
      <ScormUploadModal
        courseId={courseId!}
        sortOrder={modules.length + 1}
        onClose={() => setShowScormUploadModal(false)}
        onUploaded={(mod) => {
          setModules((prev) => [...prev, mod]);
          setShowScormUploadModal(false);
        }} />

      }

			{/* Module title edit modal */}
			<Modal
        isOpen={showModuleTitleModal}
        onClose={() => setShowModuleTitleModal(false)}
        title={dict.studio.editModuleTitle}
        footer={
        <>
						<button data-ev-id="ev_61283b7509"
          onClick={() => setShowModuleTitleModal(false)}
          className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_3741032ad8"
          onClick={handleSaveModuleTitle}
          disabled={savingModuleTitle || !moduleTitleEn.trim() || !moduleTitleHe.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
							{savingModuleTitle ? dict.common.loading : dict.common.save}
						</button>
					</>
        }>
				<div data-ev-id="ev_f6a7cf93d4" className="flex flex-col gap-4">
					<div data-ev-id="ev_129bb259e4">
						<label data-ev-id="ev_ea82794b01" className="block text-sm font-medium text-foreground mb-1">
							{dict.studio.moduleTitleEn}
						</label>
						<input data-ev-id="ev_1f44b4da82"
            type="text"
            value={moduleTitleEn}
            onChange={(e) => setModuleTitleEn(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr" />
					</div>
					<div data-ev-id="ev_d7bb431d91">
						<label data-ev-id="ev_173a9224ee" className="block text-sm font-medium text-foreground mb-1">
							{dict.studio.moduleTitleHe}
						</label>
						<input data-ev-id="ev_d06733eb65"
            type="text"
            value={moduleTitleHe}
            onChange={(e) => setModuleTitleHe(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            dir="rtl" />
					</div>
				</div>
			</Modal>

			{/* Lesson content editor modal */}
			<Modal
        isOpen={showLessonEditorModal}
        onClose={() => {if (lessonEditorDirty) {setShowDiscardConfirm(true);} else {setShowLessonEditorModal(false);setFocusBlockId(undefined);}}}
        title={dict.studioBlocks.editContent}
        size="lg">
				{editingLessonModuleId &&
        <LessonBlockEditor
          moduleId={editingLessonModuleId}
          onBlockCountChange={handleBlockCountChange}
          onSaved={() => {setLessonEditorDirty(false);setShowLessonEditorModal(false);setFocusBlockId(undefined);}}
          onDirtyChange={setLessonEditorDirty}
          focusBlockId={focusBlockId} />
        }
			</Modal>

			{/* Discard changes confirm dialog */}
			<ConfirmDialog
        isOpen={showDiscardConfirm}
        title={dict.studioBlocks.discardChangesTitle}
        message={dict.studioBlocks.discardChangesMessage}
        confirmLabel={dict.studioBlocks.discardConfirm}
        destructive
        onConfirm={() => {setShowDiscardConfirm(false);setShowLessonEditorModal(false);setLessonEditorDirty(false);setFocusBlockId(undefined);}}
        onCancel={() => setShowDiscardConfirm(false)} />


			{/* Delete confirmation modal */}
			<Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title={dict.studio.confirmDeleteCourse}
        footer={
        <>
						<button
            data-ev-id="ev_delete_cancel_btn"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }}
            className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

							{dict.common.cancel}
						</button>
						<button
            data-ev-id="ev_delete_confirm_btn"
            onClick={handleDelete}
            disabled={deleting || enrollmentCount !== null && enrollmentCount > 0 && deleteConfirmText !== course.title_en}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50">

							{deleting ? dict.common.loading : dict.tooltips.deleteCourse}
						</button>
					</>
        }>

				<div data-ev-id="ev_delete_modal_content" className="flex flex-col gap-4">
					{enrollmentCount !== null && enrollmentCount > 0 &&
          <div data-ev-id="ev_delete_warning" className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
							<p data-ev-id="ev_delete_warning_text" className="text-sm text-destructive">
								{dict.studio.deleteWarningWithEnrollments.replace('{count}', String(enrollmentCount))}
							</p>
						</div>
          }

					{enrollmentCount !== null && enrollmentCount > 0 &&
          <div data-ev-id="ev_delete_confirm_input_wrapper">
							<label data-ev-id="ev_delete_confirm_label" className="block text-sm font-medium text-foreground mb-1">
								{dict.studio.typeTitleToConfirm}
							</label>
							<p data-ev-id="ev_delete_expected_title" className="text-sm font-mono text-muted-foreground mb-2" dir="ltr">
								{course.title_en}
							</p>
							<input
              data-ev-id="ev_delete_confirm_input"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
              dir="ltr"
              autoComplete="off" />

						</div>
          }

					{(enrollmentCount === null || enrollmentCount === 0) &&
          <p data-ev-id="ev_delete_simple_confirm" className="text-muted-foreground">
							{dict.studio.deleteCourseDescription}
						</p>
          }
				</div>
			</Modal>

			{/* Delete Module Confirm Dialog */}
			<ConfirmDialog
        isOpen={deletingModuleId !== null}
        title={dict.studio.deleteModule}
        message={
        <>
            {dict.studio.confirmDeleteModule}
            {moduleDeleteWarningCount !== null &&
          <p data-ev-id="ev_55e27775f2" className="mt-2 text-destructive font-medium">
                {dict.studio.deleteModuleWarning}
                {moduleDeleteWarningCount > 0 && <span data-ev-id="ev_453ed58754" className="ms-1">{moduleDeleteWarningCount}</span>}
              </p>
          }
          </>
        }
        confirmLabel={dict.common.delete}
        destructive
        onConfirm={() => deletingModuleId && handleDeleteModule(deletingModuleId)}
        onCancel={() => {setDeletingModuleId(null);setModuleDeleteWarningCount(null);}} />

			{/* SCORM Chooser Modal */}
			<Modal
        isOpen={showScormChooser}
        onClose={() => setShowScormChooser(false)}
        title={dict.studioUpload.addScorm}>

				<div data-ev-id="ev_scorm_chooser" className="flex flex-col gap-4">
					{/* Upload new option */}
					<button data-ev-id="ev_upload_new_scorm"
          type="button"
          onClick={() => {
            setShowScormChooser(false);
            setShowScormUploadModal(true);
          }}
          className="flex items-center gap-3 p-4 text-start bg-muted border border-border rounded-lg hover:border-primary transition-colors">

						<Package className="w-6 h-6 text-primary flex-shrink-0" />
						<span data-ev-id="ev_upload_new_label" className="font-medium text-foreground">{dict.studioUpload.uploadNew}</span>
					</button>

					{/* Divider */}
					<div data-ev-id="ev_scorm_divider" className="flex items-center gap-2">
						<div data-ev-id="ev_c0bfe2ac21" className="flex-1 border-t border-border" />
						<span data-ev-id="ev_or_label" className="text-xs text-muted-foreground">{dict.studioUpload.chooseExisting}</span>
						<div data-ev-id="ev_c98aae6530" className="flex-1 border-t border-border" />
					</div>

					{/* Existing packages list */}
					{loadingPackages ?
          <p data-ev-id="ev_loading_packages" className="text-center text-muted-foreground py-4">{dict.common.loading}</p> :
          availablePackages.length === 0 ?
          <p data-ev-id="ev_no_packages" className="text-center text-muted-foreground py-4">{dict.studioUpload.noPackages}</p> :
          <div data-ev-id="ev_packages_list" className="flex flex-col gap-2 max-h-64 overflow-y-auto">
							{availablePackages.map((pkg) =>
            <button data-ev-id="ev_pkg_item"
            key={pkg.id}
            type="button"
            disabled={addingFromLibrary}
            onClick={() => handleSelectExistingPackage(pkg)}
            className="flex items-center gap-3 p-3 text-start bg-background border border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50">

									<div data-ev-id="ev_pkg_info" className="flex-1 min-w-0">
										<p data-ev-id="ev_pkg_title" className="font-medium text-foreground truncate">{pkg.title}</p>
										<p data-ev-id="ev_pkg_meta" className="text-xs text-muted-foreground">
											{pkg.scorm_version} • {new Date(pkg.created_at).toLocaleDateString(locale)}
										</p>
									</div>
								</button>
            )}
						</div>
          }
				</div>
			</Modal>

		</div>);

}