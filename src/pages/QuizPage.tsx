import { useParams, useNavigate, Link } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
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

type QuizState = 'info' | 'playing' | 'results' | 'review';

export default function QuizPage() {
  const { courseId, moduleId } = useParams<{courseId: string;moduleId: string;}>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const BackArrow = locale === 'he' ? ArrowRight : ArrowLeft;
  const PrevChevron = locale === 'he' ? ChevronRight : ChevronLeft;
  const NextChevron = locale === 'he' ? ChevronLeft : ChevronRight;

  const { quiz, questions, loading, error, attemptsUsed, attemptsAllowed, attemptsRemaining, canAttempt, hasPassed, submitQuiz, getLocalizedQuestion, getLocalizedOptions } = useQuiz(moduleId || '');
  const { course, modules, markModuleProgress, getLocalizedTitle, getLocalizedCourseTitle } = useCourseModules(courseId || '');

  const currentModule = modules.find((m) => m.id === moduleId);

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

    const { data, score, passed, error } = await submitQuiz(answers);

    if (error === 'max_attempts_reached') {
      showToast('error', dict.quiz.maxAttemptsMessage);
      setState('info');
    } else if (error) {
      showToast('error', error);
    } else {
      setResult({ score: score!, passed: passed! });
      setState('results');

      // Mark module complete if passed
      if (passed && moduleId) {
        await markModuleProgress(moduleId, 'completed', score);
      }
    }

    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, submitQuiz, moduleId, markModuleProgress, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <BackButton to={`/course/${courseId}`} label={dict.quiz.backToCourse} />
        <ErrorState error={error || dict.common.notFound} />
      </div>);

  }

  // Info screen
  if (state === 'info') {
    return (
      <div data-ev-id="ev_e303f380d7" className="min-h-screen bg-background">
        <div data-ev-id="ev_da9078865f" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
            { label: dict.nav.catalogue, href: '/catalogue' },
            { label: courseTitle, href: `/course/${courseId}` },
            { label: currentModule ? getLocalizedTitle(currentModule) : dict.course.quiz }]
            } />

          
          <BackButton to={`/course/${courseId}`} label={dict.quiz.backToCourse} />

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
								{dict.quiz.question}s
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

						{hasPassed ?
            <div data-ev-id="ev_2e2f2dc471" className="p-4 bg-primary/10 border border-primary/30 rounded-lg mb-6">
								<CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
								<p data-ev-id="ev_2655ba0c5b" className="text-primary font-medium">{dict.quiz.youPassed}</p>
							</div> :
            !canAttempt ?
            <div data-ev-id="ev_d6dbf8f5af" className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-6">
								<XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
								<p data-ev-id="ev_014e8f67f8" className="text-destructive font-medium">{dict.quiz.noAttemptsRemaining}</p>
							</div> :
            null}

						<button data-ev-id="ev_d7596ef15d"
            onClick={startQuiz}
            disabled={!canAttempt}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">

							{hasPassed ? dict.quiz.retryQuiz : dict.course.startQuiz}
						</button>
					</div>
				</div>
			</div>);

  }

  // Results screen
  if (state === 'results' && result) {
    return (
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
							{dict.quiz.passingScore}: {quiz.pass_score}% • {dict.quiz.attemptsRemaining}: {attemptsRemaining - 1}
						</p>

						<div data-ev-id="ev_13acaec1e8" className="flex flex-col sm:flex-row gap-4 justify-center">
							<button data-ev-id="ev_d0db9d9be6"
              onClick={() => setState('review')}
              className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors">

								{dict.quiz.reviewAnswers}
							</button>
							{!result.passed && canAttempt && attemptsRemaining > 1 &&
              <button data-ev-id="ev_52998ac06b"
              onClick={startQuiz}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

									{dict.quiz.retryQuiz}
								</button>
              }
							<Link
                to={`/course/${courseId}`}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

								{dict.quiz.backToCourse}
							</Link>
						</div>
					</div>
				</div>
			</div>);

  }

  // Review screen
  if (state === 'review') {
    return (
      <div data-ev-id="ev_99c82607c8" className="min-h-screen bg-background">
				<div data-ev-id="ev_1757b239f3" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div data-ev-id="ev_32f3b02f20" className="flex items-center justify-between mb-6">
						<h1 data-ev-id="ev_86452122bd" className="text-xl font-bold text-foreground">{dict.quiz.reviewAnswers}</h1>
						<Link
              to={`/course/${courseId}`}
              className="text-primary hover:underline">

							{dict.quiz.backToCourse}
						</Link>
					</div>

					<div data-ev-id="ev_a8a914f4ac" className="space-y-6">
						{questions.map((q, index) => {
              const userAnswer = answers[q.id];
              const correctAnswer = q.correct;
              const options = getLocalizedOptions(q);

              let isCorrect = false;
              if (q.question_type === 'multi') {
                const correct = correctAnswer as number[];
                const user = (userAnswer || []) as number[];
                isCorrect = correct.length === user.length && correct.every((c) => user.includes(c));
              } else {
                isCorrect = String(userAnswer) === String(correctAnswer);
              }

              return (
                <div data-ev-id="ev_502208f832" key={q.id} className="bg-card border border-border rounded-lg p-6">
									<div data-ev-id="ev_a91c401f38" className="flex items-start gap-3 mb-4">
										{isCorrect ?
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /> :

                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    }
										<div data-ev-id="ev_ca5b6e2dfb">
											<span data-ev-id="ev_d9384a8463" className="text-sm text-muted-foreground">{dict.quiz.question} {index + 1}</span>
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
                        className={`p-3 rounded-lg border ${
                        isCorrectAnswer ?
                        'bg-primary/10 border-primary/30' :
                        isUserAnswer ?
                        'bg-destructive/10 border-destructive/30' :
                        'border-border'}`
                        }>

													{opt}
													{isCorrectAnswer &&
                          <Badge variant="success" size="sm">{dict.quiz.correct}</Badge>
                          }
													{isUserAnswer && !isCorrectAnswer &&
                          <Badge variant="danger" size="sm">{dict.quiz.yourAnswer}</Badge>
                          }
												</div>);

                    })}
									</div>
								</div>);

            })}
					</div>
				</div>
			</div>);

  }

  // Quiz playing
  const question = questions[currentQuestion];
  const options = getLocalizedOptions(question);
  const questionType = question.question_type;

  return (
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
                'border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground'}`
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
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

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
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">

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
		</div>);

}