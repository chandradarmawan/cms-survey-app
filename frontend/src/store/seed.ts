// Data awal in-memory ("database" klien). Lihat docs/PRD.md §12 & docs/DATABASE.md.
// Bentuk data mengikuti rancangan DB compact: tiap array = satu tabel; options/logic/labels
// tersimpan apa adanya (kolom JSONB). jumlahPertanyaan & childCount DITURUNKAN di bawah
// (cermin DATABASE.md §5) agar count selalu konsisten dengan data — bukan di-hardcode.
import type { IdentityField, Question, Scale, ScaleSnapshot, Survey } from "@/types";
import { scaleSnapshot } from "@/lib/questionMeta";

// ---- §12.4 Scales (global, dipakai lintas survei) ----
export const seedScales: Scale[] = [
  {
    id: "scl_puas4",
    nama: "Skala puas (4 poin)",
    tipe: "KEPUASAN",
    poin: 4,
    labels: ["Sangat tidak puas", "Tidak puas", "Puas", "Sangat puas"],
  },
  {
    id: "scl_setuju4",
    nama: "Skala setuju (4 poin)",
    tipe: "PERSETUJUAN",
    poin: 4,
    labels: ["Sangat tidak setuju", "Tidak setuju", "Setuju", "Sangat setuju"],
  },
  {
    id: "scl_nps",
    nama: "NPS (0-10)",
    tipe: "NPS",
    poin: 11,
    labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    endpointKiri: "Sangat Tidak Mungkin",
    endpointKanan: "Sangat Mungkin",
  },
];

// Helper seed: bangun field skala question (snapshot + provenance) dari id master.
// Cermin pola "snapshot di question" pada DATABASE.md §2.4 — question lepas dari master.
const scaleById: Record<string, Scale> = Object.fromEntries(
  seedScales.map((s) => [s.id, s]),
);
function snap(scaleId: string): { sourceScaleId: string; scale: ScaleSnapshot } {
  return { sourceScaleId: scaleId, scale: scaleSnapshot(scaleById[scaleId]) };
}

// ---- §12.1 Surveys (jumlahPertanyaan diturunkan otomatis — lihat finalize di bawah) ----
export const seedSurveys: Survey[] = [
  {
    id: "srv_01",
    kode: "SKP-2026",
    nama: "Survei Kepuasan Pelanggan Domestik 2026",
    jenisNota: "Domestik",
    periode: 2026,
    status: "draft",
    tanggalMulai: "2026-07-01",
    tanggalSelesai: "2026-09-30",
    deskripsi: "Survei kepuasan pelanggan domestik tahun 2026.",
    jumlahPertanyaan: 0,
    jumlahResponden: 0,
    terakhirDiubah: "2026-06-18T09:30:00",
    createdAt: "2026-06-01T08:00:00",
  },
  {
    id: "srv_02",
    kode: "SKP-2025",
    nama: "Survei Penumpang Internasional Q3",
    jenisNota: "Internasional",
    periode: 2025,
    status: "aktif",
    tanggalMulai: "2025-07-01",
    tanggalSelesai: "2025-09-30",
    deskripsi:
      "Survei kepuasan layanan terminal internasional, periode Q3 2025.",
    jumlahPertanyaan: 0,
    jumlahResponden: 1248,
    terakhirDiubah: "2026-06-12T14:05:00",
    createdAt: "2025-06-10T08:00:00",
  },
  {
    id: "srv_03",
    kode: "SKP-2024",
    nama: "Survei Layanan SPSL Group - Phase 1",
    jenisNota: "SPSL Group",
    periode: 2024,
    status: "selesai",
    tanggalMulai: "2024-04-01",
    tanggalSelesai: "2024-06-30",
    deskripsi:
      "Evaluasi kepuasan pelanggan B2B atas layanan logistik terintegrasi SPSL Group.",
    jumlahPertanyaan: 0,
    jumlahResponden: 3910,
    terakhirDiubah: "2024-12-31T16:00:00",
    createdAt: "2024-03-01T08:00:00",
  },
  {
    id: "srv_04",
    kode: "SKP-2023",
    nama: "Evaluasi Tahunan Domestik 2023",
    jenisNota: "Domestik",
    periode: 2023,
    status: "arsip",
    tanggalMulai: "2023-07-01",
    tanggalSelesai: "2023-09-30",
    deskripsi: "Evaluasi tahunan kepuasan pelanggan domestik 2023 (arsip).",
    jumlahPertanyaan: 0,
    jumlahResponden: 2150,
    terakhirDiubah: "2023-12-20T08:00:00",
    createdAt: "2023-06-01T08:00:00",
  },
];

