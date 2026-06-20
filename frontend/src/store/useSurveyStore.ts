// Sumber data terpusat (Zustand). Komponen baca via selector, ubah via action.
// PRD §10. Untuk pindah ke backend nyata: bungkus action di src/data/* jadi fetch.
import { create } from 'zustand';
import type {
  ConditionGroup,
  IdentityField,
  JenisNota,
  Question,
  Scale,
  Survey,
} from '@/types';
import { genId } from '@/lib/id';
import { nowIso } from '@/lib/format';
import {
  seedIdentityFields,
  seedQuestions,
  seedScales,
  seedSurveys,
} from './seed';

export interface CreateSurveyInput {
  method: 'blank' | 'duplicate';
  sourceKode?: string; // wajib bila duplicate
  nama: string;
  kode: string;
  periode: number;
  jenisNota: JenisNota;
  tanggalMulai: string;
  tanggalSelesai: string;
  deskripsi?: string;
}

interface SurveyState {
  surveys: Survey[];
  questions: Question[];
  scales: Scale[];
  identityFields: IdentityField[];

  // actions
  createSurvey: (input: CreateSurveyInput) => Survey;
  updateSurvey: (id: string, patch: Partial<Survey>) => void;
  activateSurvey: (id: string) => void;

  addQuestion: (surveyId: string, q: Omit<Question, 'id' | 'surveyId'>) => Question;
  updateQuestion: (qid: string, patch: Partial<Question>) => void;
  deleteQuestion: (qid: string) => void;
  reorderQuestions: (updates: Array<{ id: string; urutan: number; parentId: string | null }>) => void;
  setLogic: (qid: string, logic: ConditionGroup | undefined) => void;

  addIdentityField: (surveyId: string, f: Omit<IdentityField, 'id' | 'surveyId' | 'urutan'>) => void;
  updateIdentityField: (id: string, patch: Partial<IdentityField>) => void;
  deleteIdentityField: (id: string) => void;
  reorderIdentityFields: (surveyId: string, orderedIds: string[]) => void;
}

function recalcChildCount(questions: Question[], parentId: string): number {
  return questions.filter((q) => q.parentId === parentId).length;
}

function countNonGroup(questions: Question[], surveyId: string): number {
  return questions.filter((q) => q.surveyId === surveyId && !q.isGroup).length;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: seedSurveys,
  questions: seedQuestions,
  scales: seedScales,
  identityFields: seedIdentityFields,

  createSurvey: (input) => {
    const id = genId('srv');
    const ts = nowIso();
    const survey: Survey = {
      id,
      kode: input.kode,
      nama: input.nama,
      jenisNota: input.jenisNota,
      periode: input.periode,
      status: 'draft', // §6.2 selalu mulai draft
      tanggalMulai: input.tanggalMulai,
      tanggalSelesai: input.tanggalSelesai,
      deskripsi: input.deskripsi,
      jumlahPertanyaan: 0,
      jumlahResponden: 0,
      terakhirDiubah: ts,
      createdAt: ts,
    };

    set((s) => {
      let questions = s.questions;
      let identityFields = s.identityFields;

      if (input.method === 'duplicate' && input.sourceKode) {
        // §6.3 salin seluruh struktur pertanyaan + identitas dari survei sumber.
        const source = s.surveys.find((sv) => sv.kode === input.sourceKode);
        if (source) {
          survey.duplicatedFrom = source.kode;
          const idMap = new Map<string, string>();
          const cloned = s.questions
            .filter((q) => q.surveyId === source.id)
            .map((q) => {
              const newId = genId('q');
              idMap.set(q.id, newId);
              return { ...q, id: newId, surveyId: id };
            })
            .map((q) => ({
              ...q,
              parentId: q.parentId ? idMap.get(q.parentId) ?? null : null,
            }));
          questions = [...s.questions, ...cloned];

          const clonedIdentity = s.identityFields
            .filter((f) => f.surveyId === source.id)
            .map((f) => ({ ...f, id: genId('idf'), surveyId: id }));
          identityFields = [...s.identityFields, ...clonedIdentity];

          survey.jumlahPertanyaan = countNonGroup(questions, id);
        }
      }

      return { surveys: [survey, ...s.surveys], questions, identityFields };
    });

    return survey;
  },

  updateSurvey: (id, patch) =>
    set((s) => ({
      surveys: s.surveys.map((sv) =>
        sv.id === id ? { ...sv, ...patch, terakhirDiubah: nowIso() } : sv,
      ),
    })),

  activateSurvey: (id) => get().updateSurvey(id, { status: 'aktif' }),

  addQuestion: (surveyId, q) => {
    const question: Question = { ...q, id: genId('q'), surveyId };
    set((s) => {
      const questions = [...s.questions, question];
      return {
        questions,
        surveys: s.surveys.map((sv) =>
          sv.id === surveyId
            ? {
                ...sv,
                jumlahPertanyaan: countNonGroup(questions, surveyId),
                terakhirDiubah: nowIso(),
              }
            : sv,
        ),
      };
    });
    // sinkronkan childCount induk bila ada
    if (question.parentId) {
      const cnt = recalcChildCount(get().questions, question.parentId);
      get().updateQuestion(question.parentId, { childCount: cnt });
    }
    return question;
  },

  updateQuestion: (qid, patch) =>
    set((s) => ({
      questions: s.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
    })),

  deleteQuestion: (qid) => {
    const target = get().questions.find((q) => q.id === qid);
    if (!target) return;
    set((s) => {
      // hapus pertanyaan + seluruh keturunannya
      const toDelete = new Set<string>([qid]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const q of s.questions) {
          if (q.parentId && toDelete.has(q.parentId) && !toDelete.has(q.id)) {
            toDelete.add(q.id);
            changed = true;
          }
        }
      }
      const questions = s.questions.filter((q) => !toDelete.has(q.id));
      return {
        questions,
        surveys: s.surveys.map((sv) =>
          sv.id === target.surveyId
            ? {
                ...sv,
                jumlahPertanyaan: countNonGroup(questions, target.surveyId),
                terakhirDiubah: nowIso(),
              }
            : sv,
        ),
      };
    });
    if (target.parentId) {
      const cnt = recalcChildCount(get().questions, target.parentId);
      get().updateQuestion(target.parentId, { childCount: cnt });
    }
  },

  reorderQuestions: (updates) =>
    set((s) => ({
      questions: s.questions.map((q) => {
        const u = updates.find((x) => x.id === q.id);
        return u ? { ...q, urutan: u.urutan, parentId: u.parentId } : q;
      }),
    })),

  setLogic: (qid, logic) => get().updateQuestion(qid, { logic }),

  addIdentityField: (surveyId, f) =>
    set((s) => {
      const urutan =
        s.identityFields.filter((x) => x.surveyId === surveyId).length + 1;
      return {
        identityFields: [...s.identityFields, { ...f, id: genId('idf'), surveyId, urutan }],
      };
    }),

  updateIdentityField: (id, patch) =>
    set((s) => ({
      identityFields: s.identityFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),

  deleteIdentityField: (id) =>
    set((s) => ({ identityFields: s.identityFields.filter((f) => f.id !== id) })),

  reorderIdentityFields: (surveyId, orderedIds) =>
    set((s) => ({
      identityFields: s.identityFields.map((f) => {
        if (f.surveyId !== surveyId) return f;
        const idx = orderedIds.indexOf(f.id);
        return idx >= 0 ? { ...f, urutan: idx + 1 } : f;
      }),
    })),
}));
