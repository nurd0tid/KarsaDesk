Saya sudah punya aplikasi kanban, tetapi fitur integrasi dokumen dan desain yang sekarang belum sesuai dengan konsep yang saya inginkan. Tolong audit dan refactor fitur yang sudah ada agar sesuai dengan spesifikasi berikut.

Konsep utama:
Aplikasi kanban saya bukan editor Word/Spreadsheet/Figma buatan sendiri. Kanban ini harus menjadi AI command center yang menghubungkan task dengan file asli milik user, seperti Google Docs, Google Sheets, Google Slides, dan Figma. User tetap membuka file asli di docs.google.com, sheets.google.com, slides.google.com, atau figma.com. Aplikasi kanban hanya menyimpan koneksi, metadata file, tombol buka file asli, dan panel AI untuk memberi instruksi ke file tersebut.

Fitur 1: Google Workspace Connector

Buat atau perbaiki fitur agar user bisa:

1. Login/connect akun Google melalui OAuth.
2. Memberi izin akses minimal yang diperlukan untuk Google Drive, Google Docs, Google Sheets, dan Google Slides.
3. Memilih file dari Google Drive menggunakan Google Picker atau mekanisme pemilihan file yang sesuai.
4. Menghubungkan file Google Docs/Sheets/Slides ke card/task kanban.
5. Menampilkan metadata file di task, seperti nama file, tipe file, pemilik jika tersedia, tanggal update jika tersedia, dan link untuk membuka file asli.
6. Menyediakan tombol “Open in Google Docs/Sheets/Slides” agar user tetap mengedit file di aplikasi Google asli.
7. Menyediakan panel “AI Assistant” di dalam detail task untuk memberi instruksi, misalnya:

   * “Rapikan dokumen ini menjadi bahasa akademik.”
   * “Buat ringkasan dari isi dokumen.”
   * “Tambahkan tabel baru di spreadsheet.”
   * “Buat draft slide dari dokumen ini.”
8. AI tidak boleh hanya membuat file lokal terpisah. AI harus membaca dan mengubah file asli melalui API resmi Google jika izin user mencukupi.
9. Simpan riwayat aksi AI pada task, misalnya instruksi user, status proses, hasil ringkas, waktu eksekusi, dan error jika gagal.
10. Berikan status koneksi yang jelas: belum connect, connected, token expired, permission kurang, file tidak bisa diakses, atau berhasil disinkronkan.

Fitur 2: Figma Connector

Buat atau perbaiki fitur agar user bisa:

1. Connect akun Figma menggunakan OAuth atau personal access token untuk tahap development.
2. Menghubungkan file Figma ke card/task kanban.
3. Menyimpan metadata file Figma seperti nama file, file key, thumbnail jika tersedia, last modified jika tersedia, dan link buka file asli di Figma.
4. Menyediakan tombol “Open in Figma”.
5. Menyediakan panel AI Assistant untuk instruksi desain, misalnya:

   * “Buat wireframe dashboard admin.”
   * “Analisis selected frame dan sarankan perbaikan UI.”
   * “Buat struktur komponen dari desain ini.”
   * “Generate slicing plan untuk React/Tailwind.”
6. Untuk edit langsung di canvas Figma, siapkan arsitektur yang mendukung Figma Plugin. Jangan memaksakan edit canvas penuh hanya dari kanban kalau API tidak memungkinkan.
7. Buat pembagian yang jelas:

   * Kanban app: menyimpan task, koneksi file, instruksi AI, riwayat, dan status.
   * Figma Plugin: nanti digunakan untuk membaca selected frame dan menerapkan perubahan langsung di editor Figma.
   * Backend AI: memproses instruksi dan mengirim hasil ke kanban/plugin.
8. Untuk MVP, minimal kanban bisa connect file Figma, membaca metadata file, membuka file asli, dan menghasilkan output AI berupa wireframe plan, slicing plan, atau design instruction. Untuk tahap lanjut, siapkan interface API agar Figma Plugin bisa mengambil task dan menerapkan hasil AI ke canvas.

UI/UX yang diinginkan:

1. Di setiap card/task kanban harus ada section “Connected Files”.
2. User bisa attach file dari:

   * Google Docs
   * Google Sheets
   * Google Slides
   * Figma
3. Setiap connected file tampil sebagai card kecil berisi:

   * Icon tipe file
   * Nama file
   * Source: Google/Figma
   * Status koneksi
   * Tombol Open
   * Tombol Ask AI
   * Tombol Detach
