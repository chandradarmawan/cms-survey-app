// B. Identitas — render tiap IdentityField sesuai `sumber`:
// OTOMATIS/SISTEM = read-only (prefilled), ISIAN = teks, PILIHAN = dropdown.
import { FormField } from '@/components/FormField';
import type { IdentityField } from '@/types';
import type { IdentityValues } from './preview.types';
import { autoValue, choiceOptions, isIdentityRequired } from './engine';
import { SectionTitle } from './SectionTitle';

interface Props {
  fields: IdentityField[];
  values: IdentityValues;
  onChange: (id: string, val: string) => void;
  errors: Record<string, string>;
  onPreviewBilling: () => void;
  autoResolver?: (f: IdentityField) => string; // override OTOMATIS/SISTEM (mis. dari transaksi)
}

export function IdentitySection({
  fields,
  values,
  onChange,
  errors,
  onPreviewBilling,
  autoResolver = autoValue,
}: Props) {
  const sorted = [...fields].sort((a, b) => a.urutan - b.urutan);
  return (
    <section>
      <SectionTitle letter="B" title="Identitas" />
      <div className="mt-4 flex flex-col gap-4">
        {sorted.map((f) => (
          <div id={`pf_${f.id}`} key={f.id}>
            <FormField label={f.nama} required={isIdentityRequired(f)} error={errors[f.id]}>
              <IdentityControl
                field={f}
                value={values[f.id] ?? ''}
                hasError={!!errors[f.id]}
                onChange={(v) => onChange(f.id, v)}
                onPreviewBilling={onPreviewBilling}
                autoResolver={autoResolver}
              />
            </FormField>
          </div>
        ))}
      </div>
    </section>
  );
}

function IdentityControl({
  field,
  value,
  hasError,
  onChange,
  onPreviewBilling,
  autoResolver,
}: {
  field: IdentityField;
  value: string;
  hasError: boolean;
  onChange: (v: string) => void;
  onPreviewBilling: () => void;
  autoResolver: (f: IdentityField) => string;
}) {
  if (field.sumber === 'OTOMATIS' || field.sumber === 'SISTEM') {
    const isBilling = /billing/i.test(field.nama);
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={autoResolver(field)}
          className="h-10 w-full cursor-default rounded border border-border bg-background px-3 text-body-md text-text-secondary"
        />
        {isBilling && (
          <button type="button" className="btn-primary shrink-0" onClick={onPreviewBilling}>
            Preview
          </button>
        )}
      </div>
    );
  }

  if (field.sumber === 'PILIHAN') {
    return (
      <select
        className={`input ${hasError ? '!border-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Pilih...</option>
        {choiceOptions(field).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  // ISIAN
  return (
    <input
      className={`input ${hasError ? '!border-error' : ''}`}
      placeholder={field.nama}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
