import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPresentationsByProduct, getProducts, savePresentations, saveProduct } from '../services/database';
import { useToast } from '@/contexts/ToastsContext';

export default function NewProductScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        price?: string;
        image_url?: string;
    }>();
    const isEditing = !!params.id;
    const navigation = useNavigation();

    const [name, setName] = useState(params.name || '');
    const [price, setPrice] = useState(params.price || '');
    const [imageUrl, setImageUrl] = useState(params.image_url || '');
    const [loading, setLoading] = useState(false);
    const {showToast} = useToast();

    // Presentaciones
    type PresentationForm = {
        name: string;
        unit_quantity: string;
        sale_price: string;
        is_default: boolean;
    };
    const emptyPresentation: PresentationForm = { name: '', unit_quantity: '', sale_price: '', is_default: false };
    const [presentations, setPresentations] = useState<PresentationForm[]>([]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Editar Producto' : 'Nuevo Producto',
        });
    }, [isEditing, navigation]);

    // Cargar presentaciones existentes al editar
    useEffect(() => {
        if (isEditing && params.id) {
            getPresentationsByProduct(params.id).then((data) => {
                if (data.length > 0) {
                    setPresentations(
                        data.map((p) => ({
                            name: p.name,
                            unit_quantity: String(p.unit_quantity),
                            sale_price: String(p.sale_price),
                            is_default: p.is_default,
                        }))
                    );
                }
            });
        }
    }, [isEditing, params.id]);

    const addPresentation = () => {
        setPresentations((prev) => [...prev, { ...emptyPresentation }]);
    };

    const removePresentation = (index: number) => {
        setPresentations((prev) => prev.filter((_, i) => i !== index));
    };

    const updatePresentation = (index: number, field: keyof PresentationForm, value: string | boolean) => {
        setPresentations((prev) => {
            const updated = [...prev];
            if (field === 'is_default' && value === true) {
                // Solo una puede ser default
                updated.forEach((p, i) => (p.is_default = i === index));
            } else {
                (updated[index] as any)[field] = value;
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        // Validaciones del producto
        if (!name.trim()) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        if (!price.trim()) {
            showToast('El precio es obligatorio', 'error');
            return;
        }
        if (isNaN(parseFloat(price))) {
            showToast('El precio debe ser un número válido', 'error');
            return;
        }

        // Validar presentaciones
        for (let i = 0; i < presentations.length; i++) {
            const p = presentations[i];
            if (!p.name.trim()) {
                showToast(`La presentación ${i + 1} necesita un nombre`, 'error');
                return;
            }
            if (!p.unit_quantity.trim() || isNaN(parseInt(p.unit_quantity))) {
                showToast(`La presentación "${p.name}" necesita una cantidad válida`, 'error');
                return;
            }
            if (!p.sale_price.trim() || isNaN(parseFloat(p.sale_price))) {
                showToast(`La presentación "${p.name}" necesita un precio válido`, 'error');
                return;
            }
        }

        if (!isEditing) {
            const productsExistentes = await getProducts();
            const nombreExiste = productsExistentes.some(
                (p) => p.name.toLowerCase() === name.trim().toLowerCase()
            );

            if (nombreExiste) {
                showToast('Ya existe un producto con ese nombre', 'error');
                return;
            }
        }

        setLoading(true);

        try {
            const savedProduct = await saveProduct({
                ...(isEditing ? { id: params.id } : {}),
                name: name.trim(),
                price: parseFloat(price),
                image_url: imageUrl.trim() || undefined,
            });

            // Guardar presentaciones
            await savePresentations(
                savedProduct.id,
                presentations.map((p) => ({
                    name: p.name.trim(),
                    unit_quantity: parseInt(p.unit_quantity),
                    sale_price: parseFloat(p.sale_price),
                    is_default: p.is_default,
                }))
            );
            showToast(isEditing ? 'Producto actualizado' : 'Producto guardado', 'success')
            router.replace('/product')
        } catch (error) {
            showToast('No se pudo guardar el producto', 'error');
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
            <ScrollView
                style={styles.scrollView}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
            >
                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Nombre *</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Producto A"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Precio *</Text>
                        <TextInput
                            style={styles.input}
                            value={price}
                            onChangeText={setPrice}
                            placeholder="Ej: 99.99"
                            keyboardType="decimal-pad"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>URL de imagen (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={imageUrl}
                            onChangeText={setImageUrl}
                            placeholder="Ej: https://ejemplo.com/imagen.jpg"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                {/* Sección de presentaciones */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Presentaciones</Text>
                        <TouchableOpacity style={styles.addButton} onPress={addPresentation}>
                            <Text style={styles.addButtonText}>+ Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {presentations.length === 0 && (
                        <Text style={styles.emptyText}>Sin presentaciones agregadas</Text>
                    )}

                    {presentations.map((p, index) => (
                        <View key={index} style={styles.presentationCard}>
                            <View style={styles.presentationHeader}>
                                <Text style={styles.presentationIndex}>#{index + 1}</Text>
                                <TouchableOpacity onPress={() => removePresentation(index)}>
                                    <Text style={styles.removeText}>Eliminar</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Nombre *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={p.name}
                                    onChangeText={(v) => updatePresentation(index, 'name', v)}
                                    placeholder="Ej: Caja x12"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>Unidades *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={p.unit_quantity}
                                        onChangeText={(v) => updatePresentation(index, 'unit_quantity', v)}
                                        placeholder="Ej: 12"
                                        keyboardType="number-pad"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>Precio *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={p.sale_price}
                                        onChangeText={(v) => updatePresentation(index, 'sale_price', v)}
                                        placeholder="Ej: 120.00"
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.defaultToggle}
                                onPress={() => updatePresentation(index, 'is_default', !p.is_default)}
                            >
                                <View style={[styles.checkbox, p.is_default && styles.checkboxActive]}>
                                    {p.is_default && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.defaultLabel}>Presentación por defecto</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
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
        height: 90,
        textAlignVertical: 'top',
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
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    addButton: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#2563eb',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 16,
    },
    presentationCard: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
    },
    presentationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    presentationIndex: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    removeText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    defaultToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    defaultLabel: {
        fontSize: 14,
        color: '#374151',
    },
});