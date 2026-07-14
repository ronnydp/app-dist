// app/nuevo-cliente.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getCustomers, saveCustomer } from '../services/database';
import { useToast } from '@/contexts/ToastsContext';

const DISTRITOS = ['Chimbote', 'Nuevo Chimbote'];

export default function NuevoClienteScreen() {
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        ruc?: string;
        address?: string;
        district?: string;
        phone?: string;
    }>();
    const isEditing = !!params.id;
    const navigation = useNavigation();

    const [nombre, setNombre] = useState(params.name || '');
    const [ruc, setRuc] = useState(params.ruc || '');
    const [direccion, setDireccion] = useState(params.address || '');
    const [distrito, setDistrito] = useState(params.district || 'Chimbote');
    const [telefono, setTelefono] = useState(params.phone || '');
    const [loading, setLoading] = useState(false);
    const [showDistritoModal, setShowDistritoModal] = useState(false);
    const { showToast } = useToast();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Editar Cliente' : 'Nuevo Cliente',
        });
    }, [isEditing, navigation]);

    const handleSubmit = async () => {
        // Validaciones
        if (!nombre.trim()) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        if (!direccion.trim()) {
            showToast('La dirección es obligatoria', 'error');
            return;
        }
        if (!distrito.trim()) {
            showToast('El distrito es obligatorio', 'error');
            return;
        }

        // Agrega esto:
        if (telefono.trim() && telefono.trim().length !== 9) {
            showToast('El teléfono debe tener 9 dígitos', 'error');
            return;
        }

        // Dentro de handleSubmit, antes de setLoading(true):
        if (!isEditing) {
            const clientesExistentes = await getCustomers();
            const nombreExiste = clientesExistentes.some(
                (c) => c.name.toLowerCase() === nombre.trim().toLowerCase()
            );

            if (nombreExiste) {
                showToast('Ya existe un cliente con ese nombre', 'error');
                return;
            }
        }


        setLoading(true);

        try {
            await saveCustomer({
                ...(isEditing ? { id: params.id } : {}),
                name: nombre.trim().toUpperCase(),
                ruc: ruc.trim() || undefined,
                address: direccion.trim(),
                district: distrito.trim(),
                phone: telefono.trim() || undefined,
            });
            showToast(isEditing ? 'Cliente actualizado' : 'Cliente guardado',
                'success')
            router.replace('/customer')
        } catch (error) {
            showToast('No se pudo guardar el cliente', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Nombre *</Text>
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Ej: Juan Pérez"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>RUC (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={ruc}
                            onChangeText={setRuc}
                            placeholder="Ej: 20123456789"
                            keyboardType="numeric"
                            maxLength={11}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Dirección *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={direccion}
                            onChangeText={setDireccion}
                            placeholder="Ej: Av. Principal 123"
                            multiline
                            numberOfLines={2}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Distrito *</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setShowDistritoModal(true)}
                        >
                            <Text style={styles.dropdownText}>{distrito}</Text>
                            <Ionicons name="chevron-down" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="Ej: 987654321"
                            keyboardType="phone-pad"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal para seleccionar distrito */}
            <Modal
                visible={showDistritoModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDistritoModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowDistritoModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Distrito</Text>
                        {DISTRITOS.map((dist) => (
                            <TouchableOpacity
                                key={dist}
                                style={[
                                    styles.modalOption,
                                    distrito === dist && styles.modalOptionSelected,
                                ]}
                                onPress={() => {
                                    setDistrito(dist);
                                    setShowDistritoModal(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        distrito === dist && styles.modalOptionTextSelected,
                                    ]}
                                >
                                    {dist}
                                </Text>
                                {distrito === dist && (
                                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
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
        fontSize: 16,
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
    textArea: {
        height: 70,
        textAlignVertical: 'top',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#111827',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    submitButton: {
        backgroundColor: '#2563eb',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    modalOptionSelected: {
        backgroundColor: '#eff6ff',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    modalOptionTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
});