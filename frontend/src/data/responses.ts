// Lapisan akses transaksi: undangan, response, agregat dashboard, & generator dummy.
// Dashboard membaca dari SNAPSHOT di responses[].answers — bukan master questions (docs/DATABASE.md §6).
import type {
  IdentityField,
  Question,
  ResponseSubmission,
  SubmitResult,
  SurveyInvitation,
  SurveyResponse,
  Transaction,
} from '@/types';
import { useSurveyStore } from '@/store/useSurveyStore';
import { computeNps } from '@/lib/scoring';
import { nowIso } from '@/lib/format';
import { autoValue, choiceOptions, isVisible } from '@/features/survey-preview/engine';
import type { AnswerMap, AnswerValue } from '@/features/survey-preview/preview.types';

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---- Baca ----
export function getInvitations(surveyId: string): SurveyInvitation[] {
  return useSurveyStore.getState().invitations.filter((i) => i.surveyId === surveyId);
}

export function getInvitationByToken(token: string): SurveyInvitation | undefined {
  return useSurveyStore.getState().invitations.find((i) => i.token === token);
}

export function getTransaction(id: string): Transaction | undefined {
  return useSurveyStore.getState().transactions.find((t) => t.id === id);
}

export function getResponses(surveyId: string): SurveyResponse[] {
  return useSurveyStore.getState().responses.filter((r) => r.surveyId === surveyId);
}

// ---- Mutasi (wrap store) ----
export function generateInvitations(surveyId: string): SurveyInvitation[] {
  return useSurveyStore.getState().generateInvitations(surveyId);
}

export function markOpened(token: string): void {
  useSurveyStore.getState().markInvitationOpened(token);
}

export function submitResponse(token: string, payload: ResponseSubmission): SubmitResult {
  return useSurveyStore.getState().submitResponse(token, payload);
}

/** Resolver identitas OTOMATIS/SISTEM dari transaksi (dipakai form responden & dummy). */
export function transactionAutoResolver(txn: Transaction) {
  return (f: IdentityField): string => {
    if (f.sumber === 'SISTEM') return autoValue(f);
    const n = f.nama.toLowerCase();
    if (n.includes('billing')) return txn.noBilling;
    if (n.includes('cabang')) return txn.namaCabang ?? autoValue(f);
    if (n.includes('entitas')) return txn.namaEntitas ?? autoValue(f);
    if (n.includes('perusahaan') || n.includes('kapal') || n.includes('vessel'))
      return txn.namaPerusahaan ?? autoValue(f);
    if (n.includes('email')) return txn.email ?? autoValue(f);
    return autoValue(f); // enumerator, agen, npwp, negara, dll → heuristik
  };
}

// ---- Agregat dashboard (compute-on-read dari snapshot) ----
export interface QuestionResult {
  kode: string;
  teks: string;
  tipe: Question['tipe'];
  n: number;
  avgSkor?: number;
  distribusi: Array<{ label: string; count: number }>;
}

export interface FacetResult {
  nilai: string;
  n: number;
  csi?: number;
}

export interface SurveyResults {
  jumlahUndangan: number;
  jumlahResponden: number;
  responseRate: number; // %
  csi?: number;
  npsScore?: number;
  perQuestion: QuestionResult[];
  facetOptions: string[]; // nama field identitas yang bisa di-breakdown
  byFacet?: FacetResult[]; // bila facet dipilih
}

function distribusiKey(a: SurveyResponse['answers'][number]): string[] {
  switch (a.tipe) {
    case 'SKALA_KEPUASAN':
    case 'SKALA_PERSETUJUAN': {
      const idx = (a.valueNumber ?? 0) - 1;
      const label = a.scale?.labels[idx] ?? String(a.valueNumber ?? '—');
      return [label];
    }
    case 'NPS':
      return [String(a.valueNumber ?? '—')];
    case 'YA_TIDAK':
    case 'PILIHAN_TUNGGAL':
      return a.valueText ? [a.valueText] : [];
    case 'PILIHAN_GANDA':
      return a.valueOptions ?? [];
    default:
      return []; // TEKS → tidak diagregasi
  }
}

