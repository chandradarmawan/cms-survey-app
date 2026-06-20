// Lapisan akses tipis untuk IdentityField (PRD §7).
import type { IdentityField } from '@/types';
import { useSurveyStore } from '@/store/useSurveyStore';

/** GET /api/surveys/:id/identity-fields — dari list store (pure). */
export function getIdentityFields(fields: IdentityField[], surveyId: string): IdentityField[] {
  return fields
    .filter((f) => f.surveyId === surveyId)
    .sort((a, b) => a.urutan - b.urutan);
}

export function addIdentityField(
  surveyId: string,
  f: Omit<IdentityField, 'id' | 'surveyId' | 'urutan'>,
): void {
  useSurveyStore.getState().addIdentityField(surveyId, f);
}

export function updateIdentityField(id: string, patch: Partial<IdentityField>): void {
  useSurveyStore.getState().updateIdentityField(id, patch);
}

export function deleteIdentityField(id: string): void {
  useSurveyStore.getState().deleteIdentityField(id);
}

export function reorderIdentityFields(surveyId: string, orderedIds: string[]): void {
  useSurveyStore.getState().reorderIdentityFields(surveyId, orderedIds);
}
