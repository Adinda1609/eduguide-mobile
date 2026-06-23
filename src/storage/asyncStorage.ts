// src/storage/asyncStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MataKuliah, Mahasiswa, AppSettings, SyncResult, RemoteMataKuliah, BackgroundSyncMeta } from '../types';

const KEYS = {
  MATA_KULIAH: '@eduguide:mata_kuliah',
  MAHASISWA: '@eduguide:mahasiswa',
  SETTINGS: '@eduguide:settings',
  CACHE_TIMESTAMP: '@eduguide:cache_ts',
  // 🌐 Tambahan Fitur Networking & Background Process
  SYNC_RESULT: '@eduguide:sync_result',
  REMOTE_CACHE: '@eduguide:remote_cache',
  BACKGROUND_META: '@eduguide:background_meta',
};

// Terpusat untuk logging error agar debugging di terminal VS Code terlihat rapi
const logStorageError = (context: string, error: any) => {
  console.log(`[💾 STORAGE ERROR] Error during ${context}:`, error?.message || error);
};

// ─── Mata Kuliah ──────────────────────────────────────────────────────────────

export const saveMataKuliah = async (data: MataKuliah[]): Promise<void> => {
  try {
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(KEYS.MATA_KULIAH, json);
    await AsyncStorage.setItem(KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    logStorageError('saveMataKuliah', error);
    throw new Error('Gagal mengamankan penyimpanan data mata kuliah');
  }
};

export const loadMataKuliah = async (): Promise<MataKuliah[]> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.MATA_KULIAH);
    if (!json) return [];
    return JSON.parse(json) as MataKuliah[];
  } catch (error) {
    logStorageError('loadMataKuliah', error);
    return [];
  }
};

export const addMataKuliah = async (mk: MataKuliah): Promise<MataKuliah[]> => {
  const existing = await loadMataKuliah();
  const updated = [...existing, mk];
  await saveMataKuliah(updated);
  return updated;
};

export const updateMataKuliah = async (mk: MataKuliah): Promise<MataKuliah[]> => {
  const existing = await loadMataKuliah();
  const updated = existing.map(item => (item.id === mk.id ? mk : item));
  await saveMataKuliah(updated);
  return updated;
};

export const deleteMataKuliah = async (id: string): Promise<MataKuliah[]> => {
  const existing = await loadMataKuliah();
  const updated = existing.filter(item => item.id !== id);
  await saveMataKuliah(updated);
  return updated;
};

// ─── Mahasiswa ────────────────────────────────────────────────────────────────

// ✨ REVISI: Tambahkan nilai default targetIpk & targetSks agar sinkron dengan types/index.ts
const DEFAULT_MAHASISWA: Mahasiswa = {
  nim: '',
  nama: '',
  semester: '1',
  jurusan: 'Teknik Informatika',
  ipk: '0.00',
  targetIpk: '3.50',
  targetSks: 144,
};

export const saveMahasiswa = async (data: Mahasiswa): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.MAHASISWA, JSON.stringify(data));
  } catch (error) {
    logStorageError('saveMahasiswa', error);
    throw new Error('Gagal memperbarui biodata mahasiswa');
  }
};

export const loadMahasiswa = async (): Promise<Mahasiswa> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.MAHASISWA);
    if (!json) return DEFAULT_MAHASISWA;
    
    // Gunakan teknik merging object untuk mengantisipasi data lama di storage yang belum punya field target
    return { ...DEFAULT_MAHASISWA, ...JSON.parse(json) } as Mahasiswa;
  } catch (error) {
    logStorageError('loadMahasiswa', error);
    return DEFAULT_MAHASISWA;
  }
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notifikasi: true,
  bahasa: 'id',
  fontSize: 'sedang',
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    logStorageError('saveSettings', error);
    throw new Error('Gagal menyimpan preferensi aplikasi');
  }
};

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) } as AppSettings;
  } catch (error) {
    logStorageError('loadSettings', error);
    return DEFAULT_SETTINGS;
  }
};

// ─── Cache utilities ──────────────────────────────────────────────────────────

export const getCacheAge = async (): Promise<number> => {
  try {
    const ts = await AsyncStorage.getItem(KEYS.CACHE_TIMESTAMP);
    if (!ts) return Infinity;
    return Date.now() - parseInt(ts, 10);
  } catch {
    return Infinity;
  }
};

// ─── 🌐 Networking: Sync Result & Remote Cache ─────────────────────────────────
// Menyimpan hasil sinkronisasi terakhir (kapan, berapa data) agar bisa ditampilkan
// di UI tanpa harus fetch ulang, dan menyimpan cache mentah hasil fetch server
// untuk mendukung mode offline (data terakhir tetap bisa dibaca).

export const saveSyncResult = async (result: SyncResult): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SYNC_RESULT, JSON.stringify(result));
  } catch (error) {
    logStorageError('saveSyncResult', error);
  }
};

export const loadSyncResult = async (): Promise<SyncResult | null> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.SYNC_RESULT);
    return json ? (JSON.parse(json) as SyncResult) : null;
  } catch (error) {
    logStorageError('loadSyncResult', error);
    return null;
  }
};

export const saveRemoteCache = async (data: RemoteMataKuliah[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.REMOTE_CACHE, JSON.stringify(data));
  } catch (error) {
    logStorageError('saveRemoteCache', error);
  }
};

export const loadRemoteCache = async (): Promise<RemoteMataKuliah[]> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.REMOTE_CACHE);
    return json ? (JSON.parse(json) as RemoteMataKuliah[]) : [];
  } catch (error) {
    logStorageError('loadRemoteCache', error);
    return [];
  }
};

// ─── ⏱️ Background Process: Metadata Eksekusi Task ─────────────────────────────

const DEFAULT_BACKGROUND_META: BackgroundSyncMeta = {
  lastBackgroundRunAt: null,
  lastBackgroundStatus: 'never-run',
  totalBackgroundRuns: 0,
};

export const saveBackgroundMeta = async (meta: BackgroundSyncMeta): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.BACKGROUND_META, JSON.stringify(meta));
  } catch (error) {
    logStorageError('saveBackgroundMeta', error);
  }
};

export const loadBackgroundMeta = async (): Promise<BackgroundSyncMeta> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.BACKGROUND_META);
    return json ? { ...DEFAULT_BACKGROUND_META, ...JSON.parse(json) } : DEFAULT_BACKGROUND_META;
  } catch (error) {
    logStorageError('loadBackgroundMeta', error);
    return DEFAULT_BACKGROUND_META;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.MATA_KULIAH,
      KEYS.MAHASISWA,
      KEYS.SETTINGS,
      KEYS.CACHE_TIMESTAMP,
      KEYS.SYNC_RESULT,
      KEYS.REMOTE_CACHE,
      KEYS.BACKGROUND_META,
    ]);
  } catch (error) {
    logStorageError('clearAllData', error);
  }
};