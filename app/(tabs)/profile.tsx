import ConfirmDialog from '@/components/ConfirmDialogProps';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { authService } from '@/services/auth-service';
import {
    getSellerProfileStats,
    getUserById,
    SellerProfileStats,
} from '@/services/database';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const isAdmin = role === 'admin';

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null);
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

  const handleLogout = () => {
    setIsConfirmVisible(true);
  };

  const handleCancelLogout = () => {
    setIsConfirmVisible(false);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      router.replace('/login');
    } catch (error) {
      showToast('No se pudo cerrar sesión', 'error');
      console.error(error);
    } finally {
      setIsLoggingOut(false);
      setIsConfirmVisible(false);
    }
  };

  const options = [
    {
      icon: 'person-outline',
      label: 'Editar perfil',
      onPress: () => router.push('/editProfile'),
    },
    {
      icon: 'time-outline',
      label: 'Asistencia',
      onPress: () => router.push('/asistencia'),
    },
    {
      icon: 'people-outline',
      label: 'Usuarios',
      role: 'admin',
      onPress: () => router.push('/users'),
    },
    {
      icon: 'log-out-outline',
      label: 'Cerrar sesión',
      onPress: handleLogout,
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={100} color={BrandColors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{user?.name || session?.user?.name || 'Vendedor'}</Text>
          <Text style={styles.subtitle}>{user?.role || session?.user?.role || 'Sin rol'}</Text>
        </View>
      </View>
      <Text style={{ marginTop: 20, marginBottom: 10, padding: 3, fontWeight: 'bold', fontSize: 16 }}>Información del usuario</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Correo</Text>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>{user?.email || session?.user?.email || 'No registrado'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Registrado</Text>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>{formatDate(user?.created_at)}</Text>
        </View>
      </View>

      <Text style={{ marginTop: 24, marginBottom: 10, padding: 3, fontWeight: 'bold', fontSize: 16 }}>Opciones</Text>
      <View style={styles.optionsCard}>
        {options.map((opt) => {
          const canShow = !opt.role || opt.role === role;
          if (!canShow) return null;
          const isLogout = opt.label === 'Cerrar sesión';
          return (
            <TouchableOpacity key={opt.label} style={styles.option} onPress={opt.onPress}>
              <Ionicons name={opt.icon as any} size={20} color="#374151" />
              <Text style={[styles.optionText, { flex: 1 }]}>{opt.label}</Text>
              {!isLogout && (
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ConfirmDialog
        visible={isConfirmVisible}
        title="Cerrar sesión"
        message="¿Seguro que deseas salir?"
        confirmText="Salir"
        cancelText="Cancelar"
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
  optionsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#ecedf0',
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
});
