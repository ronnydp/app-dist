// app/(tabs)/customers.tsx
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AppSearchBar from '../../components/app-search-bar';
import CustomerCard from '../../components/CustomerCard';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import {
  getCustomersPaginated,
  getFavoriteCustomerIds,
  getFavoriteCustomers,
  toggleFavoriteCustomer,
} from '../../services/database';
import { Customer } from '../../types';

const PAGE_SIZE = 30;
type ActiveFilter = 'all' | 'active' | 'inactive';
type SellerFilter = 'all' | 'favorites';

const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function CustomerScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [favoriteCustomerIds, setFavoriteCustomerIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [sellerFilter, setSellerFilter] = useState<SellerFilter>('all');
  const { role, session } = useAuth(); // para asegurar que la sesión esté lista antes de cargar clientes (evita error al arrancar la app)
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);
  const { showToast } = useToast();

  const isSeller = role === 'vendedor';
  const todayDayOfWeek = new Date().getDay();
  const todayDayName = DAY_NAMES[todayDayOfWeek];

  const loadFavorites = useCallback(async () => {
    if (!isSeller || !session?.user?.id) return;
    try {
      const ids = await getFavoriteCustomerIds(session.user.id, todayDayOfWeek);
      setFavoriteCustomerIds(new Set(ids));
    } catch (error) {
      console.warn('Error cargando favoritos del vendedor:', error);
    }
  }, [isSeller, session?.user?.id, todayDayOfWeek]);

  const loadCustomers = useCallback(async (reset = true) => {
    if (reset) {
      setRefreshing(true);
      pageRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    try {
      const search = debouncedQuery || undefined;

      if (isSeller && sellerFilter === 'favorites') {
        if (!session?.user?.id) {
          setCustomers([]);
          setHasMore(false);
          return;
        }
        const favCustomers = await getFavoriteCustomers(session.user.id, todayDayOfWeek, search);
        setCustomers(favCustomers);
        setHasMore(false);
        const ids = favCustomers.map((c) => c.id);
        setFavoriteCustomerIds(new Set(ids));
        return;
      }

      const result = await getCustomersPaginated(
        pageRef.current,
        PAGE_SIZE,
        search,
        role ?? undefined,
        activeFilter === 'all' ? undefined : activeFilter === 'active',
      );
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
  }, [activeFilter, debouncedQuery, isSeller, role, sellerFilter, session?.user?.id, todayDayOfWeek]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers(true);
      if (isSeller) {
        loadFavorites();
      }
    }, [loadCustomers, isSeller, loadFavorites])
  );

  const handleToggleFavorite = useCallback(async (customer: Customer) => {
    if (!session?.user?.id) return;

    // Actualización optimista de estado local
    const wasFavorite = favoriteCustomerIds.has(customer.id);
    setFavoriteCustomerIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) {
        next.delete(customer.id);
      } else {
        next.add(customer.id);
      }
      return next;
    });

    if (sellerFilter === 'favorites' && wasFavorite) {
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    }

    try {
      const isNowFavorite = await toggleFavoriteCustomer(
        session.user.id,
        customer.id,
        todayDayOfWeek,
      );

      showToast(
        isNowFavorite
          ? `Marcado como frecuente de hoy ${todayDayName}`
          : `Quitado de frecuentes de hoy ${todayDayName}`,
        'success',
      );
    } catch (error) {
      console.error('Error al alternar favorito:', error);
      // Revertir optimismo en caso de fallo
      setFavoriteCustomerIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.add(customer.id);
        } else {
          next.delete(customer.id);
        }
        return next;
      });
      if (sellerFilter === 'favorites' && wasFavorite) {
        loadCustomers(true);
      }
      showToast('Error al actualizar frecuente', 'error');
    }
  }, [favoriteCustomerIds, loadCustomers, sellerFilter, session?.user?.id, showToast, todayDayOfWeek]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || (isSeller && sellerFilter === 'favorites')) return;
    pageRef.current += 1;
    loadCustomers(false);
  }, [loadingMore, hasMore, isSeller, sellerFilter, loadCustomers]);

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
      showFavorite={isSeller}
      isFavorite={favoriteCustomerIds.has(item.id)}
      onToggleFavorite={handleToggleFavorite}
    />
  ), [openCustomer, isSeller, favoriteCustomerIds, handleToggleFavorite]);

  return (
    <View style={styles.container}>
      <View>
        <AppSearchBar
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchBar}
        />
        {(role === 'admin' || role === 'supervisor') && (
          <View style={styles.filterBar}>
            {(['all', 'active', 'inactive'] as ActiveFilter[]).map((filter) => (
              <Pressable
                key={filter}
                style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Ionicons
                  name={filter === 'all' ? 'people-outline' : filter === 'active' ? 'checkmark-circle-outline' : 'eye-off-outline'}
                  size={16}
                  color={activeFilter === filter ? '#fff' : '#64748b'}
                />
                <Text style={[styles.filterButtonText, activeFilter === filter && styles.filterButtonTextActive]}>
                  {filter === 'all' ? 'Todos' : filter === 'active' ? 'Habilitados' : 'Deshabilitados'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {isSeller && (
          <View style={styles.filterBar}>
            <Pressable
              style={[
                styles.filterButton,
                styles.sellerAllButton,
                sellerFilter === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSellerFilter('all')}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={sellerFilter === 'all' ? '#fff' : '#64748b'}
              />
              <Text style={[styles.filterButtonText, sellerFilter === 'all' && styles.filterButtonTextActive]}>
                Todos
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                styles.sellerFavoritesButton,
                sellerFilter === 'favorites' && styles.favoriteFilterButtonActive,
              ]}
              onPress={() => setSellerFilter('favorites')}
            >
              <Ionicons
                name={sellerFilter === 'favorites' ? 'star' : 'star-outline'}
                size={16}
                color={sellerFilter === 'favorites' ? '#fff' : '#ca8a04'}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  sellerFilter === 'favorites'
                    ? styles.filterButtonTextActive
                    : { color: '#ca8a04' },
                ]}
                numberOfLines={1}
              >
                Frecuentes hoy {todayDayName}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          loadCustomers(true);
          if (isSeller) {
            loadFavorites();
          }
        }}
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
            <Ionicons
              name={sellerFilter === 'favorites' ? 'star-outline' : 'people-outline'}
              size={64}
              color="#d1d5db"
            />
            <Text style={styles.emptyText}>
              {sellerFilter === 'favorites'
                ? `No tienes clientes frecuentes para hoy ${todayDayName}`
                : 'No hay clientes registrados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {sellerFilter === 'favorites'
                ? `Marca la estrella en un cliente para agregarlo a los frecuentes de hoy ${todayDayName}`
                : 'Presiona el botón + para agregar uno'}
            </Text>
          </View>
        }
        contentContainerStyle={customers.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  searchBar: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  filterButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderColor: '#dbe3ec',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#fff',
  },
  sellerAllButton: {
    flex: 0.38,
  },
  sellerFavoritesButton: {
    flex: 0.62,
  },
  filterButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  favoriteFilterButtonActive: {
    backgroundColor: '#ca8a04',
    borderColor: '#ca8a04',
  },
  filterButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#fff',
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