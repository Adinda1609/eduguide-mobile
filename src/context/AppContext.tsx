// src/context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { MataKuliah, Mahasiswa, AppSettings, AuditLog, ConnectionStatus, SyncStatus, SyncResult } from '../types';
import * as AsyncStore from '../storage/asyncStorage';
import { syncToSQLite, logAction, loadAllAuditLogs } from '../storage/sqliteStorage';
import { fetchMataKuliahFromServer, postMataKuliahToServer, mapRemoteToLocal, ApiError } from '../services/api';
import { notifyNewMataKuliah, notifySksDeadline } from '../services/notifications';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// ✨ REVISI: Samakan dengan model Mahasiswa baru di types/index.ts
const DEFAULT_MAHASISWA: Mahasiswa = {
  nim: '',
  nama: '',
  semester: '1',
  jurusan: 'Teknik Informatika',
  ipk: '0.00',
  targetIpk: '3.50',
  targetSks: 144,
};

interface AppState {
  mataKuliah: MataKuliah[];
  mahasiswa: Mahasiswa;
  settings: AppSettings;
  auditLogs: AuditLog[]; // ✨ FITUR BARU: Menyimpan state jejak audit transaksi untuk UI
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterSemester: string;
  // 🌐 Tambahan Fitur Networking & Background Process
  syncStatus: SyncStatus;
  lastSyncResult: SyncResult | null;
  syncError: string | null;
}

const initialState: AppState = {
  mataKuliah: [],
  mahasiswa: DEFAULT_MAHASISWA,
  settings: { darkMode: false, notifikasi: true, bahasa: 'id', fontSize: 'sedang' },
  auditLogs: [],
  isLoading: true,
  error: null,
  searchQuery: '',
  filterSemester: 'semua',
  syncStatus: 'idle',
  lastSyncResult: null,
  syncError: null,
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INIT_DATA'; payload: { mataKuliah: MataKuliah[]; mahasiswa: Mahasiswa; settings: AppSettings; auditLogs: AuditLog[] } }
  | { type: 'SET_MATA_KULIAH'; payload: MataKuliah[] }
  | { type: 'SET_MAHASISWA'; payload: Mahasiswa }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_AUDIT_LOGS'; payload: AuditLog[] } // ✨ Aksi Baru untuk Log
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER_SEMESTER'; payload: string }
  // 🌐 Aksi baru untuk Networking & Sync
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'SET_SYNC_RESULT'; payload: SyncResult | null }
  | { type: 'SET_SYNC_ERROR'; payload: string | null };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'INIT_DATA': return { ...state, ...action.payload, isLoading: false, error: null };
    case 'SET_MATA_KULIAH': return { ...state, mataKuliah: action.payload };
    case 'SET_MAHASISWA': return { ...state, mahasiswa: action.payload };
    case 'SET_SETTINGS': return { ...state, settings: action.payload };
    case 'SET_AUDIT_LOGS': return { ...state, auditLogs: action.payload };
    case 'SET_SEARCH': return { ...state, searchQuery: action.payload };
    case 'SET_FILTER_SEMESTER': return { ...state, filterSemester: action.payload };
    case 'SET_SYNC_STATUS': return { ...state, syncStatus: action.payload };
    case 'SET_SYNC_RESULT': return { ...state, lastSyncResult: action.payload };
    case 'SET_SYNC_ERROR': return { ...state, syncError: action.payload };
    default: return state;
  }
}

