// Lapisan akses tipis untuk Question (PRD §7).
import type { ConditionGroup, Question } from '@/types';
import { useSurveyStore } from '@/store/useSurveyStore';

/** GET /api/surveys/:id/questions — flat list milik survei (terurut). */
export function getQuestions(questions: Question[], surveyId: string): Question[] {
  return questions
    .filter((q) => q.surveyId === surveyId)
    .sort((a, b) => a.urutan - b.urutan);
}

export interface QuestionTreeNode {
  question: Question;
  children: QuestionTreeNode[];
}

/** Susun hirarki dari flat list via parentId (klien). parentId === null = tingkat atas. */
export function buildTree(questions: Question[], surveyId: string): QuestionTreeNode[] {
  const own = getQuestions(questions, surveyId);
  const byParent = new Map<string | null, Question[]>();
  for (const q of own) {
    const key = q.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(q);
  }
  const build = (parentId: string | null): QuestionTreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.urutan - b.urutan)
      .map((question) => ({ question, children: build(question.id) }));
  return build(null);
}

/** POST /api/surveys/:id/questions */
export function addQuestion(surveyId: string, q: Omit<Question, 'id' | 'surveyId'>): Question {
  return useSurveyStore.getState().addQuestion(surveyId, q);
}

/** PATCH /api/surveys/:id/questions/:qid */
export function updateQuestion(qid: string, patch: Partial<Question>): void {
  useSurveyStore.getState().updateQuestion(qid, patch);
}

/** DELETE /api/surveys/:id/questions/:qid */
export function deleteQuestion(qid: string): void {
  useSurveyStore.getState().deleteQuestion(qid);
}

/** POST /api/surveys/:id/questions/reorder */
export function reorderQuestions(
  updates: Array<{ id: string; urutan: number; parentId: string | null }>,
): void {
  useSurveyStore.getState().reorderQuestions(updates);
}

export function setLogic(qid: string, logic: ConditionGroup | undefined): void {
  useSurveyStore.getState().setLogic(qid, logic);
}
