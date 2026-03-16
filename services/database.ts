// services/database.ts
import { supabase } from '../lib/supabase';
import { Customer, NewOrder, Order, Product } from '../types';

// ==========================================
// FUNCIONES PARA CLIENTES (CUSTOMERS)
// ==========================================

/**
 * Obtiene todos los clientes
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

/**
 * Obtiene clientes paginados con búsqueda server-side
 */
export const getCustomersPaginated = async (
  page: number,
  pageSize: number,
  search?: string
): Promise<{ data: Customer[]; hasMore: boolean }> => {
  // Esperar a que la sesión esté lista (evita error al arrancar la app)
  await supabase.auth.getSession();

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  if (search && search.trim()) {
    const term = search.trim();
    if (/^\d+$/.test(term)) {
      query = query.or(`name.ilike.%${term}%,cod_customer.eq.${term}`);
    } else {
      query = query.ilike('name', `%${term}%`);
    }
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to);

  if (error) throw error;
  return {
    data: data || [],
    hasMore: (count ?? 0) > to + 1,
  };
};

/**
 * Busca clientes por nombre o código (para modales de selección)
 */
export const searchCustomers = async (
  term: string,
  limit: number = 50
): Promise<Customer[]> => {
  try {
    const trimmed = term.trim();
    if (!trimmed) return [];

    let query = supabase.from('customers').select('*');

    const isNumeric = /^\d+$/.test(trimmed);
    if (isNumeric) {
      query = query.or(`name.ilike.%${trimmed}%,cod_customer.eq.${trimmed}`);
    } else {
      query = query.ilike('name', `%${trimmed}%`);
    }

    const { data, error } = await query
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    throw error;
  }
};

/**
 * Crea o actualiza un cliente
 */
export const saveCustomer = async (customer: Partial<Customer>): Promise<Customer> => {
  try {
    // Si tiene ID, actualiza. Si no, crea nuevo
    if (customer.id) {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          ruc: customer.ruc,
          address: customer.address,
          district: customer.district,
          phone: customer.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('customers')
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
    console.error('Error al guardar cliente:', error);
    throw error;
  }
};

/**
 * Elimina un cliente
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
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
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

/**
 * Obtiene productos paginados con búsqueda server-side
 */
export const getProductsPaginated = async (
  page: number,
  pageSize: number,
  search?: string
): Promise<{ data: Product[]; hasMore: boolean }> => {
  await supabase.auth.getSession();

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  if (search && search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to);

  if (error) throw error;
  return {
    data: data || [],
    hasMore: (count ?? 0) > to + 1,
  };
};

/**
 * Crea o actualiza un producto
 */
export const saveProduct = async (product: Partial<Product>): Promise<Product> => {
  try {
    if (product.id) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        })
        .eq('id', product.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('products')
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
    console.error('Error al guardar producto:', error);
    throw error;
  }
};

/**
 * Elimina un producto
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    throw error;
  }
};

// ==========================================
// FUNCIONES PARA PEDIDOS (ORDERS)
// ==========================================

/**
 * Obtiene todos los pedidos con información del cliente
 */
export const getOrders = async () => {
  try {
    // Traer pedidos con product_orders
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (name, address, district, cod_customer),
        users!seller_id (name),
        product_orders (*)
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    // Traer todos los productos para mapeo
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name');

    if (productsError) throw productsError;

    // Crear mapa de productos para búsqueda rápida
    const productMap = new Map(productsData?.map((p: any) => [p.id, p.name]) || []);

    // Transformar datos para que coincidan con OrderWithDetails
    const transformedData = (data || []).map((order: any) => ({
      ...order,
      customer_name: order.customers?.name || '',
      customer_address: order.customers?.address || '',
      customer_district: order.customers?.district || '',
      customer_cod: order.customers?.cod_customer || 0,
      seller_name: order.users?.name || '',
      products: (order.product_orders || []).map((po: any) => ({
        ...po,
        product_name: productMap.get(po.product_id) || 'Producto desconocido',
      })),
    }));

    return transformedData;
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
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
      .from('orders')
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
      .from('product_orders')
      .insert(productOrders);

    if (productsError) throw productsError;

    return newOrder;
  } catch (error) {
    console.error('Error al crear pedido:', error);
    throw error;
  }
};