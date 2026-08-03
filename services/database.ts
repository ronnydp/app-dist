// services/database.ts
import { supabase } from "../lib/supabase";
import { encodeOrderObservation } from "../lib/utils/orderObservation";
import {
  Customer,
  NewOrder,
  Order,
  Presentation,
  Product,
  ProductWithPresentations,
  SellerWeeklySales,
  User,
  WeeklySales,
} from "../types";
  import { encodeOrderObservation } from "../lib/utils/orderObservation";

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const normalizeText = (text: string): string => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// ==========================================
// FUNCIONES PARA CLIENTES (CUSTOMERS)
// ==========================================

/**
 * Obtiene todos los clientes
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    throw error;
  }
};

/**
 * Obtiene clientes paginados con búsqueda server-side
 */
export const getCustomersPaginated = async (
  page: number,
  pageSize: number,
  search?: string,
  role?: string,
): Promise<{ data: Customer[]; hasMore: boolean }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let query = supabase.from("customers").select("*", { count: "exact" });

  if (role !== "admin") {
    query = query.eq("is_active", true);
  }

  if (search && search.trim()) {
    const term = search.trim();
    const normalizedTerm = normalizeText(term);
    if (/^\d+$/.test(term)) {
      query = query.or(`name.ilike.%${term}%,cod_customer.eq.${term}`);
    } else {
      query = query.ilike("name", `%${normalizedTerm}%`);
    }
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) throw error;

  // Aplicar filtro normalizador en client-side para búsquedas de texto
  let filteredData = data || [];
  if (search && search.trim() && !/^\d+$/.test(search.trim())) {
    const normalizedSearch = normalizeText(search.trim());
    filteredData = filteredData.filter((item) =>
      normalizeText(item.name).includes(normalizedSearch),
    );
  }

  return {
    data: filteredData,
    hasMore: (count ?? 0) > to + 1,
  };
};

/**
 * Busca clientes por nombre o código (para modales de selección)
 */
