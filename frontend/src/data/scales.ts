// Lapisan akses tipis untuk Scale (PRD §7). Skala bersifat terpusat/global.
import type { Scale } from '@/types';
import { useSurveyStore } from '@/store/useSurveyStore';

/** GET /api/scales */
export function getScales(): Scale[] {
  return useSurveyStore.getState().scales;
}

export function getScale(id: string): Scale | undefined {
  return useSurveyStore.getState().scales.find((s) => s.id === id);
}
