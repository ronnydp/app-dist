import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppSearchBar from '../../components/app-search-bar';
import FloatingActionButton from '../../components/floating-action-button';
import OrderCard from '../../components/OrderCard';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { normalizeString } from '../../lib/utils/string';
import { getOrders } from '../../services/database';
import { OrderWithDetails } from '../../types';

type OrdersVisibility = 'mine' | 'all';

export default function OrderScreen() {
    const { role, session } = useAuth();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [ordersVisibility, setOrdersVisibility] = useState<OrdersVisibility>('mine');
    const {showToast} = useToast();

    useEffect(() => {
        if (role === 'admin') {
            setOrdersVisibility('all');
            return;
        }

        if (role) {
            setOrdersVisibility('mine');
        }
    }, [role]);

    const sellerIdFilter = useMemo(() => {
        if (ordersVisibility === 'all') {
            return undefined;
        }
        return session?.user?.id;
    }, [ordersVisibility, session?.user?.id]);

    const loadOrders = useCallback(async () => {
        if (ordersVisibility === 'mine' && !session?.user?.id) {
            setOrders([]);
            return;
        }

        setRefreshing(true);
        try {
            const data = await getOrders({ sellerId: sellerIdFilter });
            setOrders(data);
        } catch (error) {
            showToast('No se pudieron cargar los pedidos', 'error');
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    }, [ordersVisibility, sellerIdFilter, session?.user?.id, showToast]);

    // Recargar cuando la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [loadOrders])
    );

    // Filtrado optimizado con useMemo
    const filteredOrders = useMemo(() => {
        let result = orders;
        const activeDate = selectedDate ?? new Date();

        // Filtro por fecha
        if (activeDate) {
            const dateStr = `${activeDate.getFullYear()}-${String(activeDate.getMonth() + 1).padStart(2, '0')}-${String(activeDate.getDate()).padStart(2, '0')}`;
            result = result.filter(order => order.date.startsWith(dateStr));
        }

        // Filtro por búsqueda (nombre o código de cliente)
        if (debouncedQuery) {
            const qNorm = normalizeString(debouncedQuery);
            result = result.filter(order => {
                const name = normalizeString(order.customer_name || '');
                const cod = order.customer_cod.toString();
                return name.includes(qNorm) || cod.includes(qNorm);
            });
        }

        return result;
    }, [orders, selectedDate, debouncedQuery]);

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (event?.type !== 'set' || !date) {
            return;
        }

        if (date) {
            setSelectedDate(date);
            if (Platform.OS === 'ios') {
                setShowDatePicker(false);
            }
        }
    };

    const clearDateFilter = () => {
        setSelectedDate(null);
    };

    const setMineVisibility = useCallback(() => {
        setOrdersVisibility('mine');
    }, []);

    const setAllVisibility = useCallback(() => {
        setOrdersVisibility('all');
    }, []);

    // Agrupar pedidos filtrados por vendedor
    const sections = useMemo(() => {
        const groups: Record<string, OrderWithDetails[]> = {};
        for (const order of filteredOrders) {
            const seller = order.seller_name || 'Sin vendedor';
            if (!groups[seller]) groups[seller] = [];
            groups[seller].push(order);
        }
        return Object.entries(groups).map(([title, data]) => ({ title, data }));
    }, [filteredOrders]);

    const renderOrder = ({ item }: { item: OrderWithDetails }) => (
        <OrderCard
            item={item}
            canAddObservation={role === 'vendedor' && item.seller_id === session?.user?.id}
        />
    );

    const renderSectionHeader = ({ section }: { section: { title: string; data: OrderWithDetails[] } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length} pedido{section.data.length !== 1 ? 's' : ''}</Text>
        </View>
    );
    return (
        <View style={styles.container}>
            <View style={styles.topFiltersRow}>
                <AppSearchBar
                    placeholder="Buscar pedidos..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={styles.searchBarInline}
                />

                <TouchableOpacity
                    style={[styles.iconButton]}
                    onPress={() => setShowDatePicker(true)}
                    accessibilityLabel="Seleccionar fecha"
                >
                    <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Filtros por fecha */}
            <View style={styles.dateFilterContainer}>
                <View style={styles.scopeButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.scopeButton,
                            ordersVisibility === 'mine' ? styles.scopeButtonActive : styles.scopeButtonInactive,
                        ]}
                        onPress={setMineVisibility}
                    >
                        <Ionicons
                            name="person-outline"
                            size={16}
                            color={ordersVisibility === 'mine' ? '#fff' : '#08859b'}
                        />
                        <Text
                            style={[
                                styles.scopeButtonText,
                                ordersVisibility === 'mine' ? styles.scopeButtonTextActive : styles.scopeButtonTextInactive,
                            ]}
                        >
                            Mis pedidos
                        </Text>
                    </TouchableOpacity>
                    {role === 'admin' && (
                        <TouchableOpacity
                            style={[
                                styles.scopeButton,
                                ordersVisibility === 'all' ? styles.scopeButtonActive : styles.scopeButtonInactive,
                            ]}
                            onPress={setAllVisibility}
                        >
                            <Ionicons
                                name="people-outline"
                                size={16}
                                color={ordersVisibility === 'all' ? '#fff' : '#08859b'}
                            />
                            <Text
                                style={[
                                    styles.scopeButtonText,
                                    ordersVisibility === 'all' ? styles.scopeButtonTextActive : styles.scopeButtonTextInactive,
                                ]}
                            >
                                Todos
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.rightFiltersGroup}>
                    {selectedDate && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearDateFilter}
                        >
                            <Ionicons name="close-circle" size={18} color="#ef4444" />
                            <Text style={styles.clearButtonText}>Limpiar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}

            <SectionList
                sections={sections}
                renderItem={renderOrder}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={loadOrders}
                initialNumToRender={8}
                windowSize={21}
                removeClippedSubviews={true}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No hay pedidos registrados</Text>
                        <Text style={styles.emptySubtext}>Presiona el botón + para agregar uno</Text>
                    </View>
                }
                contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
            />
            <FloatingActionButton onPress={() => router.push('/newOrder')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingBottom: 10
    },
    listContent: {
        padding: 16,
        marginBottom: 70
    },
    card: {
        backgroundColor: '#fff',
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    customerInfo: {
        flex: 1,
        marginRight: 12,
    },
    customerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    customerCode: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    address: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 16,
    },
    total: {
        fontSize: 16,
        fontWeight: '700',
        color: '#16a34a',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginBottom: 8,
    },
    productsSection: {
        marginBottom: 8,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 8,
    },
    productQty: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        minWidth: 25,
    },
    productName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
        flex: 1,
    },
    productPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
        minWidth: 70,
        textAlign: 'right',
    },
    /* note expand styles removed */
    noteSnippet: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    noteSnippetText: {
        fontSize: 13,
        color: '#92400e',
        marginLeft: 4,
        flex: 1,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#9ca3af',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
        gap: 6,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e40af',
        flex: 1,
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3b82f6',
    },
    dateFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 8,
        gap: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scopeButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    topFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    searchBarInline: {
        flex: 1,
        marginHorizontal: 0,
        marginBottom: 0,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ececec',
        backgroundColor: '#f4f5f7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scopeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    scopeButtonActive: {
        backgroundColor: '#08859b',
        borderColor: '#08859b',
    },
    scopeButtonInactive: {
        backgroundColor: '#fff',
        borderColor: '#08859b',
    },
    scopeButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    scopeButtonTextActive: {
        color: '#fff',
    },
    scopeButtonTextInactive: {
        color: '#08859b',
    },
    rightFiltersGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
    },
    dateInfoText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    totalPedidosText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
        gap: 4,
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ef4444',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        gap: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 110,
        textAlignVertical: 'top',
        color: '#111827',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    cancelModalButton: {
        backgroundColor: '#f3f4f6',
    },
    saveModalButton: {
        backgroundColor: '#08859b',
    },
    cancelModalText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
    saveModalText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    disabledModalButton: {
        opacity: 0.6,
    },
});