4. Di detail task, tambahkan panel AI Assistant yang konteksnya berdasarkan file yang sedang dipilih.
5. Jangan membuat pengalaman seperti upload manual biasa. Fokusnya adalah file asli user tetap hidup di Google/Figma.
6. Jangan embed full editor Google Docs/Figma via iframe sebagai solusi utama. Gunakan link ke editor asli dan API/plugin untuk integrasi AI.
7. UI harus clean, mudah dipahami, dan tetap mengikuti style aplikasi kanban yang sudah ada.

Backend/API yang dibutuhkan:

1. Endpoint connect Google OAuth.
2. Endpoint callback Google OAuth.
3. Endpoint list/pick/save Google file.
4. Endpoint read Google Docs/Sheets/Slides content sesuai tipe file.
5. Endpoint update Google Docs/Sheets/Slides sesuai instruksi AI.
6. Endpoint connect Figma.
7. Endpoint save Figma file connection.
8. Endpoint get Figma file metadata.
9. Endpoint AI action untuk menjalankan instruksi terhadap connected file.
10. Endpoint untuk menyimpan action history pada task.

Database yang dibutuhkan:
Tambahkan atau sesuaikan tabel/model untuk:

1. connected_accounts

   * id
   * user_id
   * provider: google/figma
   * access_token encrypted
   * refresh_token encrypted jika ada
   * scopes
   * expires_at
   * created_at
   * updated_at

2. task_connected_files

   * id
   * task_id
   * provider: google/figma
   * file_type: docs/sheets/slides/figma
   * external_file_id
   * external_file_url
   * file_name
   * thumbnail_url nullable
   * metadata json
   * connected_by
   * created_at
   * updated_at

3. ai_file_actions

   * id
   * task_id
   * connected_file_id
   * user_id
   * prompt
   * action_type
   * status: pending/running/success/failed
   * result_summary
   * error_message
   * created_at
   * updated_at

Security:

1. Jangan hardcode API key, client secret, atau token di frontend.
2. Simpan token secara aman di backend.
3. Gunakan scope minimal sesuai kebutuhan.
4. Pastikan user hanya bisa mengakses file yang memang sudah dia connect.
5. Beri handling token expired dan reconnect.
6. Tambahkan validasi permission sebelum AI membaca atau mengedit file.
7. Jangan melakukan perubahan besar ke file tanpa user confirmation jika action berisiko merusak isi file.

Cara kerja AI:

1. Saat user memilih connected file dan mengirim prompt, backend harus membaca konteks file terlebih dahulu.
2. AI harus menghasilkan rencana perubahan terlebih dahulu.
3. Untuk perubahan kecil, AI bisa langsung apply jika user memilih mode auto-apply.
4. Untuk perubahan besar, tampilkan preview/ringkasan perubahan dan minta user klik Apply.
5. Semua hasil aksi harus tersimpan di riwayat task.
6. Jika API belum sepenuhnya siap, buat adapter/service layer dengan interface yang jelas supaya nanti mudah dilanjutkan.

Acceptance criteria:

1. User bisa connect akun Google.
2. User bisa attach Google Docs/Sheets/Slides ke task kanban.
3. User bisa melihat file tersebut di detail task.
4. User bisa membuka file asli lewat tombol Open.
5. User bisa memberi prompt AI terhadap file yang dipilih.
6. Action AI tersimpan di riwayat task.
7. User bisa connect atau memasukkan file Figma.
8. User bisa attach file Figma ke task.
9. User bisa membuka file asli Figma.
10. Untuk Figma, sistem minimal bisa membaca metadata dan membuat AI output berupa design plan/wireframe plan/slicing plan.
11. Struktur kode harus rapi, modular, dan tidak merusak fitur kanban yang sudah ada.
12. Berikan fallback UI yang jelas jika OAuth/API key belum dikonfigurasi.
13. Jangan membuat editor dokumen/desain sendiri di dalam aplikasi.
14. Jangan menjadikan iframe sebagai solusi utama.
15. Buat dokumentasi singkat cara setup environment variable dan cara testing fitur.

Sebelum coding:

1. Audit dulu struktur project yang ada.
2. Identifikasi fitur integrasi yang sudah dibuat tetapi belum sesuai.
3. Jelaskan file mana saja yang akan diubah.
4. Setelah itu implementasikan secara bertahap.
5. Pastikan build/lint/test tetap jalan.
