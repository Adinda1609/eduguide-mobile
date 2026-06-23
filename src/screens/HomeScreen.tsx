// src/screens/HomeScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; 
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { RootStackParamList } from '../types';
import { notifySksDeadline } from '../services/notifications';

const { width } = Dimensions.get('window');
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { state, totalSKS, totalSKSSemesterIni } = useApp();
  const theme = getTheme(state.settings.darkMode);
  const { mahasiswa, mataKuliah } = state;

  const currentSemester = mahasiswa.semester || '1';

  const currentIpkNum = parseFloat(mahasiswa.ipk) || 0;
  const targetIpkNum = parseFloat(mahasiswa.targetIpk) || 3.50;
  const targetSksNum = parseInt(mahasiswa.targetSks as any, 10) || 144;

  const sisaSks = targetSksNum - totalSKS > 0 ? targetSksNum - totalSKS : 0;
  const progressPercent = Math.min(Math.round((totalSKS / targetSksNum) * 100), 100) || 0;

  // Status Beban SKS Maksimal Berdasarkan IPK (Fitur Akademik Otomatis)
  const maxSksBeban = currentIpkNum >= 3.00 ? 24 : currentIpkNum >= 2.50 ? 21 : 18;

  // 🔔 FITUR BARU: Local Push Notification ketika beban SKS mendekati/melebihi batas maksimal
  const lastSksAlertRef = useRef<number | null>(null);
  useEffect(() => {
    const isNearLimit = totalSKSSemesterIni >= maxSksBeban - 2; // Peringatan dini 2 SKS sebelum batas
    const alreadyAlertedForThisValue = lastSksAlertRef.current === totalSKSSemesterIni;

    if (isNearLimit && totalSKSSemesterIni > 0 && state.settings.notifikasi && !alreadyAlertedForThisValue) {
      notifySksDeadline(totalSKSSemesterIni, maxSksBeban);
      lastSksAlertRef.current = totalSKSSemesterIni;
    }
  }, [totalSKSSemesterIni, maxSksBeban, state.settings.notifikasi]);

  const stats = [
    { label: 'Total Kelas MK', value: `${mataKuliah.length} Kelas`, icon: 'grid-outline', color: theme.primary },
    { label: 'Akumulasi SKS', value: `${totalSKS} / ${targetSksNum}`, icon: 'speedometer-outline', color: theme.secondary },
    { label: 'Semester Berjalan', value: `Level Sem ${currentSemester}`, icon: 'ribbon-outline', color: theme.accent },
    { label: 'Beban SKS Aktif', value: `${totalSKSSemesterIni} SKS`, icon: 'hourglass-outline', color: theme.success },
  ];

  const quickActions = [
    {
      label: 'Tambah MK',
      icon: 'add-circle-outline',
      color: '#FFF',
      bg: theme.primary,
      onPress: () => navigation.navigate('TambahMataKuliah', {}),
    },
    {
      label: 'Lihat Jadwal',
      icon: 'time-outline',
      color: theme.secondary,
      bg: state.settings.darkMode ? '#1E293B' : '#E0F7FA',
      onPress: () => navigation.navigate('Main', { screen: 'Jadwal' } as any),
    },
    {
      label: 'Riwayat Log',
      icon: 'terminal-outline',
      color: theme.accent,
      bg: state.settings.darkMode ? '#334155' : '#FEF3C7',
      onPress: () => navigation.navigate('RiwayatLog'),
    },
    {
      label: 'Pengaturan',
      icon: 'options-outline',
      color: theme.success,
      bg: state.settings.darkMode ? '#1E3A8A' : '#D1FAE5',
      onPress: () => navigation.navigate('Pengaturan'),
    },
  ];

  const recentMK = [...mataKuliah]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 15) return 'GOOD AFTERNOON';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.primary}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* ─── HEADER MINIMALIS TANPA PETIR & BINTANG (FIX) ─── */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting()}</Text>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {mahasiswa.nama || 'Sri Adinda'}
                </Text>
              </View>
              <Text style={styles.nim}>NPM  //  {mahasiswa.nim || '233510515'}</Text>
            </View>

            {/* Kotak Avatar Squircle Clean */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditProfil')}
              style={[styles.avatarContainer, { borderColor: theme.secondary || '#00E5FF' }]}
            >
              <Text style={styles.avatarText}>
                {mahasiswa.nama ? mahasiswa.nama[0].toUpperCase() : 'S'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Kapsul Metadata Polos Tanpa Simbol/Ikon Tambahan */}
          <View style={styles.headerMetaCard}>
            <View style={styles.metaLeft}>
              <Text style={styles.metaText} numberOfLines={1}>
                {mahasiswa.jurusan || 'Teknik Informatika'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaRight}>
              <Text style={styles.metaText}>
                IPK: {currentIpkNum.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── SISA BODY UTAMA ─── */}
        <View style={styles.body}>
          {/* KARTU FUTURISTIK: MONITOR PROGRES KELULUSAN */}
          <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.border }, styles.shadowProps]}>
            <View style={styles.progressInfoRow}>
              <View>
                <Text style={[styles.progressTitle, { color: theme.text }]}>CORE PROGRESS INDEX</Text>
                <Text style={[styles.progressSubtitle, { color: theme.textSecondary }]}>Target Kelulusan Sarjana</Text>
              </View>
              <View style={[styles.neonBadge, { backgroundColor: theme.surfaceVariant }]}>
                <Text style={[styles.neonBadgeText, { color: theme.primary }]}>{progressPercent}% READY</Text>
              </View>
            </View>
            
            <View style={[styles.barBackground, { backgroundColor: state.settings.darkMode ? '#334155' : '#EBEFF5' }]}>
              <View style={[styles.barFill, { backgroundColor: theme.primary, width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.progressFooter}>
              <View>
                <Text style={styles.footerLabel}>ACCUMULATED</Text>
                <Text style={[styles.footerValue, { color: theme.text }]}>{totalSKS} SKS</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footerLabel}>REMAINING</Text>
                <Text style={[styles.footerValue, { color: theme.text }]}>{sisaSks} / {targetSksNum} SKS</Text>
              </View>
            </View>
          </View>

          {/* KARTU INTEGRASI ANALISIS STATUS SKS AKADEMIK */}
          <View style={[styles.analysisAlert, { backgroundColor: state.settings.darkMode ? '#1E1B4B' : '#EEF2FF', borderColor: theme.primary }]}>
            <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
            <Text style={[styles.analysisText, { color: state.settings.darkMode ? '#E0E7FF' : '#3730A3' }]}>
              Berdasarkan IPK saat ini ({currentIpkNum.toFixed(2)}), Anda diizinkan mengambil maksimal <Text style={{ fontWeight: '800' }}>{maxSksBeban} SKS</Text> pada semester depan. Target kelulusan diatur pada IPK <Text style={{ fontWeight: '800' }}>{targetIpkNum.toFixed(2)}</Text>.
            </Text>
          </View>

          {/* Ringkasan Akademik Grid */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>METRIK AKADEMIK</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View
                key={i}
                style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }, styles.shadowProps]}
              >
                <View style={styles.statHeaderRow}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label.toUpperCase()}</Text>
                  <Ionicons name={stat.icon as any} size={15} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Aksi Cepat Grid */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AKSI NAVIGASI</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.actionCard, { backgroundColor: action.bg }, styles.shadowProps]}
                onPress={action.onPress}
                activeOpacity={0.75}
              >
                <Ionicons name={action.icon as any} size={22} color={action.color} style={{ marginBottom: 6 }} />
                <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent MK Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              AKTIVITAS KELAS TERBARU
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MataKuliahTab' } as any)} activeOpacity={0.7}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>LIHAT SEMUA →</Text>
            </TouchableOpacity>
          </View>

          {recentMK.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Ionicons name="folder-open-outline" size={38} color={theme.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Belum ada data mata kuliah terdaftar.
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('TambahMataKuliah', {})}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>+ INTEGRASIKAN KELAS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentMK.map(mk => (
              <TouchableOpacity
                key={mk.id}
                style={[styles.mkCard, { backgroundColor: theme.card, borderColor: theme.border }, styles.shadowProps]}
                onPress={() => navigation.navigate('DetailMataKuliah', { id: mk.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.mkCardAccent, { backgroundColor: theme.primary }]} />
                
                <View style={styles.mkCardMainContent}>
                  <View style={[styles.mkBadge, { backgroundColor: theme.surfaceVariant }]}>
                    <Text style={[styles.mkBadgeText, { color: theme.primary }]}>{mk.kode}</Text>
                  </View>
                  <View style={styles.mkInfo}>
                    <Text style={[styles.mkName, { color: theme.text }]} numberOfLines={1}>
                      {mk.nama}
                    </Text>
                    <Text style={[styles.mkMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                      {mk.dosen}
                    </Text>
                  </View>
                  <View style={[styles.sksBadge, { backgroundColor: theme.chip }]}>
                    <Text style={[styles.sksText, { color: theme.chipText }]}>{mk.sks} SKS</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingBottom: 32 },

  // ─── STYLES KHUSUS COMPONENT HEADER SESUAI DESAIN CLEAN ───
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: { 
    color: 'rgba(255, 255, 255, 0.6)', 
    fontSize: 14, 
    fontWeight: '600', 
    letterSpacing: 1.2 
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userName: { 
    color: '#FFF', 
    fontSize: 34, 
    fontWeight: '700', 
    letterSpacing: -0.5,
  },
  nim: { 
    color: 'rgba(255, 255, 255, 0.5)', 
    fontSize: 15, 
    fontWeight: '500', 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  avatarText: { 
    fontSize: 24, 
    color: '#FFF', 
    fontWeight: '600' 
  },
  headerMetaCard: { 
    flexDirection: 'row', 
    height: 52,
    paddingHorizontal: 18, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.3,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 0.9,
  },
  metaText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '500',
  },
  metaDivider: { 
    width: 1, 
    height: 18, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // ─── BODY STYLES ───
  body: { padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, marginTop: 16, letterSpacing: 1.2, opacity: 0.8 },
  progressCard: { borderRadius: 16, padding: 16, marginBottom: 4, borderWidth: 1 },
  progressInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  progressSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  neonBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  neonBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  barBackground: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  footerLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  footerValue: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  analysisAlert: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 12, marginBottom: 4, alignItems: 'center' },
  analysisText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  actionCard: {
    width: (width - 42) / 2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  seeAll: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  emptyCard: { borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1 },
  emptyText: { fontSize: 12, textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  addBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  mkCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mkCardAccent: {
    width: 4,
    height: '100%',
  },
  mkCardMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  mkBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 54, alignItems: 'center' },
  mkBadgeText: { fontSize: 10, fontWeight: '800' },
  mkInfo: { flex: 1 },
  mkName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  mkMeta: { fontSize: 12, fontWeight: '500' },
  sksBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sksText: { fontSize: 10, fontWeight: '800' },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 }
    })
  }
});

export default HomeScreen;