// ---- §12.2 Questions ----

// SKP-2026 (srv_01) — Domestik, draft
const srv01Questions: Question[] = [
  // C1 — GRUP: Fasilitas & dimensi layanan
  {
    id: "q_c1",
    surveyId: "srv_01",
    kode: "C1",
    parentId: null,
    teks: "Fasilitas & dimensi layanan",
    tipe: "GRUP",
    urutan: 1,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q_c1_1",
    surveyId: "srv_01",
    kode: "C1.1",
    parentId: "q_c1",
    teks: "Kebersihan & kenyamanan fasilitas terminal",
    tipe: "SKALA_KEPUASAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q_c1_2",
    surveyId: "srv_01",
    kode: "C1.2",
    parentId: "q_c1",
    teks: "Ketersediaan & kejelasan informasi/papan petunjuk",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q_c1_3",
    surveyId: "srv_01",
    kode: "C1.3",
    parentId: "q_c1",
    teks: "Kecepatan proses layanan bongkar muat",
    tipe: "SKALA_KEPUASAN",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q_c1_4",
    surveyId: "srv_01",
    kode: "C1.4",
    parentId: "q_c1",
    teks: "Keramahan & profesionalisme petugas",
    tipe: "SKALA_KEPUASAN",
    urutan: 4,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q_c1_5",
    surveyId: "srv_01",
    kode: "C1.5",
    parentId: "q_c1",
    teks: "Keamanan barang & area pelabuhan",
    tipe: "SKALA_KEPUASAN",
    urutan: 5,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  // C2 — NPS
  {
    id: "q_c2",
    surveyId: "srv_01",
    kode: "C2",
    parentId: null,
    teks: "Seberapa besar kemungkinan Anda merekomendasikan Pelindo?",
    tipe: "NPS",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_nps"),
  },

  // C3 — YA_TIDAK + 3 anak bersyarat (tampil hanya bila C3 = "Ya")
  {
    id: "q_c3",
    surveyId: "srv_01",
    kode: "C3",
    parentId: null,
    teks: "Apakah Anda menggunakan pelabuhan lain?",
    tipe: "YA_TIDAK",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
  },
  {
    id: "q_c3_1",
    surveyId: "srv_01",
    kode: "C3.1",
    parentId: "q_c3",
    teks: "Sebutkan nama pelabuhan tersebut!",
    tipe: "TEKS",
    urutan: 1,
    wajibDiisi: false,
    isGroup: false,
    logic: {
      conditions: [
        { sourceQuestionKode: "C3", operator: "sama_dengan", value: "Ya" },
      ],
    },
  },
  {
    id: "q_c3_2",
    surveyId: "srv_01",
    kode: "C3.2",
    parentId: "q_c3",
    teks: "Tingkat kepuasan terhadap pelabuhan lain tersebut",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: false,
    isGroup: false,
    ...snap("scl_puas4"),
    logic: {
      conditions: [
        { sourceQuestionKode: "C3", operator: "sama_dengan", value: "Ya" },
      ],
    },
  },
  {
    id: "q_c3_3",
    surveyId: "srv_01",
    kode: "C3.3",
    parentId: "q_c3",
    teks: "Siapa pengelola pelabuhan tersebut?",
    tipe: "PILIHAN_TUNGGAL",
    urutan: 3,
    wajibDiisi: false,
    isGroup: false,
    acakOpsi: false,
    logic: {
      conditions: [
        { sourceQuestionKode: "C3", operator: "sama_dengan", value: "Ya" },
      ],
    },
    options: [
      { id: "opt_c3_3_a", label: "BUMN", skor: 3, urutan: 1 },
      { id: "opt_c3_3_b", label: "Swasta nasional", skor: 2, urutan: 2 },
      { id: "opt_c3_3_c", label: "Operator asing", skor: 1, urutan: 3 },
    ],
  },

  // C4 — GRUP: Loyalitas pelanggan
  {
    id: "q_c4",
    surveyId: "srv_01",
    kode: "C4",
    parentId: null,
    teks: "Loyalitas pelanggan",
    tipe: "GRUP",
    urutan: 4,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q_c4_1",
    surveyId: "srv_01",
    kode: "C4.1",
    parentId: "q_c4",
    teks: "Saya akan kembali menggunakan layanan Pelindo",
    tipe: "SKALA_PERSETUJUAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_setuju4"),
  },
  {
    id: "q_c4_2",
    surveyId: "srv_01",
    kode: "C4.2",
    parentId: "q_c4",
    teks: "Saya bersedia merekomendasikan ke mitra bisnis",
    tipe: "SKALA_PERSETUJUAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_setuju4"),
  },

  // C5 — SKALA_KEPUASAN
  {
    id: "q_c5",
    surveyId: "srv_01",
    kode: "C5",
    parentId: null,
    teks: "Penerapan SMAP ISO 37001 di lingkungan pelabuhan",
    tipe: "SKALA_KEPUASAN",
    urutan: 5,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  // C6 — TEKS (saran)
  {
    id: "q_c6",
    surveyId: "srv_01",
    kode: "C6",
    parentId: null,
    teks: "Saran & masukan terhadap layanan Pelindo",
    tipe: "TEKS",
    urutan: 6,
    wajibDiisi: false,
    isGroup: false,
  },

  // C7 — PILIHAN_GANDA
  {
    id: "q_c7",
    surveyId: "srv_01",
    kode: "C7",
    parentId: null,
    teks: "Kendala/pain points yang Anda rasakan (boleh lebih dari satu)",
    tipe: "PILIHAN_GANDA",
    urutan: 7,
    wajibDiisi: false,
    isGroup: false,
    options: [
      { id: "opt_c7_a", label: "Waktu tunggu layanan lama", urutan: 1 },
      { id: "opt_c7_b", label: "Biaya layanan tinggi", urutan: 2 },
      { id: "opt_c7_c", label: "Informasi kurang jelas", urutan: 3 },
      { id: "opt_c7_d", label: "Fasilitas terbatas", urutan: 4 },
    ],
  },
];

