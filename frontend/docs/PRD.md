# PRD — Pelindo Survey CMS

**Product Requirements Document untuk implementasi React (dengan Dummy API)**

| | |
|---|---|
| **Produk** | Pelindo Survey CMS — Aplikasi manajemen kuesioner Survei Kepuasan Pelanggan (SKP) |
| **Sumber desain** | Google Stitch — project `3016271468649215648` (15 screen aktif + 1 design system) |
| **Versi PRD** | 1.0 |
| **Tanggal** | 20 Juni 2026 |
| **Status** | Draft untuk implementasi |
| **Scope rilis ini** | Front-end CMS (admin) + Dummy API. Belum termasuk back-end produksi & sisi responden. |

---

## 1. Ringkasan Produk

Pelindo Survey CMS adalah aplikasi web internal (admin) untuk **menyusun, mengelola, dan mempublikasikan kuesioner Survei Kepuasan Pelanggan** milik Pelindo (operator pelabuhan BUMN). Admin/enumerator membuat survei tahunan/ad-hoc, menyusun struktur pertanyaan berhirarki (grup → pertanyaan → sub-pertanyaan kondisional), mengatur identitas responden, dan memantau jumlah responden.

Target rilis ini adalah **front-end fungsional dengan dummy API** — seluruh data dilayani dari mock API in-memory sehingga UI dapat dikembangkan & didemokan penuh tanpa back-end nyata.

### 1.1 Persona
- **Admin Survei** — membuat & mengonfigurasi survei, mengelola pertanyaan & skala, mempublikasikan.
- **Enumerator** — (sisi pengisian, di luar scope CMS ini) namanya tercatat pada identitas responden.

### 1.2 Tujuan
1. Membuat survei baru dari kosong atau duplikat dari survei lain.
2. Menyusun pertanyaan berhirarki dengan 8 tipe pertanyaan.
3. Mengatur logika tampil (conditional/branching) antar pertanyaan.
4. Mengelola identitas responden (otomatis dari DB Pelindo / isian / pilihan).
5. Memantau ringkasan survei (status, jumlah pertanyaan, jumlah responden).

### 1.3 Non-Goals (rilis ini)
- Back-end & database produksi (diganti dummy API).
- Halaman pengisian survei oleh responden.
- Autentikasi/otorisasi nyata (cukup mock user statis).
- Modul "Hasil & laporan", "Skala & opsi", "Master data" secara penuh — tab tersedia, halaman detail menyusul (lihat §13 roadmap). Struktur datanya tetap disiapkan.

---

## 2. Tech Stack & Arsitektur

| Layer | Pilihan | Alasan |
|---|---|---|
| Build tool | **Vite** | Cepat, standar React modern |
| Framework | **React 18 + TypeScript** | Type-safety untuk model data yang kaya |
| Styling | **Tailwind CSS** | Desain Stitch sudah berbasis token Tailwind (lihat §4) |
| Routing | **React Router v6** | Navigasi top-tab + nested routes |
| State global & data | **Zustand** (store in-memory) | Seed jadi "database" klien; komponen baca via selector, ubah via action. Sinkron antar-layar otomatis, **tanpa fetch/loading** — paling sedikit kode |
| Lapisan data | **`src/data/*`** (wrapper tipis) | Membungkus action store; saat backend nyata siap cukup ganti isinya jadi `fetch`/axios, komponen tetap |
| Form | **react-hook-form + zod** | Validasi form pembuatan survei & editor pertanyaan |
| Drag & drop | **@dnd-kit/core** | Reorder pertanyaan & opsi |
| Ikon | **Material Symbols Outlined** | Sesuai desain |
| Font | **Inter** (+ JetBrains Mono untuk kode) | Sesuai design system |

### 2.1 Prinsip arsitektur
- **Data terpusat di satu store** `src/store/` (Zustand) berisi seed (survei, pertanyaan, skala, identitas) + action mutasi. Komponen membaca lewat **selector** dan mengubah lewat **action** — perubahan otomatis tersinkron ke semua layar (mis. tambah pertanyaan → jumlah di Daftar Survei ikut naik) **tanpa refetch/invalidation manual**.
- **Lapisan akses tipis** `src/data/*` membungkus action store. Untuk pindah ke backend nyata nanti, cukup ubah isi `src/data/*` menjadi `fetch`/axios (signature tetap) — komponen tidak berubah.
- **Editor state** (form yang sedang diedit) tetap state lokal via `react-hook-form`; store hanya menyimpan data tersimpan.
- Semua label UI **Bahasa Indonesia formal (PUEBI)**.

### 2.2 Struktur folder yang disarankan
```
src/
  store/               # Zustand store (sumber data in-memory)
    useSurveyStore.ts  # state + actions
    seed.ts            # data awal (lihat §12)
  data/                # lapisan akses tipis (typed) — bungkus action store
    surveys.ts         # getSurveys / createSurvey / updateSurvey ...
    questions.ts       # addQuestion / updateQuestion / reorder ...
    scales.ts
    identity.ts
  components/          # komponen reusable (lihat §9)
  features/
    survey-list/       # Daftar Survei
    survey-create/     # Modal Buat Survei
    question-manage/   # Kelola Pertanyaan (tree + editor)
    question-editor/   # Tambah/Edit Pertanyaan (8 tipe)
  layouts/
    AppShell.tsx       # header + top tabs
  types/               # model data (lihat §6)
  routes.tsx
  main.tsx
```

