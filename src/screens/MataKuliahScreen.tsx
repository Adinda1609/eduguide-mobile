// src/screens/MataKuliahScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getTheme, SEMESTER_OPTIONS } from '../utils/theme';
import { RootStackParamList, MataKuliah } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const MataKuliahScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { state, filteredMataKuliah, deleteMataKuliah, setSearch, setFilterSemester, isOnline, syncFromServer, clearSyncError } = useApp();
  const theme = getTheme(state.settings.darkMode);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // 🌐 FITUR BARU: Pull-to-Refresh memicu sync from server yang sama dengan tombol manual
  const handlePullToRefresh = useCallback(async () => {
    await syncFromServer();
  }, [syncFromServer]);

  // 🌐 FITUR BARU: Tombol "Sync from Server" dengan feedback hasil & error handling
  const handleSyncPress = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Tidak Ada Koneksi', 'Anda sedang offline. Sambungkan ke internet untuk menyinkronkan data dari server.');
      return;
    }
    await syncFromServer();
  }, [isOnline, syncFromServer]);

  // Tampilkan alert ketika sync gagal, lalu bersihkan error agar tidak berulang
  React.useEffect(() => {
    if (state.syncError) {
      Alert.alert('Gagal Sinkronisasi', state.syncError, [{ text: 'OK', onPress: clearSyncError }]);
    }
  }, [state.syncError, clearSyncError]);

  const handleDelete = useCallback((mk: MataKuliah) => {
    Alert.alert(
      'Hapus Mata Kuliah',
      `Apakah Anda yakin ingin menghapus "${mk.nama}"? Data tidak dapat dikembalikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(mk.id);
              await deleteMataKuliah(mk.id);
            } catch {
              Alert.alert('Error', 'Gagal menghapus mata kuliah');
            } finally {
              setDeleteLoading(null);
            }
          },
        },
      ]
    );
  }, [deleteMataKuliah]);

  const renderItem = useCallback(({ item }: { item: MataKuliah }) => (
    <View style={[styles.premiumCard, { backgroundColor: theme.card, borderColor: theme.border }, styles.shadowProps]}>
      {/* Garis Aksen Dekoratif Kiri Khas Desain Futuristik */}
      <View style={[styles.leftAccentLine, { backgroundColor: theme.primary }]} />
      
      <View style={styles.cardMainBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.kodeBadge, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.kodeText, { color: theme.primary }]}>{item.kode}</Text>
          </View>
          <View style={[styles.sksBadge, { backgroundColor: theme.chip }]}>
            <Text style={[styles.sksText, { color: theme.chipText }]}>{item.sks} SKS</Text>
          </View>
        </View>

        <Text style={[styles.namaText, { color: theme.text }]} numberOfLines={1}>
          {item.nama}
        </Text>
        
        <View style={styles.infoMetaRow}>
          <Ionicons name="person-outline" size={13} color={theme.textSecondary} />
          <Text style={[styles.dosenText, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.dosen}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <View style={[styles.semesterTag, { backgroundColor: theme.inputBackground }]}>
            <Text style={[styles.semesterTagText, { color: theme.textSecondary }]}>
              Semester {item.semester}
            </Text>
          </View>
          {item.catatan ? (
            <View style={styles.catatanWrapper}>
              <Ionicons name="document-text-outline" size={12} color={theme.textMuted} />
              <Text style={[styles.catatanHint, { color: theme.textMuted }]} numberOfLines={1}>
                {item.catatan}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Grid Tombol Aksi Transparan & Terbuka Menambah Kesan Mewah */}
        <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.actionBtnItem}
            onPress={() => navigation.navigate('TambahMataKuliah', { editId: item.id })}
            activeOpacity={0.6}
          >
            <Ionicons name="create-outline" size={15} color={theme.secondary} />
            <Text style={[styles.actionBtnLabel, { color: theme.secondary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnItem}
            onPress={() => handleDelete(item)}
            disabled={deleteLoading === item.id}
            activeOpacity={0.6}
          >
            {deleteLoading === item.id ? (
              <ActivityIndicator size="small" color={theme.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={15} color={theme.error} />
                <Text style={[styles.actionBtnLabel, { color: theme.error }]}>Hapus</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnItem}
            onPress={() => navigation.navigate('DetailMataKuliah', { id: item.id })}
            activeOpacity={0.6}
          >
            <Ionicons name="eye-outline" size={15} color={theme.text} />
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [theme, navigation, handleDelete, deleteLoading]);

  const ListHeader = (
    <View>
      {/* 🌐 Status Koneksi & Hasil Sync Terakhir */}
      <View style={[styles.networkStatusBar, { backgroundColor: theme.card, borderColor: theme.border }, styles.shadowProps]}>
        <View style={styles.networkStatusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.success : theme.error }]} />
          <Text style={[styles.networkStatusText, { color: theme.textSecondary }]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
            {state.lastSyncResult ? ` · Sync terakhir: ${new Date(state.lastSyncResult.lastSyncAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.syncBtn, { backgroundColor: theme.primary, opacity: state.syncStatus === 'loading' ? 0.7 : 1 }]}
          onPress={handleSyncPress}
          disabled={state.syncStatus === 'loading'}
          activeOpacity={0.8}
        >
          {state.syncStatus === 'loading' ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={14} color="#FFF" />
              <Text style={styles.syncBtnText}>Sync from Server</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar HUD Container */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }, styles.shadowProps]}>
        <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Cari kelas, kode, atau dosen..."
          placeholderTextColor={theme.textMuted}
          value={state.searchQuery}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {state.searchQuery ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Semester Horisontal Minimalis */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {['semua', ...SEMESTER_OPTIONS].map(sem => (
          <TouchableOpacity
            key={sem}
            style={[
              styles.filterChip,
              {
                backgroundColor: state.filterSemester === sem ? theme.primary : theme.card,
                borderColor: state.filterSemester === sem ? theme.primary : theme.border,
              },
              styles.shadowProps
            ]}
            onPress={() => setFilterSemester(sem)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: state.filterSemester === sem ? '#FFF' : theme.textSecondary,
                  fontWeight: state.filterSemester === sem ? '800' : '600',
                },
              ]}
            >
              {sem === 'semua' ? 'SEMUA SEMESTER' : `SEM ${sem}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Info Strip */}
      <View style={[styles.summaryBar, { backgroundColor: theme.surfaceVariant }]}>
        <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
          📊 {filteredMataKuliah.length} KELAS TERFILTER
        </Text>
        <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
          ⚡ {filteredMataKuliah.reduce((s, m) => s + m.sks, 0)} TOTAL SKS
        </Text>
      </View>
    </View>
  );

  const ListEmpty = (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={54} color={theme.textMuted} style={{ marginBottom: 12 }} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {state.searchQuery ? 'TIDAK DITEMUKAN' : 'DATA KELAS KOSONG'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {state.searchQuery
          ? `Tidak ada rekam jejak untuk keyword "${state.searchQuery}"`
          : 'Sistem penyimpanan lokal belum merekam modul kelas akademik.'}
      </Text>
      {!state.searchQuery && (
        <TouchableOpacity
          style={[styles.addEmptyBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('TambahMataKuliah', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.addEmptyBtnText}>+ INTEGRASIKAN KELAS</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Utama Modern HUD */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>DAFTAR KELAS KRS</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('TambahMataKuliah', {})}
          activeOpacity={0.7}
        >
          <Text style={[styles.addButtonText, { color: theme.primary }]}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {state.isLoading && !filteredMataKuliah.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Sinkronisasi Core Engine...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMataKuliah}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          refreshControl={
            <RefreshControl
              refreshing={state.syncStatus === 'loading'}
              onRefresh={handlePullToRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  addButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: { fontWeight: '800', fontSize: 12 },
  listContent: { padding: 16, paddingBottom: 100 },
  networkStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 8,
  },
  networkStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  networkStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, flexShrink: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', paddingVertical: 0 },
  filterRow: { paddingBottom: 14, gap: 8, paddingHorizontal: 2 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterChipText: { fontSize: 11, letterSpacing: 0.5 },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  summaryText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  premiumCard: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  leftAccentLine: { width: 4, height: '100%' },
  cardMainBody: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  kodeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kodeText: { fontWeight: '800', fontSize: 10 },
  sksBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sksText: { fontWeight: '800', fontSize: 10 },
  namaText: { fontSize: 15, fontWeight: '800', marginBottom: 6, lineHeight: 20 },
  infoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dosenText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  semesterTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  semesterTagText: { fontSize: 11, fontWeight: '700' },
  catatanWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  catatanHint: { fontSize: 11, fontWeight: '500' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, marginTop: 14, paddingTop: 10, justifyContent: 'space-between' },
  actionBtnItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10 },
  actionBtnLabel: { fontSize: 12, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  addEmptyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addEmptyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 },
  loadingText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2 },
      android: { elevation: 1 }
    })
  }
});

export default MataKuliahScreen;