import { useToast } from "@/contexts/ToastsContext";
import { authService } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { RefObject, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createOrder,
  getPresentationsByProduct,
  getProducts,
  searchCustomers,
} from "../services/database";
import { Customer, Presentation, Product } from "../types";

const CUSTOMER_SEARCH_PAGE_SIZE = 50;

export default function NewOrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    customerRuc?: string;
    customerAddress?: string;
    customerDistrict?: string;
    customerPhone?: string;
    customerCodCustomer?: string;
    customerIsActive?: string;
  }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    params.customerId
      ? {
          id: params.customerId,
          name: params.customerName || "",
          ruc: params.customerRuc || undefined,
          address: params.customerAddress || "",
          district: params.customerDistrict || "",
          phone: params.customerPhone || undefined,
          cod_customer: Number(params.customerCodCustomer) || 0,
          is_active: params.customerIsActive === "true",
          created_at: "",
          updated_at: "",
        }
      : null,
  );
  const [orderItems, setOrderItems] = useState<
    Array<{
      product: Product;
      amount: number;
      unitPrice: number;
      presentationName?: string;
    }>
  >([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false); // Estado para controlar la visibilidad del modal de clientes
  const [showProductModal, setShowProductModal] = useState(false); // Estado para controlar la visibilidad del modal de productos
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(
    {},
  );
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  ); // Ref para manejar el debounce de búsqueda de clientes
  const [presentationsByProduct, setPresentationsByProduct] = useState<
    Presentation[]
  >([]); // Estado para almacenar las presentaciones del producto seleccionado
  const [showPresentationsByProduct, setShowPresentationsByProduct] =
    useState(false); // Estado para controlar la visibilidad del modal de presentaciones
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Estado para almacenar el producto seleccionado antes de mostrar las presentaciones
  const [selectedPresentation, setSelectedPresentation] =
    useState<Presentation | null>(null); // Estado para almacenar la presentación seleccionada
  const customerSearchInputRef = useRef<TextInput>(null);
  const productSearchInputRef = useRef<TextInput>(null);
  const [currentDraftItem, setCurrentDraftItem] = useState<
    Array<{
      product: Product;
      amount: number;
      unitPrice: number;
      presentationName?: string;
    }>
  >([]);
  const { showToast } = useToast();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Buscar clientes desde Supabase con debounce
  useEffect(() => {
    const term = searchCustomer.trim();
    if (!term) {
      setCustomers([]);
      setHasMoreCustomers(false);
      return;
    }

    let isCurrent = true;
    setSearchingCustomers(true);
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
    customerSearchTimer.current = setTimeout(async () => {
      try {
        const results = await searchCustomers(term, 0, CUSTOMER_SEARCH_PAGE_SIZE);
        if (isCurrent) {
          setCustomers(results.data);
          setHasMoreCustomers(results.hasMore);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isCurrent) setSearchingCustomers(false);
      }
    }, 350);
    return () => {
      isCurrent = false;
      if (customerSearchTimer.current)
        clearTimeout(customerSearchTimer.current);
    };
  }, [searchCustomer]);

  const loadMoreCustomers = async () => {
    const term = searchCustomer.trim();
    if (!term || searchingCustomers || loadingMoreCustomers || !hasMoreCustomers) {
      return;
    }

    setLoadingMoreCustomers(true);
    try {
      const page = Math.floor(customers.length / CUSTOMER_SEARCH_PAGE_SIZE);
      const results = await searchCustomers(term, page, CUSTOMER_SEARCH_PAGE_SIZE);
      if (searchCustomer.trim() !== term) return;

      setCustomers((previousCustomers) => {
        const existingIds = new Set(previousCustomers.map((customer) => customer.id));
        return [
          ...previousCustomers,
          ...results.data.filter((customer) => !existingIds.has(customer.id)),
        ];
      });
      setHasMoreCustomers(results.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMoreCustomers(false);
    }
  };

  const focusInputWhenModalShown = (inputRef: RefObject<TextInput | null>) => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const loadData = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      showToast("No se pudieron cargar los datos", "error");
      console.error(error);
    }
  };

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredCustomers = customers;

  const filteredProducts = products.filter((product) =>
    normalizeText(product.name).includes(normalizeText(searchProduct)),
  );

  const addOrUpdateDraftItem = (
    product: Product,
    presentation_price: number,
    presentationName?: string,
  ) => {
    const existingItem = currentDraftItem.find(
      (item) => item.product.id === product.id,
    );
    const newItem = {
      product,
      amount: 1,
      unitPrice: presentation_price,
      presentationName,
    };

    setCurrentDraftItem(
      existingItem
        ? currentDraftItem.map((item) =>
            item.product.id === product.id ? newItem : item,
          )
        : [...currentDraftItem, newItem],
    );
    setQuantityInputs((prev) => ({ ...prev, [product.id]: "1" }));
  };

  const addProductWithoutPresentation = (product: Product) => {
    const existingItem = orderItems.find(
      (i) => i.product.id === product.id,
    );
    setOrderItems((prev) =>
      existingItem
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, amount: item.amount + 1 }
              : item,
          )
        : [...prev, { product, amount: 1, unitPrice: product.price }],
    );
    setQuantityInputs((prev) => ({ ...prev, [product.id]: "1" }));
  };

  const handleProductSelection = async (product: Product) => {
    setSelectedProduct(product);
    const presentations = await getPresentationsByProduct(product.id);
    if (presentations.length === 0) {
      addProductWithoutPresentation(product);
      setShowProductModal(false);
      setSearchProduct("");
    } else {
      setPresentationsByProduct(presentations);
      setShowPresentationsByProduct(true);
    }
  };

  const handleAddPresentation = (
    product: Product,
    presentation_price: number,
    presentationName?: string,
  ) => {
    addOrUpdateDraftItem(product, presentation_price, presentationName);
  };

  const handleAddProduct = () => {
    if (currentDraftItem.length === 0) return;

    setOrderItems((prev) => {
      const next = [...prev];

      for (const draft of currentDraftItem) {
        const inputAmount = quantityInputs[draft.product.id];
        const finalAmount = inputAmount
          ? Math.max(1, parseInt(inputAmount) || 1)
          : draft.amount;

        const existingIndex = next.findIndex(
          (item) => item.product.id === draft.product.id,
        );
        if (existingIndex >= 0) {
          next[existingIndex] = { ...draft, amount: finalAmount };
        } else {
          next.push({ ...draft, amount: finalAmount });
        }
      }

      return next;
    });

    setCurrentDraftItem([]);
    setSelectedPresentation(null);
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.product.id !== productId));
    setQuantityInputs((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setSelectedPresentation(null);
  };

  const handleUpdateAmount = (productId: string, newAmount: number) => {
    if (newAmount <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setOrderItems(
      orderItems.map((item) =>
        item.product.id === productId ? { ...item, amount: newAmount } : item,
      ),
    );
    setQuantityInputs((prev) => ({ ...prev, [productId]: String(newAmount) }));
  };

  const updateItemAmount = (
    productId: string,
    text: string,
    isOrderItem: boolean = false,
  ) => {
    setQuantityInputs((prev) => ({ ...prev, [productId]: text }));
    
    const num = parseInt(text);
    if (!isNaN(num) && num > 0) {
      if (isOrderItem) {
        setOrderItems((prev) =>
          prev.map((item) =>
            item.product.id === productId ? { ...item, amount: num } : item,
          ),
        );
      } else {
        setCurrentDraftItem((prev) =>
          prev.map((item) =>
            item.product.id === productId ? { ...item, amount: num } : item,
          ),
        );
      }
    }
  };

  const handleQuantityInputChange = (productId: string, text: string) => {
    updateItemAmount(productId, text, false);
  };

  const commitQuantityInput = (productId: string) => {
    const text = quantityInputs[productId];
    const num = parseInt(text ?? "");
    const value = !text || isNaN(num) || num <= 0 ? 1 : num;
    setQuantityInputs((prev) => ({ ...prev, [productId]: String(value) }));
    handleUpdateAmount(productId, value);
  };

  const handleUpdateDraftAmount = (productId: string, newAmount: number) => {
    if (newAmount <= 0) {
      setCurrentDraftItem((prev) =>
        prev.filter((item) => item.product.id !== productId),
      );
      setQuantityInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }

    setCurrentDraftItem((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, amount: newAmount } : item,
      ),
    );
    setQuantityInputs((prev) => ({ ...prev, [productId]: String(newAmount) }));
  };

  const commitDraftQuantityInput = (productId: string) => {
    const text = quantityInputs[productId];
    const num = parseInt(text ?? "");
    const value = !text || isNaN(num) || num <= 0 ? 1 : num;
    setQuantityInputs((prev) => ({ ...prev, [productId]: String(value) }));
    handleUpdateDraftAmount(productId, value);
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.amount * item.unitPrice,
      0,
    );
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      showToast("Debe seleccionar un cliente", "error");
      return;
    }

    if (orderItems.length === 0) {
      showToast("Debe agregar al menos un producto", "error");
      return;
    }
    const total = calculateTotal();

    setLoading(true);
    try {
      const session = await authService.getSession();
      if (!session?.user?.id) {
        showToast("No hay sesión activa", "error");
        setLoading(false);
        return;
      }
      await createOrder({
        customer_id: selectedCustomer.id,
        seller_id: session.user.id, // Asumiendo que el ID del vendedor está en sessionStorage
        total,
        note: note.trim() || undefined,
        products: orderItems.map((item) => ({
          product_id: item.product.id,
          amount: item.amount,
          unit_price: item.unitPrice,
          sub_total: item.amount * item.unitPrice,
          presentation_name: item.presentationName,
        })),
      });
      showToast("Pedido agregado", "success");
      router.replace("/order");
    } catch (error) {
      showToast("No se pudo guardar el pedido", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      onLayout={loadData}
    >
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
        ]}
      >
        {/* Paso 1: Cliente */}
        <View style={styles.section}>
          <View style={styles.stepHeader}>
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.dropdown,
              selectedCustomer && styles.dropdownSelected,
            ]}
            onPress={() => setShowCustomerModal(true)}
          >
            <View style={styles.dropdownContent}>
              {!selectedCustomer && (
                <Ionicons name="person-outline" size={18} color="#9ca3af" />
              )}
              {selectedCustomer && (
                <Ionicons name="person" size={18} color="#08859b" />
              )}
              <Text
                style={[
                  styles.dropdownText,
                  !selectedCustomer && styles.placeholder,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedCustomer
                  ? selectedCustomer.name
                  : "Seleccionar cliente"}
              </Text>
              {selectedCustomer && (
                <Text style={styles.dropdownCode}>
                  #{selectedCustomer.cod_customer}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
          {selectedCustomer && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={styles.selectedAddress}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#08859b"
                  style={{ marginRight: 6 }}
                />{" "}
                {selectedCustomer.address}
              </Text>
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
          </View>

          {orderItems.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyState}
              onPress={() => setShowProductModal(true)}
            >
              <Ionicons name="cube-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>Sin productos</Text>
              <Text style={styles.emptyStateSubtitle}>
                Toca aquí para agregar productos al pedido
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.productList}>
              {orderItems.map((item) => (
                <View key={item.product.id} style={styles.productItem}>
                  {/* Fila superior: nombre + eliminar */}
                  <View style={styles.productTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      {item.presentationName && (
                        <Text style={styles.presentationLabel}>
                          {item.presentationName}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.product.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
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
                        style={[styles.amountInput, focusedField === `amount-${item.product.id}` && styles.amountInputFocused]}
                        value={
                          quantityInputs[item.product.id] ??
                          item.amount.toString()
                        }
                        onChangeText={(text) =>
                          updateItemAmount(item.product.id, text, true)
                        }
                        onEndEditing={() =>
                          commitQuantityInput(item.product.id)
                        }
                        keyboardType="numeric"
                        selectTextOnFocus
                        onFocus={() => setFocusedField(`amount-${item.product.id}`)}
                        onBlur={() => setFocusedField(null)}
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

          {orderItems.length > 0 && (
            <TouchableOpacity
              style={[styles.addButton, styles.addButtonBottom]}
              onPress={() => setShowProductModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar producto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Total */}
        {orderItems.length > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>
              S/ {calculateTotal().toFixed(2)}
            </Text>
          </View>
        )}

        {/* Paso 3: Nota */}
        <View style={styles.section}>
          <View style={styles.stepHeader}>
            <Text style={styles.sectionTitle}>
              Nota <Text style={styles.optionalLabel}>(opcional)</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, focusedField === 'note' && styles.inputFocused]}
            value={note}
            onChangeText={setNote}
            placeholder="Agregar observación al pedido"
            multiline
            numberOfLines={3}
            placeholderTextColor="#9ca3af"
            onFocus={() => setFocusedField('note')}
            onBlur={() => setFocusedField(null)}
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
            style={[
              styles.button,
              styles.submitButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : "Guardar Pedido"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de clientes */}
      <Modal
        visible={showCustomerModal}
        transparent
        animationType="fade"
        onShow={() => focusInputWhenModalShown(customerSearchInputRef)}
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <Pressable style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Seleccionar Cliente</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCustomerModal(false);
                  setSearchCustomer("");
                }}
              >
                <Ionicons name="close-outline" size={25} />
              </TouchableOpacity>
            </View>
            <TextInput
              ref={customerSearchInputRef}
              style={[styles.searchInput, focusedField === 'customerSearch' && styles.searchInputFocused]}
              placeholder="Buscar cliente..."
              placeholderTextColor="#9ca3af"
              value={searchCustomer}
              onChangeText={setSearchCustomer}
              onFocus={() => setFocusedField('customerSearch')}
              onBlur={() => setFocusedField(null)}
            />
            <FlatList
              style={styles.modalList}
              data={
                searchCustomer.trim().length === 0 || searchingCustomers
                  ? []
                  : filteredCustomers
              }
              keyExtractor={(customer) => customer.id}
              keyboardShouldPersistTaps="handled"
              onEndReached={loadMoreCustomers}
              onEndReachedThreshold={0.3}
              renderItem={({ item: customer }) => (
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
                    setSearchCustomer("");
                  }}
                >
                  <View style={styles.modalOptionTextCode}>
                    <Text style={styles.codeBadge}>
                      #{customer.cod_customer}
                    </Text>
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedCustomer?.id === customer.id &&
                          styles.modalOptionTextSelected,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {customer.name}
                    </Text>
                  </View>

                  <Text style={styles.modalOptionTextAddress}>
                    {customer.address}
                  </Text>
                  {selectedCustomer?.id === customer.id && (
                    <Ionicons name="checkmark" size={20} color="#08859b" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchCustomer.trim().length === 0 ? (
                  <Text style={styles.noResults}>
                    Escriba para buscar clientes...
                  </Text>
                ) : searchingCustomers ? (
                  <View style={styles.searchingContainer}>
                    <ActivityIndicator size="small" color="#08859b" />
                    <Text style={styles.noResults}>Buscando...</Text>
                  </View>
                ) : (
                  <Text style={styles.noResults}>
                    No se encontraron clientes
                  </Text>
                )
              }
              ListFooterComponent={
                loadingMoreCustomers ? (
                  <View style={styles.searchingContainer}>
                    <ActivityIndicator size="small" color="#08859b" />
                  </View>
                ) : null
              }
            />
          </View>
        </Pressable>
      </Modal>

      {/* Modal de productos */}
      <Modal
        visible={showProductModal}
        transparent
        animationType="fade"
        onShow={() => {
          focusInputWhenModalShown(productSearchInputRef);
          setSearchProduct("");
        }}
        onRequestClose={() => setShowProductModal(false)}
      >
        <Pressable style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Seleccionar Producto</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowProductModal(false);
                  setSearchProduct("");
                }}
              >
                <Ionicons name="close-outline" size={25} />
              </TouchableOpacity>
            </View>
            <TextInput
              ref={productSearchInputRef}
              style={[styles.searchInput, focusedField === 'productSearch' && styles.searchInputFocused]}
              placeholder="Buscar producto..."
              placeholderTextColor="#9ca3af"
              value={searchProduct}
              onChangeText={setSearchProduct}
              onFocus={() => setFocusedField('productSearch')}
              onBlur={() => setFocusedField(null)}
            />
            <FlatList
              style={styles.modalList}
              data={searchProduct.trim().length === 0 ? [] : filteredProducts}
              keyExtractor={(product) => product.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: product }) => {
                const inCart = orderItems.find(
                  (i) => i.product.id === product.id,
                );
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.modalOption,
                      inCart && styles.modalOptionInCart,
                    ]}
                    disabled={Boolean(inCart)}
                    onPress={() => handleProductSelection(product)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalOptionText}>{product.name}</Text>
                      <Text style={styles.modalOptionSubtext}>
                        S/ {product.price.toFixed(2)}
                      </Text>
                    </View>
                    {inCart && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>
                          {inCart.amount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                searchProduct.trim().length === 0 ? (
                  <Text style={styles.noResults}>
                    Escriba para buscar productos...
                  </Text>
                ) : (
                  <Text style={styles.noResults}>
                    No se encontraron productos
                  </Text>
                )
              }
            />
          </View>
        </Pressable>
      </Modal>
      {/* Modal de agregar por producto */}
      <Modal
        visible={showPresentationsByProduct}
        onRequestClose={() => {
          setShowPresentationsByProduct(false);
          setCurrentDraftItem([]);
        }}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Agregar Producto</Text>
              <TouchableOpacity
                onPress={() => setShowPresentationsByProduct(false)}
              >
                <Ionicons name="close-outline" size={25} />
              </TouchableOpacity>
            </View>
            <View style={styles.selectedProductHeader}>
              <View style={styles.productIconBox}>
                <Ionicons name="cube-outline" size={28} color="#6b7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedProductName}>
                  {selectedProduct?.name}
                </Text>
                <Text style={styles.selectedProductPrice}>
                  S/ {selectedProduct?.price.toFixed(2)}
                </Text>
              </View>
            </View>
            <Text style={{ fontWeight: "bold", marginVertical: 10 }}>
              1. Selecciona la presentación
            </Text>
            {presentationsByProduct.map((presentation) => (
              <TouchableOpacity
                key={presentation.id}
                style={[
                  styles.modalOptionPresentation,
                  selectedPresentation?.id === presentation.id &&
                    styles.modalOptionSelected,
                ]}
                onPress={() => {
                  handleAddPresentation(
                    { ...selectedProduct! },
                    presentation.sale_price,
                    presentation.name,
                  );
                  setSelectedPresentation(presentation);
                }}
              >
                <Ionicons
                  name={
                    selectedPresentation?.id === presentation.id
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    selectedPresentation?.id === presentation.id
                      ? "#08859b"
                      : "#9ca3af"
                  }
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalOptionTextPresentationName}>
                    {presentation.name}{" "}
                  </Text>
                  <Text style={styles.modalOptionTextPresentationQuantity}>
                    {presentation.unit_quantity} unidad(es)
                  </Text>
                </View>
                <Text style={styles.presentationPrice}>
                  S/ {presentation.sale_price.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={{ fontWeight: "bold", marginVertical: 10 }}>
              2. Ingresa la cantidad
            </Text>
            <View style={styles.quantityCard}>
              <View>
                {currentDraftItem.length === 0 ? (
                  <Text
                    style={{
                      color: "#bdb9b9",
                      textAlign: "center",
                      width: "100%",
                      marginVertical: 10,
                    }}
                  >
                    No ha seleccionado presentación aún
                  </Text>
                ) : (
                  <>
                    {currentDraftItem.map((item) => (
                      <View key={item.product.id} style={styles.quantityRow}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            handleUpdateDraftAmount(
                              item.product.id,
                              item.amount - 1,
                            )
                          }
                        >
                          <Ionicons name="remove" size={20} color="#08859b" />
                        </TouchableOpacity>
                        <TextInput
                          style={[
                            {
                              fontWeight: "bold",
                              fontSize: 20,
                              textAlign: "center",
                            },
                            focusedField === `draftAmount-${item.product.id}` && styles.inputFocused,
                          ]}
                          value={
                            quantityInputs[item.product.id] ??
                            item.amount.toString()
                          }
                          onChangeText={(text) =>
                            handleQuantityInputChange(item.product.id, text)
                          }
                          onEndEditing={() =>
                            commitDraftQuantityInput(item.product.id)
                          }
                          keyboardType="numeric"
                          selectTextOnFocus
                          onFocus={() => setFocusedField(`draftAmount-${item.product.id}`)}
                          onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            handleUpdateDraftAmount(
                              item.product.id,
                              item.amount + 1,
                            )
                          }
                        >
                          <Ionicons name="add" size={20} color="#08859b" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Estás agregando:</Text>
                      <Text style={styles.summaryValue}>
                        {currentDraftItem.reduce(
                          (sum, item) => sum + item.amount,
                          0,
                        )}{" x "}
                        {currentDraftItem.map((item) => item.presentationName)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal:</Text>
                      <Text style={styles.summaryValue}>
                        S/{" "}
                        {currentDraftItem
                          .reduce(
                            (sum, item) => sum + item.amount * item.unitPrice,
                            0,
                          )
                          .toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowPresentationsByProduct(false);
                  setShowProductModal(false);
                  setSearchProduct("");
                  setCurrentDraftItem([]);
                  setSelectedPresentation(null);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={() => {
                  handleAddProduct();
                  setShowPresentationsByProduct(false);
                  setShowProductModal(false);
                }}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? "Agregando..." : "Agregar al pedido"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  errorText: {
    textAlign: "center",
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    maxWidth: "70%",
  },
  dropdownCode: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  placeholder: {
    color: "#9ca3af",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#08859b",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  stepBadgeOptional: {
    backgroundColor: "#d1d5db",
  },
  stepBadgeTextOptional: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  optionalLabel: {
    fontWeight: "400",
    color: "#9ca3af",
    fontSize: 13,
  },
  itemCountBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemCountText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#08859b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonBottom: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9ca3af",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#d1d5db",
  },
  productList: {
    gap: 10,
  },
  productItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  productTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  presentationLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  productBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPrice: {
    fontSize: 13,
    color: "#6b7280",
    minWidth: 52,
  },
  multiplySign: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  equalsSign: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  quantityCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#08859b",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    padding: 5,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#16a34a",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 10,
  },
  stepperButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  amountInput: {
    width: 44,
    height: 36,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    padding: 0,
  },
  amountInputFocused: {
    borderColor: "#08859b",
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
  },
  subtotalAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#08859b",
    flex: 1,
    textAlign: "right",
  },
  dropdownSelected: {
    borderColor: "#08859b",
    backgroundColor: "#eefafc",
  },
  totalSection: {
    backgroundColor: "#eefafc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#08859b",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#08859b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: "#08859b",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  submitButton: {
    backgroundColor: "#08859b",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    minHeight: "90%",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalList: {
    maxHeight: 470,
    marginBottom: 8,
    marginHorizontal: 3,
  },
  modalOption: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    borderRadius: 8,
    marginBottom: 15,
  },
  modalOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  modalOptionTextCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  modalOptionText: {
    fontSize: 15,
    color: "#585e69",
    fontWeight: "600",
  },
  modalOptionPresentation: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 8,
  },
  modalOptionTextPresentationName: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#111827",
  },
  modalOptionTextPresentationQuantity: {
    fontSize: 12,
    color: "#6b7280",
  },
  presentationPrice: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#111827",
  },
  codeBadge: {
    backgroundColor: "#08859b",
    borderRadius: 10,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    padding: 5,
  },
  modalOptionTextAddress: {
    fontSize: 12,
    color: "#9ea1a7",
    marginTop: 3,
    marginLeft: 5,
  },
  modalOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  selectedProductHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  productIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#f4f5f7",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  selectedProductPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#16a34a", // verde, como en la imagen
    marginTop: 2,
  },
  modalOptionSubtext: {
    fontSize: 15,
    color: "#19b63b",
    marginTop: 2,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  amountSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  amountInputModal: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 6,
    fontSize: 13,
    textAlign: "center",
  },
  addProductButton: {
    backgroundColor: "#08859b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addProductButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 8,
  },
  searchInputFocused: {
    borderWidth: 1.5,
    borderColor: "#08859b",
  },
  modalOptionInCart: {
    backgroundColor: "#f0f7ff",
  },
  cartBadge: {
    backgroundColor: "#08859b",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  noResults: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
  searchingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  selectedAddress: {
    marginTop: 8,
    fontSize: 12,
    color: "#374151",
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#bfdbfe",
  },
});
