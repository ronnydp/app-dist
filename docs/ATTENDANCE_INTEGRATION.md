# Integración del Backend para Asistencia ✅

## Resumen de Cambios

Se ha implementado una integración completa del backend para la funcionalidad de **Asistencia** en la aplicación móvil. Todos los componentes ahora se conectan a Supabase en lugar de usar datos mockeados.

---

## 📦 1. Tipos de Datos Definidos (`types/index.ts`)

Se agregaron nuevas interfaces para manejar la asistencia:

```typescript
// Tabla: attendance (asistencia)
interface Attendance {
  id: string;
  user_id: string;
  date: string;
  entry_time?: string;
  exit_time?: string;
  location?: string;
  status: 'present' | 'late' | 'absent' | 'half_day';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Tipo extendido con datos del usuario
interface AttendanceWithUser extends Attendance {
  user_name: string;
  user_role: string;
  initials: string;
}

// Tipo para registro histórico formateado
interface AttendanceRecord {
  id: string;
  dateLabel: string;
  entryTime: string;
  exitTime: string;
  statusLabel: string;
  statusTone: 'success' | 'neutral' | 'warning' | 'error';
  location: string;
  workedTime: string;
}
```

---

## 🔧 2. Servicio de Asistencia (`services/attendance.ts`)

Se creó un nuevo servicio completo con las siguientes funciones:

### Funciones Principales:

#### `getTodayAttendance()`
- Obtiene el registro de asistencia del usuario actual para hoy
- Retorna: `Attendance | null`

#### `registerEntry(location?: string)`
- Registra la entrada del usuario
- Crea o actualiza el registro de asistencia
- Retorna: `Attendance`

#### `registerExit(location?: string)`
- Registra la salida del usuario
- Actualiza el registro existente
- Retorna: `Attendance`

#### `getUserAttendanceHistory(limit?: number)`
- Obtiene el historial de asistencia del usuario actual
- Formatea los datos para mostrar en la UI
- Retorna: `AttendanceRecord[]`

#### `getAttendanceByDate(date?: string)`
- Obtiene la asistencia de TODOS los empleados para una fecha (Admin)
- Incluye datos del usuario (nombre, rol, iniciales)
- Retorna: `AttendanceWithUser[]`

#### `getUserAttendanceRange(userId, startDate, endDate)`
- Obtiene asistencia de un usuario en un rango de fechas
- Retorna: `Attendance[]`

#### `saveAttendance(attendance)`
- Crea o actualiza manualmente un registro (Admin)
- Retorna: `Attendance`

#### `getAttendanceStats(userId, startDate, endDate)`
- Estadísticas de asistencia (presente, tardanza, ausente, media jornada)
- Retorna: Objeto con conteos

### Funciones Auxiliares Internas:
- `formatLocalDate()` - Formatea fechas como YYYY-MM-DD
- `formatTimeLabel()` - Formatea horas en formato 12h español
- `formatDateLabel()` - Formatea fechas en español completo
- `calculateWorkedTime()` - Calcula horas trabajadas
- `getInitials()` - Genera iniciales del nombre

---

## 🎨 3. Componentes Actualizados

### A. **asistencia.tsx** (Pantalla del Empleado)

**Cambios principales:**
- ✅ Importa servicios de asistencia
- ✅ Usa `useFocusEffect` para recargar datos cuando se ve la pantalla
- ✅ Carga la asistencia de hoy desde Supabase
- ✅ Registra entrada y salida en el backend
- ✅ Muestra historial de asistencia real
- ✅ Muestra loader mientras carga
- ✅ Maneja errores con toast notifications

**Estado del componente:**
```typescript
const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
const [history, setHistory] = useState<AttendanceRecord[]>([]);
const [loading, setLoading] = useState(false);
```

**Flujo de datos:**
1. Al cargar: obtiene asistencia de hoy e historial (últimos 10 registros)
2. Al marcar entrada: registra en BD y actualiza estado
3. Al marcar salida: registra en BD y actualiza estado
4. Al volver a la pantalla: recarga datos automáticamente

---

### B. **attendanceAdmin.tsx** (Pantalla del Admin)

**Cambios principales:**
- ✅ Carga lista de asistencia de TODOS los empleados
- ✅ Usa `useFocusEffect` para recargar datos
- ✅ Calcula dinámicamente estados (presente, tardanza, ausente, media jornada)
- ✅ Permite filtrar por estado o buscar por nombre
- ✅ Muestra loader mientras carga
- ✅ Permite refresh (pull-to-refresh) con `onRefresh`

**Mapeo de estado:**
- `status: 'present'` → Presente (success/verde)
- `status: 'late'` → Tardanza (warning/amarillo)
- `status: 'half_day'` → Media jornada (warning/amarillo)
- Sin entrada → Ausente (error/rojo)