---

## 3. Informasi Arsitektur & Navigasi

**Navigasi utama = TOP TABS** (bukan sidebar). Header sticky `h-16` berisi: ikon `assignment` + judul brand, lalu (pada konteks survei) chip kode survei + badge status; di kanan: lonceng notifikasi, gear setelan, avatar admin.

### 3.1 Tab utama & routing
| Tab (label) | Route | Status rilis |
|---|---|---|
| **Daftar survei** | `/surveys` | ✅ Penuh (§8.1) |
| **Kelola pertanyaan** | `/surveys/:surveyId/questions` | ✅ Penuh (§8.3–8.4) |
| **Skala & opsi** | `/surveys/:surveyId/scales` | 🟡 Stub + data siap (§8.5) |
| **Master data** | `/master-data` | 🟡 Stub (§8.6) |
| **Hasil & laporan** | `/surveys/:surveyId/results` | 🟡 Stub (§8.7) |

> Catatan: pada beberapa screen latar (modal) hanya tampil 4 tab (tanpa "Master data"). Set kanonik = **5 tab** di atas.

### 3.2 Alur utama (happy path)
```
Daftar Survei
   └─[Buat survei baru]→ Modal Buat Survei (kosong / duplikat)
          └─[Buat survei]→ Kelola Pertanyaan (state: Blank jika kosong / Post-Duplicate jika duplikat)
                 ├─[Tambah pertanyaan]→ Editor Tambah Pertanyaan (pilih 1 dari 8 tipe)
                 │        └─[Simpan pertanyaan]→ kembali ke tree (item bertambah)
                 ├─ pilih item di tree → Editor Edit Pertanyaan (+ Logika Tampil)
                 └─[Aktifkan]→ status survei: draft → aktif
```

---

## 4. Design System (token)

Sumber: `design.md` project Stitch ("Pelabuhan Digital"). Gaya **Minimalist-Corporate, flat (TANPA shadow)**, banyak whitespace, border 1px sebagai pemisah. Light mode only.

### 4.1 Warna (Tailwind theme extend)
```js
colors: {
  primary: '#185FA5',          // Maritime Blue — aksi utama, tab aktif
  'primary-dark': '#004782',
  'primary-tint': '#F0F7FF',   // baris terpilih, hover, highlight
  accent: '#FF9800',           // status Draft / perlu perhatian
  background: '#F8F9FF',        // latar halaman (surface)
  surface: '#FFFFFF',          // kartu/kontainer
  border: '#E2E8F0',           // border default
  'border-strong': '#CBD5E1',  // border elemen mengambang (dropdown/menu)
  'text-primary': '#0B1C30',
  'text-secondary': '#64748B',
  success: '#16A34A',          // status Aktif
  error: '#BA1A1A',
}
```

### 4.2 Tipografi — **Inter** (Regular 400 & Medium 500 saja) + **JetBrains Mono** (kode: `C3.1`, `SKP-2026`)
| Token | Size / Weight / Line |
|---|---|
| display-lg | 32 / 500 / 40 |
| headline-md | 24 / 500 / 32 |
| headline-sm | 20 / 500 / 28 |
| body-lg | 16 / 400 / 24 |
| body-md | 14 / 400 / 20 |
| body-sm | 13 / 400 / 18 |
| label-md | 12 / 500 / 16, UPPERCASE, tracking 0.05em |

### 4.3 Bentuk & spacing
- Radius: **8px (0.5rem)** default (tombol, input, kartu, modal); **4px** (checkbox, badge kecil); **full** (status pill, chip).
- Spacing: skala **8px**. Padding kontainer desktop 32px, gutter 24px, input `10px × 14px`.
- **Tanpa `box-shadow`** pada elemen apa pun, KECUALI modal/dialog (`shadow-2xl`). Elemen mengambang lain (dropdown/menu) pakai border `#CBD5E1`.

### 4.4 Komponen dasar (aturan)
- **Tombol primer**: bg `primary`, teks putih, radius 8px, tanpa shadow.
- **Tombol sekunder**: bg putih, border 1px `border`, teks `primary`.
- **Tombol ghost**: transparan, teks `primary`.
- **Status pill**: Draft → bg `#FFF7ED` teks `#C2410C`; Aktif → hijau; Selesai → biru; Arsip → abu.
- **Input**: border 1px `border`, radius 8px. Fokus → border `primary` (tanpa glow).
- **Tabel**: header bg `#F8FAFC`, border bawah 1px, teks `label-md`. Baris terpilih/hover → bg `primary-tint` + bar aksen vertikal 2px `primary` di kiri.
- **Kartu**: bg putih, border 1px `border`, radius 8px, padding 24px.

---

## 5. Model Data (TypeScript)

Enum & tipe inti. Ini menjadi kontrak antara dummy API dan UI.

