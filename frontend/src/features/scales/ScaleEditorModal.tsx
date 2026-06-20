// Editor skala master (PRD §8.5) — sadar-tipe agar tiap tipe punya UX yang tepat:
// • KEPUASAN/PERSETUJUAN: pilih jumlah poin + edit label per-poin (lengkap dengan bintangnya).
// • NPS: pilih rentang 0–10 / 1–10 + label ujung kiri/kanan.
// Selalu menampilkan preview live yang setia ke tampilan responden.
// Catatan snapshot: mengubah master TIDAK mengubah pertanyaan yang sudah memakainya.
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { Icon } from '@/components/Icon';
import { ScalePreview } from '@/components/ScalePreview';
import { StarRating } from '@/components/StarRating';
import { createScale, updateScale } from '@/data/scales';
import { descScaleType, labelScaleType } from '@/i18n/id';
import type { Scale, ScaleSnapshot } from '@/types';

type LikertType = 'KEPUASAN' | 'PERSETUJUAN';

const LIKERT_TEMPLATES: Record<LikertType, Record<number, string[]>> = {
  KEPUASAN: {
    3: ['Tidak puas', 'Cukup puas', 'Puas'],
    4: ['Sangat tidak puas', 'Tidak puas', 'Puas', 'Sangat puas'],
    5: ['Sangat tidak puas', 'Tidak puas', 'Cukup puas', 'Puas', 'Sangat puas'],
  },
  PERSETUJUAN: {
    3: ['Tidak setuju', 'Cukup setuju', 'Setuju'],
    4: ['Sangat tidak setuju', 'Tidak setuju', 'Setuju', 'Sangat setuju'],
    5: ['Sangat tidak setuju', 'Tidak setuju', 'Netral', 'Setuju', 'Sangat setuju'],
  },
};

const likertTemplate = (t: LikertType, n: number): string[] =>
  LIKERT_TEMPLATES[t][n] ?? LIKERT_TEMPLATES[t][4];

const TIPE_OPTIONS: Array<{ value: Scale['tipe']; icon: string }> = [
  { value: 'KEPUASAN', icon: 'star' },
  { value: 'PERSETUJUAN', icon: 'thumb_up' },
  { value: 'NPS', icon: 'tag' },
];

