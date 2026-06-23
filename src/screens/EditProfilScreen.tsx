// src/screens/EditProfilScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getTheme, SEMESTER_OPTIONS } from '../utils/theme';
import { Mahasiswa } from '../types';

const JURUSAN_OPTIONS = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Teknik Komputer',
  'Ilmu Komputer',
  'Teknologi Informasi',
];

const EditProfilScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, updateMahasiswa } = useApp();
  const theme = getTheme(state.settings.darkMode);

  const [form, setForm] = useState<Mahasiswa>({ ...state.mahasiswa });
  const [loading, setLoading] = useState(false);
  const [showSemModal, setShowSemModal] = useState(false);
  const [showJurusanModal, setShowJurusanModal] = useState(false);
  const [errors, setErrors] = useState<Partial<Mahasiswa>>({});

  useEffect(() => {
    setForm({ ...state.mahasiswa });
  }, [state.mahasiswa]);

  const update = (field: keyof Mahasiswa, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<Mahasiswa> = {};
    if (!form.nim.trim()) e.nim = 'NIM wajib diisi';
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi';
    
    // Validasi IPK Saat Ini
    if (form.ipk && (parseFloat(form.ipk) > 4.0 || parseFloat(form.ipk) < 0)) {
      e.ipk = 'IPK harus di antara 0.00 - 4.00';
    }

    // ✨ Validasi Fitur Baru: Target IPK
    if (!form.targetIpk.trim()) {
      e.targetIpk = 'Target IPK wajib diisi';
    } else if (parseFloat(form.targetIpk) > 4.0 || parseFloat(form.targetIpk) < 0) {
      e.targetIpk = 'Target IPK harus di antara 0.00 - 4.00';
    }

    // ✨ Validasi Fitur Baru: Target SKS Kelulusan
    if (!form.targetSks || form.targetSks <= 0) {
      e.targetSks = 'Target SKS harus lebih besar dari 0' as any;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      
      // Memastikan tipe data targetSks dikonversi kembali ke number sebelum disimpan
      const payload: Mahasiswa = {
        ...form,
        targetSks: parseInt(form.targetSks as any, 10) || 144
      };

      await updateMahasiswa(payload);
      Alert.alert('Berhasil ✅', 'Profil dan Target Akademik berhasil diperbarui', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    field,
    placeholder,
    icon,
    keyboardType = 'default',
    required = false,
  }: {
    label: string;
    field: keyof Mahasiswa;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
    required?: boolean;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.text }]}>
        {label} {required && <Text style={{ color: theme.error }}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: errors[field] ? theme.error : theme.border,
              paddingLeft: 42,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={String(form[field] ?? '')}
          onChangeText={v => update(field, v)}
          keyboardType={keyboardType}
        />
      </View>
      {errors[field] ? (
        <Text style={[styles.errorText, { color: theme.error }]}>⚠️ {errors[field] as any}</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }, styles.shadowProps]}>
            <Text style={styles.avatarText}>
              {form.nama ? form.nama[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
            Inisial Mahasiswa Aktif
          </Text>
        </View>

        {/* Card 1: Data Utama */}
        <View style={[styles.formCard, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.formTitle, { color: theme.text }]}>Data Diri & Akademik</Text>
          </View>

          <Field label="Nama Lengkap" field="nama" placeholder="Masukkan nama lengkap" icon="person-outline" required />
          <Field label="Nomor Induk Mahasiswa (NIM)" field="nim" placeholder="Masukkan NIM" icon="id-card-outline" keyboardType="numeric" required />
          <Field label="IPK Saat Ini" field="ipk" placeholder="Contoh: 3.75" icon="trending-up-outline" keyboardType="decimal-pad" />

          {/* Semester picker */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Semester Aktif</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => setShowSemModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerLeft}>
                <Ionicons name="calendar-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.pickerText, { color: theme.text }]}>Semester {form.semester}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Jurusan picker */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Program Studi</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => setShowJurusanModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerLeft}>
                <Ionicons name="school-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.pickerText, { color: theme.text }]} numberOfLines={1}>
                  {form.jurusan || 'Pilih jurusan...'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ✨ Card 2: Form Target Pencapaian (Fitur Baru) */}
        <View style={[styles.formCard, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="analytics-outline" size={20} color={theme.secondary} />
            <Text style={[styles.formTitle, { color: theme.text }]}>Target Pencapaian Kelulusan</Text>
          </View>

          <Field label="Target IPK Kelulusan" field="targetIpk" placeholder="Contoh: 3.50" icon="trophy-outline" keyboardType="decimal-pad" required />
          <Field label="Total Target SKS Kelulusan" field="targetSks" placeholder="Contoh: 144" icon="flag-outline" keyboardType="numeric" required />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }, styles.shadowProps]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="save-outline" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Simpan Profil & Target</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Semester Modal */}
      <Modal visible={showSemModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSemModal(false)}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Semester</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {SEMESTER_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.modalOpt, { backgroundColor: form.semester === s ? theme.surfaceVariant : 'transparent' }]}
                  onPress={() => { update('semester', s); setShowSemModal(false); }}
                >
                  <Text style={[styles.modalOptText, { color: form.semester === s ? theme.primary : theme.text, fontWeight: form.semester === s ? '700' : '500' }]}>
                    Semester {s}
                  </Text>
                  {form.semester === s && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Jurusan Modal */}
      <Modal visible={showJurusanModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowJurusanModal(false)}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Program Studi</Text>
            {JURUSAN_OPTIONS.map(j => (
              <TouchableOpacity
                key={j}
                style={[styles.modalOpt, { backgroundColor: form.jurusan === j ? theme.surfaceVariant : 'transparent' }]}
                onPress={() => { update('jurusan', j); setShowJurusanModal(false); }}
              >
                <Text style={[styles.modalOptText, { color: form.jurusan === j ? theme.primary : theme.text, fontWeight: form.jurusan === j ? '700' : '500', flex: 1 }]}>
                  {j}
                </Text>
                {form.jurusan === j && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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
  avatarSection: { alignItems: 'center', marginVertical: 14 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 34, color: '#FFF', fontWeight: '800' },
  avatarHint: { fontSize: 13, fontWeight: '500' },
  formCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  cardHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  formTitle: { fontSize: 15, fontWeight: '700' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pickerText: { fontSize: 14, fontWeight: '500' },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  modalOpt: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOptText: { fontSize: 14 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  }
});

export default EditProfilScreen;