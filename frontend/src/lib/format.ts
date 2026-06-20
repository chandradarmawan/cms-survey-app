// Utilitas format. Referensi waktu tetap agar demo deterministik (PRD §12.1).
export const APP_NOW = new Date('2026-06-20T10:00:00');

const HARI_MS = 24 * 60 * 60 * 1000;

/** "2 hari lalu", "kemarin", "hari ini", atau tanggal panjang untuk yang lama. */
export function relativeTime(iso: string, now: Date = APP_NOW): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '—';

  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const selisihHari = Math.round((startOf(now) - startOf(then)) / HARI_MS);

  if (selisihHari <= 0) return 'Hari ini';
  if (selisihHari === 1) return 'Kemarin';
  if (selisihHari < 7) return `${selisihHari} hari lalu`;
  if (selisihHari < 30) {
    const minggu = Math.floor(selisihHari / 7);
    return `${minggu} minggu lalu`;
  }
  return formatTanggal(iso);
}

const BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/** "31 Des 2024" */
export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format angka ribuan gaya Indonesia: 5158 → "5.158" */
export function formatAngka(n: number): string {
  return n.toLocaleString('id-ID');
}

/** ISO datetime untuk timestamp "sekarang" (deterministik di demo). */
export function nowIso(): string {
  return APP_NOW.toISOString();
}
