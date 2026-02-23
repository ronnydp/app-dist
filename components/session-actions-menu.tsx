import { authService } from '@/services/auth-service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SessionActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  useEffect(() => {
    if (isLoggingOut) {
      setIsOpen(false);
    }
  }, [isLoggingOut]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await authService.logout();
            router.replace('/login');
          } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
            console.error(error);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      {isOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
        />
      )}

      <View style={styles.anchor}>
        {isOpen && (
          <View style={styles.menuCard}>
            <Pressable
              style={styles.profileMenuItem}
              onPress={handleViewProfile}
            >
              <Ionicons name="person-outline" size={16} color="#2563eb" />
              <Text style={styles.profileMenuItemText}>Ver perfil</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, isLoggingOut && styles.menuItemDisabled]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text style={styles.menuItemText}>{isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={[styles.triggerButton, isOpen && styles.triggerButtonActive]}
          onPress={() => setIsOpen((prev) => !prev)}
        >
          <Ionicons name={isOpen ? 'close' : 'ellipsis-vertical'} size={18} color="#111827" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  anchor: {
    position: 'absolute',
    top: 56,
    right: 12,
    alignItems: 'flex-end',
  },
  triggerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  triggerButtonActive: {
    borderColor: '#d1d5db',
  },
  menuCard: {
    marginBottom: 8,
    minWidth: 160,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  profileMenuItemText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemDisabled: {
    opacity: 0.7,
  },
  menuItemText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
