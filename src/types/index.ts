

export type FollowUpStatus = 'dihubungi' | 'janji-bayar' | 'tidak-merespons' | 'sudah-bayar';

export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  due_date: string; // Format: YYYY-MM-DD
  transaction_type: 'gadai' | 'angsuran';
  priority: 'tinggi' | 'sedang' | 'rendah' | 'none';
  loan_value: number;
  has_been_late_before: boolean;
  segment: 'Platinum' | 'Reguler' | 'Berisiko' | 'Potensi Churn' | 'none';
  upc: 'Pegadaian Wanea' | 'Pegadaian Ranotana' | 'N/A';
  transaction_count: number; // For segmentation
  days_since_last_transaction: number; // For segmentation
  barang_jaminan: string;
  follow_up_status: FollowUpStatus;
}

export interface BroadcastCustomer {
  sbg_number: string;
  rubrik: string;
  name: string;
  phone_number: string;
  credit_date: string;
  due_date: string;
  loan_value: number;
  barang_jaminan: string;
  taksiran: number;
  sewa_modal: number;
  alamat: string;
  status: string;
}

export interface ScheduledTask {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // ISO string for the date
  note: string;
  isCompleted: boolean;
}

// Types for the new Task Workflow Tracker
export interface Task {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  status: 'Daftar Tugas (To Do)' | 'Sedang Dikerjakan (In Progress)' | 'Selesai (Done)';
  upc: string; // To scope tasks to a specific branch/UPC
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface TaskBoardData {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

export interface InstallmentCustomer {
  id: string;
  nasabah: string;
  produk: string;
  pinjaman: number;
  osl: number;
  kol: number;
  hr_tung: number;
  tenor: string;
  angsuran: number;
  kewajiban: number;
  pencairan: string;
  kunjungan_terakhir: string;
}

export interface HistoryEntry {
  id: string; // Unique ID for each log
  timestamp: string; // ISO string of when the action was performed
  type: 'Gadaian Broadcast' | 'Angsuran Broadcast'; // Type of broadcast
  customerName: string; // Name of the customer contacted
  customerIdentifier: string; // SBG number or other customer ID
  status: string; // e.g., 'Notifikasi Terkirim', 'Pesan Disalin', 'Pesan Suara Dibuat'
  adminUser: string; // The admin user who performed the action
  template: string; // The message template used
  upc: 'Pegadaian Wanea' | 'Pegadaian Ranotana' | 'N/A';
}

    