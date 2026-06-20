// Skala & opsi (PRD §8.5) — rilis ini: daftar skala (read) + preview; CRUD menyusul.
import { useSurveyStore } from '@/store/useSurveyStore';

export function ScalesPage() {
  const scales = useSurveyStore((s) => s.scales);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-headline-md">Skala & opsi</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            Skala jawaban terpusat yang direferensikan tipe pertanyaan SKALA &amp; NPS.
          </p>
        </div>
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-body-sm font-medium text-[#C2410C]">
          CRUD menyusul (M6)
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {scales.map((scale) => (
          <div key={scale.id} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-lg font-medium">{scale.nama}</p>
                <p className="text-body-sm text-text-secondary">
                  {scale.tipe} · {scale.poin} poin
                </p>
              </div>
              <span className="font-mono text-body-sm text-text-secondary">{scale.id}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {scale.tipe === 'NPS' ? (
                <>
                  <span className="text-body-sm text-text-secondary">{scale.endpointKiri}</span>
                  <div className="flex flex-wrap gap-1">
                    {scale.labels.map((l) => (
                      <span
                        key={l}
                        className="flex h-7 w-7 items-center justify-center rounded border border-border font-mono text-body-sm"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  <span className="text-body-sm text-text-secondary">{scale.endpointKanan}</span>
                </>
              ) : (
                scale.labels.map((l) => (
                  <span
                    key={l}
                    className="rounded-full bg-primary-tint px-3 py-1 text-body-sm text-primary"
                  >
                    {l}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