```ts
// ---- Enum ----
type SurveyStatus = 'draft' | 'aktif' | 'selesai' | 'arsip';
type JenisNota = 'Domestik' | 'Internasional' | 'SPSL Group';

type QuestionType =
  | 'GRUP'              // Grup / Bagian (folder, bukan pertanyaan)
  | 'SKALA_KEPUASAN'   // Skala kepuasan (mis. 4 poin: Sangat tidak puas..Sangat puas)
  | 'SKALA_PERSETUJUAN'// Skala persetujuan / Likert (4 poin: Sangat tidak setuju..Sangat setuju)
  | 'NPS'              // NPS 0–10
  | 'YA_TIDAK'         // Ya / Tidak (opsi tetap)
  | 'PILIHAN_TUNGGAL'  // Single choice (radio) + skor per opsi
  | 'PILIHAN_GANDA'    // Multiple choice (checkbox), min 2 opsi
  | 'TEKS';            // Teks isian bebas

type IdentitySource = 'OTOMATIS' | 'ISIAN' | 'PILIHAN' | 'SISTEM';
type LogicOperator = 'sama_dengan' | 'tidak_sama_dengan'; // extensible

// ---- Entity ----
interface Survey {
  id: string;
  kode: string;              // "SKP-2026" (auto dari tahun, editable)
  nama: string;
  jenisNota: JenisNota;
  periode: number;           // tahun, mis. 2026
  status: SurveyStatus;
  tanggalMulai: string;      // ISO date
  tanggalSelesai: string;    // ISO date
  deskripsi?: string;
  jumlahPertanyaan: number;  // derived
  jumlahResponden: number;   // derived
  terakhirDiubah: string;    // ISO datetime
  createdAt: string;
  duplicatedFrom?: string;   // kode survei sumber bila hasil duplikat
}

interface Question {
  id: string;
  surveyId: string;
  kode: string;              // "C1", "C3.1" (auto-generated, editable)
  parentId: string | null;  // hirarki
  teks: string;
  tipe: QuestionType;
  urutan: number;
  wajibDiisi: boolean;
  acakOpsi?: boolean;        // hanya tipe pilihan
  scaleId?: string;          // ref ke Scale (untuk SKALA_*, NPS)
  options?: QuestionOption[];// untuk PILIHAN_TUNGGAL / PILIHAN_GANDA
  logic?: ConditionGroup;    // logika tampil
  isGroup: boolean;          // true bila tipe GRUP
  childCount?: number;       // untuk badge "Grup · N"
}

interface QuestionOption {
  id: string;
  label: string;
  skor?: number;             // dipakai pada PILIHAN_TUNGGAL
  urutan: number;
}

interface ConditionGroup {
  conditions: Condition[];   // default semua harus terpenuhi (AND)
}
interface Condition {
  sourceQuestionKode: string;// "C3"
  operator: LogicOperator;   // "sama_dengan"
  value: string;             // "Ya"
}

interface Scale {            // dikelola di tab "Skala & opsi"
  id: string;
  nama: string;              // "Skala puas (4 poin)", "Skala setuju (4 poin)", "NPS (0-10)"
  tipe: 'KEPUASAN' | 'PERSETUJUAN' | 'NPS';
  poin: number;              // 4, 11
  labels: string[];          // ["Sangat tidak puas","Tidak puas","Puas","Sangat puas"]
  endpointKiri?: string;     // untuk NPS: "Sangat Tidak Mungkin"
  endpointKanan?: string;    // "Sangat Mungkin"
}

interface IdentityField {    // grup "Identitas"
  id: string;
  surveyId: string;
  nama: string;              // "No Billing", "Nama Responden", ...
  sumber: IdentitySource;    // OTOMATIS/ISIAN/PILIHAN/SISTEM
  deskripsi: string;         // "Lookup dari database Pelindo" / "Diisi oleh Responden"
  urutan: number;
}
```

---

## 6. Aturan Bisnis & Validasi

1. **Kode survei** dibuat otomatis dari tahun (`SKP-{periode}`) namun **boleh diubah** admin.
2. **Status awal survei = `draft`** (tidak bisa dipilih saat create). Transisi: `draft → aktif` (tombol "Aktifkan"), lalu `aktif → selesai`, dan `→ arsip`.
3. **Duplikat survei**: menyalin seluruh struktur pertanyaan + skala dari survei sumber; survei baru tetap `draft`; tampilkan banner & toast "Struktur disalin dari {kode}".
4. **Tipe `GRUP`** bukan pertanyaan — hanya wadah; ditampilkan dengan badge `Grup · {jumlah anak}`.
5. **`PILIHAN_GANDA`** wajib **minimal 2 opsi**.
6. **`PILIHAN_TUNGGAL`** punya **skor per opsi** + toggle **Acak Opsi**.
7. **`YA_TIDAK`** opsinya tetap ("Ya", "Tidak") — tidak dapat diedit.
8. **`SKALA_*` & `NPS`** mereferensikan **Scale** terpusat (read-only preview di editor; diubah via "Kelola skala"). Tidak diedit inline.
9. **Logika Tampil**: pertanyaan dapat punya ≥1 kondisi (`{kode} {operator} {value}`); default antar-kondisi = AND. Pertanyaan dengan logika diberi badge `kondisional`.
10. **`Teks pertanyaan` wajib** (validasi `*`). `Urutan` numerik. `Wajib diisi` default ON.
11. **Identitas responden** punya 3 sumber data: `OTOMATIS` (lookup DB Pelindo), `ISIAN` (diisi responden), `PILIHAN` (dropdown lookup); plus `SISTEM` (mis. Tanggal Pengisian).

---

## 7. Lapisan Data (Dummy / Store Actions)

Rilis ini memakai **store in-memory** sebagai sumber data — **tidak ada HTTP**. Operasi data di bawah diekspos sebagai fungsi di `src/data/*` (membungkus action Zustand). Daftar ini sengaja dipetakan 1:1 ke endpoint REST agar **mudah ditukar ke backend nyata** nanti (cukup ganti isi fungsi jadi `fetch`). Kolom "Path" = endpoint REST setara untuk acuan masa depan.

