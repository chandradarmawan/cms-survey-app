// Sumber data terpusat (Zustand). Komponen baca via selector, ubah via action.
// PRD §10. Untuk pindah ke backend nyata: bungkus action di src/data/* jadi fetch.
import { create } from 'zustand';
import type {
  ConditionGroup,
  IdentityField,
  InvitationStatus,
  JenisNota,
  Question,
  ResponseAnswer,
  ResponseSubmission,
  Scale,
  SubmitResult,
  Survey,
  SurveyInvitation,
  SurveyResponse,
  Transaction,
} from '@/types';
import { genId } from '@/lib/id';
import { nowIso } from '@/lib/format';
import { answerScore, channelForJenisNota, computeCsi } from '@/lib/scoring';
import {
  seedIdentityFields,
  seedQuestions,
  seedScales,
  seedSurveys,
  seedTransactions,
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
  // Lapisan transaksi (docs/DATABASE.md §6)
  transactions: Transaction[];
  invitations: SurveyInvitation[];
  responses: SurveyResponse[];

  // actions
  createSurvey: (input: CreateSurveyInput) => Survey;
  updateSurvey: (id: string, patch: Partial<Survey>) => void;
  activateSurvey: (id: string) => void;

  // Master data: katalog skala (global). Snapshot di question lepas dari katalog ini.
  addScale: (s: Omit<Scale, 'id'>) => Scale;
  updateScale: (id: string, patch: Partial<Scale>) => void;
  deleteScale: (id: string) => void;

  addQuestion: (surveyId: string, q: Omit<Question, 'id' | 'surveyId'>) => Question;
  updateQuestion: (qid: string, patch: Partial<Question>) => void;
  deleteQuestion: (qid: string) => void;
  reorderQuestions: (updates: Array<{ id: string; urutan: number; parentId: string | null }>) => void;
  setLogic: (qid: string, logic: ConditionGroup | undefined) => void;

  addIdentityField: (surveyId: string, f: Omit<IdentityField, 'id' | 'surveyId' | 'urutan'>) => void;
  updateIdentityField: (id: string, patch: Partial<IdentityField>) => void;
  deleteIdentityField: (id: string) => void;
  reorderIdentityFields: (surveyId: string, orderedIds: string[]) => void;

  // Transaksi: distribusi & pengumpulan jawaban (docs/DATABASE.md §6)
  generateInvitations: (surveyId: string) => SurveyInvitation[];
  markInvitationOpened: (token: string) => void;
  submitResponse: (token: string, payload: ResponseSubmission) => SubmitResult;
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
  transactions: seedTransactions,
  invitations: [],
  responses: [],

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

  addScale: (s) => {
    const scale: Scale = { ...s, id: genId('scl') };
    set((st) => ({ scales: [...st.scales, scale] }));
    return scale;
  },

  // Edit katalog TIDAK menyentuh snapshot di question (integritas historis).
  updateScale: (id, patch) =>
    set((st) => ({
      scales: st.scales.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)),
    })),

  // Hapus katalog aman: question tetap pegang snapshot; cukup putus provenance.
  deleteScale: (id) =>
    set((st) => ({
      scales: st.scales.filter((sc) => sc.id !== id),
      questions: st.questions.map((q) =>
        q.sourceScaleId === id ? { ...q, sourceScaleId: undefined } : q,
      ),
    })),

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

  // ---- Transaksi (docs/DATABASE.md §6) ----

  // Buat undangan untuk tiap transaksi sejenis-nota yang belum diundang (sekali per transaksi).
  generateInvitations: (surveyId) => {
    const state = get();
    const survey = state.surveys.find((sv) => sv.id === surveyId);
    if (!survey) return [];
    const sudah = new Set(
      state.invitations.filter((i) => i.surveyId === surveyId).map((i) => i.transactionId),
    );
    const ts = nowIso();
    const created: SurveyInvitation[] = state.transactions
      .filter((t) => t.jenisNota === survey.jenisNota && !sudah.has(t.id))
      .map((t) => ({
        id: genId('inv'),
        surveyId,
        transactionId: t.id,
        token: genId('tok'),
        channel: channelForJenisNota(survey.jenisNota),
        status: 'terkirim' as InvitationStatus,
        sentAt: ts,
        createdAt: ts,
      }));
    if (created.length) set((s) => ({ invitations: [...s.invitations, ...created] }));
    return created;
  },

  markInvitationOpened: (token) =>
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.token === token && i.status === 'terkirim'
          ? { ...i, status: 'dibuka', openedAt: nowIso() }
          : i,
      ),
    })),

  // Submit atomik: response + answers (snapshot + skor) + identitas; tandai undangan selesai.
  submitResponse: (token, payload) => {
    const state = get();
    const inv = state.invitations.find((i) => i.token === token);
    if (!inv) return { ok: false, error: 'Tautan tidak valid atau sudah tidak berlaku.' };
    if (inv.status === 'selesai' || state.responses.some((r) => r.invitationId === inv.id)) {
      return { ok: false, error: 'Survei untuk tautan ini sudah pernah diisi.' };
    }

    const byKode = new Map(
      state.questions.filter((q) => q.surveyId === inv.surveyId).map((q) => [q.kode, q]),
    );
    const answers: ResponseAnswer[] = payload.jawaban.map((j) => {
      const q = byKode.get(j.kode);
      const tipe = q?.tipe ?? 'TEKS';
      const { skor, skorNormal } = answerScore(
        { tipe, scale: q?.scale, options: q?.options },
        { valueText: j.valueText, valueNumber: j.valueNumber, valueOptions: j.valueJson },
      );
      return {
        questionKode: j.kode,
        sourceQuestionId: q?.id,
        teks: q?.teks ?? j.teks,
        tipe,
        scale: q?.scale,
        options: q?.options,
        valueText: j.valueText,
        valueNumber: j.valueNumber,
        valueOptions: j.valueJson,
        skor,
        skorNormal,
        bobot: 1, // authoring belum punya bobot → seragam (lihat catatan §6 doc)
      };
    });
    const npsAns = answers.find((a) => a.tipe === 'NPS' && a.valueNumber != null);

    const response: SurveyResponse = {
      id: genId('resp'),
      invitationId: inv.id,
      surveyId: inv.surveyId,
      transactionId: inv.transactionId,
      submittedAt: payload.submittedAt ?? nowIso(),
      channel: inv.channel,
      npsValue: npsAns?.valueNumber,
      csi: computeCsi(answers),
      answers,
      identity: payload.identitas.map((it, i) => ({ ...it, urutan: i + 1 })),
    };

    set((s) => ({
      responses: [...s.responses, response],
      invitations: s.invitations.map((i) =>
        i.id === inv.id ? { ...i, status: 'selesai', openedAt: i.openedAt ?? nowIso() } : i,
      ),
      surveys: s.surveys.map((sv) =>
        sv.id === inv.surveyId ? { ...sv, jumlahResponden: sv.jumlahResponden + 1 } : sv,
      ),
    }));
    return { ok: true, response };
  },
}));
