// src/types/index.ts

export interface MataKuliah {
  id: string;
  nama: string;
  kode: string;
  sks: number;
  dosen: string;
  catatan: string;
  semester: string;
  createdAt: string;
  updatedAt: string;
  // ✨ Tambahan Fitur Baru: Sistem Penilaian & Kategori Akademik
  nilaiHuruf?: 'A' | 'B' | 'C' | 'D' | 'E' | 'Belum Keluar';
  jenis?: 'Wajib' | 'Pilihan';
  tipeCatatan?: 'Materi' | 'Tugas' | 'Ujian';
}

export interface Mahasiswa {
  nim: string;
  nama: string;
  semester: string;
  jurusan: string;
  ipk: string;
  foto?: string;
  // ✨ Tambahan Fitur Baru: Target Pencapaian Akademik
  targetIpk: string;
  targetSks: number;
}

export interface AppSettings {
  darkMode: boolean;
  notifikasi: boolean;
  bahasa: string;
  fontSize: 'kecil' | 'sedang' | 'besar';
}

// ✨ Tambahan Tipe untuk Jejak Audit Log yang siap dirender di UI Screen
export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'SYNC';
  entity: string;
  entityId?: string;
  detail: string;
}

// 🌐 Tambahan Fitur Networking & Background Process: Tipe Data Mata Kuliah dari Server
export interface RemoteMataKuliah {
  remoteId: number;
  nama: string;
  kode: string;
  sks: number;
  dosen: string;
  semester: string;
  catatan: string;
}

// 🌐 Status koneksi jaringan perangkat (dipantau via NetInfo)
export type ConnectionStatus = 'online' | 'offline' | 'checking';

// 🌐 Status proses sinkronisasi data dari server (dipakai di tombol "Sync from Server")
export type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

// 🌐 Ringkasan hasil sinkronisasi terakhir, disimpan ke local storage sebagai cache
export interface SyncResult {
  lastSyncAt: string;
  totalFetched: number;
  totalMerged: number;
  totalNew: number;
  source: string;
}

// ⏱️ Tambahan Fitur Background Process: Status terakhir Background Fetch Task
export interface BackgroundSyncMeta {
  lastBackgroundRunAt: string | null;
  lastBackgroundStatus: 'success' | 'failed' | 'no-new-data' | 'never-run';
  totalBackgroundRuns: number;
}

export type RootStackParamList = {
  Main: undefined;
  DetailMataKuliah: { id: string };
  TambahMataKuliah: { editId?: string };
  EditProfil: undefined;
  Pengaturan: undefined;
  RiwayatLog: undefined; // ✨ Navigasi Baru untuk melihat riwayat aktivitas
};

export type BottomTabParamList = {
  Home: undefined;
  MataKuliahTab: undefined;
  Jadwal: undefined;
  Profil: undefined;
};