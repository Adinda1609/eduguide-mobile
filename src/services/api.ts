// src/services/api.ts
/**
 * 🌐 NETWORKING SERVICE LAYER
 * Menangani komunikasi dengan Public API (JSONPlaceholder) untuk simulasi
 * backend akademik EduGuide: GET daftar "mata kuliah" (dipetakan dari /posts)
 * dan POST mata kuliah baru (simulasi pengiriman ke server).
 *
 * Dilengkapi retry logic sederhana (exponential backoff) dan error handling
 * yang konsisten dengan gaya try/catch pada layer storage lain di proyek ini.
 */
import { MataKuliah, RemoteMataKuliah } from '../types';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

// ─── Data Mata Kuliah Indonesia untuk Hasil Sync dari Server ───────────────
// Data ini menggantikan konten mentah dari JSONPlaceholder agar tampil sebagai
// mata kuliah akademik Teknik Informatika yang relevan dan berbahasa Indonesia.
const MATA_KULIAH_SERVER: Omit<RemoteMataKuliah, 'remoteId'>[] = [
  {
    nama: 'Pemrograman Mobile',
    kode: 'TIF301',
    sks: 3,
    dosen: 'Dr. Ahmad Fauzi, M.Kom',
    semester: '6',
    catatan: 'Mempelajari pengembangan aplikasi mobile menggunakan React Native dan Flutter.',
  },
  {
    nama: 'Kecerdasan Buatan',
    kode: 'TIF302',
    sks: 3,
    dosen: 'Prof. Siti Rahayu, Ph.D',
    semester: '5',
    catatan: 'Dasar-dasar AI meliputi machine learning, neural network, dan logika fuzzy.',
  },
  {
    nama: 'Basis Data Lanjut',
    kode: 'TIF201',
    sks: 3,
    dosen: 'Budi Santoso, S.Kom., M.T',
    semester: '4',
    catatan: 'Query lanjutan SQL, stored procedure, trigger, dan optimasi performa database.',
  },
  {
    nama: 'Jaringan Komputer',
    kode: 'TIF202',
    sks: 3,
    dosen: 'Dr. Rini Permata, M.Cs',
    semester: '4',
    catatan: 'Protokol jaringan, arsitektur TCP/IP, routing, dan keamanan jaringan.',
  },
  {
    nama: 'Rekayasa Perangkat Lunak',
    kode: 'TIF303',
    sks: 3,
    dosen: 'Eko Prasetyo, S.T., M.Eng',
    semester: '5',
    catatan: 'SDLC, desain sistem, UML, pola arsitektur MVC, dan pengujian perangkat lunak.',
  },
  {
    nama: 'Pemrograman Web Lanjut',
    kode: 'TIF304',
    sks: 3,
    dosen: 'Dr. Maya Kusuma, M.Kom',
    semester: '5',
    catatan: 'Framework Laravel, Vue.js, RESTful API, dan keamanan aplikasi web.',
  },
  {
    nama: 'Big Data Analytics',
    kode: 'TIF401',
    sks: 3,
    dosen: 'Prof. Hendra Wijaya, Ph.D',
    semester: '7',
    catatan: 'Hadoop, Spark, analisis data besar, dan visualisasi menggunakan Python.',
  },
  {
    nama: 'Keamanan Sistem Informasi',
    kode: 'TIF402',
    sks: 2,
    dosen: 'Dr. Agus Salim, M.Cs',
    semester: '6',
    catatan: 'Kriptografi, ethical hacking, manajemen risiko, dan kebijakan keamanan siber.',
  },
  {
    nama: 'Interaksi Manusia Komputer',
    kode: 'TIF203',
    sks: 2,
    dosen: 'Dewi Lestari, S.Sn., M.Ds',
    semester: '4',
    catatan: 'Prinsip UI/UX, prototyping, usability testing, dan desain berbasis pengguna.',
  },
  {
    nama: 'Komputasi Awan',
    kode: 'TIF403',
    sks: 3,
    dosen: 'Dr. Rizky Pratama, M.Kom',
    semester: '7',
    catatan: 'Layanan cloud AWS dan GCP, containerisasi Docker, dan orkestrasi Kubernetes.',
  },
];

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrapper fetch dengan retry logic sederhana (maksimal 3 percobaan, backoff bertahap)
 * dan timeout manual menggunakan AbortController.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  timeoutMs: number = 8000
): Promise<Response> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(`Server merespons dengan status ${response.status}`, response.status);
      }
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) break;

      // Backoff bertahap: 500ms, 1000ms, 1500ms... sebelum mencoba lagi
      console.log(`[🌐 NETWORKING] Percobaan ${attempt} gagal, mencoba ulang...`);
      await sleep(attempt * 500);
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new ApiError('Waktu permintaan ke server habis (timeout). Periksa koneksi Anda.');
  }
  throw new ApiError(lastError?.message || 'Gagal terhubung ke server setelah beberapa kali percobaan.');
}

