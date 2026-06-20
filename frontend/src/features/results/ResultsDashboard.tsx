// Dashboard hasil satu survei — membaca SNAPSHOT jawaban (docs/DATABASE.md §6).
// Dipisah dari halaman agar bisa dipakai global (menu Hasil & laporan, lepas dari survei).
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { SummaryCard } from '@/components/SummaryCard';
import { useSurveyStore } from '@/store/useSurveyStore';
import { computeResults, type QuestionResult } from '@/data/responses';

export function ResultsDashboard({ surveyId }: { surveyId: string }) {
  // Selektor reaktif agar dashboard ikut ter-update saat ada respon baru.
  const responses = useSurveyStore((s) => s.responses);
  const invitations = useSurveyStore((s) => s.invitations);
  const [facet, setFacet] = useState('');

  const results = useMemo(
    () => computeResults(surveyId, facet || undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surveyId, facet, responses, invitations],
  );

  if (results.jumlahResponden === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
          <Icon name="insights" size={24} />
        </span>
        <p className="text-body-lg font-medium">Belum ada respon</p>
        <p className="max-w-sm text-body-md text-text-secondary">
          Buka survei ini lalu tab <span className="font-medium">Distribusi</span> untuk generate
          undangan & respon, atau isi lewat tautan responden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Responden" value={results.jumlahResponden} icon="groups" />
        <SummaryCard label="Response rate" value={`${results.responseRate}%`} icon="mark_email_read" />
        <SummaryCard
          label="CSI"
          value={results.csi != null ? `${results.csi}` : '—'}
          icon="sentiment_satisfied"
          accent="text-success"
        />
        <SummaryCard
          label="NPS"
          value={results.npsScore != null ? `${results.npsScore}` : '—'}
          icon="recommend"
          accent="text-accent"
        />
      </div>

      {/* Breakdown per identitas */}
      {results.facetOptions.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body-lg font-medium">Breakdown CSI</p>
            <select className="input w-auto" value={facet} onChange={(e) => setFacet(e.target.value)}>
              <option value="">Pilih dimensi...</option>
              {results.facetOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          {facet && results.byFacet && (
            <div className="mt-4 space-y-2">
              {results.byFacet.map((row) => (
                <div key={row.nilai} className="flex items-center gap-3">
                  <span className="w-52 shrink-0 truncate text-body-sm" title={row.nilai}>
                    {row.nilai}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/50">
                    <div className="h-full rounded-full bg-success" style={{ width: `${row.csi ?? 0}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-body-sm text-text-secondary">
                    {row.csi != null ? `CSI ${row.csi}` : '—'} · {row.n}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Distribusi per pertanyaan */}
      <div className="space-y-4">
        {results.perQuestion.map((q) => (
          <QuestionCard key={q.kode} q={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ q }: { q: QuestionResult }) {
  const max = Math.max(1, ...q.distribusi.map((d) => d.count));
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-body-sm text-text-secondary">{q.kode}</span>
          <p className="text-body-md font-medium">{q.teks}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-body-sm text-text-secondary">{q.n} jawaban</p>
          {q.avgSkor != null && <p className="text-body-md font-medium text-success">avg {q.avgSkor}</p>}
        </div>
      </div>

      {q.distribusi.length > 0 ? (
        <div className="mt-4 space-y-2">
          {q.distribusi.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-48 shrink-0 truncate text-body-sm" title={d.label}>
                {d.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/50">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-body-sm text-text-secondary">{d.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-body-sm text-text-secondary">Jawaban teks bebas — tidak diagregasi.</p>
      )}
    </div>
  );
}