export function computeResults(surveyId: string, facet?: string): SurveyResults {
  const responses = getResponses(surveyId);
  const invitations = getInvitations(surveyId);
  const questions = useSurveyStore.getState().questions.filter((q) => q.surveyId === surveyId);
  const identityFields = useSurveyStore
    .getState()
    .identityFields.filter((f) => f.surveyId === surveyId);

  const order = new Map(questions.map((q, i) => [q.kode, i]));

  // CSI rata-rata antar response; NPS dari nilai NPS tiap response.
  const csiVals = responses.map((r) => r.csi).filter((v): v is number => v != null);
  const npsVals = responses.map((r) => r.npsValue).filter((v): v is number => v != null);

  // Agregasi per pertanyaan dari snapshot answers.
  type Acc = {
    kode: string;
    teks: string;
    tipe: Question['tipe'];
    n: number;
    sumSkor: number;
    cntSkor: number;
    dist: Map<string, number>;
  };
  const accs = new Map<string, Acc>();
  for (const r of responses) {
    for (const a of r.answers) {
      let g = accs.get(a.questionKode);
      if (!g) {
        g = { kode: a.questionKode, teks: a.teks, tipe: a.tipe, n: 0, sumSkor: 0, cntSkor: 0, dist: new Map() };
        accs.set(a.questionKode, g);
      }
      g.n++;
      if (a.skor != null) {
        g.sumSkor += a.skor;
        g.cntSkor++;
      }
      for (const key of distribusiKey(a)) g.dist.set(key, (g.dist.get(key) ?? 0) + 1);
    }
  }

  const perQuestion: QuestionResult[] = [...accs.values()]
    .sort((a, b) => (order.get(a.kode) ?? 999) - (order.get(b.kode) ?? 999))
    .map((g) => ({
      kode: g.kode,
      teks: g.teks,
      tipe: g.tipe,
      n: g.n,
      avgSkor: g.cntSkor > 0 ? round1(g.sumSkor / g.cntSkor) : undefined,
      distribusi: [...g.dist.entries()].map(([label, count]) => ({ label, count })),
    }));

  // Field identitas yang layak di-breakdown (OTOMATIS/PILIHAN, bukan teks bebas/sistem).
  const facetOptions = identityFields
    .filter((f) => f.sumber === 'OTOMATIS' || f.sumber === 'PILIHAN')
    .map((f) => f.nama);

  let byFacet: FacetResult[] | undefined;
  if (facet) {
    const groups = new Map<string, { csi: number[]; n: number }>();
    for (const r of responses) {
      const nilai = r.identity.find((it) => it.nama === facet)?.nilai ?? '—';
      const g = groups.get(nilai) ?? { csi: [], n: 0 };
      g.n++;
      if (r.csi != null) g.csi.push(r.csi);
      groups.set(nilai, g);
    }
    byFacet = [...groups.entries()]
      .map(([nilai, g]) => ({
        nilai,
        n: g.n,
        csi: g.csi.length ? round1(g.csi.reduce((s, v) => s + v, 0) / g.csi.length) : undefined,
      }))
      .sort((a, b) => b.n - a.n);
  }

  return {
    jumlahUndangan: invitations.length,
    jumlahResponden: responses.length,
    responseRate: invitations.length ? round1((responses.length / invitations.length) * 100) : 0,
    csi: csiVals.length ? round1(csiVals.reduce((s, v) => s + v, 0) / csiVals.length) : undefined,
    npsScore: computeNps(npsVals),
    perQuestion,
    facetOptions,
    byFacet,
  };
}

// ---- Generator respon dummy (menghidupkan dashboard) ----
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

const NAMA_SAMPLE = ['Andi Pratama', 'Siti Rahma', 'Budi Santoso', 'Dewi Lestari', 'Rudi Hartono', 'Maya Putri'];
const TEKS_SAMPLE = [
  'Pelayanan sudah baik, pertahankan.',
  'Mohon percepat proses bongkar muat.',
  'Petugas ramah dan informatif.',
  'Perlu perbaikan fasilitas terminal.',
  'Sistem digital sangat membantu.',
];

