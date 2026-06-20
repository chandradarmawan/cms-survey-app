// Editor skala master (PRD §8.5). Buat/ubah skala di katalog Master data.
// Catatan snapshot: mengubah master TIDAK mengubah pertanyaan yang sudah memakainya.
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { Icon } from '@/components/Icon';
import { createScale, updateScale } from '@/data/scales';
import type { Scale } from '@/types';

const NPS_LABELS = Array.from({ length: 11 }, (_, i) => String(i));

const TIPE_OPTIONS: Array<{ value: Scale['tipe']; label: string }> = [
  { value: 'KEPUASAN', label: 'Kepuasan' },
  { value: 'PERSETUJUAN', label: 'Persetujuan' },
  { value: 'NPS', label: 'NPS 0–10' },
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
  const [labelsText, setLabelsText] = useState(
    scale && scale.tipe !== 'NPS'
      ? scale.labels.join('\n')
      : 'Sangat tidak puas\nTidak puas\nPuas\nSangat puas',
  );
  const [endpointKiri, setEndpointKiri] = useState(scale?.endpointKiri ?? 'Sangat Tidak Mungkin');
  const [endpointKanan, setEndpointKanan] = useState(scale?.endpointKanan ?? 'Sangat Mungkin');
  const [error, setError] = useState<string | null>(null);

  const isNps = tipe === 'NPS';
  const labels = isNps
    ? NPS_LABELS
    : labelsText.split('\n').map((l) => l.trim()).filter(Boolean);

  const save = () => {
    if (!nama.trim()) {
      setError('Nama skala wajib diisi.');
      return;
    }
    if (!isNps && labels.length < 2) {
      setError('Minimal 2 label jawaban.');
      return;
    }
    const payload: Omit<Scale, 'id'> = {
      nama: nama.trim(),
      tipe,
      poin: labels.length,
      labels,
      endpointKiri: isNps ? endpointKiri.trim() : undefined,
      endpointKanan: isNps ? endpointKanan.trim() : undefined,
    };
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
      <div className="space-y-4">
        <FormField label="Nama skala" htmlFor="scl-nama" required error={error ?? undefined}>
          <input
            id="scl-nama"
            className="input"
            placeholder="mis. Skala puas (4 poin)"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </FormField>

        <FormField label="Tipe" htmlFor="scl-tipe">
          <select
            id="scl-tipe"
            className="input"
            value={tipe}
            onChange={(e) => setTipe(e.target.value as Scale['tipe'])}
          >
            {TIPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>

        {isNps ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Label ujung kiri (0)" htmlFor="scl-kiri">
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
            <p className="sm:col-span-2 text-body-sm text-text-secondary">
              NPS otomatis memakai skala 0–10 (11 poin).
            </p>
          </div>
        ) : (
          <FormField
            label="Label jawaban"
            htmlFor="scl-labels"
            helper="Satu label per baris, urut dari terendah ke tertinggi."
          >
            <textarea
              id="scl-labels"
              rows={4}
              className="input h-auto py-2"
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
            />
          </FormField>
        )}

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
