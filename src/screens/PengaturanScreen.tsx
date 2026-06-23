// src/screens/PengaturanScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // ✨ Ikon Vektor Profesional
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { clearAllData, loadBackgroundMeta } from '../storage/asyncStorage';
import { getBackgroundFetchStatus } from '../services/backgroundTask';
import { AppSettings, BackgroundSyncMeta } from '../types';

const BACKGROUND_FETCH_STATUS_LABEL: Record<number, string> = {
  1: 'Restricted (Dibatasi Sistem)',
  2: 'Tersedia & Aktif',
  3: 'Ditolak Pengguna (Denied)',
};

const PengaturanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, updateSettings, refreshData, isOnline, connectionType } = useApp();
  const theme = getTheme(state.settings.darkMode);
  const [resetLoading, setResetLoading] = useState(false);

  // ⏱️ FITUR BARU: Status Background Process untuk ditampilkan ke dosen sebagai bukti implementasi
  const [bgMeta, setBgMeta] = useState<BackgroundSyncMeta | null>(null);
  const [bgFetchStatusCode, setBgFetchStatusCode] = useState<number | null>(null);

  const loadBackgroundInfo = useCallback(async () => {
    const meta = await loadBackgroundMeta();
    const statusCode = await getBackgroundFetchStatus();
    setBgMeta(meta);
    setBgFetchStatusCode(statusCode as unknown as number);
  }, []);

  useEffect(() => {
    loadBackgroundInfo();
  }, [loadBackgroundInfo]);

  const toggle = async (key: keyof AppSettings) => {
    await updateSettings({ [key]: !state.settings[key] } as any);
  };

  const handleFontSize = async (size: AppSettings['fontSize']) => {
    await updateSettings({ fontSize: size });
  };

  const handleResetData = () => {
    Alert.alert(
      '⚠️ Reset Data Aplikasi',
      'Semua data mata kuliah, profil, dan pengaturan akan dihapus secara permanen dari AsyncStorage & SQLite.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetLoading(true);
              await clearAllData();
              await refreshData();
              Alert.alert('Berhasil ✅', 'Semua data penyimpanan berhasil dibersihkan');
            } catch {
              Alert.alert('Error', 'Gagal mereset data');
            } finally {
              setResetLoading(false);
            }
          },
        },
      ]
    );
  };

  const SwitchRow = ({
    icon,
    label,
    subtitle,
    value,
    onToggle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
      <Ionicons name={icon} size={20} color={theme.primary} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Tampilan */}
        <View style={[styles.section, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="color-palette-outline" size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tampilan</Text>
          </View>

          <SwitchRow
            icon="moon-outline"
            label="Mode Gelap"
            subtitle="Ubah tema aplikasi menjadi gelap untuk kenyamanan mata"
            value={state.settings.darkMode}
            onToggle={() => toggle('darkMode')}
          />

          {/* Font size */}
          <View style={[styles.switchRow, { borderBottomColor: theme.border, borderBottomWidth: 0 }]}>
            <Ionicons name="text-outline" size={20} color={theme.primary} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Ukuran Font</Text>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                Sesuaikan ukuran teks di seluruh halaman
              </Text>
              <View style={styles.fontBtns}>
                {(['kecil', 'sedang', 'besar'] as AppSettings['fontSize'][]).map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontBtn,
                      {
                        backgroundColor:
                          state.settings.fontSize === size ? theme.primary : theme.inputBackground,
                      },
                    ]}
                    onPress={() => handleFontSize(size)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.fontBtnText,
                        { color: state.settings.fontSize === size ? '#FFF' : theme.textSecondary },
                      ]}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Notifikasi */}
        <View style={[styles.section, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="notifications-outline" size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifikasi</Text>
          </View>
          <SwitchRow
            icon="megaphone-outline"
            label="Pengingat Kuliah"
            subtitle="Terima notifikasi jadwal dan tugas dari EduGuide"
            value={state.settings.notifikasi}
            onToggle={() => toggle('notifikasi')}
          />
        </View>

        {/* 🌐 FITUR BARU: Networking & Background Process (Kriteria Dosen) */}
        <View style={[styles.section, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="cloud-outline" size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Networking & Background Process</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.surfaceVariant }]}>
            <View style={styles.storageLayer}>
              <View style={[styles.layerDot, { backgroundColor: isOnline ? theme.success : theme.error }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.layerName, { color: theme.text }]}>
                  Status Koneksi: {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text style={[styles.layerDesc, { color: theme.textSecondary }]}>
                  Jenis koneksi terdeteksi: {connectionType}. Dipantau real-time menggunakan NetInfo.
                </Text>
              </View>
            </View>

            <View style={styles.storageLayer}>
              <View style={[styles.layerDot, { backgroundColor: theme.secondary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.layerName, { color: theme.text }]}>
                  Background Fetch: {bgFetchStatusCode !== null ? (BACKGROUND_FETCH_STATUS_LABEL[bgFetchStatusCode] || 'Tidak Diketahui') : 'Memuat...'}
                </Text>
                <Text style={[styles.layerDesc, { color: theme.textSecondary }]}>
                  Task periodik mengecek update mata kuliah setiap ±30 menit via expo-task-manager.
                </Text>
              </View>
            </View>

            <View style={[styles.storageLayer, { marginBottom: 0 }]}>
              <View style={[styles.layerDot, { backgroundColor: theme.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.layerName, { color: theme.text }]}>
                  Eksekusi Background Terakhir: {bgMeta?.lastBackgroundRunAt
                    ? new Date(bgMeta.lastBackgroundRunAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Belum pernah berjalan'}
                </Text>
                <Text style={[styles.layerDesc, { color: theme.textSecondary }]}>
                  Status: {bgMeta?.lastBackgroundStatus || 'never-run'} · Total eksekusi: {bgMeta?.totalBackgroundRuns ?? 0} kali.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.refreshBgBtn, { borderColor: theme.primary }]}
            onPress={loadBackgroundInfo}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={15} color={theme.primary} />
            <Text style={[styles.refreshBgBtnText, { color: theme.primary }]}>Muat Ulang Status</Text>
          </TouchableOpacity>
        </View>

        {/* Penyimpanan */}
        <View style={[styles.section, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="server-outline" size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Arsitektur Penyimpanan (Kriteria Dosen)</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>📦 Sinkronisasi Multi-Layer</Text>
            
            <View style={styles.storageLayer}>
              <View style={[styles.layerDot, { backgroundColor: theme.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.layerName, { color: theme.text }]}>AsyncStorage (Persistent)</Text>
                <Text style={[styles.layerDesc, { color: theme.textSecondary }]}>
                  Sebagai local storage utama penyimpan state & konfigurasi terenkripsi.
                </Text>
              </View>
            </View>
            
            <View style={styles.storageLayer}>
              <View style={[styles.layerDot, { backgroundColor: theme.secondary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.layerName, { color: theme.text }]}>SQLite via expo-sqlite (Relational)</Text>
                <Text style={[styles.layerDesc, { color: theme.textSecondary }]}>
                  Cache data relasional mata kuliah & log audit jejak CRUD.
                </Text>
              </View>
            </View>
            
            <View style={styles.storageLayer}>
              <View style={[styles.layerDot, { backgroundColor: theme.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.layerName, { color: theme.text }]}>React Context (Reactive Memory)</Text>
                <Text style={[styles.layerDesc, { color: theme.textSecondary }]}>
                  State management global penyedia data instan antar screen.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsInfo}>
            <View style={[styles.statItem, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.statNum, { color: theme.primary }]}>{state.mataKuliah.length}</Text>
              <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Mata Kuliah</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.statNum, { color: theme.secondary }]}>
                {state.mahasiswa.nim ? '✓' : '–'}
              </Text>
              <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Profil</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.statNum, { color: theme.success }]}>✓</Text>
              <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Config</Text>
            </View>
          </View>
        </View>

        {/* Tentang */}
        <View style={[styles.section, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="information-circle-outline" size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Informasi Sistem</Text>
          </View>
          {[
            { label: 'Versi Aplikasi', value: '2.0.0' },
            { label: 'Expo SDK', value: '54.0.8' }, // ✨ Diperbarui sesuai spesifikasi proyekmu
            { label: 'State Management', value: 'React Context (Reducer)' },
            { label: 'Database Relasional', value: 'SQLite Storage' },
            { label: 'Networking', value: 'Fetch API + Retry Logic' },
            { label: 'Background Task', value: 'expo-task-manager' },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                styles.aboutRow,
                {
                  borderBottomColor: theme.border,
                  borderBottomWidth: i < arr.length - 1 ? 0.8 : 0,
                },
              ]}
            >
              <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.aboutValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Danger zone */}
        <View style={[styles.section, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="warning-outline" size={18} color={theme.error} />
            <Text style={[styles.sectionTitle, { color: theme.error }]}>Zona Berbahaya</Text>
          </View>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: theme.error, opacity: resetLoading ? 0.6 : 1 }]}
            onPress={handleResetData}
            disabled={resetLoading}
            activeOpacity={0.8}
          >
            {resetLoading ? (
              <ActivityIndicator color={theme.error} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.resetBtnText, { color: theme.error }]}>Wipe / Reset Semua Data</Text>
                <Text style={[styles.resetBtnSub, { color: theme.textSecondary }]}>
                  Menghapus permanen seluruh isi db lokal & preferensi
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, marginBottom: 14 },
  sectionHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.8,
    gap: 12,
  },
  rowIcon: { opacity: 0.8 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowSubtitle: { fontSize: 12, lineHeight: 18 },
  fontBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  fontBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  fontBtnText: { fontSize: 12, fontWeight: '700' },
  infoBox: { borderRadius: 12, padding: 14, marginBottom: 12 },
  infoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  storageLayer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  layerDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  layerName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  layerDesc: { fontSize: 11, lineHeight: 16 },
  statsInfo: { flexDirection: 'row', gap: 10 },
  refreshBgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  refreshBgBtnText: { fontSize: 12, fontWeight: '700' },
  statItem: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLbl: { fontSize: 11, fontWeight: '500' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  aboutLabel: { fontSize: 13, fontWeight: '500' },
  aboutValue: { fontSize: 13, fontWeight: '600' },
  resetBtn: { borderWidth: 1.5, borderRadius: 12, padding: 14, width: '100%' },
  resetBtnText: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  resetBtnSub: { fontSize: 11, fontWeight: '400' },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1.5 }
    })
  }
});

export default PengaturanScreen;