// Hasil & laporan (PRD §8.7) — MENU GLOBAL, bukan sub-tab survei. Karena dashboard membaca
// snapshot jawaban (lepas dari konfigurasi survei), laporan dipilih lewat pemilih survei di sini.
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { useSurveyStore } from '@/store/useSurveyStore';
import { ui } from '@/i18n/id';
import { ResultsDashboard } from './ResultsDashboard';

export function ResultsPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const surveys = useSurveyStore((s) => s.surveys);
  const responses = useSurveyStore((s) => s.responses);

  const respondenCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of responses) m.set(r.surveyId, (m.get(r.surveyId) ?? 0) + 1);
    return m;
  }, [responses]);

  // Survei terpilih: dari URL bila valid; jika tidak, survei pertama yang punya respon, lalu fallback.
  const selected = useMemo(() => {
    if (surveyId && surveys.some((s) => s.id === surveyId)) return surveyId;
    const withResp = surveys.find((s) => (respondenCount.get(s.id) ?? 0) > 0);
    return withResp?.id ?? surveys[0]?.id;
  }, [surveyId, surveys, respondenCount]);

  if (surveys.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-headline-md">{ui.tabs.results}</h1>
        <div className="card mt-6 p-10 text-center text-body-md text-text-secondary">
          Belum ada survei.
        </div>
      </div>
    );
  }

  const selectedSurvey = surveys.find((s) => s.id === selected);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header + pemilih survei */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-headline-md">{ui.tabs.results}</h1>
          {selectedSurvey && <StatusBadge status={selectedSurvey.status} />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-text-secondary">
            <Icon name="filter_list" size={16} /> Survei
          </span>
          <select
            className="input w-auto min-w-[280px]"
            value={selected ?? ''}
            onChange={(e) => navigate(`/hasil/${e.target.value}`)}
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kode}) — {respondenCount.get(s.id) ?? 0} respon
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">{selected && <ResultsDashboard surveyId={selected} />}</div>
    </div>
  );
}