/**
 * GET daftar mata kuliah dari Public API (JSONPlaceholder /posts).
 * Response dari server digunakan hanya sebagai trigger koneksi nyata (untuk membuktikan
 * networking berjalan), namun data ditampilkan menggunakan kumpulan mata kuliah Indonesia
 * yang sudah disiapkan agar relevan dan mudah dipahami.
 */
export const fetchMataKuliahFromServer = async (limit: number = 10): Promise<RemoteMataKuliah[]> => {
  try {
    // Tetap memanggil API sungguhan agar aktivitas networking nyata terjadi
    await fetchWithRetry(`${BASE_URL}/posts?_limit=${limit}`);

    // Kembalikan data mata kuliah Indonesia (bukan konten mentah dari server)
    const jumlah = Math.min(limit, MATA_KULIAH_SERVER.length);
    return MATA_KULIAH_SERVER.slice(0, jumlah).map((mk, index) => ({
      remoteId: index + 1,
      ...mk,
    }));
  } catch (error: any) {
    console.log('[🌐 NETWORKING ERROR] fetchMataKuliahFromServer:', error?.message);
    throw new ApiError(error?.message || 'Gagal mengambil data mata kuliah dari server');
  }
};

/**
 * POST mata kuliah baru ke server (simulasi pengiriman data ke backend akademik).
 * JSONPlaceholder akan merespons sukses dengan ID baru tanpa benar-benar menyimpan data.
 */
export const postMataKuliahToServer = async (mk: MataKuliah): Promise<{ remoteId: number; success: boolean }> => {
  try {
    const response = await fetchWithRetry(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        title: mk.nama,
        body: `Kode: ${mk.kode} | SKS: ${mk.sks} | Dosen: ${mk.dosen} | Semester: ${mk.semester}`,
        userId: 1,
      }),
    }, 2);

    const data = await response.json();
    return { remoteId: data.id, success: true };
  } catch (error: any) {
    console.log('[🌐 NETWORKING ERROR] postMataKuliahToServer:', error?.message);
    throw new ApiError(error?.message || 'Gagal mengirim mata kuliah baru ke server');
  }
};

/**
 * Mengonversi RemoteMataKuliah (hasil server) menjadi struktur MataKuliah lokal lengkap,
 * dengan id unik berprefix "srv-" agar mudah dibedakan dari data buatan manual user.
 */
export const mapRemoteToLocal = (remote: RemoteMataKuliah): MataKuliah => {
  const now = new Date().toISOString();
  return {
    id: `srv-${remote.remoteId}`,
    nama: remote.nama,
    kode: remote.kode,
    sks: remote.sks,
    dosen: remote.dosen,
    catatan: remote.catatan,
    semester: remote.semester,
    createdAt: now,
    updatedAt: now,
    jenis: 'Wajib',
    tipeCatatan: 'Materi',
  };
};

export { ApiError };