---

### C. **detailAttendance.tsx** (Detalle de Asistencia)

**Cambios principales:**
- ✅ Recibe parámetros de navegación
- ✅ Muestra datos del empleado (nombre, rol, iniciales)
- ✅ Muestra entrada, salida y tiempo trabajado
- ✅ Muestra estado y ubicación
- ✅ Usa valores por defecto cuando no hay parámetros

---

## 🔄 Flujo de Datos

### Para Empleados:
```
asistencia.tsx
    ↓
loadAttendanceData()
    ↓
getTodayAttendance() + getUserAttendanceHistory()
    ↓
Supabase BD (tabla attendance)
    ↓
Mostrar en UI
    ↓
[Click entrada/salida]
    ↓
registerEntry()/registerExit()
    ↓
Actualizar en Supabase
    ↓
Refrescar UI
```

### Para Administradores:
```
asistencia.tsx (con role='admin')
    ↓
AttendanceAdminScreen
    ↓
loadAttendanceData()
    ↓
getAttendanceByDate()
    ↓
Supabase BD (tabla attendance + users)
    ↓
Formatear datos
    ↓
Mostrar lista en FlatList
    ↓
[Click en empleado]
    ↓
Navegar a detailAttendance con parámetros
```

---

## 🗄️ Estructura de Base de Datos Requerida

Se requiere la siguiente tabla en Supabase:

```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  location VARCHAR(255),
  status VARCHAR(20) CHECK (status IN ('present', 'late', 'absent', 'half_day')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date) -- Un registro por usuario por día
);

-- Índices para mejor rendimiento
CREATE INDEX attendance_user_date_idx ON attendance(user_id, date);
CREATE INDEX attendance_date_idx ON attendance(date);
```

---

## 🎯 Funcionalidades Implementadas

### Para Empleados:
- ✅ Ver asistencia de hoy (entrada, salida, estado)
- ✅ Registrar entrada con ubicación
- ✅ Registrar salida con ubicación
- ✅ Ver historial de últimas 10 asistencias
- ✅ Calcular automáticamente horas trabajadas
- ✅ Ver ubicación en mapa
- ✅ Validaciones (no permitir entrada doble, etc.)

### Para Administradores:
- ✅ Ver lista de asistencia de TODOS los empleados
- ✅ Ver nombre, rol, entrada, salida, estado
- ✅ Filtrar por estado (Presente, Tardanza, Ausente, Media jornada)
- ✅ Buscar por nombre de empleado
- ✅ Click para ver detalles completos
- ✅ Refresh automático al volver a la pantalla
- ✅ Pull-to-refresh manual

---

## 🚨 Manejo de Errores

Todos los servicios incluyen:
- ✅ Try-catch blocks
- ✅ Validaciones de entrada
- ✅ Mensajes de error descriptivos
- ✅ Toast notifications para feedback
- ✅ Logging en consola para debugging

---

## 📱 Estados de Carga

Los componentes muestran:
- ✅ `ActivityIndicator` mientras cargan datos
- ✅ Textos informativos cuando no hay datos
- ✅ Refresh automático al volver a la pantalla
- ✅ Pull-to-refresh en la lista del admin

---

## 🔐 Seguridad

- ✅ Solo usuarios autenticados pueden registrar asistencia
- ✅ Los usuarios normales solo ven sus propios datos
- ✅ Los admins ven datos de todos
- ✅ Se valida user_id del token actual

---

## 🧪 Cómo Probar

### Para Empleado:
1. Navegar a la pantalla de Asistencia
2. Click en "Marcar entrada" → Debe registrarse en BD
3. Click en "Marcar salida" → Debe registrarse en BD
4. Ver historial actualizado
5. Volver atrás y volver a entrar → Debe cargar datos del servidor

### Para Admin:
1. Ir con cuenta admin a Asistencia
2. Ver lista de empleados del día
3. Filtrar por estado
4. Buscar por nombre
5. Click en empleado → Ver detalles
6. Pull-to-refresh → Debe recargar datos

---

## 📋 Checklist de Implementación

- ✅ Tipos TypeScript definidos
- ✅ Servicio de asistencia creado
- ✅ Pantalla de empleado conectada
- ✅ Pantalla de admin conectada
- ✅ Pantalla de detalle actualizada
- ✅ Validaciones de negocio
- ✅ Manejo de errores
- ✅ Loading states
- ✅ Formateo de fechas/horas
- ✅ Cálculo de horas trabajadas

---

## 🎉 Resultado Final

La funcionalidad de asistencia está **completamente conectada al backend** y lista para ser utilizada. Todos los datos son persistentes, se sincronizan en tiempo real con Supabase y ofrecen una experiencia de usuario completa tanto para empleados como para administradores.
