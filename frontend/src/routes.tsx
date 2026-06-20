// Definisi rute (PRD §3.1). Dua level: top tabs global + sub-tabs (survei & master data).
// Halaman responden (/isi/:token) di luar AppShell (tanpa chrome admin).
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { SurveyDetailLayout } from '@/layouts/SurveyDetailLayout';
import { MasterDataLayout } from '@/layouts/MasterDataLayout';
import { SurveyListPage } from '@/features/survey-list/SurveyListPage';
import { QuestionManagePage } from '@/features/question-manage/QuestionManagePage';
import { SurveyPreviewPage } from '@/features/survey-preview/SurveyPreviewPage';
import { DistribusiPage } from '@/features/distribusi/DistribusiPage';
import { ScalesPage } from '@/features/scales/ScalesPage';
import { MasterDataPage } from '@/features/master-data/MasterDataPage';
import { ResultsPage } from '@/features/results/ResultsPage';
import { RespondentFillPage } from '@/features/responses/RespondentFillPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Halaman pengisian responden — full-screen, di luar AppShell */}
      <Route path="isi/:token" element={<RespondentFillPage />} />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/surveys" replace />} />
        <Route path="surveys" element={<SurveyListPage />} />

        <Route path="surveys/:surveyId" element={<SurveyDetailLayout />}>
          <Route index element={<Navigate to="questions" replace />} />
          <Route path="questions" element={<QuestionManagePage />} />
          <Route path="preview" element={<SurveyPreviewPage />} />
          <Route path="distribusi" element={<DistribusiPage />} />
        </Route>

        {/* Hasil & laporan: menu global (lepas dari survei) + pemilih survei */}
        <Route path="hasil" element={<ResultsPage />} />
        <Route path="hasil/:surveyId" element={<ResultsPage />} />

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
