import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ArrowRight, Save, Eye, Send, Plus, Trash2, BookOpen, FileQuestion, GripVertical, Settings } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/Toast';
import type { Tables } from '@/integrations/supabase/helpers';
import { QuizQuestionEditor } from '@/components/studio/QuizQuestionEditor';

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

  // Quiz settings state
  const [showQuizSettingsModal, setShowQuizSettingsModal] = useState(false);
  const [editingQuizModuleId, setEditingQuizModuleId] = useState<string | null>(null);
  const [quizSettings, setQuizSettings] = useState<Quiz | null>(null);
  const [savingQuizSettings, setSavingQuizSettings] = useState(false);
  const [quizQuestionCounts, setQuizQuestionCounts] = useState<Record<string, number>>({});

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

  const handlePublish = async () => {
    if (!supabase || !courseId) return;

    const { error } = await supabase.
    from('courses').
    update({ status: 'published', updated_at: new Date().toISOString() }).
    eq('id', courseId);

    if (error) {
      showToast('error', error.message);
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

  const handleDeleteModule = async (moduleId: string) => {
    if (!supabase || !confirm(dict.studio.confirmDeleteModule)) return;

    const { error } = await supabase.
    from('modules').
    delete().
    eq('id', moduleId);

    if (error) {
      showToast('error', error.message);
    } else {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
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

									<GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
									<div data-ev-id="ev_8dca9d6384" className="w-8 h-8 rounded bg-muted flex items-center justify-center">
										{mod.module_type === 'quiz' ?
                <FileQuestion className="w-4 h-4 text-muted-foreground" /> :

                <BookOpen className="w-4 h-4 text-muted-foreground" />
                }
									</div>
									<div data-ev-id="ev_0fd824dbbd" className="flex-1">
										<span data-ev-id="ev_7bc8188839" className="text-sm text-muted-foreground">
											{mod.module_type === 'quiz' ? `${dict.course.quiz} ${index + 1}${quizQuestionCounts[mod.id] ? ` (${quizQuestionCounts[mod.id]} ${locale === 'he' ? 'שאלות' : 'Q'})` : ''}` : `${dict.course.lesson} ${index + 1}`}
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
									<button data-ev-id="ev_e2850d52d2"
              onClick={() => handleDeleteModule(mod.id)}
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

						{course.status !== 'published' &&
            <button data-ev-id="ev_6e5e3cdd52"
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

								<Send className="w-4 h-4" />
								{dict.studio.publishCourse}
							</button>
            }
					</div>
				</div>
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
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							{dict.common.publish}
						</button>
					</>
        }>

				<p data-ev-id="ev_6cb6a55427" className="text-muted-foreground">{dict.studio.confirmPublishMessage}</p>
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
              onQuestionCountChange={(count) => {
                if (editingQuizModuleId) {
                  setQuizQuestionCounts((prev) => ({ ...prev, [editingQuizModuleId]: count }));
                }
              }} />

						</div>
					</div>
        }
			</Modal>
		</div>);

}