### 7.1 Operasi data (≈ endpoint REST setara)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/surveys` | List survei. Query: `?q=&status=&jenisNota=` |
| GET | `/api/surveys/summary` | Kartu ringkasan: `{ total, aktif, draft, totalResponden }` |
| GET | `/api/surveys/:id` | Detail survei |
| POST | `/api/surveys` | Buat survei. Body create (lihat 7.2). Mendukung `method: 'blank' \| 'duplicate'` + `sourceKode` |
| PATCH | `/api/surveys/:id` | Update (mis. status → aktif) |
| GET | `/api/surveys/:id/questions` | Pohon pertanyaan (flat list, klien menyusun hirarki via `parentId`) |
| POST | `/api/surveys/:id/questions` | Tambah pertanyaan |
| PATCH | `/api/surveys/:id/questions/:qid` | Edit pertanyaan (termasuk `logic`, `urutan`) |
| DELETE | `/api/surveys/:id/questions/:qid` | Hapus |
| POST | `/api/surveys/:id/questions/reorder` | Reorder (body: array `{id, urutan, parentId}`) |
| GET | `/api/surveys/:id/identity-fields` | Field identitas responden |
| GET | `/api/scales` | Daftar skala (untuk dropdown "Skala jawaban") |
| GET | `/api/master-data/jenis-pelayanan` | Lookup master (Jenis Pelayanan, Kategori Responden, dll.) |

### 7.2 Contoh request/response

**POST `/api/surveys` (create — blank)**
```json
// request
{ "method": "blank", "nama": "Survei Kepuasan Pelanggan Pelindo 2027",
  "kode": "SKP-2027", "periode": 2027, "jenisNota": "Domestik",
  "tanggalMulai": "2027-07-01", "tanggalSelesai": "2027-09-30", "deskripsi": "" }
// response 201
{ "id": "srv_07", "kode": "SKP-2027", "status": "draft", "jumlahPertanyaan": 0,
  "jumlahResponden": 0, "...": "..." }
```

**POST `/api/surveys` (create — duplicate)**
```json
{ "method": "duplicate", "sourceKode": "SKP-2026", "nama": "...", "kode": "SKP-2027", "periode": 2027 }
// response menyalin questions + scales dari sumber; survei baru status "draft"
```

**GET `/api/surveys/:id/questions`** → array `Question` (lihat seed §12.2).

**PATCH question (set logika tampil)**
```json
{ "logic": { "conditions": [
  { "sourceQuestionKode": "C3", "operator": "sama_dengan", "value": "Ya" } ] } }
```

---

## 8. Spesifikasi Layar

### 8.1 Daftar Survei — `/surveys`
Screen sumber: `9f0975dc` ("Daftar Survei (Enhanced)").

**Layout**: Header brand "CMS Survei Kepuasan Pelanggan" → top tabs → page header → 4 kartu ringkasan → tabel.

**Page header (kanan)**:
- Search `Cari survei...` (ikon search).
- Filter status: `Semua status` (default) · `Aktif` · `Draft` · `Selesai`.
- Filter jenis nota: `Semua jenis nota` (default) · `Domestik` · `Internasional` · `SPSL Group`.
- Tombol primer **`Buat survei baru`** (ikon `add`) → buka modal (§8.2).

**Kartu ringkasan (4-up)**: Total survei · Survei aktif (titik hijau berdenyut) · Draft (oranye) · Total responden. Nilai dari `GET /surveys/summary`.

**Tabel** — kolom (urut): `Nama survei` (nama bold + kode kecil di bawah) · `Jenis Nota` (badge) · `Periode` · `Status` (badge) · `Pertanyaan` · `Responden` · `Terakhir diubah` · `Aksi` (`more_vert`).
- Baris pertama/terbaru di-highlight (bar aksen kiri + bg tint).
- Badge status: `Aktif` (hijau) / `Draf` (oranye) / `Selesai` (biru) / `Arsip` (abu). *(Catatan: gunakan label konsisten "Draft" pada display; nilai enum `draft`.)*
- Footer: "Menampilkan N dari M survei" + pager (chevron kiri/kanan, nomor halaman).

**States**: highlight baris aktif, pager disabled bila 1 halaman, + tambahkan **empty state** ("Belum ada survei") & **loading skeleton** (tidak ada di mockup, wajib di implementasi).

**Navigasi**: `Buat survei baru` → modal; klik baris / `more_vert` → menu (Kelola pertanyaan, Hasil, Duplikat, Arsipkan) → `/surveys/:id/questions`.

### 8.2 Buat Survei Baru (Modal) — overlay di `/surveys`
Screen sumber: `496cb66a` (kosong) & `9049fb89` (duplikat). **Satu komponen, dua state** (`creationMethod`).

**Modal** (max-width 560px, putih, radius 8px, `shadow-2xl`, scrim gelap + blur). Header "Buat survei baru" + tombol close `X`.

**Body**:
- Label `METODE PEMBUATAN`.
- 2 kartu radio:
  1. **Mulai dari kosong** — "Susun struktur pertanyaan dari nol" (ikon `description`).
  2. **Duplikat dari survei lain** — "Salin pertanyaan & skala dari survei yang sudah ada" (ikon `content_copy`).
