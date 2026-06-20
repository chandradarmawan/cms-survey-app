// Layout detail survei (PRD §3 / §8.3): header konteks survei + sub-tabs + Outlet.
// Dipakai bersama oleh sub-tab Kelola pertanyaan / Skala & opsi / Hasil & laporan.
import { useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { SubTabs, type SubTabItem } from '@/components/SubTabs';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import { activateSurvey } from '@/data/surveys';
import { ui } from '@/i18n/id';

// Skala kini di Master data (data referensi global), bukan sub-tab survei.
const SUB_TABS: SubTabItem[] = [
  { label: ui.surveyTabs.questions, to: 'questions' },
  { label: ui.surveyTabs.results, to: 'results' },
];

export function SurveyDetailLayout() {
  const { surveyId = '' } = useParams();
  const navigate = useNavigate();
  const survey = useSurveyStore((s) => s.surveys.find((sv) => sv.id === surveyId));

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const showToast = (msg: string) => setToast((t) => ({ id: (t?.id ?? 0) + 1, msg }));

  if (!survey) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="card mx-auto max-w-md p-8 text-center">
          <p className="text-body-lg font-medium">Survei tidak ditemukan</p>
          <button className="btn-secondary mt-4" onClick={() => navigate('/surveys')}>
            Kembali ke Daftar Survei
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header konteks survei */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/surveys')}
            className="flex h-9 w-9 items-center justify-center rounded text-text-secondary hover:bg-primary-tint"
            aria-label="Kembali"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <h1 className="text-headline-sm">{survey.nama}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-body-sm text-text-secondary">{survey.kode}</span>
              <StatusBadge status={survey.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => showToast('Preview tersedia setelah modul responden')}
          >
            <Icon name="visibility" size={18} />
            Preview
          </button>
          {survey.status === 'draft' && (
            <button
              className="btn-primary"
              onClick={() => {
                activateSurvey(survey.id);
                showToast('Survei diaktifkan');
              }}
            >
              <Icon name="rocket_launch" size={18} />
              Aktifkan
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs (underline sekunder) */}
      <div className="mt-5">
        <SubTabs items={SUB_TABS} />
      </div>

      {/* Konten sub-tab */}
      <div className="mt-6">
        <Outlet />
      </div>

      {toast && <Toast key={toast.id} message={toast.msg} onDismiss={() => setToast(null)} />}
    </div>
  );
}