interface ScaleEditorModalProps {
  mode: 'add' | 'edit';
  scale?: Scale; // wajib saat edit
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function ScaleEditorModal({ mode, scale, onClose, onSaved }: ScaleEditorModalProps) {
  const [nama, setNama] = useState(scale?.nama ?? '');
  const [tipe, setTipe] = useState<Scale['tipe']>(scale?.tipe ?? 'KEPUASAN');
  const [likertLabels, setLikertLabels] = useState<string[]>(
    scale && scale.tipe !== 'NPS' ? scale.labels : LIKERT_TEMPLATES.KEPUASAN[4],
  );
  const [npsStart, setNpsStart] = useState<0 | 1>(
    scale?.tipe === 'NPS' && scale.labels[0] === '1' ? 1 : 0,
  );
  const [endpointKiri, setEndpointKiri] = useState(scale?.endpointKiri ?? 'Sangat Tidak Mungkin');
  const [endpointKanan, setEndpointKanan] = useState(scale?.endpointKanan ?? 'Sangat Mungkin');
  const [error, setError] = useState<string | null>(null);

  const isNps = tipe === 'NPS';
  const npsLabels = Array.from({ length: 11 - npsStart }, (_, i) => String(i + npsStart));

  const changeTipe = (next: Scale['tipe']) => {
    setError(null);
    if (next !== 'NPS') {
      const count = tipe !== 'NPS' ? likertLabels.length : 4;
      setLikertLabels(likertTemplate(next, count));
    }
    setTipe(next);
  };

  const setPoints = (n: number) => {
    const tmpl = likertTemplate(tipe as LikertType, n);
    setLikertLabels((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? tmpl[i] ?? ''));
  };

  const setLabel = (i: number, val: string) =>
    setLikertLabels((prev) => prev.map((l, idx) => (idx === i ? val : l)));

  const useStandard = () => setLikertLabels(likertTemplate(tipe as LikertType, likertLabels.length));

  const preview: ScaleSnapshot = {
    nama: nama || 'Skala',
    tipe,
    poin: isNps ? npsLabels.length : likertLabels.length,
    labels: isNps ? npsLabels : likertLabels.map((l) => l.trim() || '—'),
    endpointKiri: isNps ? endpointKiri.trim() || undefined : undefined,
    endpointKanan: isNps ? endpointKanan.trim() || undefined : undefined,
  };

  const save = () => {
    if (!nama.trim()) {
      setError('Nama skala wajib diisi.');
      return;
    }
    let payload: Omit<Scale, 'id'>;
    if (!isNps) {
      const cleaned = likertLabels.map((l) => l.trim());
      if (cleaned.length < 2 || cleaned.some((l) => !l)) {
        setError('Semua label wajib diisi (minimal 2 poin).');
        return;
      }
      payload = { nama: nama.trim(), tipe, poin: cleaned.length, labels: cleaned };
    } else {
      payload = {
        nama: nama.trim(),
        tipe,
        poin: npsLabels.length,
        labels: npsLabels,
        endpointKiri: endpointKiri.trim() || undefined,
        endpointKanan: endpointKanan.trim() || undefined,
      };
    }
    if (mode === 'edit' && scale) {
      updateScale(scale.id, payload);
      onSaved('Skala diperbarui');
    } else {
      createScale(payload);
      onSaved('Skala ditambahkan');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'add' ? 'Tambah skala' : 'Ubah skala'}
      maxWidth="max-w-[620px]"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            <Icon name="check" size={18} />
            Simpan skala
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField label="Nama skala" htmlFor="scl-nama" required>
          <input
            id="scl-nama"
            className="input"
            placeholder="mis. Skala puas (4 poin)"
            value={nama}
            onChange={(e) => {
              setNama(e.target.value);
              setError(null);
            }}
          />
        </FormField>

        <FormField label="Tipe skala" helper={descScaleType[tipe]}>
          <div className="flex w-full rounded border border-border p-0.5">
            {TIPE_OPTIONS.map((o) => {
              const active = o.value === tipe;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => changeTipe(o.value)}
                  className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded text-body-sm font-medium transition-colors ${
                    active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon name={o.icon} size={16} fill={active} />
                  {labelScaleType[o.value]}
                </button>
              );
            })}
          </div>
        </FormField>

        {!isNps ? (
          <>
            <FormField label="Jumlah poin">
              <div className="flex items-center justify-between gap-3">
                <div className="flex rounded border border-border p-0.5">
                  {[3, 4, 5].map((n) => {
                    const active = likertLabels.length === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPoints(n)}
                        className={`h-9 w-12 rounded text-body-sm font-medium transition-colors ${
                          active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="btn-ghost px-2 text-body-sm" onClick={useStandard}>
                  <Icon name="auto_fix_high" size={16} />
                  Label standar
                </button>
              </div>
            </FormField>

            <FormField label="Label jawaban" helper="Urut dari nilai terendah ke tertinggi.">
              <div className="flex flex-col gap-2">
                {likertLabels.map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex w-24 shrink-0 justify-start">
                      <StarRating filled={i + 1} total={likertLabels.length} size={14} />
                    </span>
                    <input
                      className="input flex-1"
                      placeholder={`Label poin ${i + 1}`}
                      value={label}
                      onChange={(e) => setLabel(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Rentang nilai">
              <div className="flex rounded border border-border p-0.5">
                {(
                  [
                    { v: 0 as const, label: '0–10 (11 poin)' },
                    { v: 1 as const, label: '1–10 (10 poin)' },
                  ]
                ).map((o) => {
                  const active = npsStart === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setNpsStart(o.v)}
                      className={`h-9 flex-1 rounded px-3 text-body-sm font-medium transition-colors ${
                        active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={`Label ujung kiri (${npsStart})`} htmlFor="scl-kiri">
                <input
                  id="scl-kiri"
                  className="input"
                  value={endpointKiri}
                  onChange={(e) => setEndpointKiri(e.target.value)}
                />
              </FormField>
              <FormField label="Label ujung kanan (10)" htmlFor="scl-kanan">
                <input
                  id="scl-kanan"
                  className="input"
                  value={endpointKanan}
                  onChange={(e) => setEndpointKanan(e.target.value)}
                />
              </FormField>
            </div>
          </>
        )}

        {error && <p className="text-body-sm text-error">{error}</p>}

        <div className="card bg-background p-4">
          <p className="mb-2 text-label-md uppercase text-text-secondary">Preview responden</p>
          <ScalePreview scale={preview} />
        </div>

        {mode === 'edit' && (
          <div className="flex items-start gap-2 rounded border border-border bg-background px-3 py-2 text-body-sm text-text-secondary">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            Perubahan ini hanya berlaku untuk pertanyaan baru. Pertanyaan yang sudah memakai skala ini
            tetap memakai salinan (snapshot) lamanya.
          </div>
        )}
      </div>
    </Modal>
  );
}