- **Kondisional**: bila "Duplikat" dipilih → muncul field **`Salin dari`** (dropdown survei sumber, format `{kode} — {nama}`, mis. "SKP-2026 — Survei Kepuasan Pelanggan Pelindo 2026").
- Form:
  | Field | Tipe | Default/Helper |
  |---|---|---|
  | Nama survei | text | — |
  | Kode survei | text | auto dari tahun · helper "Dibuat otomatis dari tahun, bisa diubah" |
  | Periode (tahun) | select | 2027, 2028 |
  | Status awal | badge read-only | "Draft" · helper "Survei dimulai sebagai draft" |
  | Tanggal mulai | date (dd/mm/yyyy) | — |
  | Tanggal selesai | date | — |
  | Deskripsi (opsional) | textarea | placeholder "Catatan internal tentang survei ini..." |

**Footer**: `Batal` (sekunder) · `Buat survei` (primer) → `POST /surveys` → tutup modal → ke Kelola Pertanyaan (Blank atau Post-Duplicate).

### 8.3 Kelola Pertanyaan — `/surveys/:surveyId/questions`
Screen sumber: `aa439329`, `86611b4f`, `24d9d6d2`, `ffd5457d`, `cd33dedd` (lima state dari satu layar).

**Layout 2 kolom**:
- **Kiri (35–40%) — "Struktur pertanyaan"**: header + chip jumlah ("10 pertanyaan") + tombol **`Tambah`**. Pohon hirarkis (indentasi + garis konektor, expand `chevron`). Tiap item: chip kode mono (`C1`/`C3.1`) + teks + badge tipe (`Grup · N`, `NPS 0–10`, `Ya/Tidak`, `Skala puas`, `Pilih satu`, `Checkbox`, `Teks`, `kondisional`). Item aktif → border kiri primary + bg highlight. Grup tetap: **Identitas** & **Pertanyaan utama**.
- **Kanan (60–65%) — editor kontekstual** (lihat state di bawah).

**State panel kanan**:
| State | Sumber | Tampilan |
|---|---|---|
| **Edit pertanyaan** | `aa439329` | Form edit pertanyaan terpilih (`C3.1`) + panel Logika Tampil (read-only pills) |
| **Editor logika (enhanced)** | `24d9d6d2` | Panel "Logika Tampil" sebagai **condition-builder**: baris 3 dropdown (pertanyaan / operator / nilai) + tombol hapus per baris + **`+ Tambah kondisi`** |
| **Editor identitas (card list)** | `86611b4f` | "Editor Kuesioner" — field identitas sebagai **kartu draggable** (handle `drag_indicator`, badge sumber `OTOMATIS`/`ISIAN`/`PILIHAN`, deskripsi, `more_vert`) + tombol "Tambah Pertanyaan Baru" |
| **Empty / first-run** | `ffd5457d` | Kartu kosong: ikon `note_add`, "Belum ada pertanyaan", CTA "Tambah pertanyaan pertama", + 3 kartu quick-start: **Template** / **Salin Survei** / **Import** (Excel) |
| **Post-duplicate** | `cd33dedd` | Toast sukses "Survei berhasil dibuat / Struktur disalin dari SKP-2026" + banner info di tree + editor "Pilih pertanyaan untuk mulai mengedit" (state belum-terpilih) |

**Form Edit pertanyaan** (state default): `Teks pertanyaan` (textarea) · `Tipe pertanyaan` (select) · `Induk (parent_id)` (select) · `Urutan` (number) · `Wajib diisi` (toggle "Aktif") · panel **LOGIKA TAMPIL**. Footer sticky: `Batal` · `Simpan` (ikon `check`).

**Header konteks survei**: judul survei + chip kode + badge `Draft`; kanan: **Preview** (ikon `visibility`) · **Aktifkan** (ikon `rocket_launch` → `PATCH status=aktif`).

**Field Identitas (seed 10)** — lihat §12.3.

### 8.4 Tambah / Edit Pertanyaan (Editor 8 tipe)
Screen sumber: `8b9d8c3d`, `79b77d87`, `5621160325`, `f089e000`, `9fd3d1aa`, `9162366a`, `6ecf957e`.

**Bentuk UI**: **bukan modal** — workspace 2 kolom penuh di dalam tab "Kelola pertanyaan". Breadcrumb `folder › Pertanyaan utama › Tambah pertanyaan baru`. Kartu editor judul **"Tambah pertanyaan"**.

**Section 1 — `Tipe pertanyaan`**: grid 4 kolom × 8 tile (ikon + label). Tile aktif: border 2px primary. **Delapan tipe (kanonik)**:
| Label | Ikon | Enum |
|---|---|---|
| Grup / Bagian | `folder` | GRUP |
| Skala kepuasan | `star` | SKALA_KEPUASAN |
| Skala persetujuan | `thumb_up` | SKALA_PERSETUJUAN |
| NPS 0–10 | `tag` | NPS |
| Ya / Tidak | `toggle_off` | YA_TIDAK |
| Pilihan tunggal | `radio_button_checked` | PILIHAN_TUNGGAL |
| Pilihan ganda | `check_box` | PILIHAN_GANDA |
| Teks isian | `input` | TEKS |

**Section 2 — Field umum (semua tipe)**: `Teks pertanyaan` (textarea, wajib `*`, placeholder "Tulis pertanyaan di sini...") · `Induk (parent_id)` (select) · `Kode` (text, auto "Dibuat otomatis", editable) · `Urutan` (number) · `Wajib diisi` (toggle, default ON "Aktif").

