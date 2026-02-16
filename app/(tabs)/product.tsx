import { deleteProduct, getProducts } from "@/services/database";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppSearchBar from '../../components/app-search-bar';
import FloatingActionButton from '../../components/floating-action-button';
import ProductCard from '../../components/ProductCard';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { normalizeString } from '../../lib/utils/string';

export default function ProductScreen() {

    const [products, setProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250);
    // modal removed: no modal state required

    const loadProducts = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los productos');
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [loadProducts])
    );

    const handleDelete = useCallback((id: string, nombre: string) => {
        Alert.alert(
            'Eliminar Producto',
            `¿Estás seguro de eliminar ${nombre}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduct(id);
                            await loadProducts();
                            Alert.alert('Éxito', 'Producto eliminado correctamente');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar el producto');
                            console.error(error);
                        }
                    },
                },
            ]
        );
    }, [loadProducts]);

    const renderProduct = ({ item }: { item: Product }) => (
        <ProductCard
            item={item}
            onDelete={handleDelete}
        />
    );

    const filteredProducts = useMemo(() => {
        const q = debouncedQuery;
        if (!q) return products; // si no hay busqueda, mostrar todo
        const qNorm = normalizeString(q);
        return products.filter((p) => {
            const name = p.name ? normalizeString(p.name) : '';
            return name.includes(qNorm);
        });
    }, [debouncedQuery, products]);

    return (
        <SafeAreaView style={styles.container}>
            <AppSearchBar
                placeholder="Buscar por nombre"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={loadProducts}
                initialNumToRender={10}
                windowSize={21}
                removeClippedSubviews={true}
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
