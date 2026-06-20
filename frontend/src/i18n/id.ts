// Label UI Bahasa Indonesia formal (PUEBI). Disiapkan walau belum multi-bahasa (PRD §11).
import type { IdentitySource, JenisNota, Scale, SurveyStatus } from '@/types';

export const labelStatus: Record<SurveyStatus, string> = {
  draft: 'Draft',
  aktif: 'Aktif',
  selesai: 'Selesai',
  arsip: 'Arsip',
};

export const labelJenisNota: Record<JenisNota, string> = {
  Domestik: 'Domestik',
  Internasional: 'Internasional',
  'SPSL Group': 'SPSL Group',
};

export const labelIdentitySource: Record<IdentitySource, string> = {
  OTOMATIS: 'Otomatis',
  ISIAN: 'Isian',
  PILIHAN: 'Pilihan',
  SISTEM: 'Sistem',
};

export const labelScaleType: Record<Scale['tipe'], string> = {
  KEPUASAN: 'Kepuasan',
  PERSETUJUAN: 'Persetujuan',
  NPS: 'NPS',
};

export const descScaleType: Record<Scale['tipe'], string> = {
  KEPUASAN: 'Rating bintang — seberapa puas (mis. 4 poin).',
  PERSETUJUAN: 'Likert — tingkat persetujuan atas pernyataan.',
  NPS: 'Skala 0–10, kemungkinan merekomendasikan.',
};

export const ui = {
  brand: 'CMS Survei Kepuasan Pelanggan',
  brandShort: 'Survey CMS',
  // Navigasi global (top tabs).
  tabs: {
    surveys: 'Daftar survei',
    results: 'Hasil & laporan',
    masterData: 'Master data',
  },
  // Sub-navigasi di dalam detail survei (underline tabs sekunder).
  surveyTabs: {
    questions: 'Kelola pertanyaan',
    preview: 'Pratinjau',
    distribusi: 'Distribusi',
  },
  // Sub-navigasi di dalam Master data.
  masterTabs: {
    scales: 'Skala jawaban',
    lookup: 'Lookup identitas',
  },
  surveyList: {
    title: 'Daftar Survei',
    create: 'Buat survei baru',
    searchPlaceholder: 'Cari survei...',
    allStatus: 'Semua status',
    allJenisNota: 'Semua jenis nota',
    emptyTitle: 'Belum ada survei',
    emptyDesc: 'Buat survei pertama untuk mulai menyusun kuesioner.',
    noResultTitle: 'Tidak ada survei yang cocok',
    noResultDesc: 'Coba ubah kata kunci atau filter.',
  },
} as const;
