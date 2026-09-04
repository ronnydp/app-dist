// app/(tabs)/customers.tsx
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import AppSearchBar from '../../components/app-search-bar';
import CustomerCard from '../../components/CustomerCard';
import FloatingActionButton from '../../components/floating-action-button';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { getCustomersPaginated } from '../../services/database';
import { Customer } from '../../types';

const PAGE_SIZE = 30;

export default function CustomerScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { role } = useAuth(); // para asegurar que la sesión esté lista antes de cargar clientes (evita error al arrancar la app)
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);
  const { showToast } = useToast();


  const loadCustomers = useCallback(async (reset = true) => {
    if (reset) {
      setRefreshing(true);
      pageRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    try {
      const search = debouncedQuery || undefined;
      const result = await getCustomersPaginated(pageRef.current, PAGE_SIZE, search, role ?? undefined);
      if (reset) {
        setCustomers(result.data);
      } else {
        setCustomers((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newItems = result.data.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newItems];
        });
      }
      setHasMore(result.hasMore);
    } catch (error) {
      // Solo mostrar alerta si ya hay datos cargados (no es el arranque inicial)
      if (customers.length > 0 || pageRef.current > 0) {
        Alert.alert('Error', 'No se pudieron cargar los clientes');
      }
      console.warn('Error cargando clientes:', error);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [debouncedQuery, role]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers(true);
    }, [loadCustomers])
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    pageRef.current += 1;
    loadCustomers(false);
  }, [loadingMore, hasMore, loadCustomers]);

  const openCustomer = useCallback((c: Customer) => {
    router.push({
      pathname: '/detailCustomer',
      params: {
        id: c.id,
        name: c.name,
        ruc: c.ruc || '',
        address: c.address,
        district: c.district,
        phone: c.phone || '',
        cod_customer: String(c.cod_customer),
        is_active: String(c.is_active)
      }
    });
  }, []);

  const renderCustomer = useCallback(({ item }: { item: Customer }) => (
    <CustomerCard 
      item={item} 
      onOpen={openCustomer} 
      />
  ), [openCustomer]);

  return (
    <View style={styles.container}>
      <View>
        <AppSearchBar
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => loadCustomers(true)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={BrandColors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay clientes registrados</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar uno</Text>
          </View>
        }
        contentContainerStyle={customers.length === 0 ? styles.emptyContainer : styles.listContent}
      />
      <FloatingActionButton onPress={() => router.push('/newCustomer')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  listContent: {
    padding: 16,
    marginBottom: 70
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