**Section 3 — Field per tipe**:
- **Teks isian**: tidak ada konfigurasi tambahan.
- **Skala kepuasan**: field `Skala jawaban` + link `Kelola skala`; select (mis. "Skala puas (4 poin)"); preview pill: `Sangat tidak puas · Tidak puas · Puas · Sangat puas`.
- **Skala persetujuan**: `Skala jawaban` (mis. "Skala setuju (4 poin)"); preview: `Sangat tidak setuju · Tidak setuju · Setuju · Sangat setuju`.
- **NPS 0–10**: `Skala jawaban` = "NPS (0-10)"; preview 11 sel `0..10`; endpoint `Sangat Tidak Mungkin` (kiri) … `Sangat Mungkin` (kanan).
- **Ya / Tidak**: field `Opsi jawaban` read-only pill `Ya · Tidak` (tidak dapat diedit).
- **Pilihan tunggal**: tambahan toggle **`Acak Opsi`**; `Opsi jawaban` + tombol `Gunakan Skala Master`; tiap baris opsi: handle drag, lingkaran radio, input label, input **Skor**, tombol hapus `×`; tombol **`Tambah opsi`**.
- **Pilihan ganda**: `Opsi jawaban` + helper **"Minimal 2 opsi"**; baris opsi: handle drag, kotak checkbox, input label, hapus `×` (tanpa skor); tombol **`Tambah opsi`**. *(Catatan: di mockup label tombol "Tambah pilihan" — kanonikkan jadi "Tambah opsi".)*

**Footer (semua)**: `Batal` · `Simpan & tambah lagi` · `Simpan pertanyaan` (primer).

> **Normalisasi**: jadikan satu komponen `QuestionEditor` dengan blok Section 3 yang ditukar berdasarkan `tipe`. `Kode` kanonik = auto-generated + editable. Tombol tambah opsi kanonik = "Tambah opsi".

### 8.5 Skala & opsi — `/surveys/:id/scales` 🟡
Tab untuk mengelola **Scale** terpusat (referensi `Skala jawaban`). Rilis ini: halaman daftar skala (read dari `GET /scales`) + preview; CRUD menyusul. Seed di §12.4.

### 8.6 Master data — `/master-data` 🟡
Lookup untuk field identitas `PILIHAN`/`OTOMATIS` (Jenis Pelayanan, Kategori Responden, dll.). Rilis ini: stub + endpoint lookup.

### 8.7 Hasil & laporan — `/surveys/:id/results` 🟡
Stub (jumlah responden sudah ada di model). Detail laporan menyusul.

---

## 9. Komponen Reusable

| Komponen | Dipakai di | Catatan |
|---|---|---|
| `AppShell` | semua | header + 5 top tabs + slot konten |
| `StatusBadge` | list, header | varian draft/aktif/selesai/arsip |
| `JenisNotaBadge` | list | domestik/internasional/spsl |
| `SummaryCard` | daftar survei | label + nilai + ikon + aksen |
| `DataTable` | daftar survei | kolom konfigurable, highlight baris, pager |
| `Modal` | buat survei | scrim + blur + shadow-2xl |
| `RadioCard` | buat survei | metode pembuatan |
| `FormField` | semua form | label + input + helper + error |
| `Toggle` | editor | "Wajib diisi", "Acak Opsi" |
| `QuestionTree` | kelola pertanyaan | hirarki + badge + item aktif |
| `QuestionTreeItem` | tree | chip kode mono + badge tipe |
| `TypePicker` | editor | grid 8 tile tipe |
| `OptionRow` | editor pilihan | drag handle + input + skor + hapus |
| `ScalePreview` | editor skala/NPS | pill chips / baris 0–10 |
| `ConditionBuilder` | logika tampil | baris dropdown + tambah/hapus kondisi |
| `IdentityFieldCard` | editor identitas | draggable + badge sumber |
| `Toast` | post-duplicate | sukses auto-dismiss |
| `EmptyState` | kelola (blank) | ikon + CTA + quick-start cards |

Drag & drop (`QuestionTree`, `OptionRow`, `IdentityFieldCard`) pakai **@dnd-kit**.

---

## 10. State Management
- **Satu Zustand store** memegang `surveys`, `questions`, `scales`, `identityFields` (dari seed §12) + action: `createSurvey`, `updateSurvey`, `activateSurvey`, `addQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions`, `setLogic`.
- Komponen baca via **selector** (mis. `useSurveyStore(s => s.surveys)`). Kartu ringkasan dihitung dari selector (agregasi lintas survei) → **otomatis sinkron** lintas layar tanpa refetch/invalidation. `jumlahPertanyaan` per survei **disimpan** namun dijaga sinkron oleh action mutasi pertanyaan (lihat §14.9).
- **Editor pertanyaan**: form lokal `react-hook-form`, di-`reset` saat item tree dipilih; simpan → panggil action store.
- **Reorder (drag)**: ubah `urutan` langsung di store (sinkron seketika — tak perlu optimistic update manual).
- *(Bila nanti pindah ke backend nyata: bungkus action `src/data/*` jadi async `fetch`, dan pertimbangkan React Query untuk caching/loading — lihat §2.1.)*

---

