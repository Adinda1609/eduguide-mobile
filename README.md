# 📚 EduGuide — Panduan Akademik Mahasiswa (v2.0)

Aplikasi mobile React Native berbasis **Expo SDK 54** untuk mengelola data akademik mahasiswa secara lokal, terhubung ke backend (networking), dan mampu menjalankan proses di background.

---

## 👤 Informasi Mahasiswa

| Field | Nilai |
|-------|-------|
| Nama | Sri Adinda |
| NPM | 233510515 |
| Kelas | 6B |
| Mata Kuliah | Mobile Programming |
| Program Studi | Teknik Informatika |
| Universitas | Universitas Islam Riau (UIR) |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js ≥ 18
- npm
- Aplikasi **Expo Go** (unduh di Play Store / App Store)
- HP dan laptop terhubung ke **WiFi yang sama**

### Langkah Instalasi

```bash
# 1. Masuk ke folder Kode Sumber
cd "Kode Sumber"

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Jalankan development server
npx expo start

# 4. Scan QR code menggunakan Expo Go di HP
```

> **Catatan:** Aplikasi dibangun dengan **Expo SDK 54**. Gunakan Expo Go versi terbaru.

---

## ✅ Fitur yang Diimplementasikan

### 1. Navigation
- **Bottom Tab Navigation** — 4 tab: Beranda, Mata Kuliah, Jadwal, Profil
- **Stack Navigation** — Detail Mata Kuliah, Form Tambah/Edit, Edit Profil, Pengaturan, Riwayat Log
- Passing data antar screen menggunakan React Navigation params

### 2. Data Storage
- **AsyncStorage** — penyimpanan utama untuk Mata Kuliah, Profil, dan Pengaturan
- **SQLite** — cache sekunder dan log aktivitas CRUD
- **React Context + useReducer** — state management dengan persistence

Layer storage AsyncStorage:
```
@eduguide:mata_kuliah     → Data CRUD mata kuliah
@eduguide:mahasiswa       → Profil mahasiswa
@eduguide:settings        → Pengaturan aplikasi
@eduguide:sync_result     → Hasil sinkronisasi terakhir
@eduguide:remote_cache    → Cache data dari server
@eduguide:background_meta → Metadata background task
```

### 3. Manajemen Mata Kuliah (CRUD Lengkap)
- ➕ **Tambah** — form lengkap (nama, kode, SKS, dosen, catatan, semester)
- 📋 **Daftar** — FlatList dengan search & filter semester
- 👁️ **Detail** — info lengkap + fitur share & linking
- ✏️ **Edit** — form pre-filled untuk update data
- 🗑️ **Hapus** — konfirmasi dialog + loading state

### 4. Search & Filter
- Real-time search berdasarkan nama, kode, atau dosen
- Filter berdasarkan semester (1–8)
- Summary bar jumlah mata kuliah & total SKS

### 5. Intent-like Features (Linking & Share)
| Fitur | API |
|-------|-----|
| Bagikan mata kuliah | `Share.share()` |
| Buka WhatsApp | `Linking.openURL('whatsapp://')` |
| Buka Email | `Linking.openURL('mailto:')` |
| Buka Maps | `Linking.openURL('https://maps.google.com')` |

### 6. Pengaturan Aplikasi
- 🌙 Dark Mode toggle
- 🔔 Notifikasi toggle
- 🔤 Ukuran font (Kecil / Sedang / Besar)
- 🗑️ Reset semua data

---

## 🌐 Networking Mobile (Fitur Baru v2.0)

### Cara Menguji
1. Buka tab **Mata Kuliah**
2. Pastikan badge **ONLINE** terlihat di pojok kiri atas
3. Tekan tombol **"Sync from Server"** atau tarik daftar ke bawah (pull-to-refresh)
4. Data mata kuliah baru dari server akan masuk dan digabungkan ke daftar lokal
5. Matikan internet → badge berubah **OFFLINE** → tekan Sync → muncul alert error

### Fitur yang Diimplementasikan
- **Fetch dari Public API** — mengambil daftar mata kuliah dari JSONPlaceholder (`/posts`), dipetakan menjadi data akademik berbahasa Indonesia (Pemrograman Mobile, Kecerdasan Buatan, Basis Data Lanjut, dst.)
- **Sync from Server** — tombol di layar Mata Kuliah untuk mengambil data terbaru dari server dan menggabungkan (merge) dengan data lokal tanpa duplikasi
- **POST Mata Kuliah** — setiap penambahan mata kuliah baru dikirim ke server (simulasi) sebelum disimpan lokal — tetap tersimpan lokal meski POST gagal (offline-first)
- **Retry Logic & Timeout** — permintaan jaringan dicoba ulang hingga 3x dengan backoff bertahap (500ms, 1000ms, 1500ms), timeout via `AbortController`
- **Pull-to-Refresh** — tarik daftar ke bawah untuk sync otomatis
- **Status Koneksi Online/Offline** — dipantau real-time menggunakan `@react-native-community/netinfo`
- **Cache Networking** — hasil fetch disimpan ke AsyncStorage agar data tetap tersedia saat offline

---

## ⏱️ Background Process (Fitur Baru v2.0)

