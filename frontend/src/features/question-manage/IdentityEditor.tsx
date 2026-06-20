// Editor Identitas — kartu draggable + badge sumber (PRD §8.3 "Editor Kuesioner").
import { Icon } from '@/components/Icon';
import { SortableList } from '@/components/SortableList';
import { useSurveyStore } from '@/store/useSurveyStore';
import {
  addIdentityField,
  deleteIdentityField,
  getIdentityFields,
  reorderIdentityFields,
  updateIdentityField,
} from '@/data/identity';
import { labelIdentitySource } from '@/i18n/id';
import type { IdentitySource } from '@/types';

const SOURCE_STYLE: Record<IdentitySource, string> = {
  OTOMATIS: 'bg-primary-tint text-primary',
  ISIAN: 'bg-[#DCFCE7] text-success',
  PILIHAN: 'bg-[#F3E8FF] text-[#6B21A8]',
  SISTEM: 'bg-[#F1F5F9] text-text-secondary',
};

const SOURCES: IdentitySource[] = ['OTOMATIS', 'ISIAN', 'PILIHAN', 'SISTEM'];

export function IdentityEditor({ surveyId, onToast }: { surveyId: string; onToast: (m: string) => void }) {
  const all = useSurveyStore((s) => s.identityFields);
  const fields = getIdentityFields(all, surveyId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-headline-sm">Identitas responden</h2>
        <p className="mt-1 text-body-md text-text-secondary">
          Field identitas yang dikumpulkan saat pengisian. Geser untuk mengurutkan.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <SortableList
          items={fields}
          onReorder={(ids) => reorderIdentityFields(surveyId, ids)}
          renderItem={(f, handle) => (
            <div className="mb-3 flex items-start gap-3 rounded border border-border bg-surface p-4">
              <div className="pt-1">{handle}</div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 font-medium"
                    value={f.nama}
                    onChange={(e) => updateIdentityField(f.id, { nama: e.target.value })}
                  />
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-body-sm font-medium ${SOURCE_STYLE[f.sumber]}`}
                  >
                    {labelIdentitySource[f.sumber]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Sumber data"
                    className="input w-auto"
                    value={f.sumber}
                    onChange={(e) => updateIdentityField(f.id, { sumber: e.target.value as IdentitySource })}
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {labelIdentitySource[s]}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input flex-1"
                    value={f.deskripsi}
                    placeholder="Deskripsi"
                    onChange={(e) => updateIdentityField(f.id, { deskripsi: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                aria-label="Hapus field"
                onClick={() => {
                  deleteIdentityField(f.id);
                  onToast('Field identitas dihapus');
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-primary-tint hover:text-error"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          )}
        />

        <button
          type="button"
          className="btn-secondary mt-2"
          onClick={() => {
            addIdentityField(surveyId, {
              nama: 'Field baru',
              sumber: 'ISIAN',
              deskripsi: 'Diisi oleh Responden',
            });
            onToast('Field identitas ditambahkan');
          }}
        >
          <Icon name="add" size={18} />
          Tambah field identitas
        </button>
      </div>
    </div>
  );
}
