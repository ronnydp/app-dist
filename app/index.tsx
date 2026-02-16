import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { authBackend } from '../services/auth-backend';

export default function IndexScreen() {
  const [targetRoute, setTargetRoute] = useState<'/login' | '/(tabs)/order' | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      const session = await authBackend.getSession();
      if (!isMounted) {
        return;
      }

      setTargetRoute(session ? '/(tabs)/order' : '/login');
    };

    resolveSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!targetRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  return <Redirect href={targetRoute} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
