// Logika Tampil — condition-builder (PRD §8.3 enhanced / keputusan §14.8).
// Operator: sama_dengan | tidak_sama_dengan. Relasi antar-kondisi = AND.
import { Icon } from '@/components/Icon';
import { useSurveyStore } from '@/store/useSurveyStore';
import type { Condition, LogicOperator, Question } from '@/types';

const OPERATORS: Array<{ value: LogicOperator; label: string }> = [
  { value: 'sama_dengan', label: 'sama dengan' },
  { value: 'tidak_sama_dengan', label: 'tidak sama dengan' },
];

/** Opsi nilai: value = yang disimpan, label = yang ditampilkan. */
interface ValueOption {
  value: string;
  label: string;
}

/**
 * Nilai yang mungkin untuk pertanyaan sumber (keputusan §14.8).
 * Mengembalikan daftar opsi terbatas (dropdown) untuk semua tipe ber-pilihan/skala;
 * null hanya untuk TEKS (input bebas, tak ada nilai enumerable).
 */
function valueOptions(source: Question | undefined): ValueOption[] | null {
  if (!source) return null;

  if (source.tipe === 'YA_TIDAK')
    return [
      { value: 'Ya', label: 'Ya' },
      { value: 'Tidak', label: 'Tidak' },
    ];

  if (source.tipe === 'PILIHAN_TUNGGAL' || source.tipe === 'PILIHAN_GANDA')
    return (source.options ?? []).map((o) => ({ value: o.label, label: o.label }));

  if (
    source.tipe === 'SKALA_KEPUASAN' ||
    source.tipe === 'SKALA_PERSETUJUAN' ||
    source.tipe === 'NPS'
  ) {
    // Baca snapshot skala yang ditanam di pertanyaan sumber (bukan katalog master).
    const scale = source.scale;
    if (!scale) return null;
    const last = scale.labels.length - 1;
    return scale.labels.map((label, idx) => {
      // NPS: beri keterangan endpoint pada ujung skala agar lebih jelas.
      if (source.tipe === 'NPS' && idx === 0 && scale.endpointKiri)
        return { value: label, label: `${label} — ${scale.endpointKiri}` };
      if (source.tipe === 'NPS' && idx === last && scale.endpointKanan)
        return { value: label, label: `${label} — ${scale.endpointKanan}` };
      return { value: label, label };
    });
  }

  return null; // TEKS → input teks bebas
}

interface ConditionBuilderProps {
  surveyId: string;
  currentQuestionId?: string;
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}

export function ConditionBuilder({
  surveyId,
  currentQuestionId,
  conditions,
  onChange,
}: ConditionBuilderProps) {
  const questions = useSurveyStore((s) => s.questions);

  // Kandidat sumber: pertanyaan non-grup di survei ini, selain dirinya sendiri.
  const sources = questions.filter(
    (q) => q.surveyId === surveyId && !q.isGroup && q.id !== currentQuestionId,
  );
  const byKode = (kode: string) => sources.find((q) => q.kode === kode);

  const update = (i: number, patch: Partial<Condition>) =>
    onChange(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const remove = (i: number) => onChange(conditions.filter((_, idx) => idx !== i));

  const add = () =>
    onChange([
      ...conditions,
      { sourceQuestionKode: sources[0]?.kode ?? '', operator: 'sama_dengan', value: '' },
    ]);

  return (
    <div className="space-y-3">
      {conditions.length === 0 && (
        <p className="text-body-sm text-text-secondary">
          Belum ada kondisi. Pertanyaan selalu ditampilkan.
        </p>
      )}

      {conditions.map((c, i) => {
        const source = byKode(c.sourceQuestionKode);
        const values = valueOptions(source);
        // Pertahankan nilai lama yang tak lagi ada di daftar agar tidak hilang diam-diam.
        const hasCurrent =
          !c.value || (values?.some((v) => v.value === c.value) ?? true);
        return (
          <div key={i} className="space-y-2">
            {i > 0 && <span className="text-label-md uppercase text-text-secondary">dan</span>}
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Pertanyaan sumber"
                className="input w-auto min-w-[180px] flex-1"
                value={c.sourceQuestionKode}
                onChange={(e) => update(i, { sourceQuestionKode: e.target.value, value: '' })}
              >
                <option value="">Pilih pertanyaan...</option>
                {sources.map((q) => (
                  <option key={q.id} value={q.kode}>
                    {q.kode} — {q.teks.slice(0, 40)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Operator"
                className="input w-auto"
                value={c.operator}
                onChange={(e) => update(i, { operator: e.target.value as LogicOperator })}
              >
                {OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {values ? (
                <select
                  aria-label="Nilai"
                  className="input w-auto min-w-[140px] flex-1"
                  value={c.value}
                  onChange={(e) => update(i, { value: e.target.value })}
                >
                  <option value="">Pilih nilai...</option>
                  {values.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                  {!hasCurrent && (
                    <option value={c.value}>{c.value} (nilai lama)</option>
                  )}
                </select>
              ) : (
                <input
                  aria-label="Nilai"
                  className="input w-auto min-w-[140px] flex-1"
                  placeholder="Nilai..."
                  value={c.value}
                  onChange={(e) => update(i, { value: e.target.value })}
                />
              )}

              <button
                type="button"
                aria-label="Hapus kondisi"
                onClick={() => remove(i)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-primary-tint hover:text-error"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn-ghost px-0" onClick={add}>
        <Icon name="add" size={18} />
        Tambah kondisi
      </button>
    </div>
  );
}
