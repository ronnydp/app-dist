// app/(tabs)/customers.tsx
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AppSearchBar from '../../components/app-search-bar';
import CustomerCard from '../../components/CustomerCard';
import FloatingActionButton from '../../components/floating-action-button';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { activateCustomer, deleteCustomer, getCustomersPaginated } from '../../services/database';
import { Customer } from '../../types';
import { useToast } from '@/contexts/ToastsContext';

const PAGE_SIZE = 30;

export default function CustomerScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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


  const handleConfirmActiveCustomer = async (id: string, nombre: string, isActive: boolean) => {
    if (isActive) {
      try {
        await deleteCustomer(id);
        await loadCustomers(true);
        showToast('Cliente dado de baja', 'success');
        router.replace('/customer')
      } catch (error) {
        showToast('No se pudo dar de baja el cliente', 'error');
      }
    } else {
      try {
        await activateCustomer(id);
        await loadCustomers(true);
        showToast('Cliente habilitado', 'success');
        router.replace('/customer')
      } catch (error) {
        showToast('No se pudo habilitar el cliente', 'error');
      }
    }
  };


  // abre un modal con detalles del customer seleccionado
  const openCustomer = useCallback((c: Customer) => {
    setSelectedCustomer(c);
    setModalVisible(true);
  }, []);

  const handleEdit = useCallback((c: Customer) => {
    router.push({
      pathname: '/newCustomer',
      params: {
        id: c.id,
        name: c.name,
        ruc: c.ruc || '',
        address: c.address,
        district: c.district,
        phone: c.phone || '',
      },
    });
  }, []);

  // use shared `CustomerCard` component from components/

  const renderCustomer = useCallback(({ item }: { item: Customer }) => (
    <CustomerCard item={item} onOpen={openCustomer} onEdit={handleEdit} onToggleActive={role === 'admin' ? handleConfirmActiveCustomer : undefined} />
  ), [role, openCustomer, handleEdit, handleConfirmActiveCustomer]);

  const emptyIfMissing = (value: any) => (value || value === 0 ? String(value) : 'no tiene');

  return (
    <View style={styles.container}>
      {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15 }}> */}
        <View>
          <AppSearchBar
            placeholder="Buscar por código o nombre"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        {/* </View> */}
        {/* <TouchableOpacity style={styles.filterButton}>
          <Ionicons name='funnel-outline' size={20} color='#6b7280' />
        </TouchableOpacity> */}
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
              <ActivityIndicator size="small" color="#2563eb" />
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
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Ionicons name="person-circle-outline" size={28} color="#2563eb" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
                    {selectedCustomer ? selectedCustomer.name : 'Customer'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Código</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? String(selectedCustomer.cod_customer) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>RUC</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? emptyIfMissing(selectedCustomer.ruc) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Teléfono</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? emptyIfMissing(selectedCustomer.phone) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dirección</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? emptyIfMissing(selectedCustomer.address) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distrito</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? emptyIfMissing(selectedCustomer.district) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Creado</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? (selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleString('es-PE') : 'no tiene') : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Actualizado</Text>
                  <Text style={styles.detailValue}>{selectedCustomer ? (selectedCustomer.updated_at ? new Date(selectedCustomer.updated_at).toLocaleString('es-PE') : 'no tiene') : 'no tiene'}</Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>

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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f5f7',
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ececec',
    height: 44
  },
  card: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  codigo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  info: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ff',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fbfbfb',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});