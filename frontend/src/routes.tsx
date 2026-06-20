// Definisi rute (PRD §3.1). Dua level: top tabs global + sub-tabs (survei & master data).
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { SurveyDetailLayout } from '@/layouts/SurveyDetailLayout';
import { MasterDataLayout } from '@/layouts/MasterDataLayout';
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

        <Route path="surveys/:surveyId" element={<SurveyDetailLayout />}>
          <Route index element={<Navigate to="questions" replace />} />
          <Route path="questions" element={<QuestionManagePage />} />
          <Route path="results" element={<ResultsPage />} />
        </Route>

        {/* Master data: skala (katalog) + lookup identitas */}
        <Route path="master-data" element={<MasterDataLayout />}>
          <Route index element={<Navigate to="scales" replace />} />
          <Route path="scales" element={<ScalesPage />} />
          <Route path="lookup" element={<MasterDataPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/surveys" replace />} />
      </Route>
    </Routes>
  );
}
