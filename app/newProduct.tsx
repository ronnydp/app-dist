import ClearableTextInput from '@/components/ClearableTextInput';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { isValidPrice } from '@/lib/utils/money';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPresentationsByProduct, getProducts, savePresentations, saveProduct } from '../services/database';

export default function NewProductScreen() {
    const { role } = useAuth();
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
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        if (role && role !== 'admin' && role !== 'supervisor') {
            router.back();
        }
    }, [role]);

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

    const scrollRef = useRef<ScrollView>(null);

    const addPresentation = () => {
        setPresentations((prev) => [...prev, { ...emptyPresentation, is_default: prev.length === 0 }]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
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
        if (role !== 'admin' && role !== 'supervisor') {
            showToast('Solo admin y supervisor pueden gestionar productos', 'error');
            return;
        }

        // Validaciones del producto
        if (!name.trim()) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        if (!price.trim()) {
            showToast('El precio es obligatorio', 'error');
            return;
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            showToast('El precio debe ser un número válido', 'error');
            return;
        }
        if (!isValidPrice(parsedPrice)) {
            showToast('El precio debe ser mayor a 0', 'error');
            return;
        }

        // Validar presentaciones
        for (let i = 0; i < presentations.length; i++) {
            const p = presentations[i];
            if (!p.name.trim()) {
                showToast(`La presentación ${i + 1} necesita un nombre`, 'error');
                return;
            }
            const parsedQuantity = parseInt(p.unit_quantity);
            if (!p.unit_quantity.trim() || isNaN(parsedQuantity) || parsedQuantity <= 0) {
                showToast(`La presentación "${p.name}" necesita una cantidad válida (mayor a 0)`, 'error');
                return;
            }
            const parsedSalePrice = parseFloat(p.sale_price);
            if (!p.sale_price.trim() || isNaN(parsedSalePrice)) {
                showToast(`La presentación "${p.name}" necesita un precio válido`, 'error');
                return;
            }
            if (!isValidPrice(parsedSalePrice)) {
                showToast(`La presentación "${p.name}" necesita un precio mayor a 0`, 'error');
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
            behavior="padding"
        >
            <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
            >
                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Nombre *</Text>
                        <ClearableTextInput
                            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Producto ABCD 430gr"
                            placeholderTextColor="#9ca3af"
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Precio *</Text>
                        <ClearableTextInput
                            style={[styles.input, focusedField === 'price' && styles.inputFocused]}
                            value={price}
                            onChangeText={setPrice}
                            placeholder="Ej: 99.9"
                            keyboardType="decimal-pad"
                            placeholderTextColor="#9ca3af"
                            onFocus={() => setFocusedField('price')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>
                </View>

                {/* Sección de presentaciones */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Presentaciones</Text>
                        <Text style={styles.sectionCount}>{presentations.length}</Text>
                    </View>

                    {presentations.length === 0 && (
                        <Text style={styles.emptyText}>
                            Sin presentaciones. Agrega una si el producto se vende en caja, bolsa, paquete, etc.
                        </Text>
                    )}

                    {presentations.map((p, index) => (
                        <View key={index} style={styles.presentationCard}>
                            <View style={styles.presentationHeader}>
                                <Text style={styles.presentationIndex}>
                                    Presentación {index + 1}{p.name.trim() ? ` · ${p.name.trim()}` : ''}
                                </Text>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removePresentation(index)}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    accessibilityLabel={`Eliminar presentación ${index + 1}`}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Nombre *</Text>
                                <ClearableTextInput
                                    style={[styles.input, focusedField === `presentation-${index}-name` && styles.inputFocused]}
                                    value={p.name}
                                    onChangeText={(v) => updatePresentation(index, 'name', v)}
                                    placeholder="Ej: Caja, Bolsa, Paquete, Saco"
                                    placeholderTextColor="#9ca3af"
                                    onFocus={() => setFocusedField(`presentation-${index}-name`)}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>Unidades *</Text>
                                    <ClearableTextInput
                                        style={[styles.input, focusedField === `presentation-${index}-unit` && styles.inputFocused]}
                                        value={p.unit_quantity}
                                        onChangeText={(v) => updatePresentation(index, 'unit_quantity', v)}
                                        placeholder="Ej: 12"
                                        keyboardType="number-pad"
                                        placeholderTextColor="#9ca3af"
                                        onFocus={() => setFocusedField(`presentation-${index}-unit`)}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>Precio *</Text>
                                    <ClearableTextInput
                                        style={[styles.input, focusedField === `presentation-${index}-price` && styles.inputFocused]}
                                        value={p.sale_price}
                                        onChangeText={(v) => updatePresentation(index, 'sale_price', v)}
                                        placeholder="Ej: 120.00"
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#9ca3af"
                                        onFocus={() => setFocusedField(`presentation-${index}-price`)}
                                        onBlur={() => setFocusedField(null)}
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

                    <TouchableOpacity style={styles.addPresentationButton} onPress={addPresentation}>
                        <Ionicons name="add-circle-outline" size={22} color={BrandColors.primary} />
                        <Text style={styles.addPresentationText}>Agregar presentación</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <Ionicons name="arrow-back-outline" size={17} color="#ef4444" />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name={isEditing ? 'create-outline' : 'checkmark-outline'} size={17} color="#fff" />
                            <Text style={styles.submitButtonText}>{isEditing ? 'Actualizar' : 'Guardar'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    inputFocused: {
        borderColor: BrandColors.primary,
        borderWidth: 1.5,
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5eaf0',
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
    cancelButtonText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
    submitButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
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
    sectionCount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    addPresentationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: BrandColors.primary,
    },
    addPresentationText: {
        color: BrandColors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    removeButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
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
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
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
        backgroundColor: BrandColors.primary,
        borderColor: BrandColors.primary,
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