### Cara Menguji
1. Buka tab **Pengaturan** → scroll ke section **"Networking & Background Process"**
2. Lihat status registrasi background fetch, waktu terakhir berjalan, dan total eksekusi
3. Tutup app ke background → buka kembali → auto-sync berjalan otomatis
4. Jika ada mata kuliah baru → notifikasi lokal muncul di HP

### Fitur yang Diimplementasikan
- **Periodic Background Fetch** — menggunakan `expo-task-manager` + `expo-background-fetch` untuk mengecek update mata kuliah dari server setiap ±30 menit, bahkan saat aplikasi tidak dibuka
- **Local Push Notification** — notifikasi lokal (`expo-notifications`) ketika:
  - Ditemukan mata kuliah baru hasil sinkronisasi dari server
  - Beban SKS semester mendekati batas maksimal berdasarkan IPK
- **Auto-Sync saat App Dibuka Kembali** — memanfaatkan `AppState` React Native untuk sync otomatis setiap kali aplikasi kembali dari background ke foreground
- **Pemantauan Status Task** — dapat dilihat di layar Pengaturan (kapan terakhir berjalan, status hasil, total eksekusi)

---

## 🏗️ Struktur Proyek

```
233510515_SriAdinda/Kode Sumber/
├── App.tsx                           # Entry point
├── app.json                          # Expo config (SDK 54)
├── package.json
├── tsconfig.json
├── assets/
└── src/
    ├── types/index.ts                # TypeScript interfaces
    ├── context/AppContext.tsx        # Global state (useReducer + networking)
    ├── storage/
    │   ├── asyncStorage.ts           # AsyncStorage CRUD + cache sync/background
    │   └── sqliteStorage.ts          # SQLite cache & log aktivitas
    ├── services/
    │   ├── api.ts                    # Fetch & POST ke Public API + retry logic
    │   ├── notifications.ts          # Local push notification
    │   └── backgroundTask.ts         # expo-task-manager + expo-background-fetch
    ├── hooks/
    │   └── useNetworkStatus.ts       # Hook status online/offline (NetInfo)
    ├── utils/theme.ts                # Light & dark theme
    ├── navigation/index.tsx          # Stack + Bottom Tabs
    └── screens/
        ├── SplashScreen.tsx
        ├── HomeScreen.tsx
        ├── MataKuliahScreen.tsx      # + Sync from Server, Pull-to-Refresh
        ├── TambahMataKuliahScreen.tsx # + POST ke server
        ├── DetailMataKuliahScreen.tsx
        ├── JadwalScreen.tsx
        ├── ProfilScreen.tsx
        ├── EditProfilScreen.tsx
        ├── RiwayatLogScreen.tsx
        └── PengaturanScreen.tsx      # + Status networking & background task
```

---

## 📦 Dependencies

| Package | Versi | Fungsi |
|---------|-------|--------|
| expo | ~54.0.8 | Platform utama |
| @react-navigation/native | 7.0.14 | Navigasi |
| @react-navigation/bottom-tabs | 7.2.0 | Tab navigasi |
| @react-navigation/native-stack | 7.2.0 | Stack navigasi |
| @react-native-async-storage/async-storage | 2.2.0 | Storage utama |
| @react-native-community/netinfo | 11.4.1 | Status koneksi online/offline |
| expo-background-fetch | ~14.0.9 | Penjadwal background task |
| expo-task-manager | ~14.0.9 | Definisi & registrasi background task |
| expo-notifications | ~0.32.12 | Local push notification |
| expo-linking | ~8.0.12 | Intent-like (URL schemes) |
| expo-sharing | ~14.0.8 | Native share dialog |
| expo-font | ~13.3.2 | Font support |
| typescript | ^5.3.0 | Type safety |

---

## 🧠 Arsitektur

### State Management
```
AppContext (React Context + useReducer)
    ├── State: mataKuliah[], mahasiswa, settings, syncStatus, isOnline, ...
    ├── Actions: INIT_DATA, SET_MATA_KULIAH, SET_SYNC_STATUS, ...
    ├── Persistence → AsyncStorage (utama)
    └── Cache       → SQLite (sekunder)
```

### Flow Data Networking
```
User tekan Sync
      ↓
AppContext.syncFromServer()
      ↓
services/api.ts → JSONPlaceholder API (fetch + retry)
      ↓
Merge data baru dengan data lokal
      ↓
AsyncStorage (simpan) → UI Update
      ↓
Jika ada data baru → expo-notifications (local notification)
```

### Flow Background Task
```
App start → registerBackgroundSync() (sekali saja)
      ↓
OS menjadwalkan task setiap ±30 menit
      ↓
backgroundTask.ts berjalan di background
      ↓
Fetch data → bandingkan dengan cache → simpan ke AsyncStorage
      ↓
Jika ada data baru → Local Push Notification
```

---

## 📄 Keterangan

Proyek ini dibuat untuk memenuhi tugas mata kuliah **Mobile Programming** dengan topik:
**Pengembangan EduGuide Mobile — Full Integration (Navigation, Data Storage, Networking, & Background Process)**

Teknik Informatika Kelas 6B — Universitas Islam Riau (UIR)
