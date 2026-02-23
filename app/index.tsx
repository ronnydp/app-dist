import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth-service';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  const [targetRoute, setTargetRoute] = useState<'/login' | '/(tabs)/order' | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      // Recuperamos la sesión guardada en AsyncStorage
      const session = await authService.getSession();
      if (!isMounted) {
        return;
      }

      setTargetRoute(session ? '/(tabs)/order' : '/login');
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setTargetRoute(session ? '/(tabs)/order' : '/login');
    });

    resolveSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
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
