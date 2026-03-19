import { authService } from '@/services/auth-service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
import { createOrder, getProducts, searchCustomers } from '../services/database';
import { Customer, Product } from '../types';

export default function NewOrderScreen() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [orderItems, setOrderItems] = useState<
        Array<{ product: Product; amount: number; unitPrice: number }>
    >([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
    const [searchCustomer, setSearchCustomer] = useState('');
    const [searchProduct, setSearchProduct] = useState('');
    const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Buscar clientes desde Supabase con debounce
    useEffect(() => {
        if (!searchCustomer.trim()) {
            setCustomers([]);
            return;
        }
        setSearchingCustomers(true);
        if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
        customerSearchTimer.current = setTimeout(async () => {
            try {
                const results = await searchCustomers(searchCustomer);
                setCustomers(results);
            } catch (error) {
                console.error(error);
            } finally {
                setSearchingCustomers(false);
            }
        }, 350);
        return () => {
            if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
        };
    }, [searchCustomer]);

    const loadData = async () => {
        try {
            const productsData = await getProducts();
            setProducts(productsData);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los datos');
            console.error(error);
        }
    };

    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const filteredCustomers = customers;

    const filteredProducts = products.filter((product) =>
        normalizeText(product.name).includes(normalizeText(searchProduct))
    );

    const handleAddProduct = (product: Product) => {
        const existingItem = orderItems.find((item) => item.product.id === product.id);

        if (existingItem) {
            setOrderItems(
                orderItems.map((item) =>
                    item.product.id === product.id
                        ? { ...item, amount: item.amount + 1 }
                        : item
                )
            );
            setQuantityInputs((prev) => ({
                ...prev,
                [product.id]: String((existingItem.amount || 0) + 1),
            }));
        } else {
            setOrderItems([
                ...orderItems,
                {
                    product,
                    amount: 1,
                    unitPrice: product.price,
                },
            ]);
            setQuantityInputs((prev) => ({
                ...prev,
                [product.id]: '1',
            }));
        }

        setShowProductModal(false);
        setSearchProduct('');
    };

    const handleRemoveItem = (productId: string) => {
        setOrderItems(orderItems.filter((item) => item.product.id !== productId));
        setQuantityInputs((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const handleUpdateAmount = (productId: string, newAmount: number) => {
        if (newAmount <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setOrderItems(
            orderItems.map((item) =>
                item.product.id === productId ? { ...item, amount: newAmount } : item
            )
        );
        setQuantityInputs((prev) => ({ ...prev, [productId]: String(newAmount) }));
    };

    const handleQuantityInputChange = (productId: string, text: string) => {
        setQuantityInputs((prev) => ({ ...prev, [productId]: text }));
        const num = parseInt(text);
        if (!isNaN(num) && num > 0) {
            setOrderItems((prev) =>
                prev.map((item) =>
                    item.product.id === productId ? { ...item, amount: num } : item
                )
            );
        }
    };

    const commitQuantityInput = (productId: string) => {
        const text = quantityInputs[productId];
        const num = parseInt(text ?? '');
        const value = !text || isNaN(num) || num <= 0 ? 1 : num;
        setQuantityInputs((prev) => ({ ...prev, [productId]: String(value) }));
        handleUpdateAmount(productId, value);
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.amount * item.unitPrice, 0);
    };

    const handleSubmit = async () => {
        if (!selectedCustomer) {
            Alert.alert('Error', 'Debe seleccionar un cliente');
            return;
        }

        if (orderItems.length === 0) {
            Alert.alert('Error', 'Debe agregar al menos un producto');
            return;
        }

        const total = calculateTotal();

        setLoading(true);
        try {
            const session = await authService.getSession(); 
            if (!session?.user?.id) {
                Alert.alert('Error', 'No hay sesión activa');
                setLoading(false);
                return;
            }
            const now = new Date();
            const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            await createOrder({
                customer_id: selectedCustomer.id,
                seller_id: session.user.id, // Asumiendo que el ID del vendedor está en sessionStorage
                total,
                date: localDate,
                note: note.trim() || undefined,
                products: orderItems.map((item) => ({
                    product_id: item.product.id,
                    amount: item.amount,
                    unit_price: item.unitPrice,
                    sub_total: item.amount * item.unitPrice,
                })),
            });

            Alert.alert('Éxito', 'Pedido guardado correctamente', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el pedido');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            onLayout={loadData}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Paso 1: Cliente */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.sectionTitle}>Cliente</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.dropdown, selectedCustomer && styles.dropdownSelected]}
                        onPress={() => setShowCustomerModal(true)}
                    >
                        <View style={styles.dropdownContent}>
                            {!selectedCustomer && <Ionicons name="person-outline" size={20} color="#9ca3af" />}
                            {selectedCustomer && <Ionicons name="person" size={20} color="#2563eb" />}
                            <Text
                                style={[styles.dropdownText, !selectedCustomer && styles.placeholder]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {selectedCustomer ? selectedCustomer.name : 'Seleccionar cliente'}
                            </Text>
                            {selectedCustomer && (
                                <Text style={styles.dropdownCode}>#{selectedCustomer.cod_customer}</Text>
                            )}
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                        {selectedCustomer && (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                <Text style={styles.selectedAddress}><Ionicons name="location-outline" size={18} color="#2563eb" style={{marginRight: 6}} /> {selectedCustomer.address}</Text>
                            </View>
                        )}
                </View>

                {/* Paso 2: Productos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.sectionTitle}>Productos</Text>
                            {orderItems.length > 0 && (
                                <View style={styles.itemCountBadge}>
                                    <Text style={styles.itemCountText}>{orderItems.length}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowProductModal(true)}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {orderItems.length === 0 ? (
                        <TouchableOpacity
                            style={styles.emptyState}
                            onPress={() => setShowProductModal(true)}
                        >
                            <Ionicons name="cube-outline" size={40} color="#d1d5db" />
                            <Text style={styles.emptyStateTitle}>Sin productos</Text>
                            <Text style={styles.emptyStateSubtitle}>Toca aquí para agregar productos al pedido</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.productList}>
                            {orderItems.map((item) => (
                                <View key={item.product.id} style={styles.productItem}>
                                    {/* Fila superior: nombre + eliminar */}
                                    <View style={styles.productTopRow}>
                                        <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveItem(item.product.id)}
                                            hitSlop={8}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    {/* Fila inferior: precio × cantidad = subtotal */}
                                    <View style={styles.productBottomRow}>
                                        <Text style={styles.productPrice}>
                                            S/ {item.unitPrice.toFixed(2)}
                                        </Text>
                                        <Text style={styles.multiplySign}>×</Text>
                                        <View style={styles.quantityStepper}>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() =>
                                                    handleUpdateAmount(item.product.id, item.amount - 1)
                                                }
                                            >
                                                <Ionicons name="remove" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                            <TextInput
                                                style={styles.amountInput}
                                                value={quantityInputs[item.product.id] ?? item.amount.toString()}
                                                onChangeText={(text) => handleQuantityInputChange(item.product.id, text)}
                                                onEndEditing={() => commitQuantityInput(item.product.id)}
                                                keyboardType="numeric"
                                                selectTextOnFocus
                                            />
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() =>
                                                    handleUpdateAmount(item.product.id, item.amount + 1)
                                                }
                                            >
                                                <Ionicons name="add" size={18} color="#16a34a" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.equalsSign}>=</Text>
                                        <Text style={styles.subtotalAmount}>
                                            S/ {(item.amount * item.unitPrice).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Total */}
                {orderItems.length > 0 && (
                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>S/ {calculateTotal().toFixed(2)}</Text>
                    </View>
                )}

                {/* Paso 3: Nota */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.sectionTitle}>Nota <Text style={styles.optionalLabel}>(opcional)</Text></Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Agregar observación al pedido"
                        multiline
                        numberOfLines={3}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Botones de acción */}
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
                            {loading ? 'Guardando...' : 'Guardar Pedido'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal de clientes */}
            <Modal
                visible={showCustomerModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCustomerModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowCustomerModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar cliente..."
                            placeholderTextColor="#9ca3af"
                            autoFocus
                            value={searchCustomer}
                            onChangeText={setSearchCustomer}
                        />
                        <ScrollView style={styles.modalList}>
                            {searchCustomer.trim().length === 0 ? (
                                <Text style={styles.noResults}>Escriba para buscar clientes...</Text>
                            ) : searchingCustomers ? (
                                <View style={styles.searchingContainer}>
                                    <ActivityIndicator size="small" color="#2563eb" />
                                    <Text style={styles.noResults}>Buscando...</Text>
                                </View>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <TouchableOpacity
                                        key={customer.id}
                                        style={[
                                            styles.modalOption,
                                            selectedCustomer?.id === customer.id &&
                                            styles.modalOptionSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedCustomer(customer);
                                            setShowCustomerModal(false);
                                            setSearchCustomer('');
                                        }}
                                    >
                                        <Text
                                        style={[
                                            styles.modalOptionText,
                                            selectedCustomer?.id === customer.id &&
                                            styles.modalOptionTextSelected,
                                        ]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        #{customer.cod_customer} - {customer.name}
                                    </Text>
                                        {selectedCustomer?.id === customer.id && (
                                            <Ionicons name="checkmark" size={20} color="#2563eb" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noResults}>No se encontraron clientes</Text>
                            )}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>

            {/* Modal de productos */}
            <Modal
                visible={showProductModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProductModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowProductModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Producto</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar producto..."
                            placeholderTextColor="#9ca3af"
                            autoFocus
                            value={searchProduct}
                            onChangeText={setSearchProduct}
                        />
                        <ScrollView style={styles.modalList}>
                            {searchProduct.trim().length === 0 ? (
                                <Text style={styles.noResults}>Escriba para buscar productos...</Text>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => {
                                    const inCart = orderItems.find((i) => i.product.id === product.id);
                                    return (
                                        <TouchableOpacity
                                            key={product.id}
                                            style={[styles.modalOption, inCart && styles.modalOptionInCart]}
                                            onPress={() => handleAddProduct(product)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.modalOptionText}>
                                                    {product.name}
                                                </Text>
                                                <Text style={styles.modalOptionSubtext}>
                                                    S/ {product.price.toFixed(2)}
                                                </Text>
                                            </View>
                                            {inCart && (
                                                <View style={styles.cartBadge}>
                                                    <Text style={styles.cartBadgeText}>{inCart.amount}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={styles.noResults}>No se encontraron productos</Text>
                            )}
                        </ScrollView>
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
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
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
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    dropdownText: {
        fontSize: 16,
        color: '#111827',
        maxWidth: '70%',
    },
    dropdownCode: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    placeholder: {
        color: '#9ca3af',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    stepBadgeOptional: {
        backgroundColor: '#d1d5db',
    },
    stepBadgeTextOptional: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    optionalLabel: {
        fontWeight: '400',
        color: '#9ca3af',
        fontSize: 13,
    },
    itemCountBadge: {
        backgroundColor: '#dbeafe',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    itemCountText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 28,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        gap: 6,
    },
    emptyStateTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9ca3af',
    },
    emptyStateSubtitle: {
        fontSize: 13,
        color: '#d1d5db',
    },
    productList: {
        gap: 10,
    },
    productItem: {
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    productTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    productBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    productPrice: {
        fontSize: 13,
        color: '#6b7280',
        minWidth: 52,
    },
    multiplySign: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
    },
    equalsSign: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
    },
    quantityStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    stepperButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    amountInput: {
        width: 44,
        height: 36,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e5e7eb',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        padding: 0,
    },
    subtotalAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
        flex: 1,
        textAlign: 'right',
    },
    dropdownSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#f0f7ff',
    },
    totalSection: {
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2563eb',
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
        height: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
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
        padding: 12,
        width: '90%',
        maxHeight: '80%',
        maxWidth: 500,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    modalList: {
        maxHeight: 220,
        marginBottom: 8,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 6,
        borderRadius: 8,
        marginBottom: 4,
    },
    modalOptionSelected: {
        backgroundColor: '#eff6ff',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    modalOptionTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    modalOptionSubtext: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },
    modalFooter: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    amountSelector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amountLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    amountInputModal: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 6,
        fontSize: 13,
        textAlign: 'center',
    },
    addProductButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addProductButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 8,
        fontSize: 13,
        color: '#111827',
        backgroundColor: '#f9fafb',
        marginBottom: 8,
    },
    modalOptionInCart: {
        backgroundColor: '#f0f7ff',
    },
    cartBadge: {
        backgroundColor: '#2563eb',
        borderRadius: 10,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    noResults: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        paddingVertical: 20,
    },
    searchingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    selectedAddress: {
        marginTop: 8,
        fontSize: 14,
        color: '#374151',
        backgroundColor: '#f8fafc',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#bfdbfe',
    },
});