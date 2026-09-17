import RoleSelectModal from '@/components/RoleSelectModal';
import { BrandColors } from '@/constants/theme';
import { useToast } from '@/contexts/ToastsContext';
import { getRoleLabel } from '@/lib/utils/roles';
import { createUser, updateUser } from '@/services/database';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
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

export default function NewUserScreen() {
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        email?: string;
        role?: string;
        phone?: string;
        is_active?: string;
    }>();
    const isEditing = !!params.id;
    const navigation = useNavigation();
    const { showToast } = useToast();

    const [name, setName] = useState(params.name || '');
    const [email, setEmail] = useState(params.email || '');
    const [role, setRole] = useState(params.role || 'vendedor');
    const [isActive, setIsActive] = useState(params.is_active ? JSON.parse(params.is_active) : true);
    const [loading, setLoading] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Editar usuario' : 'Nuevo usuario',
        });
    }, [isEditing, navigation]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        if (!email.trim()) {
            showToast('El correo electrónico es obligatorio', 'error');
            return;
        }
        if (!role) {
            showToast('El rol es obligatorio', 'error');
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await updateUser(params.id!, { name: name.trim(), role, is_active: isActive });
                showToast('Usuario actualizado', 'success');
            } else {
                await createUser({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    role,
                    is_active: isActive,
                });
                showToast('Usuario guardado', 'success');
            }
            router.replace('/users');
        } catch (error) {
            showToast(isEditing ? 'No se pudo actualizar el usuario' : 'No se pudo guardar el usuario', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Nombre *</Text>
                        <TextInput
                            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej. Juan Pérez"
                            placeholderTextColor="#9ca3af"
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Correo electrónico *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                isEditing && styles.inputDisabled,
                                focusedField === 'email' && styles.inputFocused,
                            ]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="usuario@demo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isEditing}
                            placeholderTextColor="#9ca3af"
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Rol *</Text>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setShowRoleModal(true)}>
                            <Ionicons name="person-outline" size={18} color="#6b7280" />
                            <Text style={styles.dropdownText}>{getRoleLabel(role)}</Text>
                            <Ionicons name="chevron-down" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Estado</Text>
                        <View style={styles.statusRow}>
                            <TouchableOpacity
                                style={[styles.statusButton, isActive && styles.statusButtonActive]}
                                onPress={() => setIsActive(true)}
                            >
                                <Text style={[styles.statusButtonText, isActive && styles.statusButtonTextActive]}>Activo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statusButton, !isActive && styles.statusButtonInactiveSelected]}
                                onPress={() => setIsActive(false)}
                            >
                                <Text style={[styles.statusButtonText, !isActive && styles.statusButtonTextActive]}>Inactivo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.submitButtonText}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <RoleSelectModal
                visible={showRoleModal}
                selectedRole={role}
                onSelect={setRole}
                onClose={() => setShowRoleModal(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    form: {
        marginBottom: 24,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#fff',
    },
    inputDisabled: {
        backgroundColor: '#f3f4f6',
        color: '#9ca3af',
    },
    inputFocused: {
        borderColor: BrandColors.primary,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    statusRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statusButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    statusButtonActive: {
        backgroundColor: BrandColors.primary,
        borderColor: BrandColors.primary,
    },
    statusButtonInactiveSelected: {
        backgroundColor: '#9ca3af',
        borderColor: '#9ca3af',
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    statusButtonTextActive: {
        color: '#fff',
    },
    actions: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5eaf0',
    },
    submitButton: {
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
        fontSize: 15,
        fontWeight: '800',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
