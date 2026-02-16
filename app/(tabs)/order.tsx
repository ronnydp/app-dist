import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppSearchBar from '../../components/app-search-bar';
import FloatingActionButton from '../../components/floating-action-button';
import OrderCard from '../../components/OrderCard';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { normalizeString } from '../../lib/utils/string';
import { getOrders } from '../../services/database';
import { OrderWithDetails } from '../../types';

export default function OrderScreen() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const loadOrders = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los pedidos');
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    }, []);

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
            const dateStr = activeDate.toISOString().split('T')[0]; // "2026-02-11"
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

    const renderOrder = ({ item }: { item: OrderWithDetails }) => (
        <OrderCard item={item} />
    );

    return (
        <SafeAreaView style={styles.container}>
            <AppSearchBar
                placeholder="Buscar por nombre o código de cliente"
                value={searchQuery}
                onChangeText={setSearchQuery}
                iconSize={20}
            />

            {/* Filtros por fecha */}
            <View style={styles.dateFilterContainer}>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                    <Text style={styles.dateButtonText}>
                        {selectedDate
                            ? selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Hoy'
                        }
                    </Text>
                </TouchableOpacity>

                {selectedDate && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearDateFilter}
                    >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                        <Text style={styles.clearButtonText}>Limpiar</Text>
                    </TouchableOpacity>
                )}
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

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={loadOrders}
                initialNumToRender={8}
                windowSize={21}
                removeClippedSubviews={true}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No hay pedidos registrados</Text>
                        <Text style={styles.emptySubtext}>Presiona el botón + para agregar uno</Text>
                    </View>
                }
                contentContainerStyle={filteredOrders.length === 0 ? styles.emptyContainer : styles.listContent}
            />

            <FloatingActionButton onPress={() => router.push('/newOrder')} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    listContent: {
        padding: 16,
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
    dateFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        marginBottom: 8,
        gap: 8,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        gap: 6,
    },
    dateButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2563eb',
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
});