// SKP-2025 (srv_02) — Internasional, aktif
const srv02Questions: Question[] = [
  {
    id: "q2_c1",
    surveyId: "srv_02",
    kode: "C1",
    parentId: null,
    teks: "Kemudahan & aksesibilitas",
    tipe: "GRUP",
    urutan: 1,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q2_c1_1",
    surveyId: "srv_02",
    kode: "C1.1",
    parentId: "q2_c1",
    teks: "Kemudahan akses menuju terminal internasional",
    tipe: "SKALA_KEPUASAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q2_c1_2",
    surveyId: "srv_02",
    kode: "C1.2",
    parentId: "q2_c1",
    teks: "Kejelasan informasi & papan petunjuk berbahasa Inggris",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q2_c1_3",
    surveyId: "srv_02",
    kode: "C1.3",
    parentId: "q2_c1",
    teks: "Kemudahan proses imigrasi & kepabeanan",
    tipe: "SKALA_KEPUASAN",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  {
    id: "q2_c2",
    surveyId: "srv_02",
    kode: "C2",
    parentId: null,
    teks: "Kualitas layanan",
    tipe: "GRUP",
    urutan: 2,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q2_c2_1",
    surveyId: "srv_02",
    kode: "C2.1",
    parentId: "q2_c2",
    teks: "Kecepatan layanan dokumen ekspor-impor",
    tipe: "SKALA_KEPUASAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q2_c2_2",
    surveyId: "srv_02",
    kode: "C2.2",
    parentId: "q2_c2",
    teks: "Profesionalisme & kompetensi petugas",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q2_c2_3",
    surveyId: "srv_02",
    kode: "C2.3",
    parentId: "q2_c2",
    teks: "Ketersediaan fasilitas penunjang (lounge, mushola, dll.)",
    tipe: "SKALA_KEPUASAN",
    urutan: 3,
    wajibDiisi: false,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  {
    id: "q2_c3",
    surveyId: "srv_02",
    kode: "C3",
    parentId: null,
    teks: "Seberapa besar kemungkinan Anda merekomendasikan terminal internasional Pelindo?",
    tipe: "NPS",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_nps"),
  },
  {
    id: "q2_c4",
    surveyId: "srv_02",
    kode: "C4",
    parentId: null,
    teks: "Layanan terminal internasional telah sesuai standar global",
    tipe: "SKALA_PERSETUJUAN",
    urutan: 4,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_setuju4"),
  },

  {
    id: "q2_c5",
    surveyId: "srv_02",
    kode: "C5",
    parentId: null,
    teks: "Apakah Anda pernah mengalami keterlambatan layanan?",
    tipe: "YA_TIDAK",
    urutan: 5,
    wajibDiisi: true,
    isGroup: false,
  },
  {
    id: "q2_c5_1",
    surveyId: "srv_02",
    kode: "C5.1",
    parentId: "q2_c5",
    teks: "Jelaskan kendala keterlambatan yang Anda alami",
    tipe: "TEKS",
    urutan: 1,
    wajibDiisi: false,
    isGroup: false,
    logic: {
      conditions: [
        { sourceQuestionKode: "C5", operator: "sama_dengan", value: "Ya" },
      ],
    },
  },
  {
    id: "q2_c5_2",
    surveyId: "srv_02",
    kode: "C5.2",
    parentId: "q2_c5",
    teks: "Berapa lama rata-rata keterlambatan tersebut?",
    tipe: "PILIHAN_TUNGGAL",
    urutan: 2,
    wajibDiisi: false,
    isGroup: false,
    acakOpsi: false,
    logic: {
      conditions: [
        { sourceQuestionKode: "C5", operator: "sama_dengan", value: "Ya" },
      ],
    },
    options: [
      { id: "opt_q2_c5_2_a", label: "Kurang dari 1 jam", skor: 3, urutan: 1 },
      { id: "opt_q2_c5_2_b", label: "1–3 jam", skor: 2, urutan: 2 },
      { id: "opt_q2_c5_2_c", label: "Lebih dari 3 jam", skor: 1, urutan: 3 },
    ],
  },

  {
    id: "q2_c6",
    surveyId: "srv_02",
    kode: "C6",
    parentId: null,
    teks: "Aspek yang menurut Anda perlu ditingkatkan (boleh lebih dari satu)",
    tipe: "PILIHAN_GANDA",
    urutan: 6,
    wajibDiisi: false,
    isGroup: false,
    options: [
      { id: "opt_q2_c6_a", label: "Kecepatan layanan", urutan: 1 },
      { id: "opt_q2_c6_b", label: "Sistem digital/online", urutan: 2 },
      { id: "opt_q2_c6_c", label: "Fasilitas fisik", urutan: 3 },
      { id: "opt_q2_c6_d", label: "Komunikasi petugas", urutan: 4 },
      { id: "opt_q2_c6_e", label: "Tarif layanan", urutan: 5 },
    ],
  },
  {
    id: "q2_c7",
    surveyId: "srv_02",
    kode: "C7",
    parentId: null,
    teks: "Saran & masukan untuk peningkatan layanan terminal internasional",
    tipe: "TEKS",
    urutan: 7,
    wajibDiisi: false,
    isGroup: false,
  },
];

// SKP-2024 (srv_03) — SPSL Group (B2B logistik), selesai
const srv03Questions: Question[] = [
  {
    id: "q3_c1",
    surveyId: "srv_03",
    kode: "C1",
    parentId: null,
    teks: "Operasional & logistik",
    tipe: "GRUP",
    urutan: 1,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q3_c1_1",
    surveyId: "srv_03",
    kode: "C1.1",
    parentId: "q3_c1",
    teks: "Ketepatan waktu layanan logistik",
    tipe: "SKALA_KEPUASAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q3_c1_2",
    surveyId: "srv_03",
    kode: "C1.2",
    parentId: "q3_c1",
    teks: "Keandalan sistem pelacakan kargo (tracking)",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q3_c1_3",
    surveyId: "srv_03",
    kode: "C1.3",
    parentId: "q3_c1",
    teks: "Kondisi & ketersediaan alat angkut/handling",
    tipe: "SKALA_KEPUASAN",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  {
    id: "q3_c2",
    surveyId: "srv_03",
    kode: "C2",
    parentId: null,
    teks: "Administrasi & keuangan",
    tipe: "GRUP",
    urutan: 2,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q3_c2_1",
    surveyId: "srv_03",
    kode: "C2.1",
    parentId: "q3_c2",
    teks: "Transparansi tarif & komponen biaya layanan",
    tipe: "SKALA_KEPUASAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q3_c2_2",
    surveyId: "srv_03",
    kode: "C2.2",
    parentId: "q3_c2",
    teks: "Kecepatan proses penagihan/invoice",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  {
    id: "q3_c3",
    surveyId: "srv_03",
    kode: "C3",
    parentId: null,
    teks: "Seberapa besar kemungkinan Anda merekomendasikan layanan SPSL Group?",
    tipe: "NPS",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_nps"),
  },

  {
    id: "q3_c4",
    surveyId: "srv_03",
    kode: "C4",
    parentId: null,
    teks: "Apakah Anda menggunakan layanan terintegrasi (end-to-end)?",
    tipe: "YA_TIDAK",
    urutan: 4,
    wajibDiisi: true,
    isGroup: false,
  },
  {
    id: "q3_c4_1",
    surveyId: "srv_03",
    kode: "C4.1",
    parentId: "q3_c4",
    teks: "Layanan SPSL Group apa yang Anda gunakan?",
    tipe: "PILIHAN_GANDA",
    urutan: 1,
    wajibDiisi: false,
    isGroup: false,
    logic: {
      conditions: [
        { sourceQuestionKode: "C4", operator: "sama_dengan", value: "Ya" },
      ],
    },
    options: [
      { id: "opt_q3_c4_1_a", label: "Kepelabuhanan", urutan: 1 },
      { id: "opt_q3_c4_1_b", label: "Pergudangan", urutan: 2 },
      { id: "opt_q3_c4_1_c", label: "Transportasi darat", urutan: 3 },
      { id: "opt_q3_c4_1_d", label: "Freight forwarding", urutan: 4 },
      { id: "opt_q3_c4_1_e", label: "Kepabeanan (bea cukai)", urutan: 5 },
    ],
  },

  {
    id: "q3_c5",
    surveyId: "srv_03",
    kode: "C5",
    parentId: null,
    teks: "Layanan SPSL Group meningkatkan efisiensi rantai pasok perusahaan kami",
    tipe: "SKALA_PERSETUJUAN",
    urutan: 5,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_setuju4"),
  },
  {
    id: "q3_c6",
    surveyId: "srv_03",
    kode: "C6",
    parentId: null,
    teks: "Frekuensi penggunaan layanan dalam sebulan",
    tipe: "PILIHAN_TUNGGAL",
    urutan: 6,
    wajibDiisi: false,
    isGroup: false,
    acakOpsi: false,
    options: [
      { id: "opt_q3_c6_a", label: "1–5 kali", skor: 1, urutan: 1 },
      { id: "opt_q3_c6_b", label: "6–15 kali", skor: 2, urutan: 2 },
      { id: "opt_q3_c6_c", label: "Lebih dari 15 kali", skor: 3, urutan: 3 },
    ],
  },
  {
    id: "q3_c7",
    surveyId: "srv_03",
    kode: "C7",
    parentId: null,
    teks: "Masukan untuk pengembangan layanan SPSL Group",
    tipe: "TEKS",
    urutan: 7,
    wajibDiisi: false,
    isGroup: false,
  },
];

// SKP-2023 (srv_04) — Domestik, arsip (lebih ringkas)
const srv04Questions: Question[] = [
  {
    id: "q4_c1",
    surveyId: "srv_04",
    kode: "C1",
    parentId: null,
    teks: "Pelayanan umum",
    tipe: "GRUP",
    urutan: 1,
    wajibDiisi: false,
    isGroup: true,
  },
  {
    id: "q4_c1_1",
    surveyId: "srv_04",
    kode: "C1.1",
    parentId: "q4_c1",
    teks: "Kebersihan & kenyamanan fasilitas pelabuhan",
    tipe: "SKALA_KEPUASAN",
    urutan: 1,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q4_c1_2",
    surveyId: "srv_04",
    kode: "C1.2",
    parentId: "q4_c1",
    teks: "Keramahan & kesigapan petugas",
    tipe: "SKALA_KEPUASAN",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },
  {
    id: "q4_c1_3",
    surveyId: "srv_04",
    kode: "C1.3",
    parentId: "q4_c1",
    teks: "Kecepatan proses layanan",
    tipe: "SKALA_KEPUASAN",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_puas4"),
  },

  {
    id: "q4_c2",
    surveyId: "srv_04",
    kode: "C2",
    parentId: null,
    teks: "Seberapa besar kemungkinan Anda merekomendasikan Pelindo?",
    tipe: "NPS",
    urutan: 2,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_nps"),
  },
  {
    id: "q4_c3",
    surveyId: "srv_04",
    kode: "C3",
    parentId: null,
    teks: "Secara keseluruhan saya puas dengan layanan Pelindo",
    tipe: "SKALA_PERSETUJUAN",
    urutan: 3,
    wajibDiisi: true,
    isGroup: false,
    ...snap("scl_setuju4"),
  },
  {
    id: "q4_c4",
    surveyId: "srv_04",
    kode: "C4",
    parentId: null,
    teks: "Apakah Anda berencana menggunakan layanan Pelindo kembali?",
    tipe: "YA_TIDAK",
    urutan: 4,
    wajibDiisi: true,
    isGroup: false,
  },
  {
    id: "q4_c5",
    surveyId: "srv_04",
    kode: "C5",
    parentId: null,
    teks: "Saran perbaikan untuk tahun berikutnya",
    tipe: "TEKS",
    urutan: 5,
    wajibDiisi: false,
    isGroup: false,
  },
];

export const seedQuestions: Question[] = [
  ...srv01Questions,
  ...srv02Questions,
  ...srv03Questions,
  ...srv04Questions,
];

// ---- §12.3 Identity fields (grup "Identitas") ----
type IdentitySpec = Pick<IdentityField, "nama" | "sumber" | "deskripsi">;

function buildIdentity(
  surveyId: string,
  prefix: string,
  spec: IdentitySpec[],
): IdentityField[] {
  return spec.map((f, i) => ({
    id: `idf_${prefix}_${String(i + 1).padStart(2, "0")}`,
    surveyId,
    urutan: i + 1,
    ...f,
  }));
}

const identitySrv01: IdentitySpec[] = [
  {
    nama: "No Billing",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Cabang",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Entitas Bisnis Pelindo",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Responden",
    sumber: "ISIAN",
    deskripsi: "Diisi oleh Responden",
  },
  {
    nama: "Nomor WA/Handphone",
    sumber: "ISIAN",
    deskripsi: "Diisi oleh Responden",
  },
  {
    nama: "Nama Perusahaan / Nama Kapal",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Jenis Pelayanan Paling Dominan",
    sumber: "PILIHAN",
    deskripsi: "Lookup dari database Pelindo",
  },
  { nama: "Kategori Responden", sumber: "PILIHAN", deskripsi: "Lookup" },
  {
    nama: "Tanggal Pengisian",
    sumber: "SISTEM",
    deskripsi: "Diisi otomatis sistem",
  },
  {
    nama: "Nama Enumerator",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
];

const identitySrv02: IdentitySpec[] = [
  {
    nama: "No Billing",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Kapal / Vessel",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Agen Pelayaran",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Negara Asal / Tujuan",
    sumber: "PILIHAN",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Responden",
    sumber: "ISIAN",
    deskripsi: "Diisi oleh Responden",
  },
  {
    nama: "Email Responden",
    sumber: "ISIAN",
    deskripsi: "Diisi oleh Responden",
  },
  {
    nama: "Jenis Layanan (Ekspor/Impor)",
    sumber: "PILIHAN",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Tanggal Pengisian",
    sumber: "SISTEM",
    deskripsi: "Diisi otomatis sistem",
  },
];

const identitySrv03: IdentitySpec[] = [
  {
    nama: "No Kontrak",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database SPSL Group",
  },
  {
    nama: "Nama Perusahaan",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database SPSL Group",
  },
  {
    nama: "NPWP Perusahaan",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database SPSL Group",
  },
  { nama: "Nama PIC", sumber: "ISIAN", deskripsi: "Diisi oleh Responden" },
  {
    nama: "Nomor WA/Handphone",
    sumber: "ISIAN",
    deskripsi: "Diisi oleh Responden",
  },
  {
    nama: "Kategori Layanan",
    sumber: "PILIHAN",
    deskripsi: "Lookup dari database SPSL Group",
  },
  {
    nama: "Tanggal Pengisian",
    sumber: "SISTEM",
    deskripsi: "Diisi otomatis sistem",
  },
];

const identitySrv04: IdentitySpec[] = [
  {
    nama: "No Billing",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Cabang",
    sumber: "OTOMATIS",
    deskripsi: "Lookup dari database Pelindo",
  },
  {
    nama: "Nama Responden",
    sumber: "ISIAN",
    deskripsi: "Diisi oleh Responden",
  },
  { nama: "Kategori Responden", sumber: "PILIHAN", deskripsi: "Lookup" },
  {
    nama: "Tanggal Pengisian",
    sumber: "SISTEM",
    deskripsi: "Diisi otomatis sistem",
  },
];

export const seedIdentityFields: IdentityField[] = [
  ...buildIdentity("srv_01", "01", identitySrv01),
  ...buildIdentity("srv_02", "02", identitySrv02),
  ...buildIdentity("srv_03", "03", identitySrv03),
  ...buildIdentity("srv_04", "04", identitySrv04),
];

// ---- Finalize: turunkan denormalized count (cermin DATABASE.md §5) ----
// childCount per grup & jumlahPertanyaan (non-grup) per survei — selalu sinkron dengan data.
for (const q of seedQuestions) {
  if (q.isGroup) {
    q.childCount = seedQuestions.filter((c) => c.parentId === q.id).length;
  }
}
for (const s of seedSurveys) {
  s.jumlahPertanyaan = seedQuestions.filter(
    (q) => q.surveyId === s.id && !q.isGroup,
  ).length;
}
