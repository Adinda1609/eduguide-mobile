// src/screens/JadwalScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const JADWAL_SAMPLE: Record<string, { waktu: string; nama: string; ruang: string; warna: string }[]> = {
  Senin: [
    { waktu: '07.00 - 08.40', nama: 'Matematika Diskrit', ruang: 'R.201', warna: '#4F46E5' },
    { waktu: '09.00 - 10.40', nama: 'Algoritma & Pemrograman', ruang: 'Lab. IF-1', warna: '#06B6D4' },
  ],
  Selasa: [
    { waktu: '08.00 - 09.40', nama: 'Basis Data', ruang: 'R.305', warna: '#F59E0B' },
    { waktu: '13.00 - 14.40', nama: 'Jaringan Komputer', ruang: 'R.102', warna: '#10B981' },
  ],
  Rabu: [
    { waktu: '07.00 - 08.40', nama: 'Pemrograman Mobile', ruang: 'Lab. IF-2', warna: '#EF4444' },
    { waktu: '10.00 - 11.40', nama: 'Rekayasa Perangkat Lunak', ruang: 'R.401', warna: '#8B5CF6' },
    { waktu: '13.00 - 14.40', nama: 'Kecerdasan Buatan', ruang: 'R.203', warna: '#F97316' },
  ],
  Kamis: [
    { waktu: '09.00 - 10.40', nama: 'Struktur Data', ruang: 'R.301', warna: '#0EA5E9' },
  ],
  Jumat: [
    { waktu: '07.00 - 08.40', nama: 'Bahasa Inggris Teknik', ruang: 'R.101', warna: '#84CC16' },
    { waktu: '13.00 - 15.30', nama: 'Praktikum Pemrograman', ruang: 'Lab. Komputer', warna: '#EC4899' },
  ],
  Sabtu: [],
};

const JadwalScreen: React.FC = () => {
  const { state } = useApp();
  const theme = getTheme(state.settings.darkMode);
  const [selectedDay, setSelectedDay] = useState('Senin');

  const today = HARI[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 'Senin';
  const jadwalHariIni = JADWAL_SAMPLE[selectedDay] || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Jadwal Kuliah</Text>
        <Text style={styles.headerSub}>Hari ini: {today}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
        >
          {HARI.map(hari => {
            const isToday = hari === today;
            const isSelected = hari === selectedDay;
            const count = JADWAL_SAMPLE[hari]?.length || 0;
            return (
              <TouchableOpacity
                key={hari}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderWidth: isToday ? 1.5 : 0,
                    borderColor: theme.primary,
                  },
                  styles.shadowProps
                ]}
                onPress={() => setSelectedDay(hari)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isSelected ? '#FFF' : theme.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {hari.substring(0, 3)}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : theme.surfaceVariant },
                  ]}
                >
                  <Text style={[styles.countText, { color: isSelected ? '#FFF' : theme.primary }]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.body}>
          {/* Date info */}
          <View style={[styles.dateCard, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.dateDay, { color: theme.primary }]}>{selectedDay}</Text>
            <Text style={[styles.dateInfo, { color: theme.textSecondary }]}>
              {jadwalHariIni.length} Sesi Kuliah
              {selectedDay === today ? ' • Hari Ini' : ''}
            </Text>
          </View>

          {/* Jadwal list */}
          {jadwalHariIni.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="partly-sunny-outline" size={54} color={theme.textMuted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Tidak ada kuliah!</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Waktu bebas untuk belajar mandiri atau istirahat
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {jadwalHariIni.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  {/* Time */}
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                      {item.waktu.split(' - ')[0]}
                    </Text>
                    <View style={[styles.timeLine, { backgroundColor: item.warna }]} />
                    <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                      {item.waktu.split(' - ')[1]}
                    </Text>
                  </View>

                  {/* Card */}
                  <TouchableOpacity
                    style={[
                      styles.jadwalCard,
                      { backgroundColor: theme.card, borderLeftColor: item.warna },
                      styles.shadowProps
                    ]}
                    activeOpacity={0.75}
                    onPress={() =>
                      Alert.alert(
                        item.nama,
                        `📅 ${selectedDay}\n⏰ ${item.waktu}\n🏫 Ruang: ${item.ruang}`,
                        [{ text: 'Selesai' }]
                      )
                    }
                  >
                    <View style={styles.jadwalInfo}>
                      <Text style={[styles.jadwalNama, { color: theme.text }]} numberOfLines={1}>
                        {item.nama}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
                        <Text style={[styles.jadwalMeta, { color: theme.textSecondary }]}>
                          Ruang {item.ruang}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Alert Info */}
          <View style={[styles.tipBox, { backgroundColor: theme.surfaceVariant }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={16} color={theme.text} />
              <Text style={[styles.tipTitle, { color: theme.text }]}>Sinkronisasi Sistem</Text>
            </View>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Jadwal ini merupakan data lokal. Perubahan sewaktu-waktu dapat terjadi sesuai pengumuman fakultas.
            </Text>
          </View>
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  dayRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
  },
  dayText: { fontSize: 12, fontWeight: '600' },
  countBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 10, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingBottom: 100 },
  dateCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateDay: { fontSize: 15, fontWeight: '700' },
  dateInfo: { fontSize: 12, fontWeight: '500' },
  emptyDay: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  timeline: { gap: 10 },
  timelineItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  timeCol: { width: 64, alignItems: 'center', paddingTop: 2 },
  timeText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  timeLine: { width: 1.5, height: 26, borderRadius: 1, marginVertical: 3 },
  jadwalCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jadwalInfo: { flex: 1 },
  jadwalNama: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  jadwalMeta: { fontSize: 12, fontWeight: '500' },
  tipBox: { borderRadius: 12, padding: 14, marginTop: 20 },
  tipTitle: { fontSize: 13, fontWeight: '700' },
  tipText: { fontSize: 12, lineHeight: 18 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1.5 }
    })
  }
});

export default JadwalScreen;