// Editor pertanyaan 8 tipe (PRD §8.4) — satu template, Section 3 ditukar per tipe (§14.4).
import { useState } from 'react';
import { FormField } from '@/components/FormField';
import { Toggle } from '@/components/Toggle';
import { Icon } from '@/components/Icon';
import { ScalePreview } from '@/components/ScalePreview';
import { SortableList } from '@/components/SortableList';
import { TypePicker } from './TypePicker';
import { ConditionBuilder } from './ConditionBuilder';
import { useSurveyStore } from '@/store/useSurveyStore';
import { addQuestion, deleteQuestion, updateQuestion } from '@/data/questions';
import { genId } from '@/lib/id';
import { isPilihan, isSkala, nextKode, scaleTypeFor } from '@/lib/questionMeta';
import type { Condition, Question, QuestionOption, QuestionType, Scale } from '@/types';

interface QuestionEditorProps {
  surveyId: string;
  mode: 'add' | 'edit';
  questionId?: string;
  defaultParentId?: string | null;
  onCancel: () => void;
  onSaved: (questionId: string) => void;
  onDeleted?: () => void;
  onToast: (msg: string) => void;
}

interface Draft {
  tipe: QuestionType;
  teks: string;
  parentId: string | null;
  kode: string;
  urutan: number;
  wajibDiisi: boolean;
  acakOpsi: boolean;
  scaleId?: string;
  options: QuestionOption[];
  conditions: Condition[];
}

function descendantIds(questions: Question[], rootId: string): Set<string> {
  const set = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const q of questions) {
      if (q.parentId === cur && !set.has(q.id)) {
        set.add(q.id);
        stack.push(q.id);
      }
    }
  }
  return set;
}

function defaultsForType(tipe: QuestionType, scales: Scale[]): { scaleId?: string; options: QuestionOption[] } {
  const st = scaleTypeFor(tipe);
  if (st) return { scaleId: scales.find((s) => s.tipe === st)?.id, options: [] };
  if (isPilihan(tipe)) {
    return {
      options: [
        { id: genId('opt'), label: '', urutan: 1, ...(tipe === 'PILIHAN_TUNGGAL' ? { skor: 0 } : {}) },
        { id: genId('opt'), label: '', urutan: 2, ...(tipe === 'PILIHAN_TUNGGAL' ? { skor: 0 } : {}) },
      ],
    };
  }
  return { options: [] };
}

