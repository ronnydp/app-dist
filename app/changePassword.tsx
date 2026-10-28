import ClearableTextInput from '@/components/ClearableTextInput';
import { BrandColors } from '@/constants/theme';
import { useToast } from '@/contexts/ToastsContext';
import { authService } from '@/services/auth-service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCurrentFocused, setIsCurrentFocused] = useState(false);
  const [isNewFocused, setIsNewFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!session?.user?.email) {
      showToast('No se pudo identificar al usuario', 'error');
      return;
    }
    if (!currentPassword.trim()) {
      showToast('Ingresa tu contraseña actual', 'error');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      showToast(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const result = await authService.changePassword({
        email: session.user.email,
        currentPassword,
        newPassword,
      });
      if (!result.ok) {
        showToast(result.error || 'No se pudo actualizar la contraseña', 'error');
        return;
      }
      const logoutResult = await authService.logout();
      if (!logoutResult.ok) {
        showToast(logoutResult.error || 'No se pudo cerrar la sesión anterior', 'error');
        return;
      }
      showToast('Contraseña actualizada correctamente', 'success');
      router.replace('/login');
    } catch (error) {
      showToast('No se pudo actualizar la contraseña', 'error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
    >
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contraseña actual</Text>
          <ClearableTextInput
            style={[styles.input, isCurrentFocused && styles.inputFocused]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Ingresa tu contraseña actual"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            textContentType="password"
            onFocus={() => setIsCurrentFocused(true)}
            onBlur={() => setIsCurrentFocused(false)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nueva contraseña</Text>
          <ClearableTextInput
            style={[styles.input, isNewFocused && styles.inputFocused]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            textContentType="newPassword"
            onFocus={() => setIsNewFocused(true)}
            onBlur={() => setIsNewFocused(false)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirmar nueva contraseña</Text>
          <ClearableTextInput
            style={[styles.input, isConfirmFocused && styles.inputFocused]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite la nueva contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            textContentType="newPassword"
            onFocus={() => setIsConfirmFocused(true)}
            onBlur={() => setIsConfirmFocused(false)}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Ionicons name="arrow-back-outline" size={17} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={17} color="#fff" />
                <Text style={styles.submitButtonText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ecedf0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: BrandColors.primary,
    borderWidth: 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fb7185',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  submitButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
