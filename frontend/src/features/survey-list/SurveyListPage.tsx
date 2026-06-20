// Daftar Survei — layar penuh M1 (PRD §8.1).
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { JenisNotaBadge } from '@/components/JenisNotaBadge';
import { SummaryCard } from '@/components/SummaryCard';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import { archiveSurvey, computeSummary, createSurvey, filterSurveys } from '@/data/surveys';
import { formatAngka, relativeTime } from '@/lib/format';
import { ui } from '@/i18n/id';
import type { JenisNota, Survey, SurveyStatus } from '@/types';
import { RowActionsMenu } from './RowActionsMenu';
import { CreateSurveyModal } from '@/features/survey-create/CreateSurveyModal';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{ value: SurveyStatus | 'semua'; label: string }> = [
  { value: 'semua', label: ui.surveyList.allStatus },
  { value: 'aktif', label: 'Aktif' },
  { value: 'draft', label: 'Draft' },
  { value: 'selesai', label: 'Selesai' },
];

const JENIS_OPTIONS: Array<{ value: JenisNota | 'semua'; label: string }> = [
  { value: 'semua', label: ui.surveyList.allJenisNota },
  { value: 'Domestik', label: 'Domestik' },
  { value: 'Internasional', label: 'Internasional' },
  { value: 'SPSL Group', label: 'SPSL Group' },
];

export function SurveyListPage() {
  const navigate = useNavigate();
  const surveys = useSurveyStore((s) => s.surveys);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<SurveyStatus | 'semua'>('semua');
  const [jenis, setJenis] = useState<JenisNota | 'semua'>('semua');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Loading skeleton (simulasi latency tipis — store sebenarnya sinkron). PRD §8.1.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  // reset halaman saat filter berubah
  useEffect(() => setPage(1), [q, status, jenis]);

  const summary = useMemo(() => computeSummary(surveys), [surveys]);
  const filtered = useMemo(
    () => filterSurveys(surveys, { q, status, jenisNota: jenis }),
    [surveys, q, status, jenis],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDuplicate = (row: Survey) => {
    createSurvey({
      method: 'duplicate',
      sourceKode: row.kode,
      nama: `${row.nama} (Salinan)`,
      kode: `${row.kode}-COPY`,
      periode: row.periode,
      jenisNota: row.jenisNota,
      tanggalMulai: row.tanggalMulai,
      tanggalSelesai: row.tanggalSelesai,
      deskripsi: row.deskripsi,
    });
    setNotice(`Struktur disalin dari ${row.kode}`);
  };

  const handleArchive = (row: Survey) => {
    archiveSurvey(row.id);
    setNotice(`Survei ${row.kode} diarsipkan`);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline-md">{ui.surveyList.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              <Icon name="search" size={18} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={ui.surveyList.searchPlaceholder}
              className="input w-64 pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SurveyStatus | 'semua')}
            className="input w-auto pr-8"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisNota | 'semua')}
            className="input w-auto pr-8"
          >
            {JENIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon name="add" size={20} />
            {ui.surveyList.create}
          </button>
        </div>
      </div>

      {/* Kartu ringkasan */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total survei" value={summary.total} icon="assignment" />
        <SummaryCard
          label="Survei aktif"
          value={summary.aktif}
          icon="rocket_launch"
          accent="text-success"
          pulse="success"
        />
        <SummaryCard label="Draft" value={summary.draft} icon="edit_document" accent="text-accent" />
        <SummaryCard
          label="Total responden"
          value={formatAngka(summary.totalResponden)}
          icon="groups"
        />
      </div>

      {/* Tabel */}
      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#F8FAFC] text-label-md uppercase text-text-secondary">
                <th className="px-4 py-3 font-medium">Nama survei</th>
                <th className="px-4 py-3 font-medium">Jenis Nota</th>
                <th className="px-4 py-3 text-center font-medium">Periode</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Pertanyaan</th>
                <th className="px-4 py-3 text-right font-medium">Responden</th>
                <th className="px-4 py-3 font-medium">Terakhir diubah</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState hasAny={surveys.length > 0} />
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => {
                  const highlight = safePage === 1 && i === 0;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/surveys/${row.id}/questions`)}
                      className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-primary-tint ${
                        highlight ? 'bg-primary-tint' : ''
                      }`}
                    >
                      <td className="relative px-4 py-3">
                        {highlight && (
                          <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-primary" />
                        )}
                        <p className="font-medium text-text-primary">{row.nama}</p>
                        <p className="font-mono text-body-sm text-text-secondary">{row.kode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <JenisNotaBadge jenis={row.jenisNota} />
                      </td>
                      <td className="px-4 py-3 text-center text-body-md">{row.periode}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-body-md">{row.jumlahPertanyaan}</td>
                      <td className="px-4 py-3 text-right text-body-md">
                        {formatAngka(row.jumlahResponden)}
                      </td>
                      <td className="px-4 py-3 text-body-md text-text-secondary">
                        {relativeTime(row.terakhirDiubah)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <RowActionsMenu
                            actions={[
                              {
                                label: 'Kelola pertanyaan',
                                icon: 'account_tree',
                                onSelect: () => navigate(`/surveys/${row.id}/questions`),
                              },
                              {
                                label: 'Hasil',
                                icon: 'bar_chart',
                                onSelect: () => navigate(`/hasil/${row.id}`),
                              },
                              {
                                label: 'Duplikat',
                                icon: 'content_copy',
                                onSelect: () => handleDuplicate(row),
                              },
                              {
                                label: 'Arsipkan',
                                icon: 'inventory_2',
                                onSelect: () => handleArchive(row),
                                danger: true,
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pager */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-body-sm text-text-secondary">
              Menampilkan {pageRows.length} dari {filtered.length} survei
            </p>
            <div className="flex items-center gap-1">
              <PagerButton
                icon="chevron_left"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
              <span className="px-2 text-body-md">
                {safePage} / {totalPages}
              </span>
              <PagerButton
                icon="chevron_right"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </div>
          </div>
        )}
      </div>

      {notice && <Toast message={notice} onDismiss={() => setNotice(null)} />}

      <CreateSurveyModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function PagerButton({
  icon,
  disabled,
  onClick,
}: {
  icon: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded text-text-secondary enabled:hover:bg-primary-tint disabled:opacity-40"
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border last:border-0">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 animate-pulse rounded bg-border/70" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Icon name={hasAny ? 'search_off' : 'note_add'} size={26} />
      </span>
      <p className="text-body-lg font-medium">
        {hasAny ? ui.surveyList.noResultTitle : ui.surveyList.emptyTitle}
      </p>
      <p className="max-w-sm text-body-md text-text-secondary">
        {hasAny ? ui.surveyList.noResultDesc : ui.surveyList.emptyDesc}
      </p>
    </div>
  );
}
