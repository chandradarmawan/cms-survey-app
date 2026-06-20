# Arsitektur — Pelindo Survey CMS

Dokumen ini menjelaskan arsitektur teknis aplikasi. Untuk *kebutuhan produk* (apa & mengapa),
lihat **[PRD.md](PRD.md)** yang menjadi sumber kebenaran — kode mereferensikan section-nya (`PRD §6.3`, `§8.4`, dst).
Dokumen ini fokus pada *bagaimana* kode disusun.

---

## 1. Ringkasan

**Pelindo Survey CMS** adalah front-end admin untuk mengelola kuesioner Survei Kepuasan Pelanggan (SKP).

| Aspek | Keputusan |
|---|---|
| **Tipe** | SPA (Single Page Application) front-end-only |
| **Backend** | **Tidak ada.** Seluruh data hidup di store in-memory (Zustand), di-*seed* saat startup |
| **Persistensi** | Tidak ada — refresh halaman = reset ke data seed |
| **Bahasa label** | Bahasa Indonesia formal (`src/i18n/id.ts`) |
| **Bahasa kode** | Identifier & komentar campuran Indonesia/Inggris |
| **Tujuan** | Demo alur end-to-end + cetak biru (blueprint) yang siap ditempel backend nyata |

Aplikasi dirancang dengan **seam (jahitan) yang jelas** agar penggantian dari dummy in-memory
ke REST API nyata tidak menyentuh komponen UI — lihat [§5 Lapisan Akses Data](#5-lapisan-akses-data).

---

## 2. Tech Stack

| Kategori | Pilihan | Versi | Catatan |
|---|---|---|---|
| Build tool | **Vite** | 5 | Dev server `:5173`, alias `@` → `src/` |
| UI library | **React** | 18 | `StrictMode`, function components + hooks |
| Bahasa | **TypeScript** | 5 | `tsc -b` adalah satu-satunya gate otomatis |
| Styling | **Tailwind CSS** | 3 | Token desain di `tailwind.config.js` (PRD §4) |
| Routing | **React Router** | 6 | Nested routes di bawah `AppShell` |
| State | **Zustand** | 4 | Satu store global, tanpa Redux/Context |
| Form | **react-hook-form + zod** | 7 / 3 | Validasi (mis. CreateSurveyModal) |
| Drag & drop | **@dnd-kit** | core 6 | Reorder opsi, identitas, tree |
| Ikon | **Material Symbols Outlined** | — | Via ligature, komponen `<Icon>` |

Tidak ada test runner dan tidak ada linter. **`npm run typecheck` (`tsc -b --noEmit`) adalah satu-satunya pemeriksaan otomatis.**

```bash
npm run dev        # vite dev server, http://localhost:5173
npm run build      # tsc -b (typecheck) + vite build
npm run typecheck  # validasi perubahan
npm run preview    # serve hasil build produksi
```

---

## 3. Gambaran Arsitektur

Pola intinya: **satu store, dua lapisan** (single store, two layers).

```
┌──────────────────────────────────────────────────────────────┐
│                          UI (React)                          │
│   layouts/AppShell  ·  features/*  ·  components/*           │
│   - baca state via SELECTOR (useSurveyStore(s => ...))      │
│   - ubah state via ACTION (lewat lapisan data)              │
└───────────────┬───────────────────────┬──────────────────────┘
                │ read (pure helpers)    │ write (mutations)
                ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│              Lapisan Akses Data — src/data/*                  │
│   filterSurveys() · buildTree() · addQuestion() · ...        │
│   Signature DIPETAKAN ke REST (GET/POST/PATCH) — PRD §7     │
│   → ini "seam" untuk ditukar ke fetch/axios nanti           │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│           Store (the "database") — src/store/                │
│   useSurveyStore.ts  ← di-seed dari  seed.ts (PRD §12)       │
│   state: surveys[] · questions[] · scales[] · identityFields[]│
│   actions menjaga INVARIAN (denormalized counts, cascade)   │
└──────────────────────────────────────────────────────────────┘
                            ▲
                            │ kontrak tipe
                  src/types/index.ts (model data, PRD §5)
```

**Mengapa pola ini?** Komponen tidak pernah memanggil store secara langsung untuk hal-hal yang
"berbau API". Mereka melewati `src/data/*`, yang setiap fungsinya diberi komentar route REST yang
dituju (`GET /api/surveys`, `POST /api/surveys/:id/questions`). Saat backend nyata datang, hanya
isi fungsi-fungsi di `src/data/*` yang berubah (dari `getState()` menjadi `fetch`) — komponen tetap.

---

## 4. Struktur Folder

```
frontend/
├── docs/
│   ├── PRD.md            # sumber kebenaran produk
│   └── ARCHITECTURE.md   # dokumen ini
├── src/
│   ├── main.tsx          # entry: StrictMode + BrowserRouter + AppRoutes
│   ├── routes.tsx        # definisi rute (nested di bawah AppShell)
│   ├── types/
│   │   └── index.ts      # model data inti — kontrak store↔UI (PRD §5)
│   ├── store/
│   │   ├── useSurveyStore.ts  # Zustand store + semua action (the "database")
│   │   └── seed.ts            # data awal in-memory (PRD §12)
│   ├── data/             # LAPISAN AKSES TIPIS (≈ endpoint REST)
│   │   ├── surveys.ts        # filterSurveys, computeSummary, createSurvey, ...
│   │   ├── questions.ts      # getQuestions, buildTree, addQuestion, ...
│   │   ├── scales.ts         # getScales, getScale
│   │   └── identity.ts       # getIdentityFields, reorderIdentityFields, ...
│   ├── lib/              # util murni, tanpa state
│   │   ├── id.ts             # genId(prefix) — id entitas baru
│   │   ├── format.ts         # relativeTime, formatTanggal, nowIso (waktu deterministik)
│   │   └── questionMeta.ts   # metadata per-tipe + predikat (isPilihan, nextKode, ...)
│   ├── i18n/
│   │   └── id.ts         # seluruh label UI (Bahasa Indonesia)
│   ├── layouts/
│   │   └── AppShell.tsx  # header sticky + 5 top tabs + <Outlet/>
│   ├── components/       # reusable, agnostik domain
│   │   ├── Icon · Modal · Toast · Toggle · FormField · RadioCard
│   │   ├── StatusBadge · JenisNotaBadge · SummaryCard · StubPage
│   │   └── SortableList · ScalePreview
│   └── features/         # modul per layar (lihat §8)
│       ├── survey-list/      survey-create/
│       ├── question-manage/  question-editor/
│       ├── scales/  master-data/  results/
├── tailwind.config.js   # token desain (PRD §4)
├── vite.config.ts       # alias @ → src/
└── tsconfig*.json        # konfigurasi TypeScript (project references)
```

**Pemisahan tanggung jawab:**
- `components/` = reusable & agnostik domain (tidak tahu soal "survei").
- `features/` = layar konkret, boleh tahu domain & memanggil `data/`.
- `lib/` = fungsi murni, tanpa side-effect/state.
- `data/` = satu-satunya pintu menuju store untuk operasi mirip-API.

---

## 5. Model Data

Didefinisikan di **`src/types/index.ts`** (PRD §5). Empat entitas utama + view-model turunan.

```
Survey 1───* Question         (Question.surveyId → Survey.id)
Question *──1 Question         (Question.parentId → Question.id, hirarki grup)
Question *──1 Scale            (Question.scaleId  → Scale.id, untuk tipe skala)
Survey 1───* IdentityField     (IdentityField.surveyId → Survey.id)
Scale = global (tidak terikat survei)
```

### Entitas

| Entitas | Field kunci | Catatan |
|---|---|---|
| **Survey** | `status`, `jenisNota`, `periode`, `jumlahPertanyaan`, `jumlahResponden` | `status`: `draft \| aktif \| selesai \| arsip`. Selalu mulai `draft` (PRD §6.2) |
| **Question** | `tipe`, `parentId`, `urutan`, `kode`, `isGroup`, `childCount` | Flat array, hirarki lewat `parentId`. `kode` auto ("C1", "C3.1") |
| **QuestionOption** | `label`, `skor?`, `urutan` | Untuk `PILIHAN_TUNGGAL`/`PILIHAN_GANDA` |
| **Scale** | `tipe`, `poin`, `labels[]`, `endpointKiri/Kanan?` | `KEPUASAN \| PERSETUJUAN \| NPS`. Global/reusable |
| **IdentityField** | `sumber`, `urutan` | `sumber`: `OTOMATIS \| ISIAN \| PILIHAN \| SISTEM` |
| **Condition / ConditionGroup** | `sourceQuestionKode`, `operator`, `value` | Logika tampil; group = AND dari semua condition |

### Delapan Tipe Pertanyaan (`QuestionType`)

`GRUP` · `SKALA_KEPUASAN` · `SKALA_PERSETUJUAN` · `NPS` · `YA_TIDAK` · `PILIHAN_TUNGGAL` · `PILIHAN_GANDA` · `TEKS`

Tipe pertanyaan **mengendalikan hampir segalanya**: field editor mana yang muncul, badge di tree,
skala apa yang berlaku. Metadata per-tipe disentralisasi di `src/lib/questionMeta.ts` (lihat §7).

### View-model turunan

- **`SurveySummary`** — `{ total, aktif, draft, totalResponden }`, dihitung dari `surveys[]` oleh
  `computeSummary()` (bukan disimpan).

---

## 6. State Management (Store + Invarian)

### Store

`src/store/useSurveyStore.ts` adalah **seluruh "database"**. State-nya empat array:
`surveys`, `questions`, `scales`, `identityFields` — di-inisialisasi dari `seed.ts`.

Komponen membaca dengan **selector** agar re-render minimal:

```ts
// baca subset → re-render hanya saat subset berubah
const survey = useSurveyStore((s) => s.surveys.find((sv) => sv.id === id));
```

Mutasi selalu lewat **action** (`createSurvey`, `addQuestion`, `deleteQuestion`, …). Karena UI baca
dari store reaktif yang sama, perubahan langsung tersinkron tanpa refetch.

### Invarian #1 — Denormalized counts dijaga di dalam action

`Survey.jumlahPertanyaan` dan `Question.childCount` **disimpan**, bukan dihitung saat render.
Setiap action yang menambah/menghapus/memindah pertanyaan **wajib** menghitung ulang:

- `countNonGroup(questions, surveyId)` → set `Survey.jumlahPertanyaan`
- `recalcChildCount(questions, parentId)` → set `Question.childCount`

> ⚠️ Saat menyunting action store, pertahankan ini. Contoh: `addQuestion` dan `deleteQuestion`
> keduanya memanggil helper di atas. Melewatkannya = badge & ringkasan jadi salah.

### Invarian #2 — Delete meng-cascade ke seluruh keturunan

`deleteQuestion` menghapus pertanyaan target **dan semua anak/cucunya** (penelusuran `parentId`
berulang sampai tidak ada perubahan), lalu menyinkronkan `childCount` induk.

### Invarian #3 — Duplicate menyalin struktur dengan remap id

`createSurvey({ method: 'duplicate' })` (PRD §6.3) menyalin seluruh pertanyaan + identitas dari
survei sumber. Karena `parentId` mereferensikan id lama, action membangun **`idMap` (id lama → id baru)**
lalu memetakan ulang `parentId` setiap klon — sehingga hirarki utuh di survei baru.

### Waktu deterministik

`src/lib/format.ts` mematok `APP_NOW = 2026-06-20` agar timestamp & "x hari lalu" stabil di demo.
Gunakan `nowIso()` untuk timestamp, bukan `new Date()` langsung.

---

## 7. Sistem Tipe Pertanyaan

Logika per-tipe **tidak boleh** disebar sebagai `switch (tipe)` di banyak tempat. Sentralnya di
**`src/lib/questionMeta.ts`**:

| Ekspor | Guna |
|---|---|
| `QUESTION_TYPE_META` | `{ label, icon }` per tipe (untuk picker & header) |
| `QUESTION_TYPE_ORDER` | urutan tile pada `TypePicker` |
| `treeBadge(q)` | badge ringkas di tree (mis. `"Grup · 3"`, `"NPS 0–10"`) |
| `isPilihan(t)` / `isSkala(t)` | predikat tipe — pakai ini, jangan re-switch |
| `scaleTypeFor(t)` | `QuestionType` skala → `Scale.tipe` yang cocok |
| `nextKode(...)` | kode auto: top-level `C{n}`, anak `{kodeInduk}.{m}` (PRD §6.1) |

> Saat menambah tipe pertanyaan baru: perbarui `QuestionType` di `types/index.ts`, lalu lengkapi
> SEMUA map/predikat di `questionMeta.ts`. TypeScript akan memaksa Anda melengkapi `Record<QuestionType, …>`.

---

## 8. Routing & Modul Fitur

### Rute

`src/routes.tsx` — semua halaman nested di bawah `AppShell` (navigasi via **top tabs**, bukan sidebar):

| Path | Halaman | Scope |
|---|---|---|
| `/surveys` | `SurveyListPage` | global |
| `/surveys/:surveyId/questions` | `QuestionManagePage` | per-survei |
| `/surveys/:surveyId/scales` | `ScalesPage` | per-survei |
| `/surveys/:surveyId/results` | `ResultsPage` | per-survei |
| `/master-data` | `MasterDataPage` | global |
| `*` / `index` | redirect → `/surveys` | — |

`AppShell` mengekstrak `surveyId` aktif dari URL; tab per-survei dinonaktifkan saat belum ada survei dipilih.

### Modul fitur (`src/features/*`)

| Folder | Komponen | Tanggung jawab |
|---|---|---|
| **survey-list** | `SurveyListPage`, `RowActionsMenu` | Daftar survei + filter + ringkasan (PRD §8.1) |
| **survey-create** | `CreateSurveyModal` | Buat survei: dua mode *blank / duplicate*, validasi zod (PRD §8.2) |
| **question-manage** | `QuestionManagePage`, `QuestionTree`, `IdentityEditor` | Layout 2 kolom: tree + editor kontekstual; kelola identitas (PRD §8.3) |
| **question-editor** | `QuestionEditor`, `TypePicker`, `ConditionBuilder` | Satu template editor, Section 3 ditukar per tipe; logika tampil (PRD §8.4) |
| **scales** | `ScalesPage` | Daftar skala (read) + preview; CRUD menyusul (PRD §8.5) |
| **master-data** | `MasterDataPage` | Stub (PRD §8.6) |
| **results** | `ResultsPage` | Stub (PRD §8.7) |

### Komponen reusable (`src/components/*`)

`Icon`, `Modal` (satu-satunya yang boleh shadow), `Toast`, `Toggle`, `FormField`, `RadioCard`,
`StatusBadge`, `JenisNotaBadge`, `SummaryCard`, `StubPage`, `SortableList` (dnd reusable: dipakai
opsi/identitas/tree), `ScalePreview`.

---

## 9. Alur Data (Read & Write)

### Read path (contoh: Daftar Survei)

```
SurveyListPage
  └─ useSurveyStore((s) => s.surveys)        # selector, reaktif
  └─ filterSurveys(surveys, filter)          # data/surveys.ts — pure, GET /api/surveys
  └─ computeSummary(surveys)                 # pure, GET /api/surveys/summary
  └─ render
```

Helper *baca* bersifat **pure**: mereka menerima array data sebagai argumen
(`filterSurveys(surveys, …)`, `buildTree(questions, …)`) — mudah dites & tidak menyentuh store.

### Write path (contoh: tambah pertanyaan)

```
QuestionEditor (submit)
  └─ data/questions.ts → addQuestion(surveyId, q)      # POST /api/surveys/:id/questions
       └─ useSurveyStore.getState().addQuestion(...)   # action
            ├─ push question baru (id via genId('q'))
            ├─ recompute Survey.jumlahPertanyaan        # invarian #1
            └─ recompute induk.childCount               # invarian #1
  └─ store update → selector trigger → UI re-render     # sinkron, tanpa refetch
```

Helper *tulis* memanggil `useSurveyStore.getState().<action>()` — **tidak** pakai hook (boleh dipanggil
di luar komponen React).

---

## 10. Konvensi

| Konvensi | Aturan |
|---|---|
| **Alias impor** | `@/` → `src/` (di `vite.config.ts` + `tsconfig`). Gunakan `@/lib/id`, bukan path relatif panjang |
| **Generate id** | `genId(prefix)` — `srv`/`q`/`idf`/… Jangan bikin id manual |
| **Timestamp** | `nowIso()` dari `lib/format.ts` (deterministik), bukan `new Date().toISOString()` |
| **Label UI** | Semua teks tampak di `src/i18n/id.ts`. Jangan hardcode string Indonesia di JSX |
| **Logika per-tipe** | Lewat `lib/questionMeta.ts`. Jangan duplikasi `switch (tipe)` |
| **Akses store dari UI** | Baca via selector, tulis via `data/*`. Komponen tidak panggil action langsung idealnya |
| **Token desain** | Dari `tailwind.config.js` (flat, light-mode, tanpa shadow kecuali modal) — PRD §4 |
| **Referensi PRD** | Komentar kode menunjuk section PRD (`§8.4`). Baca section terkait sebelum ubah behavior |

---

## 11. Cara Mengembangkan

### Menambah backend nyata (mengganti dummy API)

Hanya sentuh **`src/data/*`**. Tiap fungsi sudah diberi komentar route REST yang dituju:

```ts
// SEKARANG (in-memory):
export function createSurvey(input: CreateSurveyInput): Survey {
  return useSurveyStore.getState().createSurvey(input);
}

// NANTI (REST):
export async function createSurvey(input: CreateSurveyInput): Promise<Survey> {
  const res = await fetch('/api/surveys', { method: 'POST', body: JSON.stringify(input) });
  return res.json();
}
```

Yang perlu dipikir saat migrasi: helper *baca* yang kini pure (menerima array) perlu jadi async/fetch,
sehingga komponen yang memanggilnya harus menambah loading/error state. Store bisa beralih peran jadi
cache, atau dilepas demi React Query/SWR.

### Menambah tipe pertanyaan baru

1. Tambah varian di `QuestionType` (`src/types/index.ts`).
2. Lengkapi `QUESTION_TYPE_META`, `QUESTION_TYPE_ORDER`, `treeBadge`, dan predikat di `questionMeta.ts`
   (TypeScript memaksa kelengkapan `Record<QuestionType, …>`).
3. Tambah Section 3 yang sesuai di `QuestionEditor.tsx`.
4. Jalankan `npm run typecheck`.

### Menambah halaman/tab baru

1. Buat folder `src/features/<nama>/` + komponen halaman.
2. Daftarkan rute di `src/routes.tsx`.
3. Tambah tab di `src/layouts/AppShell.tsx` (+ label di `i18n/id.ts`).

---

## 12. Batasan & Catatan

- **Tidak ada persistensi** — refresh = reset ke seed. Tidak ada localStorage.
- **Tidak ada autentikasi** — avatar "AD" di header hanyalah placeholder.
- **Beberapa tab masih stub** — Master Data & Hasil; Skala read-only (CRUD menyusul). Lihat status milestone di `README.md`.
- **Satu pemeriksaan otomatis** — `npm run typecheck`. Tidak ada unit/integration test.
- **Single store** cukup untuk skala demo; bila tumbuh, pertimbangkan memecah slice Zustand atau pindah ke fetch-per-fitur.
