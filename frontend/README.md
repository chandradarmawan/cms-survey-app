# Pelindo Survey CMS

Front-end (admin) untuk manajemen kuesioner Survei Kepuasan Pelanggan (SKP) Pelindo, dengan **dummy API in-memory** (Zustand). Lihat [docs/PRD.md](docs/PRD.md) sebagai sumber kebenaran.

## Stack

Vite · React 18 + TypeScript · Tailwind CSS · React Router v6 · Zustand · (siap: react-hook-form + zod, @dnd-kit).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc -b) + build produksi
npm run preview    # preview hasil build
```

## Status implementasi (per milestone — PRD §13)

| Milestone | Status |
|---|---|
| **M1** Fondasi + Daftar Survei | ✅ Selesai |
| **M2** Buat Survei (modal blank/duplicate, zod) | ✅ Selesai |
| **M3** Kelola Pertanyaan (tree + grup virtual + state) | ✅ Selesai |
| **M4** Editor Pertanyaan (8 tipe, opsi+skor, dnd) | ✅ Selesai |
| **M5** Logika Tampil (condition-builder) & Identitas (kartu draggable) | ✅ Selesai |
| **M6** Tab pendukung & polish | 🟡 Skala (read), Master data & Hasil (stub); reorder dnd aktif |

Alur end-to-end yang bisa didemokan: **Daftar Survei → Buat Survei (kosong/duplikat) → Kelola Pertanyaan (tambah/edit 8 tipe, opsi+skor, logika tampil, identitas draggable, reorder) → Aktifkan**.

## Arsitektur singkat

> Detail lengkap: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

- **Sumber data**: `src/store/useSurveyStore.ts` (Zustand) + `src/store/seed.ts` (PRD §12). Komponen baca via selector, ubah via action — sinkron otomatis tanpa refetch.
- **Lapisan akses tipis**: `src/data/*` membungkus store; signature dipetakan ke REST (PRD §7) agar mudah ditukar ke `fetch` nanti.
- **Token desain**: `tailwind.config.js` (PRD §4) — flat, light mode, tanpa shadow kecuali modal.
- **Label**: Bahasa Indonesia formal di `src/i18n/id.ts`.

## Struktur folder

```
src/
  store/     # Zustand store + seed (sumber data in-memory)
  data/      # lapisan akses tipis (≈ endpoint REST)
  types/     # model data (PRD §5)
  components/ # reusable: Icon, StatusBadge, SummaryCard, Toast, ...
  features/  # survey-list, question-manage, scales, master-data, results
  layouts/   # AppShell (header + 5 top tabs)
  lib/       # format, id
  i18n/      # id.ts
  routes.tsx
  main.tsx
```
