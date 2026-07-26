import { authService, AuthSession } from '@/services/auth-service';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08859b" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={100} color="#08859b" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{session?.user?.name || 'Vendedor'}</Text>
          <Text style={styles.subtitle}>{session?.user?.role || 'Sin rol'}</Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pedidos hoy</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ventas semana pasada</Text>
            <Text style={styles.statValue}>S/ 3,820.00</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pedidos esta semana</Text>
            <Text style={styles.statValue}>65</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ventas esta semana</Text>
            <Text style={styles.statValue}>S/ 3,820.00</Text>
          </View>
        </View>
      </View>
      <Text style={{marginTop: 20, marginBottom:10, padding: 3, fontWeight: 'bold', fontSize: 16}}>Información personal</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={{color: '#6b7280', fontSize: 14}}>Correo</Text>
          <Text style={{color: '#6b7280', fontSize: 14}}>{session?.user?.email || 'Vendedor'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#ecedf0',
    padding: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingBottom: 15,
  },
  title: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    gap: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 2,
  },

  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ecedf0',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
});
