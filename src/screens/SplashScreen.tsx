// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // ✨ Menggunakan ikon vektor modern

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation untuk bagian logo icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(() => {
      pulse.start();
    });

    const timer = setTimeout(() => {
      pulse.stop();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        onFinish();
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3730A3" />

      {/* Ornamen dekorasi latar belakang */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Logo Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="school" size={54} color="#FFFFFF" />
        </View>

        <Text style={styles.appName}>EduGuide</Text>
        <Text style={styles.tagline}>Panduan Akademik Mandiri Mahasiswa</Text>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>Kelola studi, raih prestasi</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.3 }]} />
          ))}
        </View>
        <Text style={styles.version}>Versi 1.0.0 • Expo SDK 54.0.8</Text> 
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -width * 0.25,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -width * 0.15,
    left: -width * 0.15,
  },
  circle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(129,140,248,0.15)',
    top: height * 0.15,
    left: -50,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  divider: {
    width: 50,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    marginVertical: 18,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  version: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
});

export default SplashScreen;