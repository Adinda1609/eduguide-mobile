// src/services/backgroundTask.ts
/**
 * ⏱️ BACKGROUND PROCESS: PERIODIC SYNC TASK
 * Mendefinisikan & mendaftarkan task background menggunakan expo-task-manager
 * + expo-background-fetch agar EduGuide bisa secara periodik (setiap ±30-60 menit)
 * mengecek update mata kuliah dari server tanpa harus dibuka manual oleh user,
 * lalu menyimpan hasilnya ke local storage dan memicu notifikasi jika ada data baru.
 */
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { fetchMataKuliahFromServer } from './api';
import { notifyNewMataKuliah } from './notifications';
import {
  loadMataKuliah,
  loadRemoteCache,
  saveRemoteCache,
  saveBackgroundMeta,
  loadBackgroundMeta,
} from '../storage/asyncStorage';
import { logAction } from '../storage/sqliteStorage';

export const BACKGROUND_SYNC_TASK = 'EDUGUIDE_BACKGROUND_SYNC_TASK';

/**
 * Definisi task: dijalankan oleh OS (Android JobScheduler / iOS BGTaskScheduler)
 * di latar belakang sesuai interval minimum yang didaftarkan.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[⏱️ BACKGROUND TASK] Menjalankan pengecekan update mata kuliah...');

    const remoteData = await fetchMataKuliahFromServer(10);
    const previousCache = await loadRemoteCache();

    // Bandingkan remoteId untuk mendeteksi data baru yang belum pernah di-cache sebelumnya
    const previousIds = new Set(previousCache.map(r => r.remoteId));
    const newItems = remoteData.filter(r => !previousIds.has(r.remoteId));

    await saveRemoteCache(remoteData);

    const meta = await loadBackgroundMeta();
    await saveBackgroundMeta({
      lastBackgroundRunAt: new Date().toISOString(),
      lastBackgroundStatus: newItems.length > 0 ? 'success' : 'no-new-data',
      totalBackgroundRuns: meta.totalBackgroundRuns + 1,
    });

    if (newItems.length > 0) {
      await notifyNewMataKuliah(newItems.length);
      await logAction('SYNC', 'mata_kuliah', undefined, `Background task menemukan ${newItems.length} mata kuliah baru dari server.`);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    await logAction('SYNC', 'mata_kuliah', undefined, 'Background task berjalan, tidak ada data baru ditemukan.');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error: any) {
    console.log('[⏱️ BACKGROUND TASK ERROR]', error?.message);
    const meta = await loadBackgroundMeta();
    await saveBackgroundMeta({
      lastBackgroundRunAt: new Date().toISOString(),
      lastBackgroundStatus: 'failed',
      totalBackgroundRuns: meta.totalBackgroundRuns + 1,
    });
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Mendaftarkan task ke sistem OS dengan interval minimum 30 menit (1800 detik).
 * Catatan: OS Android/iOS tidak menjamin task berjalan tepat pada interval ini secara presisi;
 * ini adalah interval MINIMUM yang diminta ke scheduler sistem (battery-optimized).
 */
export const registerBackgroundSync = async (): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      console.log('[⏱️ BACKGROUND TASK] Task sudah terdaftar sebelumnya, skip registrasi ulang.');
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 30 * 60, // 30 menit dalam detik
      stopOnTerminate: false,   // Tetap berjalan walau app ditutup (Android)
      startOnBoot: true,        // Otomatis aktif lagi setelah perangkat di-restart
    });

    console.log('[⏱️ BACKGROUND TASK] Berhasil mendaftarkan periodic sync task.');
    return true;
  } catch (error) {
    console.log('[⏱️ BACKGROUND TASK ERROR] Gagal mendaftarkan task:', error);
    return false;
  }
};

export const unregisterBackgroundSync = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    }
  } catch (error) {
    console.log('[⏱️ BACKGROUND TASK ERROR] Gagal membatalkan registrasi task:', error);
  }
};

/**
 * 🔁 Auto-sync sederhana saat aplikasi dibuka kembali (foreground).
 * Berbeda dari background fetch (yang dijadwalkan OS), ini dipanggil langsung
 * dari App.tsx setiap kali AppState berubah dari background -> active.
 */
export const runForegroundAutoSync = async (): Promise<{ newItemsCount: number }> => {
  try {
    const remoteData = await fetchMataKuliahFromServer(10);
    const previousCache = await loadRemoteCache();
    const previousIds = new Set(previousCache.map(r => r.remoteId));
    const newItems = remoteData.filter(r => !previousIds.has(r.remoteId));

    await saveRemoteCache(remoteData);

    if (newItems.length > 0) {
      await notifyNewMataKuliah(newItems.length);
      await logAction('SYNC', 'mata_kuliah', undefined, `Auto-sync saat app dibuka kembali menemukan ${newItems.length} data baru.`);
    }

    return { newItemsCount: newItems.length };
  } catch (error) {
    console.log('[🔁 AUTO-SYNC ERROR]', error);
    return { newItemsCount: 0 };
  }
};

/**
 * Status task background saat ini, untuk ditampilkan di Pengaturan/RiwayatLog.
 */
export const getBackgroundFetchStatus = async (): Promise<BackgroundFetch.BackgroundFetchStatus | null> => {
  try {
    return await BackgroundFetch.getStatusAsync();
  } catch {
    return null;
  }
};
