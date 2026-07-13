import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Check, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/Toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/helpers';

type QuizQuestion = Tables<'quiz_questions'>;

interface QuizOption {
  en: string;
  he: string;
}

interface EditableQuestion {
  id?: string;
  question_en: string;
  question_he: string;
  question_type: 'single' | 'multi' | 'true_false';
  options: QuizOption[];
  correct: number | number[];
  points: number;
  sort_order: number;
  isNew?: boolean;
  isExpanded?: boolean;
}

interface QuizQuestionEditorProps {
  quizId: string;
  onQuestionCountChange?: (count: number) => void;
}

export function QuizQuestionEditor({ quizId, onQuestionCountChange }: QuizQuestionEditorProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch existing questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!supabase || !quizId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.
      from('quiz_questions').
      select('*').
      eq('quiz_id', quizId).
      order('sort_order');

      if (error) {
        showToast('error', error.message);
      } else if (data) {
        const mapped: EditableQuestion[] = data.map((q) => ({
          id: q.id,
          question_en: q.question_en,
          question_he: q.question_he,
          question_type: q.question_type as EditableQuestion['question_type'],
          options: q.options as unknown as QuizOption[] || [],
          correct: q.correct as number | number[],
          points: q.points,
          sort_order: q.sort_order,
          isExpanded: false
        }));
        setQuestions(mapped);
        onQuestionCountChange?.(mapped.length);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [quizId, onQuestionCountChange]);

  const handleAddQuestion = () => {
    const newQuestion: EditableQuestion = {
      question_en: '',
      question_he: '',
      question_type: 'single',
      options: [
      { en: '', he: '' },
      { en: '', he: '' }],

      correct: 0,
      points: 1,
      sort_order: questions.length,
      isNew: true,
      isExpanded: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleTypeChange = (index: number, newType: EditableQuestion['question_type']) => {
    const updated = [...questions];
    const q = updated[index];
    q.question_type = newType;

    if (newType === 'true_false') {
      // True/False has fixed options
      q.options = [
      { en: 'True', he: 'נכון' },
      { en: 'False', he: 'לא נכון' }];

      q.correct = 0;
    } else if (newType === 'multi') {
      // Multi-select uses array of indices
      q.correct = typeof q.correct === 'number' ? [q.correct] : q.correct;
    } else {
      // Single choice uses single index
      q.correct = Array.isArray(q.correct) ? q.correct[0] ?? 0 : q.correct;
    }

    setQuestions(updated);
  };

  const handleQuestionTextChange = (index: number, field: 'question_en' | 'question_he', value: string) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, field: 'en' | 'he', value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex][field] = value;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length < 6) {
      updated[qIndex].options.push({ en: '', he: '' });
      setQuestions(updated);
    }
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (q.options.length > 2) {
      q.options.splice(optIndex, 1);
      // Adjust correct answer indices
      if (q.question_type === 'multi') {
        const correctArr = (q.correct as number[]).filter((i) => i !== optIndex).map((i) => i > optIndex ? i - 1 : i);
        q.correct = correctArr.length > 0 ? correctArr : [0];
      } else {
        const correct = q.correct as number;
        if (correct === optIndex) {
          q.correct = 0;
        } else if (correct > optIndex) {
          q.correct = correct - 1;
        }
      }
      setQuestions(updated);
    }
  };

  const handleCorrectChange = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];

    if (q.question_type === 'multi') {
      const correctArr = [...(q.correct as number[])];
      const idx = correctArr.indexOf(optIndex);
      if (idx >= 0) {
        if (correctArr.length > 1) {
          correctArr.splice(idx, 1);
        }
      } else {
        correctArr.push(optIndex);
      }
      q.correct = correctArr.sort((a, b) => a - b);
    } else {
      q.correct = optIndex;
    }

    setQuestions(updated);
  };

  const handlePointsChange = (index: number, points: number) => {
    const updated = [...questions];
    updated[index].points = Math.max(1, points);
    setQuestions(updated);
  };

  const handleToggleExpand = (index: number) => {
    const updated = [...questions];
    updated[index].isExpanded = !updated[index].isExpanded;
    setQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const updated = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    // Update sort_order
    updated.forEach((q, i) => {
      q.sort_order = i;
    });
    setQuestions(updated);
  };

  const handleDeleteQuestion = async (index: number) => {
    const q = questions[index];

    if (q.id && supabase) {
      const { error } = await supabase.
      from('quiz_questions').
      delete().
      eq('id', q.id);

      if (error) {
        showToast('error', error.message);
        return;
      }
    }

    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => {
      q.sort_order = i;
    });
    setQuestions(updated);
    onQuestionCountChange?.(updated.length);
    setDeleteConfirm(null);
    showToast('success', locale === 'he' ? 'השאלה נמחקה' : 'Question deleted');
  };

  const handleSaveQuestion = async (index: number) => {
    const q = questions[index];
    if (!supabase) return;

    // Validate
    if (!q.question_en.trim() || !q.question_he.trim()) {
      showToast('error', locale === 'he' ? 'נא למלא את טקסט השאלה בשתי השפות' : 'Please fill in question text in both languages');
      return;
    }

    const hasEmptyOption = q.options.some((opt) => !opt.en.trim() || !opt.he.trim());
    if (hasEmptyOption) {
      showToast('error', locale === 'he' ? 'נא למלא את כל האפשרויות בשתי השפות' : 'Please fill in all options in both languages');
      return;
    }

    setSaving(true);

    const questionData: TablesInsert<'quiz_questions'> = {
      quiz_id: quizId,
      question_en: q.question_en.trim(),
      question_he: q.question_he.trim(),
      question_type: q.question_type,
      options: q.options as unknown as TablesInsert<'quiz_questions'>['options'],
      correct: q.correct as unknown as TablesInsert<'quiz_questions'>['correct'],
      points: q.points,
      sort_order: q.sort_order
    };

    if (q.id) {
      // Update existing
      const { error } = await supabase.
      from('quiz_questions').
      update(questionData).
      eq('id', q.id);

      if (error) {
        showToast('error', error.message);
      } else {
        showToast('success', locale === 'he' ? 'השאלה נשמרה' : 'Question saved');
      }
    } else {
      // Insert new
      const { data, error } = await supabase.
      from('quiz_questions').
      insert(questionData).
      select().
      single();

      if (error) {
        showToast('error', error.message);
      } else if (data) {
        const updated = [...questions];
        updated[index] = {
          ...updated[index],
          id: data.id,
          isNew: false
        };
        setQuestions(updated);
        onQuestionCountChange?.(updated.length);
        showToast('success', locale === 'he' ? 'השאלה נוספה' : 'Question added');
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div data-ev-id="ev_96b4667961" className="py-4">
				<div data-ev-id="ev_3166c9c739" className="animate-pulse flex flex-col gap-3">
					<div data-ev-id="ev_657909a70d" className="h-10 bg-muted rounded" />
					<div data-ev-id="ev_d38985af99" className="h-10 bg-muted rounded" />
				</div>
			</div>);

  }

  return (
    <div data-ev-id="ev_cc8bfc6aeb" className="flex flex-col gap-4">
			{/* Header */}
			<div data-ev-id="ev_5e1b4052f4" className="flex items-center justify-between">
				<h3 data-ev-id="ev_78aeac3c1c" className="text-sm font-semibold text-foreground">
					{dict.studio.questions} ({questions.length})
				</h3>
				<button data-ev-id="ev_5549b47bbe"
        type="button"
        onClick={handleAddQuestion}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

					<Plus className="w-4 h-4" />
					{dict.studio.addQuestion}
				</button>
			</div>

			{/* Questions List */}
			{questions.length === 0 ?
      <p data-ev-id="ev_35f8555eee" className="text-center text-muted-foreground py-6 border border-dashed border-border rounded-lg">
					{locale === 'he' ? 'אין שאלות עדיין. לחץ על "הוסף שאלה" להתחיל.' : 'No questions yet. Click "Add Question" to start.'}
				</p> :

      <div data-ev-id="ev_ac2780f8fe" className="flex flex-col gap-2">
					{questions.map((q, index) =>
        <div data-ev-id="ev_dbc11ba6ad"
        key={q.id || `new-${index}`}
        className="border border-border rounded-lg bg-background overflow-hidden">

							{/* Question Header */}
							<div data-ev-id="ev_339d1a4d12"
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleToggleExpand(index)}>

								<div data-ev-id="ev_8f34f935cc" className="flex items-center gap-1">
									<button data-ev-id="ev_52ba5dbdd2"
              type="button"
              onClick={(e) => {e.stopPropagation();handleMoveQuestion(index, 'up');}}
              disabled={index === 0}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">

										<ChevronUp className="w-4 h-4" />
									</button>
									<button data-ev-id="ev_98148781cf"
              type="button"
              onClick={(e) => {e.stopPropagation();handleMoveQuestion(index, 'down');}}
              disabled={index === questions.length - 1}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">

										<ChevronDown className="w-4 h-4" />
									</button>
								</div>

								<div data-ev-id="ev_c208197684" className="flex-1 min-w-0">
									<span data-ev-id="ev_6cd62dc848" className="text-xs text-muted-foreground">
										{q.question_type === 'single' ? dict.studio.singleChoice :
                q.question_type === 'multi' ? dict.studio.multipleChoice :
                dict.studio.trueFalse} • {q.points} {locale === 'he' ? 'נק׳' : 'pts'}
									</span>
									<p data-ev-id="ev_17b246ad74" className="font-medium text-foreground truncate">
										{(locale === 'he' ? q.question_he : q.question_en) || (locale === 'he' ? 'שאלה חדשה' : 'New question')}
									</p>
								</div>

								<div data-ev-id="ev_9a79ce3e8e" className="flex items-center gap-2">
									{q.isNew &&
              <span data-ev-id="ev_a2f7d87386" className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
											{locale === 'he' ? 'חדש' : 'New'}
										</span>
              }
									{q.isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
								</div>
							</div>

							{/* Question Editor (expanded) */}
							{q.isExpanded &&
          <div data-ev-id="ev_0861d0942d" className="border-t border-border p-4 flex flex-col gap-4 bg-card">
									{/* Type & Points Row */}
									<div data-ev-id="ev_7b22ccd937" className="grid grid-cols-2 gap-4">
										<div data-ev-id="ev_1d4170b169">
											<label data-ev-id="ev_e01331c260" className="block text-sm font-medium text-foreground mb-1">
												{dict.studio.questionType}
											</label>
											<select data-ev-id="ev_091166bb62"
                value={q.question_type}
                onChange={(e) => handleTypeChange(index, e.target.value as EditableQuestion['question_type'])}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">

												<option data-ev-id="ev_be79032b0b" value="single">{dict.studio.singleChoice}</option>
												<option data-ev-id="ev_ff808dd57e" value="multi">{dict.studio.multipleChoice}</option>
												<option data-ev-id="ev_666e5e52e3" value="true_false">{dict.studio.trueFalse}</option>
											</select>
										</div>
										<div data-ev-id="ev_1c3465a4ef">
											<label data-ev-id="ev_08f087073e" className="block text-sm font-medium text-foreground mb-1">
												{dict.studio.questionPoints}
											</label>
											<input data-ev-id="ev_53312819ef"
                type="number"
                min="1"
                value={q.points}
                onChange={(e) => handlePointsChange(index, parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

										</div>
									</div>

									{/* Question Text - Bilingual */}
									<div data-ev-id="ev_f9acff2439" className="grid grid-cols-2 gap-4">
										<div data-ev-id="ev_f4dfed2376">
											<label data-ev-id="ev_f3ba31d0c5" className="block text-sm font-medium text-foreground mb-1">
												{dict.studio.questionTextEn}
											</label>
											<textarea data-ev-id="ev_42f9cc5611"
                value={q.question_en}
                onChange={(e) => handleQuestionTextChange(index, 'question_en', e.target.value)}
                rows={2}
                dir="ltr"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter question in English..." />

										</div>
										<div data-ev-id="ev_644aab4a38">
											<label data-ev-id="ev_1725b58838" className="block text-sm font-medium text-foreground mb-1">
												{dict.studio.questionTextHe}
											</label>
											<textarea data-ev-id="ev_888e279f69"
                value={q.question_he}
                onChange={(e) => handleQuestionTextChange(index, 'question_he', e.target.value)}
                rows={2}
                dir="rtl"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="הזן שאלה בעברית..." />

										</div>
									</div>

									{/* Options */}
									<div data-ev-id="ev_ee25d818c9">
										<div data-ev-id="ev_24c9729233" className="flex items-center justify-between mb-2">
											<label data-ev-id="ev_1f6d54ae06" className="block text-sm font-medium text-foreground">
												{dict.studio.options} ({q.question_type === 'multi' ? dict.studio.correctAnswers : dict.studio.correctAnswer})
											</label>
											{q.question_type !== 'true_false' && q.options.length < 6 &&
                <button data-ev-id="ev_8f771edbb0"
                type="button"
                onClick={() => handleAddOption(index)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-foreground border border-border rounded hover:bg-muted transition-colors">

													<Plus className="w-3 h-3" />
													{dict.studio.addOption}
												</button>
                }
										</div>

										<div data-ev-id="ev_30778f9455" className="flex flex-col gap-2">
											{q.options.map((opt, optIndex) => {
                  const isCorrect = q.question_type === 'multi' ?
                  (q.correct as number[]).includes(optIndex) :
                  q.correct === optIndex;

                  return (
                    <div data-ev-id="ev_03b3e6ce30" key={optIndex} className="flex items-center gap-2">
														{/* Correct answer indicator */}
														<button data-ev-id="ev_6f5726c751"
                      type="button"
                      onClick={() => handleCorrectChange(index, optIndex)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCorrect ?
                      'bg-primary border-primary text-primary-foreground' :
                      'border-border hover:border-primary/50'}`
                      }
                      title={q.question_type === 'multi' ? dict.studio.correctAnswers : dict.studio.correctAnswer}>

															{isCorrect && <Check className="w-3 h-3" />}
														</button>

														{/* Option inputs */}
														<div data-ev-id="ev_d31f614b71" className="flex-1 grid grid-cols-2 gap-2">
															<input data-ev-id="ev_b27512469a"
                        type="text"
                        value={opt.en}
                        onChange={(e) => handleOptionChange(index, optIndex, 'en', e.target.value)}
                        dir="ltr"
                        disabled={q.question_type === 'true_false'}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={dict.studio.optionEn} />

															<input data-ev-id="ev_38dcd6e8f8"
                        type="text"
                        value={opt.he}
                        onChange={(e) => handleOptionChange(index, optIndex, 'he', e.target.value)}
                        dir="rtl"
                        disabled={q.question_type === 'true_false'}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={dict.studio.optionHe} />

														</div>

														{/* Remove option button */}
														{q.question_type !== 'true_false' && q.options.length > 2 &&
                      <button data-ev-id="ev_2ad285530f"
                      type="button"
                      onClick={() => handleRemoveOption(index, optIndex)}
                      className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors">

																<X className="w-4 h-4" />
															</button>
                      }
													</div>);

                })}
										</div>
									</div>

									{/* Action buttons */}
									<div data-ev-id="ev_3a49907a32" className="flex items-center justify-between pt-2 border-t border-border">
										{deleteConfirm === (q.id || `new-${index}`) ?
              <div data-ev-id="ev_dad8932b6a" className="flex items-center gap-2">
												<span data-ev-id="ev_30855e552d" className="text-sm text-destructive">
													{locale === 'he' ? 'למחוק את השאלה?' : 'Delete this question?'}
												</span>
												<button data-ev-id="ev_f0cea5294f"
                type="button"
                onClick={() => handleDeleteQuestion(index)}
                className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">

													{dict.common.delete}
												</button>
												<button data-ev-id="ev_e6fac04ad7"
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1 text-sm text-foreground border border-border rounded hover:bg-muted transition-colors">

													{dict.common.cancel}
												</button>
											</div> :

              <button data-ev-id="ev_2ba0eb0673"
              type="button"
              onClick={() => setDeleteConfirm(q.id || `new-${index}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition-colors">

												<Trash2 className="w-4 h-4" />
												{dict.common.delete}
											</button>
              }

										<button data-ev-id="ev_e6c61fa2f8"
              type="button"
              onClick={() => handleSaveQuestion(index)}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50">

											{saving ? dict.common.loading : dict.common.save}
										</button>
									</div>
								</div>
          }
						</div>
        )}
				</div>
      }
		</div>);

}