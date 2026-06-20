// C. Pertanyaan Umum — susun tree (parentId) lalu render rekursif.
// Grup = sub-judul + anak indentasi; visibilitas dievaluasi live (logic).
import { buildTree, type QuestionTreeNode } from '@/data/questions';
import type { Question } from '@/types';
import type { AnswerMap, AnswerValue } from './preview.types';
import { displayKode, isVisible } from './engine';
import { QuestionRenderer } from './QuestionRenderer';
import { SectionTitle } from './SectionTitle';

interface Props {
  surveyId: string;
  questions: Question[];
  answers: AnswerMap;
  onAnswer: (qid: string, v: AnswerValue) => void;
  errors: Record<string, string>;
}

export function QuestionSection({ surveyId, questions, answers, onAnswer, errors }: Props) {
  const tree = buildTree(questions, surveyId);
  return (
    <section>
      <SectionTitle letter="C" title="Pertanyaan Umum" />
      <div className="mt-4 flex flex-col gap-6">
        {tree.map((node) => (
          <QuestionNode
            key={node.question.id}
            node={node}
            questions={questions}
            answers={answers}
            onAnswer={onAnswer}
            errors={errors}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionNode({
  node,
  questions,
  answers,
  onAnswer,
  errors,
}: {
  node: QuestionTreeNode;
  questions: Question[];
  answers: AnswerMap;
  onAnswer: (qid: string, v: AnswerValue) => void;
  errors: Record<string, string>;
}) {
  const q = node.question;
  if (!isVisible(q, questions, answers)) return null;

  if (q.isGroup) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body-md font-medium text-text-primary">
          <span className="text-text-secondary">{displayKode(q.kode)} </span>
          {q.teks}
        </p>
        <div className="flex flex-col gap-5 border-l-2 border-border pl-4">
          {node.children.map((c) => (
            <QuestionNode
              key={c.question.id}
              node={c}
              questions={questions}
              answers={answers}
              onAnswer={onAnswer}
              errors={errors}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={`pf_${q.id}`} className="flex flex-col gap-2.5">
      <p className="text-body-md text-text-primary">
        <span className="font-medium text-text-secondary">{displayKode(q.kode)} </span>
        {q.teks}
        {q.wajibDiisi && <span className="ml-0.5 text-error">*</span>}
      </p>
      <QuestionRenderer
        question={q}
        value={answers[q.id]}
        onChange={(v) => onAnswer(q.id, v)}
        error={errors[q.id]}
      />
    </div>
  );
}