## 11. Aksesibilitas & i18n
- Seluruh teks Bahasa Indonesia formal (PUEBI). Siapkan satu file `id.ts` walau belum multi-bahasa.
- Kontras warna AA (teks `#0B1C30` di atas putih/`#F8F9FF`).
- Semua kontrol form ber-`label`; toggle pakai `role="switch"`; tree pakai `role="tree"`.
- Fokus keyboard: hint `Ctrl+K` "Pencarian cepat" (post-duplicate) → implement command palette opsional.

---

## 12. Seed Data Dummy

### 12.1 Surveys (`GET /api/surveys`)
| id | kode | nama | jenisNota | periode | status | pertanyaan | responden | terakhirDiubah (ISO) |
|---|---|---|---|---|---|---|---|---|
| srv_01 | SKP-2026 | Survei Kepuasan Pelanggan Domestik 2026 | Domestik | 2026 | draft | 14 | 0 | 2026-06-18T09:30:00 |
| srv_02 | SKP-2025 | Survei Penumpang Internasional Q3 | Internasional | 2025 | aktif | 22 | 1248 | 2026-06-12T14:05:00 |
| srv_03 | SKP-2024 | Survei Layanan SPSL Group - Phase 1 | SPSL Group | 2024 | selesai | 20 | 3910 | 2024-12-31T16:00:00 |
| srv_04 | SKP-2023 | Evaluasi Tahunan Domestik 2023 | Domestik | 2023 | arsip | 20 | 0 | 2023-12-20T08:00:00 |

Summary: `{ total: 4, aktif: 1, draft: 1, totalResponden: 5158 }`.

> **Aturan hitung `pertanyaan`** (kanonik): `jumlahPertanyaan` = jumlah `Question` **non-GRUP** milik survei (sub-pertanyaan ikut dihitung; GRUP & field Identitas **tidak**). Disimpan sebagai field dan dijaga sinkron oleh action `addQuestion`/`deleteQuestion` (lihat §14.9). Untuk SKP-2026, 14 = tree pada §12.2. Hanya SKP-2026 yang memiliki tree lengkap di seed; survei lain memakai nilai tampilan tersimpan.
>
> **Format tanggal** (kanonik): seluruh `terakhirDiubah` disimpan sebagai **ISO datetime** dan ditampilkan relatif ("2 hari lalu") melalui formatter (`src/lib/format.ts`), dihitung terhadap referensi tetap `APP_NOW = 2026-06-20` agar demo deterministik.

### 12.2 Questions (survei SKP-2026, `parentId` menyusun hirarki)
- `C1` Fasilitas & dimensi layanan — GRUP (5 anak)
  - `C1.1` Kebersihan & kenyamanan fasilitas terminal — SKALA_KEPUASAN
  - `C1.2` Ketersediaan & kejelasan informasi/papan petunjuk — SKALA_KEPUASAN
  - `C1.3` Kecepatan proses layanan bongkar muat — SKALA_KEPUASAN
  - `C1.4` Keramahan & profesionalisme petugas — SKALA_KEPUASAN
  - `C1.5` Keamanan barang & area pelabuhan — SKALA_KEPUASAN
- `C2` Rekomendasi — NPS
- `C3` Pakai pelabuhan lain? — YA_TIDAK
  - `C3.1` "Sebutkan nama pelabuhan tersebut!" — TEKS — **kondisional** (tampil jika `C3 sama_dengan Ya`)
  - `C3.2` Kepuasan pelabuhan lain — SKALA_KEPUASAN
  - `C3.3` Pengelola pelabuhan — PILIHAN_TUNGGAL
- `C4` Loyalitas pelanggan — GRUP (2 anak)
  - `C4.1` Akan kembali menggunakan layanan Pelindo — SKALA_PERSETUJUAN
  - `C4.2` Bersedia merekomendasikan ke mitra bisnis — SKALA_PERSETUJUAN
- `C5` Penerapan SMAP ISO 37001 — SKALA_KEPUASAN
- `C7` Pain points — PILIHAN_GANDA
- *(varian SKP-2027/post-duplicate menambah `C6` Kebutuhan layanan — TEKS, `C8` Saran perbaikan — TEKS)*

Total non-GRUP = 5 (`C1.x`) + 1 (`C2`) + 1 (`C3`) + 3 (`C3.x`) + 2 (`C4.x`) + 1 (`C5`) + 1 (`C7`) = **14** (cocok dengan §12.1).

### 12.3 Identity fields (grup Identitas)
| nama | sumber | deskripsi |
|---|---|---|
| No Billing | OTOMATIS | Lookup dari database Pelindo |
| Nama Cabang | OTOMATIS | Lookup dari database Pelindo |
| Nama Entitas Bisnis Pelindo | OTOMATIS | Lookup dari database Pelindo |
| Nama Responden | ISIAN | Diisi oleh Responden |
| Nomor WA/Handphone | ISIAN | Diisi oleh Responden |
| Nama Perusahaan / Nama Kapal | OTOMATIS | Lookup dari database Pelindo |
| Jenis Pelayanan Paling Dominan | PILIHAN | Lookup dari database Pelindo |
| Kategori Responden | PILIHAN | Lookup |
| Tanggal Pengisian | SISTEM | Diisi otomatis sistem |
| Nama Enumerator | OTOMATIS | Lookup dari database Pelindo |

