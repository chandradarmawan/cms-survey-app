// Lapisan akses tipis untuk Survey. Signature dipetakan ke REST (PRD §7) agar
// mudah ditukar ke fetch/axios nanti — komponen tidak berubah.
import type { JenisNota, Survey, SurveyStatus, SurveySummary } from '@/types';
import { useSurveyStore, type CreateSurveyInput } from '@/store/useSurveyStore';

export interface SurveyFilter {
  q?: string;
  status?: SurveyStatus | 'semua';
  jenisNota?: JenisNota | 'semua';
}

/** GET /api/surveys — filter klien dari list store (pure). */
export function filterSurveys(surveys: Survey[], filter: SurveyFilter): Survey[] {
  const q = (filter.q ?? '').trim().toLowerCase();
  return surveys.filter((s) => {
    if (q && !`${s.nama} ${s.kode}`.toLowerCase().includes(q)) return false;
    if (filter.status && filter.status !== 'semua' && s.status !== filter.status) return false;
    if (filter.jenisNota && filter.jenisNota !== 'semua' && s.jenisNota !== filter.jenisNota)
      return false;
    return true;
  });
}

/** GET /api/surveys/summary — kartu ringkasan (agregasi via selector). */
export function computeSummary(surveys: Survey[]): SurveySummary {
  return {
    total: surveys.length,
    aktif: surveys.filter((s) => s.status === 'aktif').length,
    draft: surveys.filter((s) => s.status === 'draft').length,
    totalResponden: surveys.reduce((sum, s) => sum + s.jumlahResponden, 0),
  };
}

/** GET /api/surveys/:id */
export function getSurvey(id: string): Survey | undefined {
  return useSurveyStore.getState().surveys.find((s) => s.id === id);
}

/** POST /api/surveys */
export function createSurvey(input: CreateSurveyInput): Survey {
  return useSurveyStore.getState().createSurvey(input);
}

/** PATCH /api/surveys/:id */
export function updateSurvey(id: string, patch: Partial<Survey>): void {
  useSurveyStore.getState().updateSurvey(id, patch);
}

export function activateSurvey(id: string): void {
  useSurveyStore.getState().activateSurvey(id);
}

export function archiveSurvey(id: string): void {
  useSurveyStore.getState().updateSurvey(id, { status: 'arsip' });
}
