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

// Tabla: presentations
export interface Presentation {
  id: string; // uuid
  product_id: string; // uuid referencia a products
  name: string;
  unit_quantity: number; // int2
  sale_price: number; // numeric
  is_default: boolean;
  created_at: string; // timestamptz
}

// Tipo extendido: producto con sus presentaciones
export interface ProductWithPresentations extends Product {
  presentations: Presentation[];
}

// Tabla: orders
export interface Order {
  id: string; // uuid
  customer_id: string; // uuid referencia a customers
  seller_id: string; // uuid referencia a users (vendedor)
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
  presentation_name: string; // presentacion del producto
}

// Tipo para crear un nuevo pedido (antes de tener ID)
export interface NewOrder {
  customer_id: string;
  seller_id: string; // uuid referencia a users (vendedor)
  total: number;
  note?: string;
  products: {
    product_id: string;
    amount: number;
    unit_price: number;
    sub_total: number;
    presentation_name?: string;
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
  orderCount: number;
}

// Tabla: attendance (asistencia)
export interface Attendance {
  id: string; // uuid
  user_id: string; // uuid referencia a users
  date: string; // date (YYYY-MM-DD)
  entry_time?: string; // timestamp con hora de entrada
  exit_time?: string; // timestamp con hora de salida
  entry_location?: string; // ubicación GPS al registrar entrada
  exit_location?: string; // ubicación GPS al registrar salida
  status: "present" | "late" | "absent" | "half_day"; // estado de asistencia
  notes?: string; // notas adicionales
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

// Tipo extendido: asistencia con datos del usuario
export interface AttendanceWithUser extends Attendance {
  user_name: string; // nombre del usuario
  user_role: string; // rol del usuario
  initials: string; // iniciales del usuario (generadas)
}

// Tipo para crear/actualizar asistencia
export interface NewAttendance {
  user_id: string;
  date: string;
  entry_time?: string;
  exit_time?: string;
  entry_location?: string;
  exit_location?: string;
  status?: "present" | "late" | "absent" | "half_day";
  notes?: string;
}

// Tipo para respuesta de registros de asistencia
export interface AttendanceRecord {
  id: string;
  dateLabel: string;
  entryTime: string;
  exitTime: string;
  statusLabel: string;
  statusTone: "success" | "neutral" | "warning" | "error";
  entryLocation: string;
  exitLocation: string;
  workedTime: string;
}
