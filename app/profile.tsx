import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import {
  getSellerProfileStats,
  getUserById,
  SellerProfileStats,
} from '@/services/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { User } from '@/types';

const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

const formatDate = (value?: string) => {
  if (!value) {
    return 'No disponible';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'No disponible';
  }

  return parsedDate.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function ProfileScreen() {
  const { session, role } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<SellerProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = role === 'admin';

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null);
      setStats(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userDataPromise = getUserById(session.user.id);
      const statsDataPromise = isAdmin
        ? Promise.resolve<SellerProfileStats | null>(null)
        : getSellerProfileStats(session.user.id);

      const [userData, statsData] = await Promise.all([
        userDataPromise,
        statsDataPromise,
      ]);

      setUser(userData);
      setStats(statsData);
    } catch (error) {
      showToast('No se pudo cargar el perfil', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, session?.user?.id, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

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
          <Text style={styles.title}>{user?.name || session?.user?.name || 'Vendedor'}</Text>
          <Text style={styles.subtitle}>{user?.role || session?.user?.role || 'Sin rol'}</Text>
        </View>
      </View>
      {!isAdmin && (
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pedidos hoy</Text>
              <Text style={styles.statValue}>{stats?.todayOrderCount ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ventas semana pasada</Text>
              <Text style={styles.statValue}>{formatCurrency(stats?.previousWeekTotal ?? 0)}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pedidos esta semana</Text>
              <Text style={styles.statValue}>{stats?.weekOrderCount ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ventas esta semana</Text>
              <Text style={styles.statValue}>{formatCurrency(stats?.currentWeekTotal ?? 0)}</Text>
            </View>
          </View>
        </View>
      )}
      <Text style={{marginTop: 20, marginBottom:10, padding: 3, fontWeight: 'bold', fontSize: 16}}>Información personal</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={{color: '#6b7280', fontSize: 14}}>Correo</Text>
          <Text style={{color: '#6b7280', fontSize: 14}}>{user?.email || session?.user?.email || 'No registrado'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{color: '#6b7280', fontSize: 14}}>Teléfono</Text>
          <Text style={{color: '#6b7280', fontSize: 14}}>{user?.phone || 'No registrado'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{color: '#6b7280', fontSize: 14}}>Estado</Text>
          <Text style={{color: '#6b7280', fontSize: 14}}>{user?.is_active ? 'Activo' : 'Inactivo'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{color: '#6b7280', fontSize: 14}}>Registrado</Text>
          <Text style={{color: '#6b7280', fontSize: 14}}>{formatDate(user?.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    gap: 10,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#ecedf0',
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingBottom: 15,
  },
  title: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsGrid: {
    gap: 1.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 2,
  },

  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ecedf0",
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
});
