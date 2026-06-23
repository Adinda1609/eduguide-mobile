// src/services/notifications.ts
/**
 * 🔔 LOCAL PUSH NOTIFICATION SERVICE
 * Mengelola permission & pengiriman notifikasi lokal (expo-notifications) ketika:
 * - Ditemukan mata kuliah baru hasil sinkronisasi dari server
 * - Beban SKS mendekati/melebihi batas maksimal yang diizinkan
 *
 * Catatan: Hanya menggunakan LOCAL notification (bukan remote/push).
 * Remote push notification tidak digunakan dan sudah dinonaktifkan agar
 * tidak memunculkan warning di Expo Go SDK 53+.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Konfigurasi handler: notifikasi tetap muncul sebagai alert meski app sedang dibuka (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Meminta izin notifikasi lokal ke user.
 * Dipanggil sekali saat app pertama kali start.
 * Tidak mendaftarkan push token (hanya local notification).
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('eduguide-default', {
        name: 'Pembaruan EduGuide',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return finalStatus === 'granted';
  } catch {
    // Abaikan error permission, app tetap berjalan normal tanpa notifikasi
    return false;
  }
};

/**
 * Mengirim notifikasi lokal segera (dipakai setelah sync menemukan data baru)
 */
export const sendLocalNotification = async (title: string, body: string, data: Record<string, any> = {}): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null, // null = tampil segera
    });
  } catch {
    // Abaikan jika notifikasi gagal (misal permission tidak diberikan)
  }
};

/**
 * Notifikasi spesifik ketika sinkronisasi menemukan mata kuliah baru dari server
 */
export const notifyNewMataKuliah = async (count: number): Promise<void> => {
  if (count <= 0) return;
  await sendLocalNotification(
    'Mata Kuliah Baru Tersedia',
    `Ditemukan ${count} mata kuliah baru dari server. Buka tab Mata Kuliah untuk melihatnya.`,
    { type: 'NEW_MATA_KULIAH', count }
  );
};

/**
 * Notifikasi peringatan beban SKS mendekati batas maksimal
 */
export const notifySksDeadline = async (totalSks: number, maxSks: number): Promise<void> => {
  await sendLocalNotification(
    'Pengingat Beban SKS',
    `Total SKS kamu saat ini ${totalSks} SKS, mendekati batas maksimal ${maxSks} SKS. Segera tinjau rencana studi.`,
    { type: 'SKS_DEADLINE', totalSks, maxSks }
  );
};
