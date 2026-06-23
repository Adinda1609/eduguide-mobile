// src/navigation/index.ts
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { RootStackParamList, BottomTabParamList } from '../types';

import HomeScreen from '../screens/HomeScreen';
import MataKuliahScreen from '../screens/MataKuliahScreen';
import JadwalScreen from '../screens/JadwalScreen';
import ProfilScreen from '../screens/ProfilScreen';
import DetailMataKuliahScreen from '../screens/DetailMataKuliahScreen';
import TambahMataKuliahScreen from '../screens/TambahMataKuliahScreen';
import EditProfilScreen from '../screens/EditProfilScreen';
import PengaturanScreen from '../screens/PengaturanScreen';

// ─── 1. IMPORT SCREEN BARU DI SINI ───
import RiwayatLogScreen from '../screens/RiwayatLogScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const CustomTabIcon = ({ 
  name, 
  label, 
  focused, 
  color 
}: { 
  name: keyof typeof Ionicons.glyphMap; 
  label: string; 
  focused: boolean; 
  color: string 
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', top: Platform.OS === 'android' ? 2 : 0 }}>
    <Ionicons name={name} size={22} color={color} style={{ marginBottom: 2 }} />
    <Text 
      numberOfLines={1} 
      style={{ 
        fontSize: 10, 
        color, 
        fontWeight: focused ? '700' : '500',
        letterSpacing: 0.2
      }}
    >
      {label}
    </Text>
  </View>
);

function BottomTabs() {
  const { state } = useApp();
  const theme = getTheme(state.settings.darkMode);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 68 : 88,
          paddingBottom: Platform.OS === 'android' ? 8 : 24,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          tabBarIcon: ({ focused, color }) => (
            <CustomTabIcon name={focused ? "home" : "home-outline"} label="Beranda" focused={focused} color={color} />
          ) 
        }}
      />
      <Tab.Screen 
        name="MataKuliahTab" 
        component={MataKuliahScreen}
        options={{ 
          tabBarIcon: ({ focused, color }) => (
            <CustomTabIcon name={focused ? "book" : "book-outline"} label="Mata Kuliah" focused={focused} color={color} />
          ) 
        }}
      />
      <Tab.Screen 
        name="Jadwal" 
        component={JadwalScreen}
        options={{ 
          tabBarIcon: ({ focused, color }) => (
            <CustomTabIcon name={focused ? "calendar" : "calendar-outline"} label="Jadwal" focused={focused} color={color} />
          ) 
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen}
        options={{ 
          tabBarIcon: ({ focused, color }) => (
            <CustomTabIcon name={focused ? "person" : "person-outline"} label="Profil" focused={focused} color={color} />
          ) 
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useApp();
  const theme = getTheme(state.settings.darkMode);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={BottomTabs} />
        
        <Stack.Screen 
          name="DetailMataKuliah" 
          component={DetailMataKuliahScreen}
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="TambahMataKuliah" 
          component={TambahMataKuliahScreen}
          options={{ animation: 'slide_from_bottom' }} 
        />
        <Stack.Screen 
          name="EditProfil" 
          component={EditProfilScreen}
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Pengaturan" 
          component={PengaturanScreen}
          options={{ animation: 'slide_from_right' }} 
        />

        {/* ─── 2. DAFTARKAN SCREEN BARU DI SINI ─── */}
        <Stack.Screen 
          name="RiwayatLog" 
          component={RiwayatLogScreen}
          options={{ 
            headerShown: true, // Menampilkan top bar bawaan dengan tombol "Back" otomatis
            title: 'Riwayat Aktivitas SQLite',
            animation: 'slide_from_right',
            headerStyle: { backgroundColor: theme.primary },
            headerTintColor: '#FFF',
            headerTitleStyle: { fontWeight: '800', fontSize: 16 }
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}