import { authService, AuthSession } from '@/services/auth-service';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentSession = await authService.getSession();
        setSession(currentSession);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={52} color="#2563eb" />
          <Text style={styles.title}>Perfil del vendedor</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.value}>{session?.user?.name || 'Vendedor'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Correo</Text>
          <Text style={styles.value}>{session?.user?.email || 'Sin correo'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  row: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});
