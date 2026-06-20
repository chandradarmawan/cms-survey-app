// Label UI Bahasa Indonesia formal (PUEBI). Disiapkan walau belum multi-bahasa (PRD §11).
import type { IdentitySource, JenisNota, SurveyStatus } from '@/types';

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

export const ui = {
  brand: 'CMS Survei Kepuasan Pelanggan',
  brandShort: 'Survey CMS',
  tabs: {
    surveys: 'Daftar survei',
    questions: 'Kelola pertanyaan',
    scales: 'Skala & opsi',
    masterData: 'Master data',
    results: 'Hasil & laporan',
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
