// Kelola Pertanyaan (PRD §8.3) — layout 2 kolom: tree + editor kontekstual.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import { activateSurvey } from '@/data/surveys';
import { getQuestions } from '@/data/questions';
import { getIdentityFields } from '@/data/identity';
import { QuestionTree } from './QuestionTree';
import { IdentityEditor } from './IdentityEditor';
import { QuestionEditor } from '@/features/question-editor/QuestionEditor';

type Selection =
  | { kind: 'none' }
  | { kind: 'question'; id: string }
  | { kind: 'add'; parentId: string | null }
  | { kind: 'identity' };

interface LocationState {
  justCreated?: boolean;
  fromKode?: string;
}

export function QuestionManagePage() {
  const { surveyId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const survey = useSurveyStore((s) => s.surveys.find((sv) => sv.id === surveyId));
  const questions = useSurveyStore((s) => s.questions);
  const identityFields = useSurveyStore((s) => s.identityFields);

  const [selection, setSelection] = useState<Selection>({ kind: 'none' });
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const showToast = (msg: string) => setToast((t) => ({ id: (t?.id ?? 0) + 1, msg }));

  // Post-duplicate toast (sekali) — PRD §8.3 cd33dedd.
  const greeted = useRef(false);
  useEffect(() => {
    const st = location.state as LocationState | null;
    if (st?.justCreated && !greeted.current) {
      greeted.current = true;
      showToast(st.fromKode ? `Survei dibuat · struktur disalin dari ${st.fromKode}` : 'Survei berhasil dibuat');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  if (!survey) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-body-lg font-medium">Survei tidak ditemukan</p>
        <button className="btn-secondary mt-4" onClick={() => navigate('/surveys')}>
          Kembali ke Daftar Survei
        </button>
      </div>
    );
  }

  const surveyQuestions = getQuestions(questions, surveyId);
  const surveyIdentity = getIdentityFields(identityFields, surveyId);
  const isEmpty = surveyQuestions.length === 0 && surveyIdentity.length === 0;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Sub-header konteks survei */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
          <button className="btn-secondary" onClick={() => showToast('Preview tersedia setelah modul responden')}>
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

      {/* Banner post-duplicate */}
      {survey.duplicatedFrom && (
        <div className="mb-4 flex items-center gap-2 rounded border border-primary/20 bg-primary-tint px-4 py-3 text-body-md text-primary">
          <Icon name="content_copy" size={18} />
          Struktur disalin dari {survey.duplicatedFrom}. Sesuaikan pertanyaan sesuai kebutuhan.
        </div>
      )}

      {isEmpty && selection.kind === 'none' ? (
        <EmptyFirstRun onAddFirst={() => setSelection({ kind: 'add', parentId: null })} onToast={showToast} />
      ) : (
        <div className="grid h-[calc(100vh-15rem)] grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,38%)_1fr]">
          <div className="card overflow-hidden">
            <QuestionTree
              surveyId={surveyId}
              activeQuestionId={selection.kind === 'question' ? selection.id : undefined}
              identityActive={selection.kind === 'identity'}
              onSelectQuestion={(id) => setSelection({ kind: 'question', id })}
              onSelectIdentity={() => setSelection({ kind: 'identity' })}
              onAdd={() => setSelection({ kind: 'add', parentId: null })}
            />
          </div>

          <div className="card overflow-hidden">
            {selection.kind === 'none' && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <Icon name="touch_app" size={28} />
                </span>
                <p className="text-body-lg font-medium">Pilih pertanyaan untuk mulai mengedit</p>
                <p className="max-w-sm text-body-md text-text-secondary">
                  Pilih item di struktur, atau klik <span className="font-medium">Tambah</span> untuk membuat pertanyaan baru.
                </p>
              </div>
            )}

            {selection.kind === 'identity' && <IdentityEditor surveyId={surveyId} onToast={showToast} />}

            {selection.kind === 'add' && (
              <QuestionEditor
                key={`add-${selection.parentId ?? 'root'}`}
                surveyId={surveyId}
                mode="add"
                defaultParentId={selection.parentId}
                onCancel={() => setSelection({ kind: 'none' })}
                onSaved={(id) => setSelection({ kind: 'question', id })}
                onToast={showToast}
              />
            )}

            {selection.kind === 'question' && (
              <QuestionEditor
                key={`edit-${selection.id}`}
                surveyId={surveyId}
                mode="edit"
                questionId={selection.id}
                onCancel={() => setSelection({ kind: 'none' })}
                onSaved={(id) => setSelection({ kind: 'question', id })}
                onDeleted={() => setSelection({ kind: 'none' })}
                onToast={showToast}
              />
            )}
          </div>
        </div>
      )}

      {toast && <Toast key={toast.id} message={toast.msg} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function EmptyFirstRun({
  onAddFirst,
  onToast,
}: {
  onAddFirst: () => void;
  onToast: (m: string) => void;
}) {
  const cards = [
    { icon: 'dashboard_customize', title: 'Template', desc: 'Mulai dari template kuesioner standar.' },
    { icon: 'content_copy', title: 'Salin Survei', desc: 'Salin struktur dari survei lain.' },
    { icon: 'upload_file', title: 'Import', desc: 'Impor pertanyaan dari Excel.' },
  ];
  return (
    <div className="card flex flex-col items-center gap-5 p-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Icon name="note_add" size={32} />
      </span>
      <div>
        <p className="text-headline-sm">Belum ada pertanyaan</p>
        <p className="mt-1 text-body-md text-text-secondary">
          Mulai susun kuesioner dengan menambah pertanyaan pertama.
        </p>
      </div>
      <button className="btn-primary" onClick={onAddFirst}>
        <Icon name="add" size={18} />
        Tambah pertanyaan pertama
      </button>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => onToast(`${c.title} — segera hadir`)}
            className="flex flex-col items-center gap-2 rounded border border-border p-5 text-center hover:border-border-strong"
          >
            <Icon name={c.icon} size={24} className="text-primary" />
            <span className="text-body-md font-medium">{c.title}</span>
            <span className="text-body-sm text-text-secondary">{c.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
