// A. Petunjuk — teks pengantar yang digenerate dari metadata survei.
import type { Survey } from '@/types';
import { SectionTitle } from './SectionTitle';

export function InstructionSection({ survey }: { survey: Survey }) {
  return (
    <section>
      <SectionTitle letter="A" title="Petunjuk" />
      <div className="mt-3 flex flex-col gap-3 text-body-md leading-relaxed text-text-primary">
        <p>Pelanggan PT Pelabuhan Indonesia (Persero) yang terhormat,</p>
        <p>
          Terima kasih Anda telah meluangkan waktu untuk berpartisipasi dalam{' '}
          <span className="font-medium">{survey.nama}</span> tahun {survey.periode}. Kami mohon
          kesediaan Anda untuk mengisi kuesioner ini dengan lengkap, jujur, dan apa adanya. Sebelum
          mengklik tombol submit, kami mohon Anda memeriksa kembali seluruh jawaban telah dijawab
          dengan lengkap.
        </p>
        {survey.deskripsi && <p className="text-text-secondary">{survey.deskripsi}</p>}
      </div>
    </section>
  );
}
