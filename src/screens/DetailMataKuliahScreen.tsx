// src/screens/DetailMataKuliahScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; // ✨ Vector Icons Lebih Profesional
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'DetailMataKuliah'>;

const DetailMataKuliahScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { state, deleteMataKuliah, getMataKuliahById } = useApp();
  const theme = getTheme(state.settings.darkMode);

  const mk = getMataKuliahById(route.params.id);

  if (!mk) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
            <Text style={styles.backText}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Mata Kuliah</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.textMuted} style={{ marginBottom: 16 }} />
          <Text style={[styles.notFoundText, { color: theme.text }]}>Mata kuliah tidak ditemukan</Text>
        </View>
      </View>
    );
  }

  // ─── Intent-like: Share ───────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      const message =
        `📚 *${mk.nama}*\n` +
        `🔑 Kode: ${mk.kode}\n` +
        `⚡ SKS: ${mk.sks}\n` +
        `👨‍🏫 Dosen: ${mk.dosen}\n` +
        `📅 Semester: ${mk.semester}\n` +
        (mk.catatan ? `📝 Catatan: ${mk.catatan}\n` : '') +
        `\nDibagikan dari EduGuide 🎓`;

      await Share.share({ message, title: `Mata Kuliah: ${mk.nama}` });
    } catch (error) {
      Alert.alert('Error', 'Gagal membagikan data');
    }
  }, [mk]);

  // ─── Intent-like: WhatsApp ────────────────────────────────────────────────
  const handleWhatsApp = useCallback(async () => {
    const message = encodeURIComponent(
      `Halo, saya ingin bertanya tentang mata kuliah *${mk.nama}* (${mk.kode}) yang Bapak/Ibu ${mk.dosen} ampu.`
    );
    const url = `whatsapp://send?text=${message}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error();
      }
    } catch {
      Alert.alert('WhatsApp Tidak Tersedia', 'Pastikan WhatsApp sudah terinstal di perangkat Anda.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Buka Email', onPress: () => handleEmail() },
      ]);
    }
  }, [mk]);

  // ─── Intent-like: Email ───────────────────────────────────────────────────
  const handleEmail = useCallback(async () => {
    const subject = encodeURIComponent(`Pertanyaan tentang ${mk.nama} (${mk.kode})`);
    const body = encodeURIComponent(
      `Yth. Bapak/Ibu ${mk.dosen},\n\nSaya ingin bertanya mengenai mata kuliah ${mk.nama}.\n\nTerima kasih.`
    );
    const url = `mailto:?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Tidak dapat membuka aplikasi email.');
    }
  }, [mk]);

  // ─── Intent-like: Maps (cari ruang kuliah) ────────────────────────────────
  const handleMaps = useCallback(async () => {
    const query = encodeURIComponent('Universitas kampus gedung kuliah');
    const url = Platform.select({
      ios: `maps://?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`
    });
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Tidak dapat membuka Maps.');
    }
  }, []);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Hapus Mata Kuliah',
      `Apakah Anda yakin ingin menghapus "${mk.nama}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteMataKuliah(mk.id);
            navigation.goBack();
          },
        },
      ]
    );
  }, [mk, deleteMataKuliah, navigation]);

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={theme.primary} style={styles.infoIcon} />
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
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
        <Text style={styles.headerTitle}>Detail Kelas</Text>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.6}>
          <Ionicons name="share-social-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.primary }, styles.shadowProps]}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{mk.kode}</Text>
            </View>
            <View style={styles.sksBadge}>
              <Text style={styles.sksBadgeText}>{mk.sks} SKS</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{mk.nama}</Text>
          <Text style={styles.heroSemester}>Semester {mk.semester}</Text>
        </View>

        {/* Info card */}
        <View style={[styles.card, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="information-circle-outline" size={18} color={theme.text} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Informasi Lengkap</Text>
          </View>
          <InfoRow icon="book-outline" label="Nama MK" value={mk.nama} />
          <InfoRow icon="key-outline" label="Kode MK" value={mk.kode} />
          <InfoRow icon="flash-outline" label="SKS" value={`${mk.sks} SKS`} />
          <InfoRow icon="person-outline" label="Dosen Pengampu" value={mk.dosen} />
          <InfoRow icon="calendar-outline" label="Semester" value={`Semester ${mk.semester}`} />
          <InfoRow icon="time-outline" label="Ditambahkan" value={new Date(mk.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {mk.updatedAt !== mk.createdAt && (
            <InfoRow icon="create-outline" label="Diperbarui" value={new Date(mk.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
        </View>

        {/* Notes card */}
        {mk.catatan ? (
          <View style={[styles.card, { backgroundColor: theme.card }, styles.shadowProps]}>
            <View style={styles.cardHeaderTitle}>
              <Ionicons name="document-text-outline" size={18} color={theme.text} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Catatan Tambahan</Text>
            </View>
            <Text style={[styles.catatanText, { color: theme.textSecondary }]}>{mk.catatan}</Text>
          </View>
        ) : null}

        {/* Intent-like actions */}
        <View style={[styles.card, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="flash-outline" size={18} color={theme.text} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Aksi Cepat & Hubungi</Text>
          </View>
          <View style={styles.intentGrid}>
            {[
              { icon: 'share-social', label: 'Bagikan', color: theme.primary, bg: theme.surfaceVariant, onPress: handleShare },
              { icon: 'logo-whatsapp', label: 'WhatsApp', color: '#128C7E', bg: '#E8F5E9', onPress: handleWhatsApp },
              { icon: 'mail', label: 'Email', color: '#D44638', bg: '#FFEBEE', onPress: handleEmail },
              { icon: 'map', label: 'Lokasi Kampus', color: '#1A73E8', bg: '#E8F0FE', onPress: handleMaps },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.intentBtn, { backgroundColor: action.bg }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={action.icon as any} size={24} color={action.color} style={{ marginBottom: 4 }} />
                <Text style={[styles.intentLabel, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Edit/Delete actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.primary }, styles.shadowProps]}
            onPress={() => navigation.navigate('TambahMataKuliah', { editId: mk.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Edit Kelas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: theme.error }]}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={18} color={theme.error} style={{ marginRight: 4 }} />
            <Text style={[styles.deleteBtnText, { color: theme.error }]}>Hapus</Text>
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
  heroCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  sksBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sksBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  heroName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 6, lineHeight: 32 },
  heroSemester: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },
  card: { borderRadius: 16, padding: 18, marginBottom: 14 },
  cardHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.8,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { opacity: 0.8 },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  catatanText: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  intentBtn: { width: '48%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  intentLabel: { fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  editBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  deleteBtnText: { fontWeight: '700', fontSize: 15 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  }
});

export default DetailMataKuliahScreen;