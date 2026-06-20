// Definisi rute (PRD §3.1). Navigasi = top tabs (bukan sidebar).
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { SurveyListPage } from '@/features/survey-list/SurveyListPage';
import { QuestionManagePage } from '@/features/question-manage/QuestionManagePage';
import { ScalesPage } from '@/features/scales/ScalesPage';
import { MasterDataPage } from '@/features/master-data/MasterDataPage';
import { ResultsPage } from '@/features/results/ResultsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/surveys" replace />} />
        <Route path="surveys" element={<SurveyListPage />} />
        <Route path="surveys/:surveyId/questions" element={<QuestionManagePage />} />
        <Route path="surveys/:surveyId/scales" element={<ScalesPage />} />
        <Route path="surveys/:surveyId/results" element={<ResultsPage />} />
        <Route path="master-data" element={<MasterDataPage />} />
        <Route path="*" element={<Navigate to="/surveys" replace />} />
      </Route>
    </Routes>
  );
}
