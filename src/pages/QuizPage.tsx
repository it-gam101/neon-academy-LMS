import { useParams, useNavigate, Link, useSearchParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useAuth } from '@/hooks/useAuth';
import { useQuiz } from '@/hooks/useQuiz';
import { useCourseModules } from '@/hooks/useCourseModules';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/Toast';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { PreviewBanner } from '@/components/studio/PreviewBanner';
import { scoreQuiz, questionFraction, verdictOf } from '@/lib/grading';
import { isModuleDone } from '@/lib/courseProgress';

type QuizState = 'info' | 'playing' | 'results' | 'review';

export default function QuizPage() {
  const { courseId, moduleId } = useParams<{courseId: string;moduleId: string;}>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const BackArrow = locale === 'he' ? ArrowRight : ArrowLeft;
  const PrevChevron = locale === 'he' ? ChevronRight : ChevronLeft;
  const NextChevron = locale === 'he' ? ChevronLeft : ChevronRight;

  // Preview mode: only authors (instructor/hr_manager/super_admin) get preview behavior
  const previewParam = searchParams.get('preview') === '1';
  const canAuthor = profile?.role === 'instructor' || profile?.role === 'hr_manager' || profile?.role === 'super_admin';
  const isPreview = previewParam && canAuthor;
  const previewSuffix = isPreview ? '?preview=1' : '';

  const { quiz, questions, loading, error, attemptsUsed, attemptsAllowed, attemptsRemaining, canAttempt, hasPassed, submitQuiz, getLocalizedQuestion, getLocalizedOptions } = useQuiz(moduleId || '');
  const { course, modules, enrollment, markModuleProgress, getLocalizedTitle, getLocalizedCourseTitle } = useCourseModules(courseId || '');

  const currentModule = modules.find((m) => m.id === moduleId);

  // Item 117: the course completes only when EVERY module is finished AND the quiz is passed. Navigation is
  // free, so a learner can reach the quiz first — and "You passed" then reads as "done" when it is not.
  // Say which parts are unfinished, with links. Inform, never block. Same rule as the completion rollup.
  const unfinished = modules.filter((m) => m.id !== moduleId && !isModuleDone(m.progress));
  const moduleHref = (m: (typeof modules)[number]) =>
  m.module_type === 'scorm_package' ?
  enrollment ? `/learn/${enrollment.id}/scorm/${m.id}` : `/course/${courseId}` :
  m.module_type === 'quiz' ? `/course/${courseId}/quiz/${m.id}` :
  `/course/${courseId}/module/${m.id}`;
  const unfinishedNotice = (message: string) =>
  isPreview || unfinished.length === 0 ? null :
  <div data-ev-id="ev_quiz_unfinished" role="note" className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-start">
      <p data-ev-id="ev_quiz_unfinished_msg" className="flex items-start gap-2 text-sm text-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
        <span data-ev-id="ev_quiz_unfinished_text">{message}</span>
      </p>
      <ul data-ev-id="ev_quiz_unfinished_list" className="mt-2 space-y-1 ps-6 text-sm">
        {unfinished.map((m) =>
      <li data-ev-id="ev_quiz_unfinished_item" key={m.id}>
            <Link data-ev-id="ev_quiz_unfinished_link" to={moduleHref(m)} className="text-primary hover:underline">{getLocalizedTitle(m)}</Link>
          </li>
      )}
      </ul>
      {unfinished.some((m) => m.module_type === 'lesson') &&
    <p data-ev-id="ev_quiz_unfinished_hint" className="mt-2 ps-6 text-xs text-muted-foreground">
          {dict.quiz.unfinishedLessonHint.replace('{mark}', dict.course.markComplete)}
        </p>
    }
    </div>;
  const [state, setState] = useState<QuizState>('info');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{score: number;passed: boolean;} | null>(null);

  // Timer
  useEffect(() => {
    if (state !== 'playing' || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, timeRemaining]);

  const startQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    if (quiz?.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
    setState('playing');
  };

  const handleAnswer = (questionId: string, answer: number | number[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    // In preview mode, calculate score locally without writing to DB
    if (isPreview) {
      // Item 116: the same shared grader as a real attempt.
      const localScore = scoreQuiz(questions, answers);
      const localPassed = localScore >= (quiz?.pass_score || 70);
      setResult({ score: localScore, passed: localPassed });
      setState('results');
      setSubmitting(false);
      return;
    }

    try {
      const { data, score, passed, error } = await withTimeout(submitQuiz(answers), 10000);

      if (error === 'max_attempts_reached') {
        showToast('error', dict.quiz.maxAttemptsMessage);
        setState('info');
      } else if (error) {
        showToast('error', error);
      } else {
        setResult({ score: score!, passed: passed! });
        setState('results');

        // Record the outcome either way. A failed attempt is NOT completed — it is
        // in_progress with passed = false, which is what an HR report needs to see
        // and what the server-side rollup will read in the next window.
        if (moduleId) {
          await withTimeout(
            markModuleProgress(moduleId, passed ? 'completed' : 'in_progress', score, passed),
            10000
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error && err.message === 'TIMEOUT' ?
      dict.errors.connectionTimeout :
      err instanceof Error ? err.message :
      (err as {message?: string;})?.message || dict.common.error;
      console.error('quiz submit failed:', err);
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [answers, submitQuiz, moduleId, markModuleProgress, submitting, isPreview, questions, quiz?.pass_score, dict]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Wrapper for preview mode
  const wrapInPreview = (content: React.ReactNode) => {
    if (isPreview) {
      return <PreviewBanner courseId={courseId || ''}>{content}</PreviewBanner>;
    }
    return content;
  };

  if (loading) {
    return (
      <div data-ev-id="ev_0dad995514" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<LoadingSkeleton variant="text" count={5} />
			</div>);

  }

  const courseTitle = course ? getLocalizedCourseTitle() : dict.course.quiz;

  if (error || !quiz) {
    return (
      <div data-ev-id="ev_66bf24593c" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton to={`/course/${courseId}${previewSuffix}`} label={dict.quiz.backToCourse} />
        <ErrorState error={error || dict.common.notFound} />
      </div>);
  }

  // Guard against empty questions - quiz exists but no questions yet
  if (questions.length === 0) {
    return (
      <div data-ev-id="ev_quiz_no_questions" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton to={`/course/${courseId}${previewSuffix}`} label={dict.quiz.backToCourse} />
        <div data-ev-id="ev_no_questions_card" className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 data-ev-id="ev_no_questions_title" className="text-xl font-semibold text-foreground mb-2">
            {dict.quiz.noQuestionsTitle}
          </h2>
          <p data-ev-id="ev_no_questions_desc" className="text-muted-foreground">
            {dict.quiz.noQuestionsDescription}
          </p>
        </div>
      </div>);

  }

  // Info screen
  if (state === 'info') {
    return wrapInPreview(
      <div data-ev-id="ev_e303f380d7" className="min-h-screen bg-background">
        <div data-ev-id="ev_da9078865f" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
            { label: dict.nav.catalogue, href: '/catalogue' },
            { label: courseTitle, href: `/course/${courseId}${previewSuffix}` },
            { label: currentModule ? getLocalizedTitle(currentModule) : dict.course.quiz }]
            } />

          
          <BackButton to={`/course/${courseId}${previewSuffix}`} label={dict.quiz.backToCourse} />

					<div data-ev-id="ev_9ba8660d35" className="bg-card border border-border rounded-lg p-8 text-center">
						<h1 data-ev-id="ev_2b529c51a7" className="text-2xl font-bold text-foreground mb-4">
							{currentModule ? getLocalizedTitle(currentModule) : dict.course.quiz}
						</h1>

						<div data-ev-id="ev_8ffd233620" className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-8">
							<div data-ev-id="ev_28759c967e">
								<span data-ev-id="ev_bd2b65f752" className="block text-2xl font-bold text-foreground">{quiz.pass_score}%</span>
								{dict.course.passScore}
							</div>
							<div data-ev-id="ev_62312d669a">
								<span data-ev-id="ev_65afa93033" className="block text-2xl font-bold text-foreground">{questions.length}</span>
								{dict.quiz.questions}
							</div>
							<div data-ev-id="ev_ba71bdefd2">
								<span data-ev-id="ev_a0583fc3e8" className="block text-2xl font-bold text-foreground">
									{quiz.time_limit_minutes || '∞'}
								</span>
								{quiz.time_limit_minutes ? dict.common.minutes : dict.course.noTimeLimit}
							</div>
						</div>

						<div data-ev-id="ev_2c406112e2" className="mb-8">
							<span data-ev-id="ev_23b787c03d" className="text-muted-foreground">
								{dict.course.attemptsUsed}: {attemptsUsed} / {attemptsAllowed}
							</span>
						</div>

						{/* Item 117: before the quiz — what is still unfinished, and that the quiz can be taken anyway. */}
						{unfinishedNotice(dict.quiz.unfinishedIntro.replace('{count}', String(unfinished.length)))}

						{hasPassed ?
            <div data-ev-id="ev_2e2f2dc471" className="p-4 bg-primary/10 border border-primary/30 rounded-lg mb-6">
								<CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
								<p data-ev-id="ev_2655ba0c5b" className="text-primary font-medium">{dict.quiz.youPassed}</p>
							</div> :
            !canAttempt && !isPreview ?
            <div data-ev-id="ev_d6dbf8f5af" className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-6">
								<XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
								<p data-ev-id="ev_014e8f67f8" className="text-destructive font-medium">{dict.quiz.noAttemptsRemaining}</p>
							</div> :
            null}

						<button data-ev-id="ev_d7596ef15d"
            onClick={startQuiz}
            disabled={!canAttempt && !isPreview}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

							{hasPassed ? dict.quiz.retryQuiz : dict.course.startQuiz}
						</button>
					</div>
				</div>
			</div>
    );
  }

  // Results screen
  if (state === 'results' && result) {
    return wrapInPreview(
      <div data-ev-id="ev_ce964a37c6" className="min-h-screen bg-background">
				<div data-ev-id="ev_e078460f0f" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div data-ev-id="ev_ea13b18d8c" className="bg-card border border-border rounded-lg p-8 text-center">
						{result.passed ?
            <>
								<div data-ev-id="ev_b481f330a3" className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<CheckCircle className="w-10 h-10 text-primary" />
								</div>
								<h1 data-ev-id="ev_d85930091e" className="text-2xl font-bold text-primary mb-2">{dict.quiz.youPassed}</h1>
							</> :

            <>
								<div data-ev-id="ev_53b022972b" className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<XCircle className="w-10 h-10 text-destructive" />
								</div>
								<h1 data-ev-id="ev_eca5a1cd4b" className="text-2xl font-bold text-destructive mb-2">{dict.quiz.youFailed}</h1>
							</>
            }

						<p data-ev-id="ev_e9b8cdc01b" className="text-muted-foreground mb-6">
							{dict.quiz.yourScoreIs} <span data-ev-id="ev_adfb2eac97" className="text-3xl font-bold text-foreground">{result.score}%</span>
						</p>

						<p data-ev-id="ev_ecd4d7552f" className="text-sm text-muted-foreground mb-8">
							{dict.quiz.passingScore}: {quiz.pass_score}% • {dict.quiz.attemptsRemaining}: {attemptsRemaining}
						</p>

						{/* Item 117: a PASS with unfinished parts is not a finished course — the moment that matters. */}
						{result.passed && unfinishedNotice(dict.quiz.unfinishedAfterPass)}

						<div data-ev-id="ev_13acaec1e8" className="flex flex-col sm:flex-row gap-4 justify-center">
							<button data-ev-id="ev_d0db9d9be6"
              onClick={() => setState('review')}
              className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted hover:border-muted-foreground transition-colors">

								{dict.quiz.reviewAnswers}
							</button>
							{!result.passed && canAttempt &&
              <button data-ev-id="ev_52998ac06b"
              onClick={startQuiz}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

									{dict.quiz.retryQuiz}
								</button>
              }
							<Link data-ev-id="ev_b2641cf59f"
              to={`/course/${courseId}${previewSuffix}`}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

								{dict.quiz.backToCourse}
							</Link>
						</div>
					</div>
				</div>
			</div>
    );
  }

  // Review screen
  if (state === 'review') {
    return wrapInPreview(
      <div data-ev-id="ev_99c82607c8" className="min-h-screen bg-background">
				<div data-ev-id="ev_1757b239f3" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div data-ev-id="ev_32f3b02f20" className="flex items-center justify-between mb-6">
						<h1 data-ev-id="ev_86452122bd" className="text-xl font-bold text-foreground">{dict.quiz.reviewAnswers}</h1>
						<Link data-ev-id="ev_389fea5c7a"
            to={`/course/${courseId}${previewSuffix}`}
            className="text-primary hover:underline">

							{dict.quiz.backToCourse}
						</Link>
					</div>

					<div data-ev-id="ev_a8a914f4ac" className="space-y-6">
						{questions.map((q, index) => {
              const userAnswer = answers[q.id];
              const correctAnswer = q.correct;
              const options = getLocalizedOptions(q);

              // Item 116: three verdicts from the shared grader — correct, partly correct, incorrect.
              const verdict = verdictOf(questionFraction(q.question_type, correctAnswer, userAnswer));

              return (
                <div data-ev-id="ev_502208f832" key={q.id} className="bg-card border border-border rounded-lg p-6">
									<div data-ev-id="ev_a91c401f38" className="flex items-start gap-3 mb-4">
										{verdict === 'correct' ?
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /> :
                    verdict === 'partial' ?
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /> :
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    }
										<div data-ev-id="ev_ca5b6e2dfb">
											<span data-ev-id="ev_d9384a8463" className="text-sm text-muted-foreground">{dict.quiz.question} {index + 1}</span>
											{' '}
											<Badge variant={verdict === 'correct' ? 'success' : verdict === 'partial' ? 'warning' : 'danger'} size="sm">
												{verdict === 'correct' ? dict.quiz.correct : verdict === 'partial' ? dict.quiz.partlyCorrect : dict.quiz.incorrect}
											</Badge>
											<p data-ev-id="ev_ef08b952b5" className="font-medium text-foreground">{getLocalizedQuestion(q)}</p>
										</div>
									</div>

									<div data-ev-id="ev_530ec25a63" className="space-y-2 ps-8">
										{options.map((opt, optIndex) => {
                      const isUserAnswer = q.question_type === 'multi' ?
                      (userAnswer as number[] || []).includes(optIndex) :
                      userAnswer === optIndex;
                      const isCorrectAnswer = q.question_type === 'multi' ?
                      (correctAnswer as number[]).includes(optIndex) :
                      correctAnswer === optIndex;

                      return (
                        <div data-ev-id="ev_57c78d1dc6"
                        key={optIndex}
                        className={`p-3 rounded-lg border text-foreground ${
                        isCorrectAnswer ?
                        'bg-primary/10 border-primary/50' :
                        isUserAnswer ?
                        'bg-destructive/10 border-destructive/50' :
                        'border-border'}`
                        }>

													{opt}
													{/* Item 94: mark EVERY option the learner picked — neutral when it was right, red when not. Before,
													    a correct pick showed no "Your answer", so on a choose-all question picked and missed
													    correct options looked identical. */}
													{(isCorrectAnswer || isUserAnswer) &&
                          <span data-ev-id="ev_quiz_review_badges" className="ms-2 inline-flex gap-1 align-middle">
															{isCorrectAnswer &&
                            <Badge variant="success" size="sm">{dict.quiz.correct}</Badge>
                            }
															{isUserAnswer &&
                            <Badge variant={isCorrectAnswer ? 'default' : 'danger'} size="sm">{dict.quiz.yourAnswer}</Badge>
                            }
														</span>
                          }
												</div>);

                    })}
									</div>
								</div>);

            })}
					</div>
				</div>
			</div>
    );
  }

  // Quiz playing
  const question = questions[currentQuestion];
  const options = getLocalizedOptions(question);
  const questionType = question.question_type;

  return wrapInPreview(
    <div data-ev-id="ev_7a6c8533f4" className="min-h-screen bg-background">
			<div data-ev-id="ev_60adf4ad5e" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Progress header */}
				<div data-ev-id="ev_cdc925890a" className="mb-6">
					<div data-ev-id="ev_ad2c101ab2" className="flex items-center justify-between mb-2">
						<span data-ev-id="ev_16220da099" className="text-sm text-muted-foreground">
							{dict.quiz.question} {currentQuestion + 1} {dict.quiz.questionOf} {questions.length}
						</span>
						{timeRemaining !== null &&
            <span data-ev-id="ev_47780885f9" className={`flex items-center gap-1 text-sm ${
            timeRemaining < 60 ? 'text-destructive' : 'text-muted-foreground'}`
            }>
								<Clock className="w-4 h-4" />
								{formatTime(timeRemaining)}
							</span>
            }
					</div>
					<ProgressBar value={currentQuestion + 1} max={questions.length} />
				</div>

				{/* Question */}
				<div data-ev-id="ev_03020ae7f7" className="bg-card border border-border rounded-lg p-6 mb-6">
					<h2 data-ev-id="ev_d39be4ed9a" className="text-lg font-semibold text-foreground mb-2">
						{getLocalizedQuestion(question)}
					</h2>
					<p data-ev-id="ev_c6e7a6de6b" className="text-sm text-muted-foreground mb-6">
						{questionType === 'multi' ? dict.quiz.selectAll :
            questionType === 'true_false' ? dict.quiz.trueOrFalse :
            dict.quiz.selectOne}
					</p>

					{/* Options */}
					<div data-ev-id="ev_18278b4ac0" className="space-y-3">
						{options.map((opt, index) => {
              const answerValue = answers[question.id];
              const currentArray = Array.isArray(answerValue) ? answerValue : [];
              const isSelected = questionType === 'multi' ?
              currentArray.includes(index) :
              answerValue === index;

              return (
                <button data-ev-id="ev_afb6207f67"
                key={index}
                onClick={() => {
                  if (questionType === 'multi') {
                    const updated = isSelected ?
                    currentArray.filter((i) => i !== index) :
                    [...currentArray, index];
                    handleAnswer(question.id, updated);
                  } else {
                    handleAnswer(question.id, index);
                  }
                }}
                className={`w-full p-4 text-start border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                isSelected ?
                'bg-primary/10 border-primary text-foreground' :
                'border-border hover:border-primary/50 text-foreground'}`
                }>

									{opt}
								</button>);

            })}
					</div>
				</div>

				{/* Navigation */}
				<div data-ev-id="ev_f4de708ec1" className="flex items-center justify-between">
					<button data-ev-id="ev_dbc4b343a2"
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

						<PrevChevron className="w-5 h-5" />
						{dict.quiz.previousQuestion}
					</button>

					{currentQuestion < questions.length - 1 ?
          <button data-ev-id="ev_03a96ff7f9"
          onClick={() => setCurrentQuestion((prev) => prev + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							{dict.quiz.nextQuestion}
							<NextChevron className="w-5 h-5" />
						</button> :

          <button data-ev-id="ev_9af1861084"
          onClick={() => setShowConfirmModal(true)}
          disabled={submitting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">

							{dict.quiz.submitQuiz}
						</button>
          }
				</div>
			</div>

			{/* Confirm modal */}
			<Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={dict.quiz.confirmSubmit}
        footer={
        <>
						<button data-ev-id="ev_fbcd445444"
          onClick={() => setShowConfirmModal(false)}
          className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_570f4f706e"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">

							{submitting ? dict.common.loading : dict.common.submit}
						</button>
					</>
        }>

				<p data-ev-id="ev_897b988f13" className="text-muted-foreground">{dict.quiz.confirmSubmitMessage}</p>
			</Modal>
		</div>
  );
}