-- Skema "Database" untuk Aplikasi NAVIGA
-- Data ini sebenarnya disimpan di Local Storage peramban pengguna.
-- File ini dibuat untuk diimpor ke alat ERD seperti ERDPlus.

-- Tabel untuk menyimpan data pengguna yang sedang login
CREATE TABLE User (
    name VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    upc VARCHAR(50) NOT NULL COMMENT 'Unit/Cabang (Wanea, Ranotana, all)',
    avatar TEXT COMMENT 'URL Avatar dalam format Base64'
);

-- Tabel untuk menyimpan data papan tugas Kanban
-- Kunci penyimpanan di Local Storage adalah "taskBoardData_{upc}"
CREATE TABLE TaskBoard (
    upc_id VARCHAR(50) PRIMARY KEY,
    tasks JSON NOT NULL COMMENT 'Objek JSON berisi semua data tugas',
    columns JSON NOT NULL COMMENT 'Objek JSON berisi semua data kolom',
    columnOrder JSON NOT NULL COMMENT 'Array JSON berisi urutan ID kolom'
);

-- Tabel untuk menyimpan riwayat aktivitas broadcast
-- Kunci penyimpanan di Local Storage adalah "broadcastHistory_{upc}"
CREATE TABLE History (
    id VARCHAR(255) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'Jenis Broadcast (Gadaian/Angsuran)',
    customerName VARCHAR(255) NOT NULL,
    adminUser VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL
);

-- Definisikan hubungan antar tabel
ALTER TABLE TaskBoard ADD FOREIGN KEY (upc_id) REFERENCES User (upc);
ALTER TABLE History ADD FOREIGN KEY (adminUser) REFERENCES User (name);

-- Entitas sementara yang tidak disimpan di Local Storage,
-- tetapi ada saat runtime setelah file diunggah.

-- Mewakili data dari PDF
CREATE TABLE BroadcastCustomer_Temporary (
    sbg_number VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    phone_number VARCHAR(50),
    due_date DATE,
    loan_value DECIMAL(15, 2)
);

-- Mewakili data dari XLSX
CREATE TABLE InstallmentCustomer_Temporary (
    id VARCHAR(255) PRIMARY KEY,
    nasabah VARCHAR(255),
    produk VARCHAR(255),
    kewajiban DECIMAL(15, 2),
    hr_tung INT
);
