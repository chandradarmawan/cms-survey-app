// Sub-tab Distribusi — generate undangan dari transaksi & buka link responden (simulasi).
// "Generate respon dummy" mengisi store agar dashboard Hasil langsung hidup.
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import { generateInvitations, generateDummyResponses } from '@/data/responses';
import type { InvitationStatus } from '@/types';

const STATUS_STYLE: Record<InvitationStatus, string> = {
  dibuat: 'bg-border/60 text-text-secondary',
  terkirim: 'bg-primary-tint text-primary',
  dibuka: 'bg-[#FEF3C7] text-[#92400E]',
  selesai: 'bg-success/15 text-success',
  kedaluwarsa: 'bg-error/10 text-error',
};

export function DistribusiPage() {
  const { surveyId = '' } = useParams();
  const survey = useSurveyStore((s) => s.surveys.find((sv) => sv.id === surveyId));
  const invitations = useSurveyStore((s) => s.invitations);
  const transactions = useSurveyStore((s) => s.transactions);

  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      invitations
        .filter((i) => i.surveyId === surveyId)
        .map((i) => ({ inv: i, txn: transactions.find((t) => t.id === i.transactionId) })),
    [invitations, transactions, surveyId],
  );

  if (!survey) return null;

  const terisi = rows.filter((r) => r.inv.status === 'selesai').length;
  const calonTransaksi = transactions.filter((t) => t.jenisNota === survey.jenisNota).length;

  const handleGenerate = () => {
    const created = generateInvitations(surveyId);
    setToast(
      created.length
        ? `${created.length} undangan dibuat dari transaksi ${survey.jenisNota}.`
        : 'Semua transaksi yang cocok sudah punya undangan.',
    );
  };

  const handleDummy = () => {
    const n = generateDummyResponses(surveyId, 25);
    setToast(n ? `${n} respon dummy dibuat.` : 'Tidak ada undangan kosong untuk diisi.');
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-body-md text-text-secondary">
          Undangan dibuat per transaksi <span className="font-medium">{survey.jenisNota}</span> (
          {calonTransaksi} transaksi). Kanal{' '}
          <span className="font-medium">{survey.jenisNota === 'Domestik' ? 'QR di invoice' : 'email'}</span>{' '}
          mengikuti jenis nota.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button className="btn-secondary" onClick={handleDummy}>
            <Icon name="auto_awesome" size={18} />
            Generate 25 respon dummy
          </button>
          <button className="btn-primary" onClick={handleGenerate}>
            <Icon name="send" size={18} />
            Generate undangan
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="mt-5 flex flex-wrap gap-3 text-body-sm">
        <Stat label="Undangan" value={rows.length} />
        <Stat label="Terisi" value={terisi} accent="text-success" />
        <Stat
          label="Response rate"
          value={rows.length ? `${Math.round((terisi / rows.length) * 100)}%` : '—'}
        />
      </div>

      {/* Tabel undangan */}
      {rows.length === 0 ? (
        <div className="card mt-5 flex flex-col items-center gap-2 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
            <Icon name="outgoing_mail" size={24} />
          </span>
          <p className="text-body-lg font-medium">Belum ada undangan</p>
          <p className="max-w-sm text-body-md text-text-secondary">
            Klik <span className="font-medium">Generate undangan</span> untuk membuat tautan isian dari
            daftar transaksi {survey.jenisNota}.
          </p>
        </div>
      ) : (
        <div className="card mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-[#F8FAFC] text-label-md uppercase text-text-secondary">
                  <th className="px-4 py-3 font-medium">Transaksi</th>
                  <th className="px-4 py-3 font-medium">Perusahaan / Cabang</th>
                  <th className="px-4 py-3 font-medium">Kanal</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Tautan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ inv, txn }) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-body-sm">{txn?.noBilling ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-md">{txn?.namaPerusahaan ?? '—'}</p>
                      <p className="text-body-sm text-text-secondary">{txn?.namaCabang}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-border/50 px-2.5 py-1 text-body-sm">
                        <Icon name={inv.channel === 'QR' ? 'qr_code_2' : 'mail'} size={14} />
                        {inv.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-body-sm font-medium ${STATUS_STYLE[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'selesai' ? (
                        <span className="text-body-sm text-text-secondary">—</span>
                      ) : (
                        <a
                          href={`/isi/${inv.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
                        >
                          <Icon name="open_in_new" size={16} />
                          Buka
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded border border-border px-4 py-2">
      <p className="text-label-md uppercase text-text-secondary">{label}</p>
      <p className={`text-headline-sm ${accent ?? ''}`}>{value}</p>
    </div>
  );
}
