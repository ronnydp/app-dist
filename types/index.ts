// Tabla: customers
export interface Customer {
  id: string; // uuid
  name: string;
  ruc?: string;
  address: string;
  district: string;
  phone?: string;
  cod_customer: number; // auto-generado
  is_active: boolean;
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

// Tabla: products
export interface Product {
  id: string; // uuid
  name: string;
  price: number; // numeric
  image_url?: string;
  is_active: boolean;
  created_at: string; // timestamp
}

// Tabla: orders
export interface Order {
  id: string; // uuid
  customer_id: string; // uuid referencia a customers
  seller_id: string // uuid referencia a users (vendedor)
  total: number; // numeric
  date: string; // timestamp
  note?: string;
  created_at: string; // timestamp
}

// Tabla: product_orders (relación muchos a muchos)
export interface ProductOrder {
  order_id: string; // uuid referencia a orders
  product_id: string; // uuid referencia a products
  amount: number; // cantidad (debe ser > 0)
  unit_price: number; // numeric
  sub_total: number; // numeric
}

// Tipos extendidos para uso en la app (con datos relacionados)
export interface OrderWithDetails extends Order {
  customer_name: string; // nombre del cliente
  customer_address: string; // dirección del cliente
  customer_district: string; // distrito del cliente
  customer_cod: number; // código del cliente
  customer_phone?: string; // teléfono del cliente
  seller_name: string; // nombre del vendedor
  products: ProductOrderWithDetails[]; // productos del pedido
}

export interface ProductOrderWithDetails extends ProductOrder {
  product_name: string; // nombre del producto
}

// Tipo para crear un nuevo pedido (antes de tener ID)
export interface NewOrder {
  customer_id: string;
  seller_id: string; // uuid referencia a users (vendedor)
  total: number;
  date: string;
  note?: string;
  products: {
    product_id: string;
    amount: number;
    unit_price: number;
    sub_total: number;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para resumen semanal de ventas
export interface DailySale {
  date: string;
  dayLabel: string;
  total: number;
}

export interface WeeklySales {
  total: number;
  daily: DailySale[];
}

export interface SellerWeeklySales extends WeeklySales {
  sellerId: string;
  sellerName: string;
}