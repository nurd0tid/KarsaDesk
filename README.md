# KarsaDesk

KarsaDesk adalah local-first AI command center untuk kanban coding, OpenCode sessions, dan file kerja asli user seperti Google Docs, Google Sheets, Google Slides, dan Figma.

UI berjalan di `http://127.0.0.1:3456`. Orchestrator lokal berjalan di `http://127.0.0.1:4317` dan mengurus filesystem, Git, OpenCode, terminal, SQLite, dan sync NocoDB. Source code, path lokal, terminal log, raw agent event, dan diff tetap lokal.

## Fitur utama

- Browse project lokal lewat folder tree lokal; system folder dialog tersedia sebagai opsi sekunder.
- Kelola banyak repository Git dan banyak session paralel.
- Deteksi OpenCode dari awal, lalu load provider/model setelah project dipilih.
- Jalankan task Next, Selected, atau All dengan review gate.
- Review diff dan explicit merge; tidak auto-stash, tidak auto-merge.
- Connected Files per task:
  - attach Google Docs/Sheets/Slides atau Figma URL;
  - simpan metadata dasar dan status koneksi;
  - tombol Open ke editor asli Google/Figma;
  - AI Assistant per connected file;
  - action history per task.
- Local Document Studio masih ada sebagai scratchpad lokal, bukan arah utama integrasi Google/Figma.

## Prasyarat

- Node.js 20.9+; Node 22 LTS direkomendasikan.
- Git tersedia di `PATH`.
- OpenCode direkomendasikan sebagai executor AI.
- NocoDB base + PAT server-side bila ingin sync cloud.

## Setup OpenCode

KarsaDesk tidak menginstall CLI dan tidak membaca credential provider. Install dan login dilakukan manual di terminal kamu sendiri.

```bash
opencode --version
opencode auth login
opencode auth list
opencode models
```

Jika binary tidak ada di `PATH`, isi `OPENCODE_BIN` di `.env.local`.

## Install dan jalan lokal

```bash
npm install
copy .env.example .env.local
npm run dev
```

macOS/Linux:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://127.0.0.1:3456`.

## NocoDB

Isi `.env.local`:

```env
NOCODB_BASE_URL=https://app.nocodb.com
NOCODB_WORKSPACE_ID=wfost257
NOCODB_BASE_ID=pfzvil4cr8t2529
NOCODB_API_TOKEN=your-new-server-side-pat
```

Jalankan:

```bash
npm run nocodb:setup
```

Migration idempotent dan hanya membuat tabel berprefix `vk_`.

## Coding project workflow

1. Klik **Add project**.
2. Klik **Browse folders** untuk folder tree lokal.
3. Pilih folder, klik **Use this folder**, lalu **Add repository**.
4. Buat task manual atau Smart Prompt.
5. Pindahkan task ke Ready.
6. Buat OpenCode session dengan provider/model.
7. Jalankan Next, Selected, atau All.
8. Review diff, request changes, atau explicit merge.

## Google/Figma Connected Files workflow

KarsaDesk bukan editor Word/Spreadsheet/Figma buatan sendiri. File asli tetap dibuka di `docs.google.com`, `sheets.google.com`, `slides.google.com`, atau `figma.com`.

1. Buat/pilih task.
2. Buka task inspector.
3. Di **Connected Files**, paste URL Google Docs/Sheets/Slides atau Figma.
4. Klik **Attach original file**.
5. Klik **Open** untuk mengedit di aplikasi asli.
6. Tulis instruksi di **AI Assistant**, lalu klik **Ask AI**.
7. Riwayat action tersimpan di task.

MVP saat ini menyimpan koneksi file, metadata dasar, tombol Open, prompt AI, dan action history. OAuth Google, Google Picker, Google Docs/Sheets/Slides API apply, Figma metadata sync, dan Figma Plugin bridge disiapkan sebagai layer berikutnya.

Env yang nanti dipakai:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://127.0.0.1:4317/api/connect/google/callback
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=
FIGMA_PERSONAL_ACCESS_TOKEN=
```

## Local Document Studio scratchpad

Klik **Docs/PPT/Excel** di header untuk scratchpad lokal berbasis upload/prompt. Fitur ini berguna untuk draft cepat, tetapi bukan solusi utama Google/Figma. Untuk file asli yang terus hidup, gunakan **Connected Files** di task.

## Data lokal

Default runtime data:

- `~/.karsadesk/karsadesk.sqlite`
- `~/.karsadesk/worktrees/`
- `~/.karsadesk/logs/`

Override:

```env
VK_DATA_DIR=
VK_WORKTREE_DIR=
```

Prefix env `VK_` tetap dipertahankan untuk kompatibilitas v1.

## Command

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm test
npm run test:e2e
npm run nocodb:setup
```

## Troubleshooting

- **Web masih ke port 3000:** stop proses Next lama dan jalankan dari folder ini; app memakai port 3456.
- **Browse folder tidak muncul:** gunakan **Browse folders**; system dialog hanya opsi sekunder dan bisa diblokir OS/headless session.
- **OpenCode unavailable:** cek `opencode --version`, atau set `OPENCODE_BIN`.
- **No providers/models:** login provider di OpenCode lalu refresh project.
- **Cannot create session:** source worktree harus clean dan target branch harus sedang checked out.
- **Google/Figma belum auto-edit:** isi OAuth/API env dan lanjutkan adapter resmi; MVP tidak mengubah file asli tanpa layer tersebut.