interface AppContextValue {
  state: AppState;
  filteredMataKuliah: MataKuliah[];
  totalSKS: number;
  totalSKSSemesterIni: number;
  refreshAuditLogs: () => Promise<void>; // ✨ FITUR BARU: Pemicu refresh log di layar RiwayatLog
  addMataKuliah: (data: Omit<MataKuliah, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMataKuliah: (data: MataKuliah) => Promise<void>;
  deleteMataKuliah: (id: string) => Promise<void>;
  getMataKuliahById: (id: string) => MataKuliah | undefined;
  updateMahasiswa: (data: Mahasiswa) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setSearch: (q: string) => void;
  setFilterSemester: (s: string) => void;
  clearError: () => void;
  refreshData: () => Promise<void>;
  // 🌐 Tambahan Fitur Networking & Background Process
  isOnline: boolean;
  connectionType: string;
  syncFromServer: () => Promise<void>;
  postMataKuliahBaru: (data: Omit<MataKuliah, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  clearSyncError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isOnline, connectionType } = useNetworkStatus(); // 🌐 Status koneksi real-time

  // Fungsi penyegar log virtual SQLite
  const refreshAuditLogs = useCallback(async () => {
    const logs = await loadAllAuditLogs();
    dispatch({ type: 'SET_AUDIT_LOGS', payload: logs });
  }, []);

  const loadData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [mataKuliah, mahasiswa, settings] = await Promise.all([
        AsyncStore.loadMataKuliah(),
        AsyncStore.loadMahasiswa(),
        AsyncStore.loadSettings(),
      ]);

      // Gabungkan data lama dengan default target baru untuk mencegah crash property missing
      const mergedMahasiswa: Mahasiswa = {
        ...DEFAULT_MAHASISWA,
        ...mahasiswa,
      };

      // Sinkronisasi data ke database sekunder virtual
      await syncToSQLite(mataKuliah);
      const auditLogs = await loadAllAuditLogs();
      const cachedSyncResult = await AsyncStore.loadSyncResult(); // 🌐 Muat hasil sync terakhir dari cache

      dispatch({ 
        type: 'INIT_DATA', 
        payload: { mataKuliah, mahasiswa: mergedMahasiswa, settings, auditLogs } 
      });
      if (cachedSyncResult) {
        dispatch({ type: 'SET_SYNC_RESULT', payload: cachedSyncResult });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data aplikasi' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredMataKuliah = useMemo(() => {
    let list = state.mataKuliah;
    if (state.filterSemester !== 'semua') {
      list = list.filter(mk => mk.semester === state.filterSemester);
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(mk =>
        mk.nama.toLowerCase().includes(q) ||
        mk.kode.toLowerCase().includes(q) ||
        mk.dosen.toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.mataKuliah, state.filterSemester, state.searchQuery]);

  const totalSKS = useMemo(
    () => state.mataKuliah.reduce((s, mk) => s + mk.sks, 0),
    [state.mataKuliah]
  );

  const totalSKSSemesterIni = useMemo(() => {
    return state.mataKuliah
      .filter(mk => mk.semester === state.mahasiswa.semester)
      .reduce((s, mk) => s + mk.sks, 0);
  }, [state.mataKuliah, state.mahasiswa.semester]);

  const addMataKuliah = useCallback(async (data: Omit<MataKuliah, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const now = new Date().toISOString();
      const newMK: MataKuliah = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      const updated = await AsyncStore.addMataKuliah(newMK);
      
      dispatch({ type: 'SET_MATA_KULIAH', payload: updated });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      await syncToSQLite(updated);
      await logAction('ADD', 'mata_kuliah', newMK.id, `Menambahkan mata kuliah baru: ${newMK.nama} (${newMK.kode})`);
      await refreshAuditLogs();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menambah mata kuliah' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error('Gagal menambah mata kuliah');
    }
  }, [refreshAuditLogs]);

  const updateMataKuliah = useCallback(async (data: MataKuliah) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updated = await AsyncStore.updateMataKuliah({ ...data, updatedAt: new Date().toISOString() });
      
      dispatch({ type: 'SET_MATA_KULIAH', payload: updated });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      await syncToSQLite(updated);
      await logAction('UPDATE', 'mata_kuliah', data.id, `Memperbarui info mata kuliah: ${data.nama}`);
      await refreshAuditLogs();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal mengupdate mata kuliah' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error('Gagal update');
    }
  }, [refreshAuditLogs]);

  const deleteMataKuliah = useCallback(async (id: string) => {
    try {
      const targetMK = state.mataKuliah.find(mk => mk.id === id);
      dispatch({ type: 'SET_LOADING', payload: true });
      const updated = await AsyncStore.deleteMataKuliah(id);
      
      dispatch({ type: 'SET_MATA_KULIAH', payload: updated });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      await syncToSQLite(updated);
      await logAction('DELETE', 'mata_kuliah', id, `Menghapus mata kuliah: ${targetMK ? targetMK.nama : id}`);
      await refreshAuditLogs();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menghapus mata kuliah' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error('Gagal hapus');
    }
  }, [state.mataKuliah, refreshAuditLogs]);

  const getMataKuliahById = useCallback(
    (id: string) => state.mataKuliah.find(mk => mk.id === id),
    [state.mataKuliah]
  );

  const updateMahasiswa = useCallback(async (data: Mahasiswa) => {
    try {
      await AsyncStore.saveMahasiswa(data);
      dispatch({ type: 'SET_MAHASISWA', payload: data });
      await logAction('UPDATE', 'mahasiswa', undefined, `Memperbarui profil mahasiswa dan target akademik kelulusan.`);
      await refreshAuditLogs();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menyimpan profil' });
      throw new Error('Gagal simpan profil');
    }
  }, [refreshAuditLogs]);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    try {
      const newSettings = { ...state.settings, ...partial };
      await AsyncStore.saveSettings(newSettings);
      dispatch({ type: 'SET_SETTINGS', payload: newSettings });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menyimpan pengaturan' });
      throw new Error('Gagal simpan pengaturan');
    }
  }, [state.settings]);

  const setSearch = useCallback((q: string) => dispatch({ type: 'SET_SEARCH', payload: q }), []);
  const setFilterSemester = useCallback((s: string) => dispatch({ type: 'SET_FILTER_SEMESTER', payload: s }), []);
  const clearError = useCallback(() => dispatch({ type: 'SET_ERROR', payload: null }), []);
  const refreshData = useCallback(() => loadData(), [loadData]);

  // 🌐 FITUR BARU: Sync from Server — fetch data terbaru & merge dengan data lokal
  const syncFromServer = useCallback(async () => {
    if (!isOnline) {
      dispatch({ type: 'SET_SYNC_ERROR', payload: 'Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.' });
      return;
    }

    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'loading' });
      dispatch({ type: 'SET_SYNC_ERROR', payload: null });

      const remoteData = await fetchMataKuliahFromServer(10);
      await AsyncStore.saveRemoteCache(remoteData);

      // Merge: hanya tambahkan mata kuliah server yang belum ada di local storage (cek by id "srv-X")
      const existingLocal = await AsyncStore.loadMataKuliah();
      const existingIds = new Set(existingLocal.map(mk => mk.id));
      const newOnes = remoteData
        .map(mapRemoteToLocal)
        .filter(mk => !existingIds.has(mk.id));

      const merged = [...existingLocal, ...newOnes];
      await AsyncStore.saveMataKuliah(merged);
      await syncToSQLite(merged);

      const result: SyncResult = {
        lastSyncAt: new Date().toISOString(),
        totalFetched: remoteData.length,
        totalMerged: merged.length,
        totalNew: newOnes.length,
        source: 'JSONPlaceholder API',
      };
      await AsyncStore.saveSyncResult(result);

      dispatch({ type: 'SET_MATA_KULIAH', payload: merged });
      dispatch({ type: 'SET_SYNC_RESULT', payload: result });
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'success' });

      await logAction('SYNC', 'mata_kuliah', undefined, `Sync manual dari server: ${newOnes.length} mata kuliah baru ditambahkan (total fetch: ${remoteData.length}).`);
      await refreshAuditLogs();

      if (newOnes.length > 0 && state.settings.notifikasi) {
        await notifyNewMataKuliah(newOnes.length);
      }
    } catch (error: any) {
      const message = error instanceof ApiError ? error.message : 'Gagal melakukan sinkronisasi dengan server';
      dispatch({ type: 'SET_SYNC_ERROR', payload: message });
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
    }
  }, [isOnline, refreshAuditLogs, state.settings.notifikasi]);

  // 🌐 FITUR BARU: POST mata kuliah baru ke server (simulasi), lalu tetap simpan ke lokal
  const postMataKuliahBaru = useCallback(async (data: Omit<MataKuliah, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isOnline) {
        try {
          const now = new Date().toISOString();
          const tempMK: MataKuliah = { ...data, id: generateId(), createdAt: now, updatedAt: now };
          await postMataKuliahToServer(tempMK);
          await logAction('SYNC', 'mata_kuliah', tempMK.id, `Berhasil mengirim mata kuliah "${tempMK.nama}" ke server (simulasi POST).`);
        } catch (postError: any) {
          // Tetap lanjutkan simpan lokal walau POST ke server gagal (offline-first behavior)
          console.log('[🌐 POST WARNING] Gagal kirim ke server, melanjutkan simpan lokal:', postError?.message);
        }
      }

      // Simpan ke local storage seperti flow addMataKuliah biasa
      const now = new Date().toISOString();
      const newMK: MataKuliah = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      const updated = await AsyncStore.addMataKuliah(newMK);

      dispatch({ type: 'SET_MATA_KULIAH', payload: updated });
      dispatch({ type: 'SET_LOADING', payload: false });

      await syncToSQLite(updated);
      await logAction('ADD', 'mata_kuliah', newMK.id, `Menambahkan mata kuliah baru (dengan sinkronisasi server): ${newMK.nama} (${newMK.kode})`);
      await refreshAuditLogs();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menambah & mengirim mata kuliah ke server' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error('Gagal menambah mata kuliah');
    }
  }, [isOnline, refreshAuditLogs]);

  const clearSyncError = useCallback(() => dispatch({ type: 'SET_SYNC_ERROR', payload: null }), []);

  return (
    <AppContext.Provider value={{
      state, filteredMataKuliah, totalSKS, totalSKSSemesterIni, refreshAuditLogs,
      addMataKuliah, updateMataKuliah, deleteMataKuliah, getMataKuliahById,
      updateMahasiswa, updateSettings,
      setSearch, setFilterSemester, clearError, refreshData,
      isOnline, connectionType, syncFromServer, postMataKuliahBaru, clearSyncError,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};