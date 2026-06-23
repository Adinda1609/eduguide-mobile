// src/screens/TambahMataKuliahScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; // ✨ Import Ikon Vektor Input Form
import { useApp } from '../context/AppContext';
import { getTheme, SEMESTER_OPTIONS, SKS_OPTIONS } from '../utils/theme';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'TambahMataKuliah'>;

interface FormData {
  nama: string;
  kode: string;
  sks: string;
  dosen: string;
  catatan: string;
  semester: string;
}

interface FormErrors {
  nama?: string;
  kode?: string;
  sks?: string;
  dosen?: string;
}

const TambahMataKuliahScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { state, updateMataKuliah, getMataKuliahById, postMataKuliahBaru, isOnline } = useApp();
  const theme = getTheme(state.settings.darkMode);

  const editId = route.params?.editId;
  const isEdit = !!editId;
  const existingMK = editId ? getMataKuliahById(editId) : undefined;

  const [form, setForm] = useState<FormData>({
    nama: '',
    kode: '',
    sks: '3',
    dosen: '',
    catatan: '',
    semester: state.mahasiswa.semester || '1',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showSKSModal, setShowSKSModal] = useState(false);
  const [showSemModal, setShowSemModal] = useState(false);

  useEffect(() => {
    if (isEdit && existingMK) {
      setForm({
        nama: existingMK.nama,
        kode: existingMK.kode,
        sks: String(existingMK.sks),
        dosen: existingMK.dosen,
        catatan: existingMK.catatan,
        semester: existingMK.semester,
      });
    }
  }, [isEdit, existingMK]);

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.nama.trim()) newErrors.nama = 'Nama mata kuliah wajib diisi';
    else if (form.nama.trim().length < 3) newErrors.nama = 'Nama minimal 3 karakter';
    if (!form.kode.trim()) newErrors.kode = 'Kode mata kuliah wajib diisi';
    else if (form.kode.trim().length < 2) newErrors.kode = 'Kode minimal 2 karakter';
    if (!form.dosen.trim()) newErrors.dosen = 'Nama dosen wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const data = {
        nama: form.nama.trim(),
        kode: form.kode.trim().toUpperCase(),
        sks: parseInt(form.sks, 10),
        dosen: form.dosen.trim(),
        catatan: form.catatan.trim(),
        semester: form.semester,
      };
      if (isEdit && existingMK) {
        await updateMataKuliah({ ...existingMK, ...data });
        Alert.alert('Berhasil ✅', 'Mata kuliah berhasil diperbarui', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // 🌐 FITUR BARU: Kirim mata kuliah baru ke server (simulasi POST) sebelum disimpan lokal
        await postMataKuliahBaru(data);
        Alert.alert(
          'Berhasil ✅',
          isOnline
            ? 'Mata kuliah berhasil ditambahkan & dikirim ke server'
            : 'Mata kuliah berhasil ditambahkan secara lokal (offline, belum terkirim ke server)',
          [
            { text: 'Lihat Daftar', onPress: () => navigation.goBack() },
            { text: 'Tambah Lagi', onPress: resetForm },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Gagal menyimpan data. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [form, isEdit, existingMK, postMataKuliahBaru, updateMataKuliah, navigation, isOnline]);

  const resetForm = () => {
    setForm({ nama: '', kode: '', sks: '3', dosen: '', catatan: '', semester: state.mahasiswa.semester || '1' });
    setErrors({});
  };

  const InputField = ({
    label,
    field,
    placeholder,
    icon,
    multiline = false,
    required = false,
    autoCapitalize = 'words',
  }: {
    label: string;
    field: keyof FormData;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    multiline?: boolean;
    required?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.text }]}>
        {label} {required && <Text style={{ color: theme.error }}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color={theme.textMuted} style={[styles.inputIcon, multiline && { top: 14 }]} />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: errors[field as keyof FormErrors] ? theme.error : theme.border,
              paddingLeft: 42,
            },
            multiline && styles.textArea,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={form[field]}
          onChangeText={v => update(field, v)}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {errors[field as keyof FormErrors] ? (
        <Text style={[styles.errorText, { color: theme.error }]}>
          ⚠️ {errors[field as keyof FormErrors]}
        </Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Kelas' : 'Tambah Kelas'}</Text>
        <View style={styles.headerNetBadge}>
          <Ionicons name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'} size={18} color="#FFF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: theme.card }, styles.shadowProps]}>
          <View style={styles.cardHeaderTitle}>
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.formTitle, { color: theme.text }]}>Informasi Mata Kuliah</Text>
          </View>

          <InputField label="Nama Mata Kuliah" field="nama" placeholder="Contoh: Pemrograman Mobile" icon="book-outline" required />
          <InputField label="Kode Mata Kuliah" field="kode" placeholder="Contoh: IF301" icon="key-outline" required autoCapitalize="characters" />

          {/* SKS Picker */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Beban SKS <Text style={{ color: theme.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => setShowSKSModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerLeft}>
                <Ionicons name="flash-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.pickerBtnText, { color: theme.text }]}>{form.sks} SKS</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <InputField label="Nama Dosen Pengampu" field="dosen" placeholder="Contoh: Dr. Ahmad Fauzi" icon="person-outline" required />

          {/* Semester Picker */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Diambil Pada Semester <Text style={{ color: theme.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => setShowSemModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerLeft}>
                <Ionicons name="calendar-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.pickerBtnText, { color: theme.text }]}>Semester {form.semester}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <InputField label="Catatan Tambahan Kuliah" field="catatan" placeholder="Tambahkan ruang, link drive, dll (opsional)..." icon="document-text-outline" multiline />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }, styles.shadowProps]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? '💾 Simpan Perubahan Kelas' : '🎉 Daftarkan Mata Kuliah'}
            </Text>
          )}
        </TouchableOpacity>

        {!isEdit && (
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: theme.border }]}
            onPress={() => {
              Alert.alert('Clear Form', 'Yakin ingin mengosongkan semua isian form?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Reset Form', onPress: resetForm },
              ]);
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>🔄 Kosongkan Form</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* SKS Modal */}
      <Modal visible={showSKSModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSKSModal(false)}
        >
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Bobot SKS</Text>
            {SKS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.modalOption,
                  { backgroundColor: form.sks === String(s) ? theme.surfaceVariant : 'transparent' },
                ]}
                onPress={() => { update('sks', String(s)); setShowSKSModal(false); }}
              >
                <Text style={[styles.modalOptionText, { color: form.sks === String(s) ? theme.primary : theme.text, fontWeight: form.sks === String(s) ? '700' : '500' }]}>
                  {s} SKS
                </Text>
                {form.sks === String(s) && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Semester Modal */}
      <Modal visible={showSemModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSemModal(false)}
        >
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Target Semester</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {SEMESTER_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.modalOption,
                    { backgroundColor: form.semester === s ? theme.surfaceVariant : 'transparent' },
                  ]}
                  onPress={() => { update('semester', s); setShowSemModal(false); }}
                >
                  <Text style={[styles.modalOptionText, { color: form.semester === s ? theme.primary : theme.text, fontWeight: form.semester === s ? '700' : '500' }]}>
                    Semester {s}
                  </Text>
                  {form.semester === s && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  headerNetBadge: { width: 24, alignItems: 'flex-end' },
  body: { padding: 16, paddingBottom: 40 },
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
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
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
  pickerBtnText: { fontSize: 14, fontWeight: '500' },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  resetBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  resetBtnText: { fontSize: 14, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: { width: '80%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOptionText: { fontSize: 14 },
  shadowProps: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1.5 }
    })
  }
});

export default TambahMataKuliahScreen;