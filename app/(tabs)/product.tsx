import { useAuth } from "@/hooks/useAuth";
import { activateProduct, deleteProduct, getProductsPaginated } from "@/services/database";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppSearchBar from '../../components/app-search-bar';
import FloatingActionButton from '../../components/floating-action-button';
import ProductCard from '../../components/ProductCard';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

const PAGE_SIZE = 30;

export default function ProductScreen() {

    const [products, setProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const pageRef = useRef(0);
    const [searchQuery, setSearchQuery] = useState('');
    const { role } = useAuth(); // para asegurar que la sesión esté lista antes de cargar productos (evita error al arrancar la app)
    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);

    const loadProducts = useCallback(async (reset = true) => {
        if (reset) {
            setRefreshing(true);
            pageRef.current = 0;
        } else {
            setLoadingMore(true);
        }
        try {
            const search = debouncedQuery || undefined;
            const result = await getProductsPaginated(pageRef.current, PAGE_SIZE, search, role ?? undefined);
            if (reset) {
                setProducts(result.data);
            } else {
                setProducts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const newItems = result.data.filter((p) => !existingIds.has(p.id));
                    return [...prev, ...newItems];
                });
            }
            setHasMore(result.hasMore);
        } catch (error) {
            if (products.length > 0 || pageRef.current > 0) {
                Alert.alert('Error', 'No se pudieron cargar los productos');
            }
            console.warn('Error cargando productos:', error);
        } finally {
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [debouncedQuery, role]);

    useFocusEffect(
        useCallback(() => {
            loadProducts(true);
        }, [loadProducts])
    );

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        pageRef.current += 1;
        loadProducts(false);
    }, [loadingMore, hasMore, loadProducts]);

    const handleToggleActive = useCallback((id: string, nombre: string, isActive: boolean) => {
        if (isActive) {
            Alert.alert(
                'Dar de baja',
                `¿Estás seguro de dar de baja ${nombre}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Dar de baja',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await deleteProduct(id);
                                await loadProducts(true);
                                Alert.alert('Éxito', 'Producto dado de baja correctamente');
                            } catch (error) {
                                Alert.alert('Error', 'No se pudo dar de baja el producto');
                                console.error(error);
                            }
                        },
                    },
                ]
            );
        } else {
            Alert.alert(
                'Habilitar producto',
                `¿Quieres volver a habilitar ${nombre}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Habilitar',
                        onPress: async () => {
                            try {
                                await activateProduct(id);
                                await loadProducts(true);
                                Alert.alert('Éxito', 'Producto habilitado correctamente');
                            } catch (error) {
                                Alert.alert('Error', 'No se pudo habilitar el producto');
                                console.error(error);
                            }
                        },
                    },
                ]
            );
        }
    }, [loadProducts]);

    const handleEdit = useCallback((p: Product) => {
        router.push({
            pathname: '/newProduct',
            params: {
                id: p.id,
                name: p.name,
                price: String(p.price),
                image_url: p.image_url || '',
            },
        });
    }, []);

    const renderProduct = useCallback(({ item }: { item: Product }) => (
        <ProductCard
            item={item}
            onEdit={role === 'admin' ? handleEdit : undefined}
            onToggleActive={role === 'admin' ? handleToggleActive : undefined}
        />
    ), [role, handleEdit, handleToggleActive]);

    return (
        <SafeAreaView style={styles.container}>
            <AppSearchBar
                placeholder="Buscar por nombre"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={() => loadProducts(true)}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color="#2563eb" />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="cube-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No hay productos registrados</Text>
                        <Text style={styles.emptySubtext}>Presiona el botón + para agregar uno</Text>
                    </View>
                }
                contentContainerStyle={products.length === 0 ? styles.emptyContainer : styles.listContent}
            />

            <FloatingActionButton onPress={() => router.push('/newProduct')} />
            {/* modal removed */}
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
        marginBottom: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContent: {
        flex: 1,
        paddingRight: 8,
    },
    nombre: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#16a34a',
        marginBottom: 4,
    },
    info: {
        fontSize: 13,
        color: '#6b7280',
    },
    deleteBtn: {
        padding: 6,
        marginLeft: 8,
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
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
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
});
