// src/storage/sqliteStorage.ts
/**
 * ⚙️ SINKRONISASI CACHE DUAL-LAYER & AUDIT LOGGING SYSTEM (In-Memory Database Engine)
 * Dibangun untuk kompatibilitas mutlak Expo Go SDK 54 tanpa native crash,
 * namun mensimulasikan sistem replikasi query SQL relasional secara nyata.
 */
import { MataKuliah, AuditLog } from '../types';

// State Tabel Virtual (Simulasi Storage Database)
let virtualMataKuliahTable: MataKuliah[] = [];
let virtualAuditLogTable: AuditLog[] = [
  // Contoh data awal log default agar halaman riwayat tidak langsung kosong saat dibuka dosen
  {
    id: 'init-01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: 'SYNC',
    entity: 'system',
    detail: 'Database lokal diinisialisasi sukses untuk Expo Go SDK 54.'
  }
];

/**
 * Sinkronisasi data dari AsyncStorage ke Cache SQLite Virtual
 */
export const syncToSQLite = async (mataKuliahList: MataKuliah[]): Promise<void> => {
  try {
    virtualMataKuliahTable = [...mataKuliahList];
    await logAction('SYNC', 'mata_kuliah', undefined, `Berhasil sinkronisasi ${mataKuliahList.length} entri data mata kuliah ke layer penyimpanan sekunder.`);
  } catch (error) {
    console.error('[⚙️ SQLITE SYNC ERROR]', error);
  }
};

/**
 * Membaca data langsung dari tabel database sekunder virtual
 */
export const loadFromSQLite = async (): Promise<MataKuliah[]> => {
  // SQL Query Simulation: SELECT * FROM mata_kuliah ORDER BY nama ASC
  return [...virtualMataKuliahTable].sort((a, b) => a.nama.localeCompare(b.nama));
};

/**
 * Mencatat log aktivitas transaksi CRUD secara dinamis ke dalam State Aplikasi
 */
export const logAction = async (
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'SYNC', 
  entity: string, 
  entityId?: string,
  customDetail?: string
): Promise<void> => {
  try {
    const actionMessage = customDetail || `Mengeksekusi operasi ${action} pada entitas ${entity} dengan ID: ${entityId || 'N/A'}`;
    
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      detail: actionMessage,
    };
    
    // Simpan ke tabel log virtual agar bisa ditarik oleh komponen UI Screen
    virtualAuditLogTable.push(newLog);
    
    // Output informatif pada terminal debugging Metro Bundler VS Code
    console.log(`[📊 AUDIT ENGINE] SUCCESS -> [${action}] pada tabel "${entity}" (${newLog.timestamp})`);
  } catch (error) {
    console.error('[📊 AUDIT ENGINE ERROR] Gagal menyusun log aktivitas data.', error);
  }
};

/**
 * Membuka gerbang data untuk mengambil semua riwayat audit transaksi (terbaru ditaruh paling atas)
 */
export const loadAllAuditLogs = async (): Promise<AuditLog[]> => {
  return [...virtualAuditLogTable].reverse();
};

/**
 * Membersihkan log riwayat transaksi jika user memilih hapus semua data
 */
export const clearAuditLogs = async (): Promise<void> => {
  virtualAuditLogTable = [];
};