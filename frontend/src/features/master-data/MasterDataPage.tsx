// Master data (PRD §8.6) — stub + lookup menyusul.
import { StubPage } from '@/components/StubPage';

export function MasterDataPage() {
  return (
    <StubPage
      title="Master data"
      milestone="Milestone M6"
      icon="database"
      desc="Lookup untuk field identitas (Jenis Pelayanan, Kategori Responden, dll.) yang dipakai sumber data OTOMATIS/PILIHAN."
    />
  );
}
