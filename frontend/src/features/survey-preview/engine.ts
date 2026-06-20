// Logika murni modul simulasi: penomoran, evaluasi logika tampil, lookup dummy,
// validasi wajib (hormati visibilitas), dan serialisasi jawaban ke bentuk §6.
import type { IdentityField, Question, Survey } from '@/types';
import { formatTanggal, nowIso } from '@/lib/format';
import type {
  AnswerMap,
  AnswerValue,
  IdentityValues,
  SerializedResponse,
} from './preview.types';

/** "C1" → "C.1", "C1.1" → "C.1.1" (gaya penomoran pada form responden). */
export function displayKode(kode: string): string {
  return kode.replace(/^([A-Za-z]+)(?=\d)/, '$1.');
}

/** String pembanding untuk evaluasi logika (dicocokkan dengan Condition.value). */
function comparable(a: AnswerValue | undefined): string | undefined {
  if (!a) return undefined;
  if (a.text != null && a.text !== '') return a.text;
  if (a.number != null) return String(a.number);
  if (a.json && a.json.length) return a.json.join('|');
  return undefined;
}

/** Apakah pertanyaan tampil, berdasar logic terhadap jawaban berjalan (semua kondisi AND). */
export function isVisible(q: Question, questions: Question[], answers: AnswerMap): boolean {
  const conds = q.logic?.conditions;
  if (!conds || conds.length === 0) return true;
  return conds.every((c) => {
    const src = questions.find((x) => x.kode === c.sourceQuestionKode);
    const val = comparable(src ? answers[src.id] : undefined);
    const eq = val === c.value;
    return c.operator === 'sama_dengan' ? eq : !eq;
  });
}

/** Field identitas wajib diisi responden? ISIAN & PILIHAN ya; OTOMATIS & SISTEM tidak. */
export function isIdentityRequired(f: IdentityField): boolean {
  return f.sumber === 'ISIAN' || f.sumber === 'PILIHAN';
}

/** Nilai prefilled (read-only) untuk OTOMATIS/SISTEM — simulasi lookup database Pelindo. */
export function autoValue(f: IdentityField): string {
  if (f.sumber === 'SISTEM') return formatTanggal(nowIso());
  const n = f.nama.toLowerCase();
  if (n.includes('billing')) return '182408DP01218';
  if (n.includes('kontrak')) return 'KTR-2026-00417';
  if (n.includes('npwp')) return '01.234.567.8-051.000';
  if (n.includes('entitas')) return 'TPK Merauke [SPTP]';
  if (n.includes('cabang')) return 'TPK Merauke [TPK Merauke]';
  if (n.includes('kapal') || n.includes('vessel')) return 'MV. KARYA BARUNA RAYA';
  if (n.includes('agen')) return 'PT. PELAYARAN NUSANTARA';
  if (n.includes('perusahaan')) return 'PT. KARYA BARUNA RAYA';
  if (n.includes('enumerator')) return 'Andi Pratama';
  if (n.includes('negara')) return 'Singapura';
  return 'Lookup dari database Pelindo';
}

/** Opsi dummy untuk field identitas bertipe PILIHAN. */
export function choiceOptions(f: IdentityField): string[] {
  const n = f.nama.toLowerCase();
  if (n.includes('kategori'))
    return ['Pelanggan Korporasi', 'Pelanggan Perorangan', 'Mitra Logistik', 'Instansi Pemerintah'];
  if (n.includes('ekspor') || n.includes('impor')) return ['Ekspor', 'Impor'];
  if (n.includes('negara')) return ['Singapura', 'Malaysia', 'Tiongkok', 'Australia', 'Jepang'];
  if (n.includes('pelayanan') || n.includes('layanan'))
    return [
      'Pelayanan Barang Petikemas',
      'Pelayanan Kapal',
      'Pelayanan Terminal Penumpang',
      'Pelayanan Rupa-rupa',
    ];
  if (n.includes('cabang'))
    return ['TPK Merauke [TPK Merauke]', 'Tanjung Priok [TPK]', 'Belawan [BICT]', 'Makassar [MNP]'];
  return ['Opsi 1', 'Opsi 2', 'Opsi 3'];
}

/** Apakah AnswerValue dianggap kosong (untuk validasi wajib). */
function isEmpty(a: AnswerValue | undefined): boolean {
  if (!a) return true;
  if (a.text != null) return a.text.trim() === '';
  if (a.number != null) return false;
  if (a.json) return a.json.length === 0;
  return true;
}

/** Validasi: pesan error per kunci (identitas → fieldId, pertanyaan → questionId). */
export function validate(
  identityFields: IdentityField[],
  identityValues: IdentityValues,
  visibleQuestions: Question[],
  answers: AnswerMap,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of identityFields) {
    if (isIdentityRequired(f) && !(identityValues[f.id] ?? '').trim()) {
      errors[f.id] = 'Wajib diisi';
    }
  }
  for (const q of visibleQuestions) {
    if (q.isGroup || !q.wajibDiisi) continue;
    if (isEmpty(answers[q.id])) errors[q.id] = 'Wajib diisi';
  }
  return errors;
}

/** Bentuk payload submit simulasi (hanya pertanyaan yang tampil & terjawab). */
export function serialize(
  survey: Survey,
  identityFields: IdentityField[],
  identityValues: IdentityValues,
  visibleQuestions: Question[],
  answers: AnswerMap,
  autoResolver: (f: IdentityField) => string = autoValue, // override OTOMATIS/SISTEM (mis. dari transaksi)
): SerializedResponse {
  return {
    surveyId: survey.id,
    submittedAt: nowIso(),
    identitas: [...identityFields]
      .sort((a, b) => a.urutan - b.urutan)
      .map((f) => ({
        nama: f.nama,
        sumber: f.sumber,
        nilai:
          f.sumber === 'OTOMATIS' || f.sumber === 'SISTEM'
            ? autoResolver(f)
            : (identityValues[f.id] ?? ''),
      })),
    jawaban: visibleQuestions
      .filter((q) => !q.isGroup && !isEmpty(answers[q.id]))
      .map((q) => ({
        kode: q.kode,
        teks: q.teks,
        valueText: answers[q.id].text,
        valueNumber: answers[q.id].number,
        valueJson: answers[q.id].json,
      })),
  };
}
