// src/screens/ProfilScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; // ✨ Mengganti emoji dengan Vector Icons kustom
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ProfilScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { state, totalSKS } = useApp();
  const theme = getTheme(state.settings.darkMode);
  const { mahasiswa, mataKuliah } = state;

  const isProfileComplete = mahasiswa.nim && mahasiswa.nama;

  const semesterSKS = Array.from({ length: 8 }, (_, i) => {
    const sem = String(i + 1);
    const mks = mataKuliah.filter(mk => mk.semester === sem);
    return { semester: sem, count: mks.length, sks: mks.reduce((s, m) => s + m.sks, 0) };
  }).filter(s => s.count > 0);

  const menuItems = [
    { icon: 'create-outline', label: 'Edit Profil Akademik', onPress: () => navigation.navigate('EditProfil') },
    { icon: 'settings-outline', label: 'Pengaturan Aplikasi', onPress: () => navigation.navigate('Pengaturan') },
    { icon: 'mail-outline', label: 'Hubungi Sekretariat/Dosen', onPress: () => Linking.openURL('mailto:akademik@kampus.ac.id?subject=Tanya%20EduGuide') }, // ✨ Fungsional Intent Mail
    { icon: 'globe-outline', label: 'Portal SIAKAD Kampus', onPress: () => Linking.openURL('https://google.com') }, // ✨ Fungsional Intent Browser
    {
      icon: 'information-circle-outline', 
      label: 'Tentang Aplikasi', 
      onPress: () => Alert.alert(
        'EduGuide v1.0.0 🎓',
        'Sistem Manajemen Rekam Akademik Mandiri Mahasiswa.\n\nDibuat untuk memenuhi kriteria kelulusan praktikum penyimpanan data mobile relasional & intents.\n\nTech Stack: React Native + Expo SDK 54',
        [{ text: 'Paham' }]
      )
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => navigation.navigate('EditProfil')}
          activeOpacity={0.7}
        >
          <Text style={styles.editHeaderText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Avatar & Name Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }, styles.shadowProps]}>
            <Text style={styles.avatarText}>
              {mahasiswa.nama ? mahasiswa.nama[0].toUpperCase() : '?'}
            </Text>
          </View>

          {isProfileComplete ? (
            <>
              <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{mahasiswa.nama}</Text>
              <Text style={[styles.profileNIM, { color: theme.textSecondary }]}>NIM: {mahasiswa.nim}</Text>
              <View style={styles.profileMeta}>
                <View style={[styles.metaTag, { backgroundColor: theme.surfaceVariant }]}>
                  <Text style={[styles.metaTagText, { color: theme.primary }]}>
                    🎓 {mahasiswa.jurusan || 'Teknik Informatika'}
                  </Text>
                </View>
                <View style={[styles.metaTag, { backgroundColor: theme.surfaceVariant }]}>
                  <Text style={[styles.metaTagText, { color: theme.primary }]}>
                    📅 Sem {mahasiswa.semester}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyProfile}>
              <Text style={[styles.emptyProfileText, { color: theme.textSecondary }]}>
                Biodata Mahasiswa Belum Lengkap
              </Text>
              <TouchableOpacity
                style={[styles.fillProfileBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('EditProfil')}
                activeOpacity={0.8}
              >
                <Text style={styles.fillProfileBtnText}>Lengkapi Profil</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Academic Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="bar-chart-outline" size={18} color={theme.text} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Statistik Akademik</Text>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Total MK', value: mataKuliah.length, icon: 'book', color: theme.primary },
              { label: 'Total SKS', value: totalSKS, icon: 'flash', color: theme.secondary },
              { label: 'IPK Target', value: mahasiswa.ipk || '0.00', icon: 'ribbon', color: theme.success },
            ].map((stat, i) => (
              <View
                key={i}
                style={[styles.statBox, { backgroundColor: theme.surfaceVariant }]}
              >
                <Ionicons name={stat.icon as any} size={20} color={stat.color} style={{ marginBottom: 4 }} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Semester breakdown */}
        {semesterSKS.length > 0 && (
          <View style={[styles.semCard, { backgroundColor: theme.card }, styles.shadowProps]}>
            <View style={styles.cardHeaderTitle}>
              <Ionicons name="calendar-outline" size={18} color={theme.text} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Distribusi Beban Semester</Text>
            </View>
            {semesterSKS.map(s => (
              <View key={s.semester} style={[styles.semRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.semBadge, { backgroundColor: theme.surfaceVariant }]}>
                  <Text style={[styles.semBadgeText, { color: theme.primary }]}>Sem {s.semester}</Text>
                </View>
                <Text style={[styles.semInfo, { color: theme.textSecondary }]}>
                  {s.count} Kelas Diambil
                </Text>
                <View style={[styles.sksBar, { backgroundColor: theme.chip }]}>
                  <Text style={[styles.sksBarText, { color: theme.chipText }]}>{s.sks} SKS</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Menu items */}
        <View style={[styles.menuCard, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="options-outline" size={18} color={theme.text} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Menu Utama</Text>
          </View>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, {
                borderBottomColor: theme.border,
                borderBottomWidth: i < menuItems.length - 1 ? 0.8 : 0,
              }]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <Ionicons name={item.icon as any} size={18} color={theme.textSecondary} />
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          EduGuide v1.0.0 • Universitas Mobile Project
        </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  editHeaderBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editHeaderText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  body: { padding: 16, paddingBottom: 40 },
  profileCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  profileNIM: { fontSize: 13, marginBottom: 10, fontWeight: '500' },
  profileMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  metaTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  metaTagText: { fontSize: 11, fontWeight: '700' },
  emptyProfile: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  emptyProfileText: { fontSize: 14, fontWeight: '500' },
  fillProfileBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  fillProfileBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  statsCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  cardHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 1 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  semCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  semRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.8, gap: 10 },
  semBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  semBadgeText: { fontSize: 11, fontWeight: '700' },
  semInfo: { flex: 1, fontSize: 13, fontWeight: '500' },
  sksBar: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sksBarText: { fontSize: 11, fontWeight: '700' },
  menuCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  footerText: { textAlign: 'center', fontSize: 11, fontWeight: '500', marginTop: 12, marginBottom: 20 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1.5 }
    })
  }
});

export default ProfilScreen;