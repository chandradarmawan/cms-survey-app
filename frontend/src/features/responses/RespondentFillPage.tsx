// Halaman pengisian responden (/isi/:token) — full-screen, di luar chrome admin.
// Identitas OTOMATIS diambil dari transaksi; submit menyimpan response + answers (snapshot).
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import { markOpened, submitResponse, transactionAutoResolver } from '@/data/responses';
import { SurveyForm } from '@/features/survey-preview/SurveyForm';
import { ui } from '@/i18n/id';

export function RespondentFillPage() {
  const { token = '' } = useParams();

  const invitations = useSurveyStore((s) => s.invitations);
  const surveys = useSurveyStore((s) => s.surveys);
  const allQuestions = useSurveyStore((s) => s.questions);
  const allIdentity = useSurveyStore((s) => s.identityFields);
  const transactions = useSurveyStore((s) => s.transactions);

  const invitation = useMemo(() => invitations.find((i) => i.token === token), [invitations, token]);
  const survey = useMemo(
    () => (invitation ? surveys.find((s) => s.id === invitation.surveyId) : undefined),
    [surveys, invitation],
  );
  const transaction = useMemo(
    () => (invitation ? transactions.find((t) => t.id === invitation.transactionId) : undefined),
    [transactions, invitation],
  );
  const questions = useMemo(
    () => (survey ? allQuestions.filter((q) => q.surveyId === survey.id) : []),
    [allQuestions, survey],
  );
  const identityFields = useMemo(
    () => (survey ? allIdentity.filter((f) => f.surveyId === survey.id) : []),
    [allIdentity, survey],
  );

  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const showToast = (msg: string) => setToast((t) => ({ id: (t?.id ?? 0) + 1, msg }));

  // Tandai dibuka sekali.
  useEffect(() => {
    if (invitation && invitation.status === 'terkirim') markOpened(token);
  }, [invitation, token]);

  const resolver = useMemo(
    () => (transaction ? transactionAutoResolver(transaction) : undefined),
    [transaction],
  );

  if (!invitation || !survey || !transaction) {
    return <CenteredCard icon="link_off" title="Tautan tidak valid" desc="Tautan survei tidak ditemukan atau sudah tidak berlaku." />;
  }
  if (done) {
    return (
      <CenteredCard
        icon="task_alt"
        accent="text-success"
        title="Terima kasih!"
        desc="Jawaban Anda sudah kami terima. Masukan Anda sangat berarti untuk peningkatan layanan Pelindo."
      />
    );
  }
  if (invitation.status === 'selesai') {
    return <CenteredCard icon="how_to_reg" title="Survei sudah diisi" desc="Tautan ini sudah pernah digunakan untuk mengisi survei." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
            <Icon name="assignment" size={18} fill />
          </span>
          <div className="leading-tight">
            <p className="text-body-md font-medium">{survey.nama}</p>
            <p className="font-mono text-body-sm text-text-secondary">{survey.kode}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="card p-6 sm:p-8">
          <SurveyForm
            survey={survey}
            questions={questions}
            identityFields={identityFields}
            autoResolver={resolver}
            submitLabel="Kirim jawaban"
            onSubmitted={(payload) => {
              const res = submitResponse(token, payload);
              if (res.ok) setDone(true);
              else showToast(res.error ?? 'Gagal mengirim jawaban.');
            }}
            onInfo={showToast}
          />
        </div>
      </main>

      {toast && <Toast key={toast.id} message={toast.msg} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function CenteredCard({
  icon,
  title,
  desc,
  accent = 'text-primary',
}: {
  icon: string;
  title: string;
  desc: string;
  accent?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="card max-w-md p-10 text-center">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint ${accent}`}>
          <Icon name={icon} size={32} />
        </span>
        <p className="mt-4 text-headline-sm">{title}</p>
        <p className="mt-2 text-body-md text-text-secondary">{desc}</p>
        <p className="mt-6 text-body-sm text-text-secondary">{ui.brand}</p>
      </div>
    </div>
  );
}