export const searchCustomers = async (
  term: string,
  limit: number = 50,
): Promise<Customer[]> => {
  try {
    const trimmed = term.trim();
    if (!trimmed) return [];

    let query = supabase.from("customers").select("*").eq("is_active", true);

    const isNumeric = /^\d+$/.test(trimmed);
    const normalizedTerm = normalizeText(trimmed);
    if (isNumeric) {
      query = query.or(`name.ilike.%${trimmed}%,cod_customer.eq.${trimmed}`);
    } else {
      query = query.ilike("name", `%${normalizedTerm}%`);
    }

    const { data, error } = await query
      .order("name", { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Aplicar filtro normalizador en client-side para búsquedas de texto
    let filteredData = data || [];
    if (!isNumeric) {
      filteredData = filteredData.filter((item) =>
        normalizeText(item.name).includes(normalizedTerm),
      );
    }

    return filteredData;
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    throw error;
  }
};

/**
 * Crea o actualiza un cliente
 */
export const saveCustomer = async (
  customer: Partial<Customer>,
): Promise<Customer> => {
  try {
    // Si tiene ID, actualiza. Si no, crea nuevo
    if (customer.id) {
      const { data, error } = await supabase
        .from("customers")
        .update({
          name: customer.name,
          ruc: customer.ruc,
          address: customer.address,
          district: customer.district,
          phone: customer.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customer.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: customer.name,
          ruc: customer.ruc,
          address: customer.address,
          district: customer.district,
          phone: customer.phone,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    throw error;
  }
};

/**
 * Inhabilita un cliente (soft delete)
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("customers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error al inhabilitar cliente:", error);
    throw error;
  }
};

/**
 * Habilita un cliente dado de baja
 */
export const activateCustomer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("customers")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error al habilitar cliente:", error);
    throw error;
  }
};

// ==========================================
// FUNCIONES PARA PRODUCTOS (PRODUCTS)
// ==========================================

/**
 * Obtiene todos los productos
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

/**
 * Obtiene productos paginados con búsqueda server-side
 */
export const getProductsPaginated = async (
  page: number,
  pageSize: number,
  search?: string,
  role?: string,
): Promise<{ data: ProductWithPresentations[]; hasMore: boolean }> => {
  await supabase.auth.getSession();

  let query = supabase
    .from("products")
    .select("*, presentations(*)", { count: "exact" });

  if (role !== "admin") {
    query = query.eq("is_active", true);
  }

  if (search && search.trim()) {
    const normalizedSearch = normalizeText(search.trim());
    query = query.ilike("name", `%${normalizedSearch}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) throw error;

  // Ordenar presentaciones: default primero
  const products = (data || []).map((p: any) => ({
    ...p,
    presentations: (p.presentations || []).sort(
      (a: Presentation, b: Presentation) =>
        a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1,
    ),
  }));

  // Aplicar filtro normalizador en client-side para búsquedas de texto
  let filteredProducts = products;
  if (search && search.trim()) {
    const normalizedSearch = normalizeText(search.trim());
    filteredProducts = filteredProducts.filter((item) =>
      normalizeText(item.name).includes(normalizedSearch),
    );
  }

  return {
    data: filteredProducts,
    hasMore: (count ?? 0) > to + 1,
  };
};

/**
 * Crea o actualiza un producto
 */
export const saveProduct = async (
  product: Partial<Product>,
): Promise<Product> => {
  try {
    if (product.id) {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        })
        .eq("id", product.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error al guardar producto:", error);
    throw error;
  }
};

/**
 * Inhabilita un producto (soft delete)
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error al inhabilitar producto:", error);
    throw error;
  }
};

/**
 * Habilita un producto dado de baja
 */
export const activateProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("products")
      .update({ is_active: true })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error al habilitar producto:", error);
    throw error;
  }
};

// ==========================================
// FUNCIONES PARA PRESENTACIONES (PRESENTATIONS)
// ==========================================

/**
 * Obtiene las presentaciones de un producto
 */
export const getPresentationsByProduct = async (
  productId: string,
): Promise<Presentation[]> => {
  try {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("product_id", productId)
      .order("is_default", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener presentaciones:", error);
    throw error;
  }
};

/**
 * Guarda las presentaciones de un producto (reemplaza todas las existentes)
 */
export const savePresentations = async (
  productId: string,
  presentations: Omit<Presentation, "id" | "product_id" | "created_at">[],
): Promise<Presentation[]> => {
  try {
    // Eliminar presentaciones existentes del producto
    const { error: deleteError } = await supabase
      .from("presentations")
      .delete()
      .eq("product_id", productId);

    if (deleteError) throw deleteError;

    if (presentations.length === 0) return [];

    // Insertar las nuevas presentaciones
    const rows = presentations.map((p) => ({
      product_id: productId,
      name: p.name,
      unit_quantity: p.unit_quantity,
      sale_price: p.sale_price,
      is_default: p.is_default,
    }));

    const { data, error } = await supabase
      .from("presentations")
      .insert(rows)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al guardar presentaciones:", error);
    throw error;
  }
};

// ==========================================
// FUNCIONES PARA PEDIDOS (ORDERS)
// ==========================================

/**
 * Obtiene todos los pedidos con información del cliente
 */
export type GetOrdersParams = {
  sellerId?: string;
};

export const getOrders = async (params: GetOrdersParams = {}) => {
  try {
    const { sellerId } = params;

    // Traer pedidos con product_orders
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        customers (name, address, district, cod_customer, phone),
        users!seller_id (name),
        product_orders (*)
      `,
      )
      .order("date", { ascending: false });

    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Traer todos los productos para mapeo
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name");

    if (productsError) throw productsError;

    // Crear mapa de productos para búsqueda rápida
    const productMap = new Map(
      productsData?.map((p: any) => [p.id, p.name]) || [],
    );

    // Transformar datos para que coincidan con OrderWithDetails
    const transformedData = (data || []).map((order: any) => ({
      ...order,
      customer_name: order.customers?.name || "",
      customer_address: order.customers?.address || "",
      customer_district: order.customers?.district || "",
      customer_cod: order.customers?.cod_customer || 0,
      customer_phone: order.customers?.phone || "",
      seller_name: order.users?.name || "",
      products: (order.product_orders || []).map((po: any) => ({
        ...po,
        product_name: productMap.get(po.product_id) || "Producto desconocido",
      })),
    }));

    return transformedData;
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    throw error;
  }
};

/**
 * Crea un nuevo pedido con sus productos
 */
export const createOrder = async (order: NewOrder): Promise<Order> => {
  try {
    // 1. Crear el pedido
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: order.customer_id,
        seller_id: order.seller_id,
        total: order.total,
        date: order.date || new Date().toISOString(),
        note: order.note,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Crear los productos del pedido
    const productsList = order.products || [];
    const productOrders = productsList.map((p) => ({
      order_id: newOrder.id,
      product_id: p.product_id,
      amount: p.amount,
      unit_price: p.unit_price,
      sub_total: p.sub_total,
    }));

    const { error: productsError } = await supabase
      .from("product_orders")
      .insert(productOrders);

    if (productsError) throw productsError;

    return newOrder;
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

export const saveOrderObservation = async (
  orderId: string,
  sellerId: string,
  observation: string,
): Promise<void> => {
  const trimmedObservation = observation.trim();
  if (!trimmedObservation) {
    throw new Error("La observación no puede estar vacía");
  }

  try {
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("id, seller_id, note")
      .eq("id", orderId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!orderData) {
      throw new Error("No autorizado para observar este pedido");
    }

    const encodedNote = encodeOrderObservation(
      trimmedObservation,
      new Date().toISOString(),
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({ note: encodedNote })
      .eq("id", orderId)
      .eq("seller_id", sellerId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error al guardar observación del pedido:", error);
    throw error;
  }
};

/**
 * Obtiene el total vendido en la semana actual (lunes a sábado)
 * para un vendedor específico, con desglose diario.
 */
export const getWeeklySalesTotal = async (
  sellerId: string,
): Promise<WeeklySales> => {
  const now = new Date();
  const { start: startOfWeek, end: endOfWeek } = getWeekBounds(now);

  const startStr = formatLocalDate(startOfWeek);
  const endStr = formatLocalDate(endOfWeek);

  const { data, error } = await supabase
    .from("orders")
    .select("total, date")
    .eq("seller_id", sellerId)
    .gte("date", startStr)
    .lte("date", endStr);

  if (error) throw error;

  const orders = data || [];
  const weekTotal = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const daily: WeeklySales["daily"] = [];

  for (let i = 0; i < dayNames.length; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = formatLocalDate(d);
    const dayTotal = orders
      .filter((o) => o.date?.startsWith(dateStr))
      .reduce((sum, o) => sum + (o.total || 0), 0);
    daily.push({ date: dateStr, dayLabel: dayNames[i], total: dayTotal });
  }

  return { total: weekTotal, daily };
};

/**
 * Obtiene el resumen semanal de TODOS los vendedores (para admin).
 */
export const getAllSellersWeeklySales = async (): Promise<
  SellerWeeklySales[]
> => {
  const now = new Date();
  const { start: startOfWeek, end: endOfWeek } = getWeekBounds(now);

  const startStr = formatLocalDate(startOfWeek);
  const endStr = formatLocalDate(endOfWeek);

  const { data, error } = await supabase
    .from("orders")
    .select("total, date, seller_id, users!seller_id (name)")
    .gte("date", startStr)
    .lte("date", endStr);

  if (error) throw error;

  const orders = data || [];

  // Agrupar por vendedor
  const sellerMap = new Map<string, { name: string; orders: typeof orders }>();
  for (const order of orders) {
    const id = order.seller_id;
    const name = (order as any).users?.name || "Sin nombre";
    if (!sellerMap.has(id)) {
      sellerMap.set(id, { name, orders: [] });
    }
    sellerMap.get(id)!.orders.push(order);
  }

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const todayStr = formatLocalDate(now);

  const result: SellerWeeklySales[] = [];
  for (const [sellerId, { name, orders: sellerOrders }] of sellerMap) {
    const total = sellerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const daily: WeeklySales["daily"] = [];
    const todayOrderCount = sellerOrders.filter((o) =>
      o.date?.startsWith(todayStr),
    ).length;

    for (let i = 0; i < dayNames.length; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = formatLocalDate(d);
      const dayTotal = sellerOrders
        .filter((o) => o.date?.startsWith(dateStr))
        .reduce((sum, o) => sum + (o.total || 0), 0);
      daily.push({ date: dateStr, dayLabel: dayNames[i], total: dayTotal });
    }

    result.push({
      sellerId,
      sellerName: name,
      total,
      daily,
      orderCount: todayOrderCount,
    });
  }

  // Ordenar por total descendente
  result.sort((a, b) => b.total - a.total);
  return result;
};

export const getUsers = async () => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener usuarios: ", error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener usuario por id:", error);
    throw error;
  }
};

export type SellerProfileStats = {
  todayOrderCount: number;
  weekOrderCount: number;
  currentWeekTotal: number;
  previousWeekTotal: number;
};

const getWeekBounds = (date: Date, weekOffset = 0) => {
  const baseDate = new Date(date);
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const day = baseDate.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    start: startOfWeek,
    end: endOfWeek,
    startStr: formatLocalDate(startOfWeek),
    endStr: formatLocalDate(endOfWeek),
  };
};

export const getSellerProfileStats = async (
  sellerId: string,
): Promise<SellerProfileStats> => {
  try {
    const now = new Date();
    const currentWeek = getWeekBounds(now);
    const previousWeek = getWeekBounds(now, -1);
    const todayStr = formatLocalDate(now);

    const [currentWeekResult, previousWeekResult] = await Promise.all([
      supabase
        .from("orders")
        .select("total, date")
        .eq("seller_id", sellerId)
        .gte("date", currentWeek.startStr)
        .lte("date", currentWeek.endStr),
      supabase
        .from("orders")
        .select("total")
        .eq("seller_id", sellerId)
        .gte("date", previousWeek.startStr)
        .lte("date", previousWeek.endStr),
    ]);

    if (currentWeekResult.error) throw currentWeekResult.error;
    if (previousWeekResult.error) throw previousWeekResult.error;

    const currentWeekOrders = currentWeekResult.data || [];
    const previousWeekOrders = previousWeekResult.data || [];

    return {
      todayOrderCount: currentWeekOrders.filter((order) =>
        order.date?.startsWith(todayStr),
      ).length,
      weekOrderCount: currentWeekOrders.length,
      currentWeekTotal: currentWeekOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      ),
      previousWeekTotal: previousWeekOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      ),
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del perfil:", error);
    throw error;
  }
};