function randomAnswerValue(q: Question): AnswerValue | null {
  switch (q.tipe) {
    case 'SKALA_KEPUASAN':
    case 'SKALA_PERSETUJUAN': {
      const poin = q.scale?.poin ?? 4;
      // bias ke arah positif agar CSI realistis
      const n = Math.random() < 0.7 ? randInt(Math.ceil(poin / 2) + 1, poin) : randInt(1, poin);
      return { number: Math.min(n, poin) };
    }
    case 'NPS':
      return { number: Math.random() < 0.6 ? randInt(7, 10) : randInt(0, 6) };
    case 'YA_TIDAK':
      return { text: Math.random() < 0.6 ? 'Ya' : 'Tidak' };
    case 'PILIHAN_TUNGGAL': {
      const opts = q.options ?? [];
      return opts.length ? { text: pick(opts).label } : null;
    }
    case 'PILIHAN_GANDA': {
      const opts = q.options ?? [];
      if (!opts.length) return null;
      const chosen = opts.filter(() => Math.random() < 0.4).map((o) => o.label);
      return { json: chosen.length ? chosen : [pick(opts).label] };
    }
    case 'TEKS':
      return { text: pick(TEKS_SAMPLE) };
    default:
      return null;
  }
}

function randomIdentityValue(f: IdentityField): string {
  if (f.sumber === 'PILIHAN') return pick(choiceOptions(f));
  const n = f.nama.toLowerCase();
  if (n.includes('wa') || n.includes('handphone') || n.includes('hp'))
    return `08${randInt(11, 99)}${randInt(1000000, 9999999)}`;
  if (n.includes('email')) return `responden${randInt(1, 999)}@contoh.co.id`;
  return pick(NAMA_SAMPLE);
}

/** Isi store dengan n response acak (valid, hormati logika tampil). Return jumlah berhasil. */
export function generateDummyResponses(surveyId: string, n: number): number {
  const store = useSurveyStore.getState();
  const survey = store.surveys.find((s) => s.id === surveyId);
  if (!survey) return 0;
  store.generateInvitations(surveyId); // pastikan undangan tersedia

  const state = useSurveyStore.getState();
  const invites = state.invitations.filter((i) => i.surveyId === surveyId && i.status !== 'selesai');
  const questions = state.questions.filter((q) => q.surveyId === surveyId);
  const idFields = [...state.identityFields.filter((f) => f.surveyId === surveyId)].sort(
    (a, b) => a.urutan - b.urutan,
  );
  const target = Math.min(n, invites.length);
  let done = 0;

  for (let k = 0; k < target; k++) {
    const inv = invites[k];
    const txn = state.transactions.find((t) => t.id === inv.transactionId);
    if (!txn) continue;
    const resolver = transactionAutoResolver(txn);

    // Bangun jawaban incremental agar logika tampil dihormati.
    const answers: AnswerMap = {};
    for (const q of questions) {
      if (q.isGroup) continue;
      if (!isVisible(q, questions, answers)) continue;
      const v = randomAnswerValue(q);
      if (v) answers[q.id] = v;
    }

    const submission: ResponseSubmission = {
      submittedAt: nowIso(),
      identitas: idFields.map((f) => ({
        nama: f.nama,
        sumber: f.sumber,
        nilai:
          f.sumber === 'OTOMATIS' || f.sumber === 'SISTEM' ? resolver(f) : randomIdentityValue(f),
      })),
      jawaban: questions
        .filter((q) => !q.isGroup && answers[q.id])
        .map((q) => ({
          kode: q.kode,
          teks: q.teks,
          valueText: answers[q.id].text,
          valueNumber: answers[q.id].number,
          valueJson: answers[q.id].json,
        })),
    };

    if (useSurveyStore.getState().submitResponse(inv.token, submission).ok) done++;
  }
  return done;
}
