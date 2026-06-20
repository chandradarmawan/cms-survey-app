// Sub-tab "Pratinjau" — simulasi tampilan & pengisian form responden, digenerate
// dari konfigurasi survei (identitas + pertanyaan). Submit hanya menampilkan ringkasan.
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import type { DeviceMode, SerializedResponse } from './preview.types';
import { SurveyForm } from './SurveyForm';

export function SurveyPreviewPage() {
  const { surveyId = '' } = useParams();
  const survey = useSurveyStore((s) => s.surveys.find((sv) => sv.id === surveyId));
  const allQuestions = useSurveyStore((s) => s.questions);
  const allIdentity = useSurveyStore((s) => s.identityFields);

  const questions = useMemo(
    () => allQuestions.filter((q) => q.surveyId === surveyId),
    [allQuestions, surveyId],
  );
  const identityFields = useMemo(
    () => allIdentity.filter((f) => f.surveyId === surveyId),
    [allIdentity, surveyId],
  );

  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [summary, setSummary] = useState<SerializedResponse | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const showToast = (msg: string) => setToast((t) => ({ id: (t?.id ?? 0) + 1, msg }));

  if (!survey) {
    return <p className="text-body-md text-text-secondary">Survei tidak ditemukan.</p>;
  }

  const hasContent = questions.length > 0 || identityFields.length > 0;
  const frameWidth = device === 'mobile' ? 'max-w-[390px]' : 'max-w-3xl';

  return (
    <div>
      {/* Toolbar simulasi */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-body-sm text-text-secondary">
          <Icon name="visibility" size={18} />
          Simulasi tampilan responden — data tidak disimpan.
        </div>
        <div className="flex items-center gap-0.5 rounded border border-border p-0.5">
          <DeviceBtn
            active={device === 'desktop'}
            onClick={() => setDevice('desktop')}
            icon="desktop_windows"
            label="Desktop"
          />
          <DeviceBtn
            active={device === 'mobile'}
            onClick={() => setDevice('mobile')}
            icon="smartphone"
            label="Mobile"
          />
        </div>
      </div>

      {/* Lembar form responden */}
      <div className={`mx-auto w-full ${frameWidth} transition-all`}>
        {hasContent ? (
          <div className="card p-6 sm:p-8">
            <SurveyForm
              survey={survey}
              questions={questions}
              identityFields={identityFields}
              onSubmitted={(payload) => {
                setSummary(payload);
                showToast('Simulasi berhasil — tidak ada data tersimpan.');
              }}
              onInfo={showToast}
            />
          </div>
        ) : (
          <div className="card p-10 text-center text-body-md text-text-secondary">
            Survei ini belum punya pertanyaan atau field identitas. Tambahkan dulu di tab
            “Kelola pertanyaan”.
          </div>
        )}
      </div>

      {/* Ringkasan submit (simulasi) */}
      <Modal
        open={!!summary}
        onClose={() => setSummary(null)}
        title="Ringkasan Jawaban (Simulasi)"
        footer={
          <button className="btn-primary" onClick={() => setSummary(null)}>
            Tutup
          </button>
        }
      >
        {summary && <SummaryView payload={summary} />}
      </Modal>

      {toast && <Toast key={toast.id} message={toast.msg} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function DeviceBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded px-3 text-body-sm font-medium transition-colors ${
        active ? 'bg-primary-tint text-primary' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

function SummaryView({ payload }: { payload: SerializedResponse }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-label-md uppercase text-text-secondary">Identitas</h3>
        <dl className="flex flex-col gap-1.5">
          {payload.identitas.map((it) => (
            <div key={it.nama} className="flex justify-between gap-4 text-body-sm">
              <dt className="text-text-secondary">{it.nama}</dt>
              <dd className="text-right font-medium">{it.nilai || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h3 className="mb-2 text-label-md uppercase text-text-secondary">
          Jawaban ({payload.jawaban.length})
        </h3>
        <ul className="flex flex-col gap-2">
          {payload.jawaban.map((a) => (
            <li key={a.kode} className="text-body-sm">
              <span className="font-mono text-text-secondary">{a.kode}</span>{' '}
              <span className="font-medium">{formatAnswer(a)}</span>
            </li>
          ))}
        </ul>
      </div>
      <details>
        <summary className="cursor-pointer text-body-sm text-primary">
          Lihat payload (responses/answers)
        </summary>
        <pre className="mt-2 max-h-60 overflow-auto rounded bg-background p-3 font-mono text-body-sm">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function formatAnswer(a: SerializedResponse['jawaban'][number]): string {
  if (a.valueJson) return a.valueJson.join(', ');
  if (a.valueNumber != null) return String(a.valueNumber);
  return a.valueText ?? '—';
}
