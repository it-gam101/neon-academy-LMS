import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/helpers';
import { useLocale } from '@/hooks/useLocale';

export type Quiz = Tables<'quizzes'>;
export type QuizQuestion = Tables<'quiz_questions'>;
export type QuizAttempt = Tables<'quiz_attempts'>;

interface QuizOption {
	en: string;
	he: string;
}

export function useQuiz(moduleId: string) {
	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [questions, setQuestions] = useState<QuizQuestion[]>([]);
	const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { locale } = useLocale();

	const fetchQuiz = useCallback(async () => {
		if (!supabase || !moduleId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			// Fetch quiz
			const { data: quizData, error: quizError } = await supabase
				.from('quizzes')
				.select('*')
				.eq('module_id', moduleId)
				.single();

			if (quizError) throw quizError;
			setQuiz(quizData);

			// Fetch questions
			const { data: questionsData, error: questionsError } = await supabase
				.from('quiz_questions')
				.select('*')
				.eq('quiz_id', quizData.id)
				.order('sort_order');

			if (questionsError) throw questionsError;
			setQuestions(questionsData || []);

			// Fetch user's attempts
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: attemptsData } = await supabase
					.from('quiz_attempts')
					.select('*')
					.eq('user_id', user.id)
					.eq('quiz_id', quizData.id)
					.order('attempt_no', { ascending: false });

				setAttempts(attemptsData || []);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load quiz');
		} finally {
			setLoading(false);
		}
	}, [moduleId]);

	useEffect(() => {
		fetchQuiz();
	}, [fetchQuiz]);

	const getLocalizedQuestion = (question: QuizQuestion) =>
		locale === 'he' ? question.question_he : question.question_en;

	const getLocalizedOptions = (question: QuizQuestion): string[] => {
		const options = (question.options as unknown) as QuizOption[];
		return (options ?? []).map(opt => locale === 'he' ? opt.he : opt.en);
	};

	const attemptsUsed = attempts.length;
	const attemptsAllowed = quiz?.attempts_allowed || 0;
	const attemptsRemaining = Math.max(0, attemptsAllowed - attemptsUsed);
	const canAttempt = attemptsRemaining > 0;
	const lastAttempt = attempts[0] || null;
	const hasPassed = attempts.some(a => a.passed);

	const shuffledQuestions = useMemo(() => {
		if (!quiz?.shuffle_questions) return questions;
		return [...questions].sort(() => Math.random() - 0.5);
	}, [questions, quiz?.shuffle_questions]);

	const submitQuiz = async (answers: Record<string, number | number[]>) => {
		if (!supabase || !quiz) return { error: 'Quiz not loaded' };

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return { error: 'Not authenticated' };

		// Calculate score
		let earnedPoints = 0;
		let totalPoints = 0;

		questions.forEach(q => {
			totalPoints += q.points || 1;
			const userAnswer = answers[q.id];
			const correctAnswer = q.correct;

			if (q.question_type === 'multi') {
				// Multi-select: compare arrays
				const correct = correctAnswer as number[];
				const user = (userAnswer || []) as number[];
				if (correct.length === user.length && correct.every(c => user.includes(c))) {
					earnedPoints += q.points || 1;
				}
			} else {
				// Single/true_false: compare single value
				if (String(userAnswer) === String(correctAnswer)) {
					earnedPoints += q.points || 1;
				}
			}
		});

		const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
		const passed = score >= (quiz.pass_score || 70);

		// Insert attempt
		const { data, error: insertError } = await supabase
			.from('quiz_attempts')
			.insert({
				user_id: user.id,
				quiz_id: quiz.id,
				attempt_no: attemptsUsed + 1,
				answers,
				score,
				passed,
				started_at: new Date().toISOString(),
				submitted_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (insertError) {
			// Check for max attempts error
			if (insertError.message.includes('attempt')) {
				return { error: 'max_attempts_reached' };
			}
			return { error: insertError.message };
		}

		setAttempts(prev => [data, ...prev]);

		return { data, score, passed };
	};

	return {
		quiz,
		questions: shuffledQuestions,
		attempts,
		loading,
		error,
		refetch: fetchQuiz,
		getLocalizedQuestion,
		getLocalizedOptions,
		attemptsUsed,
		attemptsAllowed,
		attemptsRemaining,
		canAttempt,
		lastAttempt,
		hasPassed,
		submitQuiz,
	};
}
