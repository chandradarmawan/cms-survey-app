// Lapisan akses tipis untuk Scale (PRD §7). Skala = master data terpusat/global.
import type { Scale } from '@/types';
import { useSurveyStore } from '@/store/useSurveyStore';

/** GET /api/scales */
export function getScales(): Scale[] {
  return useSurveyStore.getState().scales;
}

export function getScale(id: string): Scale | undefined {
  return useSurveyStore.getState().scales.find((s) => s.id === id);
}

/** POST /api/scales */
export function createScale(s: Omit<Scale, 'id'>): Scale {
  return useSurveyStore.getState().addScale(s);
}

/** PATCH /api/scales/:id */
export function updateScale(id: string, patch: Partial<Scale>): void {
  useSurveyStore.getState().updateScale(id, patch);
}

/** DELETE /api/scales/:id */
export function deleteScale(id: string): void {
  useSurveyStore.getState().deleteScale(id);
}
