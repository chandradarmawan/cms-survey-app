// Orkestrator form responden: kelola state jawaban + identitas, validasi (hormati
// visibilitas logic), lalu serialize ke payload §6 saat submit. Tanpa persist.
import { useMemo, useState } from 'react';
import type { IdentityField, Question, Survey } from '@/types';
import type { AnswerMap, AnswerValue, IdentityValues, SerializedResponse } from './preview.types';
import { isVisible, serialize, validate } from './engine';
import { InstructionSection } from './InstructionSection';
import { IdentitySection } from './IdentitySection';
import { QuestionSection } from './QuestionSection';

interface Props {
  survey: Survey;
  questions: Question[];
  identityFields: IdentityField[];
  onSubmitted: (payload: SerializedResponse) => void;
  onInfo: (msg: string) => void;
  autoResolver?: (f: IdentityField) => string; // OTOMATIS/SISTEM dari transaksi (mode responden)
  submitLabel?: string;
}

function Divider() {
  return <div className="border-t border-border" />;
}

export function SurveyForm({
  survey,
  questions,
  identityFields,
  onSubmitted,
  onInfo,
  autoResolver,
  submitLabel = 'Submit',
}: Props) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [identityValues, setIdentityValues] = useState<IdentityValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleQuestions = useMemo(
    () => questions.filter((q) => isVisible(q, questions, answers)),
    [questions, answers],
  );

  const clearError = (key: string) =>
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });

  const setAnswer = (qid: string, v: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
    clearError(qid);
  };
  const setIdentity = (id: string, val: string) => {
    setIdentityValues((prev) => ({ ...prev, [id]: val }));
    clearError(id);
  };

  const handleSubmit = () => {
    const errs = validate(identityFields, identityValues, visibleQuestions, answers);
    setErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length > 0) {
      onInfo(`Masih ada ${keys.length} isian wajib yang kosong.`);
      document
        .getElementById(`pf_${keys[0]}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSubmitted(
      serialize(survey, identityFields, identityValues, visibleQuestions, answers, autoResolver),
    );
  };

  const handleReset = () => {
    setAnswers({});
    setIdentityValues({});
    setErrors({});
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <InstructionSection survey={survey} />
      <Divider />
      <IdentitySection
        fields={identityFields}
        values={identityValues}
        onChange={setIdentity}
        errors={errors}
        onPreviewBilling={() => onInfo('Pratinjau nota tagihan (simulasi).')}
        autoResolver={autoResolver}
      />
      <Divider />
      <QuestionSection
        surveyId={survey.id}
        questions={questions}
        answers={answers}
        onAnswer={setAnswer}
        errors={errors}
      />
      <div className="flex items-center justify-between gap-3 pt-2">
        <button type="button" className="btn-ghost" onClick={handleReset}>
          Reset
        </button>
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
