// Master data → Skala jawaban (PRD §8.5). Katalog skala terpusat: buat/ubah/hapus.
// Pertanyaan menyimpan SNAPSHOT skala (lihat docs/DATABASE.md §2.4) — lepas dari katalog ini.
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { ScalePreview } from '@/components/ScalePreview';
import { Toast } from '@/components/Toast';
import { useSurveyStore } from '@/store/useSurveyStore';
import { deleteScale } from '@/data/scales';
import type { Scale } from '@/types';
import { ScaleEditorModal } from './ScaleEditorModal';

type Editing = { mode: 'add' } | { mode: 'edit'; scale: Scale } | null;

export function ScalesPage() {
  const scales = useSurveyStore((s) => s.scales);
  const questions = useSurveyStore((s) => s.questions);

  const [editing, setEditing] = useState<Editing>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const usageOf = (id: string) => questions.filter((q) => q.sourceScaleId === id).length;

  const handleDelete = (id: string) => {
    deleteScale(id);
    setConfirmId(null);
    setToast('Skala dihapus');
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-md text-text-secondary">
          Skala jawaban terpusat yang direferensikan tipe pertanyaan SKALA &amp; NPS. Pertanyaan
          menyimpan salinannya (snapshot) saat dipilih.
        </p>
        <button className="btn-primary shrink-0" onClick={() => setEditing({ mode: 'add' })}>
          <Icon name="add" size={18} />
          Tambah skala
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {scales.map((scale) => {
          const usage = usageOf(scale.id);
          return (
            <div key={scale.id} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body-lg font-medium">{scale.nama}</p>
                  <p className="text-body-sm text-text-secondary">
                    {scale.tipe} · {scale.poin} poin · dipakai {usage} pertanyaan
                  </p>
                </div>
                {confirmId === scale.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-body-sm text-text-secondary">Hapus skala?</span>
                    <button className="btn-ghost px-2 text-body-sm" onClick={() => setConfirmId(null)}>
                      Batal
                    </button>
                    <button
                      className="btn-ghost px-2 text-body-sm text-error hover:bg-error/10"
                      onClick={() => handleDelete(scale.id)}
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      aria-label="Ubah skala"
                      className="flex h-9 w-9 items-center justify-center rounded text-text-secondary hover:bg-primary-tint hover:text-primary"
                      onClick={() => setEditing({ mode: 'edit', scale })}
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      aria-label="Hapus skala"
                      className="flex h-9 w-9 items-center justify-center rounded text-text-secondary hover:bg-primary-tint hover:text-error"
                      onClick={() => setConfirmId(scale.id)}
                    >
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <ScalePreview scale={scale} />
              </div>
            </div>
          );
        })}

        {scales.length === 0 && (
          <div className="card flex flex-col items-center gap-2 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Icon name="straighten" size={24} />
            </span>
            <p className="text-body-lg font-medium">Belum ada skala</p>
            <p className="text-body-md text-text-secondary">
              Tambah skala jawaban pertama untuk dipakai pertanyaan tipe skala &amp; NPS.
            </p>
          </div>
        )}
      </div>

      {editing && (
        <ScaleEditorModal
          key={editing.mode === 'edit' ? editing.scale.id : 'add'}
          mode={editing.mode}
          scale={editing.mode === 'edit' ? editing.scale : undefined}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast(msg);
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
