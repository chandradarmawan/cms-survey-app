// Grid 8 tile pemilih tipe pertanyaan (PRD §8.4 Section 1).
import { Icon } from '@/components/Icon';
import { QUESTION_TYPE_META, QUESTION_TYPE_ORDER } from '@/lib/questionMeta';
import type { QuestionType } from '@/types';

interface TypePickerProps {
  value: QuestionType;
  onChange: (t: QuestionType) => void;
}

export function TypePicker({ value, onChange }: TypePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUESTION_TYPE_ORDER.map((t) => {
        const meta = QUESTION_TYPE_META[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-2 rounded p-4 text-center transition-colors ${
              active
                ? 'border-2 border-primary bg-primary-tint'
                : 'border border-border hover:border-border-strong'
            }`}
          >
            <Icon name={meta.icon} size={24} className={active ? 'text-primary' : 'text-text-secondary'} />
            <span className="text-body-sm font-medium text-text-primary">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
