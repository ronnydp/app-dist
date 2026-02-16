import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { createOrder, getCustomers, getProducts } from '../services/database';
import { Customer, Product } from '../types';

export default function NewOrderScreen() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [orderItems, setOrderItems] = useState<
        Array<{ product: Product; amount: number; unitPrice: number }>
    >([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
    const [productAmount, setProductAmount] = useState('1');
    const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
    const [searchCustomer, setSearchCustomer] = useState('');
    const [searchProduct, setSearchProduct] = useState('');

    const loadData = async () => {
        try {
            const customersData = await getCustomers();
            const productsData = await getProducts();
            setCustomers(customersData);
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

    const filteredCustomers = customers.filter((customer) =>
        normalizeText(customer.name).includes(normalizeText(searchCustomer)) ||
        customer.cod_customer.toString().includes(searchCustomer)
    );

    const filteredProducts = products.filter((product) =>
        normalizeText(product.name).includes(normalizeText(searchProduct))
    );

    const handleAddProduct = () => {
        if (!selectedProductForModal) return;

        const amount = parseInt(productAmount) || 1;
        if (amount <= 0) {
            Alert.alert('Error', 'La cantidad debe ser mayor a 0');
            return;
        }

        const existingItem = orderItems.find((item) => item.product.id === selectedProductForModal.id);

        if (existingItem) {
            setOrderItems(
                orderItems.map((item) =>
                    item.product.id === selectedProductForModal.id
                        ? { ...item, amount: item.amount + amount }
                        : item
                )
            );
            setQuantityInputs((prev) => ({
                ...prev,
                [selectedProductForModal.id]: String(
                    (existingItem.amount || 0) + amount
                ),
            }));
        } else {
            setOrderItems([
                ...orderItems,
                {
                    product: selectedProductForModal,
                    amount,
                    unitPrice: selectedProductForModal.price,
                },
            ]);
            setQuantityInputs((prev) => ({
                ...prev,
                [selectedProductForModal.id]: String(amount),
            }));
        }

        setProductAmount('1');
        setSelectedProductForModal(null);
        setShowProductModal(false);
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
            await createOrder({
                customer_id: selectedCustomer.id,
                total,
                date: new Date().toISOString(),
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
                {/* Cliente */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cliente *</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setShowCustomerModal(true)}
                    >
                        <View style={styles.dropdownContent}>
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

                {/* Productos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Productos *</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowProductModal(true)}
                        >
                            <Ionicons name="add" size={24} color="#2563eb" />
                        </TouchableOpacity>
                    </View>

                    {orderItems.length === 0 ? (
                        <Text style={styles.emptyText}>No hay productos agregados</Text>
                    ) : (
                        <View style={styles.productList}>
                            {orderItems.map((item) => (
                                <View key={item.product.id} style={styles.productItem}>
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName}>{item.product.name}</Text>
                                        <Text style={styles.productPrice}>
                                            S/ {item.unitPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles.productControls}>
                                        <TouchableOpacity
                                            onPress={() =>
                                                handleUpdateAmount(item.product.id, item.amount - 1)
                                            }
                                        >
                                            <Ionicons name="remove-circle" size={24} color="#ef4444" />
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
                                            onPress={() =>
                                                handleUpdateAmount(item.product.id, item.amount + 1)
                                            }
                                        >
                                            <Ionicons name="add-circle" size={24} color="#16a34a" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.productSubtotal}>
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

                {/* Nota */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nota (opcional)</Text>
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
                            value={searchCustomer}
                            onChangeText={setSearchCustomer}
                        />
                        <ScrollView style={styles.modalList}>
                            {filteredCustomers.length > 0 ? (
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
                            value={searchProduct}
                            onChangeText={setSearchProduct}
                        />
                        <ScrollView style={styles.modalList}>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={[
                                            styles.modalOption,
                                            selectedProductForModal?.id === product.id &&
                                            styles.modalOptionSelected,
                                        ]}
                                        onPress={() => setSelectedProductForModal(product)}
                                    >
                                        <View>
                                            <Text
                                                style={[
                                                    styles.modalOptionText,
                                                    selectedProductForModal?.id === product.id &&
                                                    styles.modalOptionTextSelected,
                                                ]}
                                            >
                                                {product.name}
                                            </Text>
                                            <Text style={styles.modalOptionSubtext}>
                                                S/ {product.price.toFixed(2)}
                                            </Text>
                                        </View>
                                        {selectedProductForModal?.id === product.id && (
                                            <Ionicons name="checkmark" size={20} color="#2563eb" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noResults}>No se encontraron productos</Text>
                            )}
                        </ScrollView>

                        {selectedProductForModal && (
                            <View style={styles.modalFooter}>
                                <View style={styles.amountSelector}>
                                    <Text style={styles.amountLabel}>Cantidad:</Text>
                                    <TextInput
                                        style={styles.amountInputModal}
                                        value={productAmount}
                                        onChangeText={setProductAmount}
                                        keyboardType="numeric"
                                        placeholder="1"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.addProductButton}
                                    onPress={() => {
                                        handleAddProduct();
                                        setSearchProduct('');
                                    }}
                                >
                                    <Text style={styles.addProductButtonText}>Agregar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
    addButton: {
        padding: 4,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        paddingVertical: 20,
    },
    productList: {
        gap: 12,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        gap: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 12,
        color: '#6b7280',
    },
    productControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amountInput: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
    productSubtotal: {
        alignItems: 'flex-end',
        minWidth: 70,
    },
    subtotalAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
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
    noResults: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        paddingVertical: 20,
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