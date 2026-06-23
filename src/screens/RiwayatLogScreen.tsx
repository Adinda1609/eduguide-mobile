// src/screens/RiwayatLogScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const RiwayatLogScreen: React.FC = () => {
  const { state, refreshAuditLogs } = useApp();
  const theme = getTheme(state.settings.darkMode);

  // Auto-refresh daftar log dari database sekunder virtual setiap kali halaman dibuka
  useEffect(() => {
    refreshAuditLogs().catch(() => {});
  }, [refreshAuditLogs]);

  // Mengatur warna dan ikon badge berdasarkan jenis transaksi data
  const getLogConfig = (action: string) => {
    switch (action) {
      case 'ADD':
        return { icon: 'add-circle', color: theme.success, bg: '#E8F5E9' };
      case 'UPDATE':
        return { icon: 'create', color: theme.secondary, bg: '#E0F7FA' };
      case 'DELETE':
        return { icon: 'trash', color: theme.error, bg: '#FFEBEE' };
      case 'SYNC':
        return { icon: 'sync', color: theme.primary, bg: '#EEF2FF' };
      default:
        return { icon: 'information-circle', color: theme.textSecondary, bg: '#F3F4F6' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={state.auditLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.infoBanner, { backgroundColor: theme.surfaceVariant }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
              Log ini mencatat seluruh aktivitas transaksi CRUD lokal secara real-time pada arsitektur penyimpanan virtual SQLite.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="hourglass-outline" size={54} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Log Masih Kosong</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Lakukan operasi tambah, edit, atau hapus mata kuliah untuk memicu pencatatan audit.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = getLogConfig(item.action);
          const dateFormatted = new Date(item.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <View style={[styles.logCard, { backgroundColor: theme.card }, styles.shadowProps]}>
              {/* Badge Ikon Kiri */}
              <View style={[styles.iconBadge, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon as any} size={20} color={config.color} />
              </View>

              {/* Konten Log */}
              <View style={styles.logContent}>
                <View style={styles.logHeaderRow}>
                  <Text style={[styles.actionTag, { color: config.color, fontWeight: '800' }]}>
                    {item.action}
                  </Text>
                  <Text style={[styles.logTime, { color: theme.textMuted }]}>
                    ⏰ {dateFormatted}
                  </Text>
                </View>
                
                <Text style={[styles.logDetail, { color: theme.text }]}>
                  {item.detail}
                </Text>
                
                <Text style={[styles.logMeta, { color: theme.textSecondary }]}>
                  Scope: {item.entity} {item.entityId ? `(ID: ${item.entityId})` : ''}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  infoBannerText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
  logCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logContent: { flex: 1 },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionTag: { fontSize: 11, letterSpacing: 0.5 },
  logTime: { fontSize: 11, fontWeight: '500' },
  logDetail: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 4 },
  logMeta: { fontSize: 11, fontWeight: '400' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
});

export default RiwayatLogScreen;