### 12.4 Scales (`GET /api/scales`)
| id | nama | tipe | poin | labels / endpoint |
|---|---|---|---|---|
| scl_puas4 | Skala puas (4 poin) | KEPUASAN | 4 | Sangat tidak puas · Tidak puas · Puas · Sangat puas |
| scl_setuju4 | Skala setuju (4 poin) | PERSETUJUAN | 4 | Sangat tidak setuju · Tidak setuju · Setuju · Sangat setuju |
| scl_nps | NPS (0-10) | NPS | 11 | endpoint: Sangat Tidak Mungkin … Sangat Mungkin |

---

## 13. Roadmap Implementasi (milestone)

**M1 — Fondasi & Daftar Survei**
- Setup Vite + TS + Tailwind (token §4) + Router + **Zustand store + seed (§12)**.
- `AppShell` (header + 5 tab).
- Layar Daftar Survei penuh (filter, search, summary cards, tabel, pager, empty/loading).

**M2 — Buat Survei**
- `CreateSurveyModal` (blank + duplicate), validasi (zod), `POST /surveys`.
- Redirect ke Kelola Pertanyaan (Blank/Post-Duplicate + toast).

**M3 — Kelola Pertanyaan (shell + tree)**
- `QuestionTree` (hirarki, badge, item aktif, count chip).
- State Blank (quick-start), Post-Duplicate (banner+toast), header konteks + "Aktifkan".

**M4 — Editor Pertanyaan (8 tipe)**
- `QuestionEditor` + `TypePicker` + field umum.
- Blok per tipe: Teks, Skala kepuasan/persetujuan, NPS (preview), Ya/Tidak, Pilihan tunggal (skor+acak), Pilihan ganda (min 2). `OptionRow` + dnd-kit.

**M5 — Logika Tampil & Identitas**
- `ConditionBuilder` (enhanced), badge `kondisional`.
- Editor Identitas (kartu draggable + badge sumber).

**M6 — Tab pendukung (stub) & polish**
- Skala & opsi (list), Master data (lookup), Hasil & laporan (stub).
- Reorder, optimistic update, aksesibilitas, command palette `Ctrl+K` (opsional).

---

## 14. Inkonsistensi Desain yang Dinormalisasi (keputusan)
Ditemukan di mockup, diputuskan kanonik untuk implementasi:
1. **Status**: enum `draft|aktif|selesai|arsip`; display "Draft/Aktif/Selesai/Arsip" (mockup mencampur "Draf"/"Draft").
2. **Tombol tambah opsi**: "Tambah opsi" (mockup: "Tambah opsi" vs "Tambah pilihan").
3. **Kode pertanyaan**: auto-generated + editable (mockup campur read-only & free-text).
4. **Layout editor**: satu template `QuestionEditor` (mockup punya 2 varian; pilih template Pilihan tunggal yang paling lengkap sebagai dasar: Induk/Kode atas, `*` wajib, skor, Acak Opsi).
5. **Navigasi**: 5 top tabs (bukan sidebar); modal latar yang hanya 4 tab diabaikan.
6. **Tidak menambah** field yang tak ada di desain (mis. min/max pilihan numerik, opsi "Lainnya", batas karakter teks) kecuali diminta — hanya hint "Minimal 2 opsi" untuk Pilihan ganda.
7. **Struktur tree dua-sumber** (gap diputuskan): node **"Identitas"** dan **"Pertanyaan utama"** adalah **grup virtual** di komponen `QuestionTree`, **bukan** entitas `Question`/`GRUP` tersimpan. `IdentityField` dirender di bawah "Identitas"; `Question` dengan `parentId === null` dirender di bawah "Pertanyaan utama"; GRUP nyata (`C1`, `C4`) adalah node asli dengan anak via `parentId`. Jadi `parentId === null` berarti "pertanyaan tingkat atas".
8. **Logika Tampil (rilis ini)**: operator = `sama_dengan` | `tidak_sama_dengan`; relasi antar-kondisi = **AND** (satu-satunya, tanpa OR). Dropdown **nilai** diturunkan dari pertanyaan sumber: `YA_TIDAK` → `["Ya","Tidak"]`; `PILIHAN_TUNGGAL`/`PILIHAN_GANDA` → label opsi; tipe lain → input teks bebas. (Menjawab §15.1–§15.2 untuk scope ini; OR & operator lanjutan ditunda.)
9. **`jumlahPertanyaan` / `jumlahResponden`**: `jumlahPertanyaan` disimpan di `Survey` namun **dijaga sinkron** oleh action `addQuestion`/`deleteQuestion` (bukan ditulis manual) sehingga "tambah pertanyaan → angka di Daftar Survei naik" tetap berlaku tanpa refetch. `jumlahResponden` murni nilai tersimpan (tak dihitung dari store). Kartu ringkasan tetap agregasi via selector.

---

## 15. Pertanyaan Terbuka (perlu konfirmasi)
1. **Operator logika** selain `sama dengan` (mis. `tidak sama dengan`, `salah satu dari`)?
2. **Hubungan AND/OR** antar kondisi pada "Tambah kondisi" — default AND?
3. **Sumber data lookup** (DB Pelindo) untuk field `OTOMATIS` — bentuk dummy-nya?
4. **Modul Hasil & laporan** — metrik apa yang ditampilkan (skor rata-rata, NPS score, distribusi)?
5. **Manajemen Skala** (CRUD) — apakah masuk rilis ini atau read-only dulu?

---

*Sumber kebenaran desain: Stitch project `3016271468649215648`. PRD ini diturunkan dari ekstraksi HTML 15 screen aktif + design system "Pelabuhan Digital".*
