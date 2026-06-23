import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState as RNAppState, AppStateStatus, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { AppProvider, useApp } from './src/context/AppContext';
import SplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation';
import { requestNotificationPermission } from './src/services/notifications';
import { registerBackgroundSync, runForegroundAutoSync } from './src/services/backgroundTask';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications: Push notifications',
]);

function AppContent() {
  const [splashDone, setSplashDone] = useState<boolean>(false); // ✨ Menambahkan anotasi tipe TypeScript eksplisit
  const { state, refreshData } = useApp();
  const appStateRef = useRef<AppStateStatus>(RNAppState.currentState);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  // ⏱️ FITUR BARU: Inisialisasi Background Process & Notifikasi saat app pertama kali start
  useEffect(() => {
    (async () => {
      await requestNotificationPermission();
      await registerBackgroundSync();
    })();
  }, []);

  // 🔁 FITUR BARU: Auto-sync sederhana saat aplikasi dibuka kembali dari background ke foreground
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const cameFromBackground = appStateRef.current.match(/inactive|background/) && nextState === 'active';
      appStateRef.current = nextState;

      if (cameFromBackground) {
        console.log('[🔁 AUTO-SYNC] App kembali ke foreground, menjalankan auto-sync...');
        const { newItemsCount } = await runForegroundAutoSync();
        if (newItemsCount > 0) {
          await refreshData(); // Muat ulang state agar data baru dari cache server ikut terlihat
        }
      }
    };

    const subscription = RNAppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshData]);

  if (!splashDone) {
    return (
      <>
        {/* Mengunci status bar berwarna putih terang khusus saat animasi splash screen berjalan */}
        <StatusBar style="light" animated={true} />
        <SplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <>
      {/* Mengubah gaya warna ikon status bar (baterai, jam, sinyal) secara dinamis mengikuti preferensi dark mode */}
      <StatusBar 
        style={state.settings.darkMode ? 'light' : 'dark'} 
        animated={true}
      />
      <AppNavigator />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

// Mendaftarkan komponen utama ke sistem pembundelan Expo murni
registerRootComponent(App);
export default App;