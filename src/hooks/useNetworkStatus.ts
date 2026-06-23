// src/hooks/useNetworkStatus.ts
/**
 * 🌐 HOOK STATUS KONEKSI JARINGAN
 * Memantau status online/offline perangkat secara real-time menggunakan NetInfo,
 * agar UI (badge status, tombol sync) bisa bereaksi otomatis terhadap perubahan koneksi.
 */
import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ConnectionStatus } from '../types';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [connectionType, setConnectionType] = useState<string>('unknown');

  const evaluate = useCallback((state: NetInfoState) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    setStatus(isOnline ? 'online' : 'offline');
    setConnectionType(state.type || 'unknown');
  }, []);

  useEffect(() => {
    // Cek kondisi awal saat komponen pertama kali mount
    NetInfo.fetch().then(evaluate);

    // Subscribe ke perubahan koneksi secara berkelanjutan (WiFi <-> Data Seluler <-> Offline)
    const unsubscribe = NetInfo.addEventListener(evaluate);
    return () => unsubscribe();
  }, [evaluate]);

  return {
    status,
    connectionType,
    isOnline: status === 'online',
  };
};
