import { useToast } from '@/contexts/ToastsContext';
import { authService } from '@/services/auth-service';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function SessionActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const {showToast} = useToast();

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

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

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      {isOpen && !isConfirmVisible &&(
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
        />
      )}
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
