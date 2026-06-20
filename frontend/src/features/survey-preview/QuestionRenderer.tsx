// Render kontrol jawaban satu pertanyaan (non-grup) berdasarkan `tipe`.
// Skala dibaca dari snapshot `question.scale` (bukan katalog master) — lihat DATABASE.md §2.4.
import { useMemo, type ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { StarRating } from '@/components/StarRating';
import type { Question, QuestionOption } from '@/types';
import type { AnswerValue } from './preview.types';

interface Props {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  error?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Missing({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-body-sm text-accent">
      <Icon name="warning" size={16} fill /> {text}
    </p>
  );
}

export function QuestionRenderer({ question: q, value, onChange, error }: Props) {
  const opts = useMemo<QuestionOption[]>(() => {
    const base = [...(q.options ?? [])].sort((a, b) => a.urutan - b.urutan);
    return q.acakOpsi ? shuffle(base) : base;
  }, [q.id, q.acakOpsi, q.options]);

  const name = `q_${q.id}`;

  const renderControl = (): ReactNode => {
    switch (q.tipe) {
      case 'SKALA_KEPUASAN':
      case 'SKALA_PERSETUJUAN': {
        if (!q.scale) return <Missing text="Skala belum dipilih untuk pertanyaan ini" />;
        return (
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {q.scale.labels.map((label, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name={name}
                  className="mt-1 accent-primary"
                  checked={value?.number === i + 1}
                  onChange={() => onChange({ number: i + 1 })}
                />
                <span className="flex flex-col gap-0.5">
                  <StarRating filled={i + 1} total={q.scale!.poin} />
                  <span className="text-body-sm text-text-secondary">{label}</span>
                </span>
              </label>
            ))}
          </div>
        );
      }
      case 'NPS': {
        if (!q.scale) return <Missing text="Skala NPS belum dipilih untuk pertanyaan ini" />;
        return (
          <div>
            <div className="flex flex-wrap gap-2">
              {q.scale.labels.map((label) => {
                const num = Number(label);
                const selected = value?.number === num;
                return (
                  <label
                    key={label}
                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded border text-body-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary font-medium text-white'
                        : 'border-border hover:border-border-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name={name}
                      className="sr-only"
                      checked={selected}
                      onChange={() => onChange({ number: num })}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            {(q.scale.endpointKiri || q.scale.endpointKanan) && (
              <div className="mt-1.5 flex justify-between text-body-sm text-text-secondary">
                <span>{q.scale.endpointKiri}</span>
                <span>{q.scale.endpointKanan}</span>
              </div>
            )}
          </div>
        );
      }
      case 'YA_TIDAK':
        return (
          <div className="flex gap-6">
            {['Ya', 'Tidak'].map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={name}
                  className="accent-primary"
                  checked={value?.text === opt}
                  onChange={() => onChange({ text: opt })}
                />
                <span className="text-body-md">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'PILIHAN_TUNGGAL':
        return (
          <div className="flex flex-col gap-2">
            {opts.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={name}
                  className="accent-primary"
                  checked={value?.text === o.label}
                  onChange={() => onChange({ text: o.label })}
                />
                <span className="text-body-md">{o.label}</span>
              </label>
            ))}
          </div>
        );
      case 'PILIHAN_GANDA': {
        const sel = value?.json ?? [];
        const toggle = (label: string) =>
          onChange({
            json: sel.includes(label) ? sel.filter((x) => x !== label) : [...sel, label],
          });
        return (
          <div className="flex flex-col gap-2">
            {opts.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={sel.includes(o.label)}
                  onChange={() => toggle(o.label)}
                />
                <span className="text-body-md">{o.label}</span>
              </label>
            ))}
          </div>
        );
      }
      case 'TEKS':
        return (
          <textarea
            rows={3}
            placeholder="Input Jawaban"
            value={value?.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            className={`w-full rounded border bg-surface px-3 py-2 text-body-md placeholder:text-text-secondary focus:border-primary focus:outline-none ${
              error ? 'border-error' : 'border-border'
            }`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {renderControl()}
      {error && <p className="mt-1 text-body-sm text-error">{error}</p>}
    </div>
  );
}
