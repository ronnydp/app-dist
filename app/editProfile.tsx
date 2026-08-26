import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { getUserById, updateUser } from '@/services/database';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        if (!session?.user?.id) {
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const userData = await getUserById(session.user.id);
          setName(userData?.name || '');
          setPhone(userData?.phone || '');
          setEmail(userData?.email || '');
        } catch (error) {
          showToast('No se pudo cargar el perfil', 'error');
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      loadUser();
    }, [session?.user?.id, showToast])
  );

  const handleSave = async () => {
    if (!session?.user?.id) {
      return;
    }

    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    if (phone.trim() && phone.trim().length !== 9) {
      showToast('El teléfono debe tener 9 dígitos', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateUser(session.user.id, { name: name.trim(), phone: phone.trim() });
      showToast('Perfil actualizado correctamente', 'success');
      router.back();
    } catch (error) {
      showToast('No se pudo actualizar el perfil', 'error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08859b" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, isNameFocused && styles.inputFocused]}
            value={name}
            onChangeText={setName}
            placeholder="Nombre completo"
            placeholderTextColor="#9ca3af"
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo</Text>
          <View style={[styles.input, styles.disabledInput]}>
            <Text style={styles.disabledInputText}>{email || 'No registrado'}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
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
    borderColor: '#08859b',
    borderWidth: 1.5,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
  },
  disabledInputText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  buttonRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ecedf0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#08859b',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