export function QuestionEditor({
  surveyId,
  mode,
  questionId,
  defaultParentId = null,
  onCancel,
  onSaved,
  onDeleted,
  onToast,
}: QuestionEditorProps) {
  const scales = useSurveyStore((s) => s.scales);
  const questions = useSurveyStore((s) => s.questions);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>(() => {
    const all = useSurveyStore.getState().questions;
    const allScales = useSurveyStore.getState().scales;
    if (mode === 'edit' && questionId) {
      const q = all.find((x) => x.id === questionId)!;
      return {
        tipe: q.tipe,
        teks: q.teks,
        parentId: q.parentId,
        kode: q.kode,
        urutan: q.urutan,
        wajibDiisi: q.wajibDiisi,
        acakOpsi: q.acakOpsi ?? false,
        scaleId: q.scaleId,
        options: q.options ? q.options.map((o) => ({ ...o })) : [],
        conditions: q.logic?.conditions ? q.logic.conditions.map((c) => ({ ...c })) : [],
      };
    }
    const parent = defaultParentId ? all.find((x) => x.id === defaultParentId) : undefined;
    const sibCount = all.filter((x) => x.surveyId === surveyId && x.parentId === defaultParentId).length;
    const tipe: QuestionType = 'TEKS';
    return {
      tipe,
      teks: '',
      parentId: defaultParentId,
      kode: nextKode(all, surveyId, defaultParentId, parent?.kode),
      urutan: sibCount + 1,
      wajibDiisi: true,
      acakOpsi: false,
      conditions: [],
      ...defaultsForType(tipe, allScales),
    };
  });

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const changeType = (tipe: QuestionType) =>
    setDraft((d) => {
      if (isPilihan(d.tipe) && isPilihan(tipe)) return { ...d, tipe };
      return { ...d, tipe, ...defaultsForType(tipe, scales) };
    });

  // Opsi parent: grup di survei ini, kecuali diri & keturunannya.
  const excluded = questionId ? descendantIds(questions, questionId) : new Set<string>();
  const groupOptions = questions.filter(
    (q) => q.surveyId === surveyId && q.isGroup && q.id !== questionId && !excluded.has(q.id),
  );

  const selectedScale = draft.scaleId ? scales.find((s) => s.id === draft.scaleId) : undefined;

  // ---- opsi (pilihan) ----
  const addOption = () =>
    patch({
      options: [
        ...draft.options,
        {
          id: genId('opt'),
          label: '',
          urutan: draft.options.length + 1,
          ...(draft.tipe === 'PILIHAN_TUNGGAL' ? { skor: 0 } : {}),
        },
      ],
    });
  const updateOption = (id: string, p: Partial<QuestionOption>) =>
    patch({ options: draft.options.map((o) => (o.id === id ? { ...o, ...p } : o)) });
  const removeOption = (id: string) =>
    patch({ options: draft.options.filter((o) => o.id !== id) });
  const reorderOptions = (ids: string[]) =>
    patch({
      options: ids
        .map((id, i) => {
          const o = draft.options.find((x) => x.id === id)!;
          return { ...o, urutan: i + 1 };
        }),
    });
  const useScaleMaster = () => {
    const puas = scales.find((s) => s.tipe === 'KEPUASAN');
    if (!puas) return;
    patch({
      options: puas.labels.map((label, i) => ({
        id: genId('opt'),
        label,
        urutan: i + 1,
        ...(draft.tipe === 'PILIHAN_TUNGGAL' ? { skor: i + 1 } : {}),
      })),
    });
  };

  // ---- simpan ----
  const buildPayload = (): Omit<Question, 'id' | 'surveyId'> | null => {
    if (!draft.teks.trim()) {
      setError('Teks pertanyaan wajib diisi.');
      return null;
    }
    const cleanOptions = draft.options
      .filter((o) => o.label.trim() !== '')
      .map((o, i) => ({ ...o, label: o.label.trim(), urutan: i + 1 }));
    if (draft.tipe === 'PILIHAN_GANDA' && cleanOptions.length < 2) {
      setError('Pilihan ganda wajib minimal 2 opsi.');
      return null;
    }
    if (draft.tipe === 'PILIHAN_TUNGGAL' && cleanOptions.length < 1) {
      setError('Tambahkan minimal 1 opsi.');
      return null;
    }
    setError(null);
    const existing = questionId ? questions.find((q) => q.id === questionId) : undefined;
    return {
      kode: draft.kode.trim(),
      parentId: draft.parentId,
      teks: draft.teks.trim(),
      tipe: draft.tipe,
      urutan: draft.urutan,
      wajibDiisi: draft.tipe === 'GRUP' ? false : draft.wajibDiisi,
      acakOpsi: draft.tipe === 'PILIHAN_TUNGGAL' ? draft.acakOpsi : undefined,
      scaleId: isSkala(draft.tipe) ? draft.scaleId : undefined,
      options: isPilihan(draft.tipe) ? cleanOptions : undefined,
      logic: draft.conditions.length ? { conditions: draft.conditions } : undefined,
      isGroup: draft.tipe === 'GRUP',
      childCount: draft.tipe === 'GRUP' ? existing?.childCount ?? 0 : undefined,
    };
  };

  const resetForAddAgain = () => {
    const all = useSurveyStore.getState().questions;
    const parent = draft.parentId ? all.find((x) => x.id === draft.parentId) : undefined;
    const sibCount = all.filter((x) => x.surveyId === surveyId && x.parentId === draft.parentId).length;
    setDraft((d) => ({
      ...d,
      teks: '',
      kode: nextKode(all, surveyId, d.parentId, parent?.kode),
      urutan: sibCount + 1,
      conditions: [],
      ...defaultsForType(d.tipe, scales),
    }));
  };

  const handleSave = (addAgain: boolean) => {
    const payload = buildPayload();
    if (!payload) return;
    if (mode === 'edit' && questionId) {
      updateQuestion(questionId, payload);
      onToast('Pertanyaan disimpan');
      onSaved(questionId);
      return;
    }
    const q = addQuestion(surveyId, payload);
    onToast('Pertanyaan ditambahkan');
    if (addAgain) resetForAddAgain();
    else onSaved(q.id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb + judul */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-1 text-body-sm text-text-secondary">
          <Icon name="folder" size={16} />
          <span>Struktur pertanyaan</span>
          <Icon name="chevron_right" size={16} />
          <span className="text-text-primary">
            {mode === 'add' ? 'Tambah pertanyaan' : `Edit ${draft.kode}`}
          </span>
        </div>
        <h2 className="mt-1 text-headline-sm">
          {mode === 'add' ? 'Tambah pertanyaan' : 'Edit pertanyaan'}
        </h2>
      </div>

      {/* Body scroll */}
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {/* Section 1 — tipe */}
        <div>
          <p className="mb-2 text-label-md uppercase text-text-secondary">Tipe pertanyaan</p>
          <TypePicker value={draft.tipe} onChange={changeType} />
        </div>

        {/* Section 2 — field umum */}
        <FormField label="Teks pertanyaan" htmlFor="q-teks" required error={error ?? undefined}>
          <textarea
            id="q-teks"
            rows={2}
            className="input h-auto py-2"
            placeholder="Tulis pertanyaan di sini..."
            value={draft.teks}
            onChange={(e) => patch({ teks: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Induk (parent)" htmlFor="q-parent">
            <select
              id="q-parent"
              className="input"
              value={draft.parentId ?? ''}
              onChange={(e) => patch({ parentId: e.target.value || null })}
            >
              <option value="">Pertanyaan utama (tingkat atas)</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.kode} — {g.teks}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Kode" htmlFor="q-kode" helper="Dibuat otomatis, bisa diubah">
            <input
              id="q-kode"
              className="input font-mono"
              value={draft.kode}
              onChange={(e) => patch({ kode: e.target.value })}
            />
          </FormField>

          <FormField label="Urutan" htmlFor="q-urutan">
            <input
              id="q-urutan"
              type="number"
              className="input"
              value={draft.urutan}
              onChange={(e) => patch({ urutan: Number(e.target.value) })}
            />
          </FormField>

          {draft.tipe !== 'GRUP' && (
            <FormField label="Wajib diisi" helper={draft.wajibDiisi ? 'Aktif' : 'Nonaktif'}>
              <div className="flex h-10 items-center">
                <Toggle checked={draft.wajibDiisi} onChange={(v) => patch({ wajibDiisi: v })} />
              </div>
            </FormField>
          )}
        </div>

        {/* Section 3 — per tipe */}
        <Section3
          draft={draft}
          scales={scales}
          selectedScale={selectedScale}
          onScaleChange={(id) => patch({ scaleId: id })}
          onAcakChange={(v) => patch({ acakOpsi: v })}
          onAddOption={addOption}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          onReorderOptions={reorderOptions}
          onUseScaleMaster={useScaleMaster}
        />

        {/* Logika Tampil */}
        {draft.tipe !== 'GRUP' && (
          <div>
            <p className="mb-2 text-label-md uppercase text-text-secondary">Logika tampil</p>
            <div className="card p-4">
              <ConditionBuilder
                surveyId={surveyId}
                currentQuestionId={questionId}
                conditions={draft.conditions}
                onChange={(conditions) => patch({ conditions })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        {mode === 'edit' && questionId && onDeleted && (
          <button
            type="button"
            className="btn-ghost mr-auto text-error hover:bg-error/10"
            onClick={() => {
              deleteQuestion(questionId);
              onToast('Pertanyaan dihapus');
              onDeleted();
            }}
          >
            <Icon name="delete" size={18} />
            Hapus
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        {mode === 'add' && (
          <button type="button" className="btn-secondary" onClick={() => handleSave(true)}>
            Simpan &amp; tambah lagi
          </button>
        )}
        <button type="button" className="btn-primary" onClick={() => handleSave(false)}>
          <Icon name="check" size={18} />
          Simpan pertanyaan
        </button>
      </div>
    </div>
  );
}

// ---- Section 3 (field per tipe) ----
interface Section3Props {
  draft: Draft;
  scales: Scale[];
  selectedScale?: Scale;
  onScaleChange: (id: string) => void;
  onAcakChange: (v: boolean) => void;
  onAddOption: () => void;
  onUpdateOption: (id: string, p: Partial<QuestionOption>) => void;
  onRemoveOption: (id: string) => void;
  onReorderOptions: (ids: string[]) => void;
  onUseScaleMaster: () => void;
}

function Section3({
  draft,
  scales,
  selectedScale,
  onScaleChange,
  onAcakChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onReorderOptions,
  onUseScaleMaster,
}: Section3Props) {
  const st = scaleTypeFor(draft.tipe);

  if (draft.tipe === 'TEKS' || draft.tipe === 'GRUP') return null;

  if (draft.tipe === 'YA_TIDAK') {
    return (
      <FormField label="Opsi jawaban" helper="Opsi tetap, tidak dapat diubah">
        <div className="flex gap-2">
          {['Ya', 'Tidak'].map((v) => (
            <span key={v} className="rounded-full border border-border bg-background px-4 py-1.5 text-body-md">
              {v}
            </span>
          ))}
        </div>
      </FormField>
    );
  }

  if (st) {
    const matching = scales.filter((s) => s.tipe === st);
    return (
      <div className="space-y-3">
        <FormField label="Skala jawaban" htmlFor="q-scale">
          <div className="flex items-center gap-3">
            <select
              id="q-scale"
              className="input"
              value={draft.scaleId ?? ''}
              onChange={(e) => onScaleChange(e.target.value)}
            >
              {matching.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-body-sm text-primary">Kelola skala</span>
          </div>
        </FormField>
        {selectedScale && (
          <div className="card bg-background p-4">
            <p className="mb-2 text-label-md uppercase text-text-secondary">Preview</p>
            <ScalePreview scale={selectedScale} />
          </div>
        )}
      </div>
    );
  }

  // PILIHAN_TUNGGAL / PILIHAN_GANDA
  const tunggal = draft.tipe === 'PILIHAN_TUNGGAL';
  return (
    <div className="space-y-3">
      {tunggal && (
        <div className="flex items-center justify-between">
          <span className="text-body-md">Acak Opsi</span>
          <Toggle checked={draft.acakOpsi} onChange={onAcakChange} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-label-md uppercase text-text-secondary">Opsi jawaban</p>
        {tunggal && (
          <button type="button" className="btn-ghost px-0 text-body-sm" onClick={onUseScaleMaster}>
            <Icon name="auto_awesome" size={16} />
            Gunakan Skala Master
          </button>
        )}
      </div>

      <SortableList
        items={draft.options}
        onReorder={onReorderOptions}
        renderItem={(opt, handle) => (
          <div className="mb-2 flex items-center gap-2">
            {handle}
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-secondary">
              <Icon name={tunggal ? 'radio_button_unchecked' : 'check_box_outline_blank'} size={18} />
            </span>
            <input
              className="input flex-1"
              placeholder="Label opsi"
              value={opt.label}
              onChange={(e) => onUpdateOption(opt.id, { label: e.target.value })}
            />
            {tunggal && (
              <input
                type="number"
                className="input w-24"
                placeholder="Skor"
                value={opt.skor ?? 0}
                onChange={(e) => onUpdateOption(opt.id, { skor: Number(e.target.value) })}
              />
            )}
            <button
              type="button"
              aria-label="Hapus opsi"
              onClick={() => onRemoveOption(opt.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-primary-tint hover:text-error"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
      />

      {!tunggal && <p className="text-body-sm text-text-secondary">Minimal 2 opsi.</p>}

      <button type="button" className="btn-secondary" onClick={onAddOption}>
        <Icon name="add" size={18} />
        Tambah opsi
      </button>
    </div>
  );
}
