# 🚀 GUÍA DE INSTALACIÓN - ASISTENCIA BACKEND

## Paso 1: Configurar Base de Datos en Supabase ⚙️

### 1.1 Crear tabla `attendance`

1. Ve a tu proyecto Supabase
2. Ve a SQL Editor
3. Copia todo el contenido de `docs/attendance_schema.sql`
4. Ejecuta el script

**Lo que se ejecuta:**
- ✅ Tabla `attendance` con todos los campos
- ✅ Índices para performance
- ✅ RLS (Row Level Security) habilitado
- ✅ Políticas de seguridad
- ✅ Triggers para actualizar `updated_at`
- ✅ Funciones auxiliares

### 1.2 Verificar tabla `users`

La tabla `users` debe existir con estos campos:
- `id` (UUID)
- `email` (varchar)
- `name` (varchar) - Requerido
- `role` (varchar) - Requerido ('admin' o 'user')
- `phone` (varchar)
- `is_active` (boolean)

Si falta el campo `name` o `role`, agregarlos:

```sql
-- Si falta name
ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT 'Sin nombre';

-- Si falta role
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
```

### 1.3 Verificar RLS está habilitado

```sql
-- Verificar que RLS está activo
SELECT tablename FROM pg_tables 
WHERE tablename = 'attendance' AND schemaname = 'public';

-- Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'attendance';
```

---

## Paso 2: Verificar Archivos del Código ✅

### 2.1 Verificar que existan los archivos creados

```
✅ services/attendance.ts (NUEVO)
✅ types/index.ts (MODIFICADO)
✅ app/(tabs)/asistencia.tsx (MODIFICADO)
✅ app/attendanceAdmin.tsx (MODIFICADO)
✅ app/detailAttendance.tsx (MODIFICADO)
✅ docs/ATTENDANCE_INTEGRATION.md (NUEVO)
✅ docs/CHANGES_SUMMARY.md (NUEVO)
✅ docs/VERIFICATION_CHECKLIST.md (NUEVO)
✅ docs/attendance_schema.sql (NUEVO)
```

### 2.2 Verificar imports en asistencia.tsx

```typescript
// Debe tener estos imports
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import * as attendanceService from '@/services/attendance';
import { AttendanceRecord, Attendance } from '@/types';
```

### 2.3 Verificar imports en attendanceAdmin.tsx

```typescript
// Debe tener estos imports
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import * as attendanceService from '@/services/attendance';
import { AttendanceWithUser } from '@/types';
```

---

## Paso 3: Crear Usuarios de Prueba 🧪

### 3.1 En Supabase Auth

1. Ve a Authentication → Users
2. Crea usuario para Empleado:
   - Email: `empleado@demo.com`
   - Password: `Demo123!`
3. Crea usuario para Admin:
   - Email: `admin@demo.com`
   - Password: `Demo123!`

### 3.2 Actualizar tabla users

```sql
-- Buscar IDs de los usuarios creados en auth
SELECT id, email FROM auth.users;

-- Actualizar datos en tabla public.users
UPDATE users 
SET 
  name = 'Carlos Mendoza',
  role = 'user',
  is_active = true
WHERE email = 'empleado@demo.com';

UPDATE users 
SET 
  name = 'Admin Sistema',
  role = 'admin',
  is_active = true
WHERE email = 'admin@demo.com';

-- Crear más empleados si es necesario
INSERT INTO users (id, email, name, role, is_active) VALUES
  (gen_random_uuid(), 'luis@demo.com', 'Luis Ramírez', 'user', true),
  (gen_random_uuid(), 'andrea@demo.com', 'Andrea Quispe', 'user', true),
  (gen_random_uuid(), 'miguel@demo.com', 'Miguel Torres', 'user', true);
```

---

## Paso 4: Probar la Integración 🧪

### 4.1 Test 1: Marcar Entrada

```
1. Ejecuta: npm run dev (o expo start)
2. Login con empleado@demo.com / Demo123!
3. Navega a Asistencia
4. Click "Marcar entrada"

❌ ERROR → Revisar:
   - ¿Token autenticación válido?
   - ¿Tabla attendance existe?
   - ¿RLS permite insert?

✅ ÉXITO → Debe ver:
   - Toast: "Entrada registrada a las XX:XX"
   - Hora de entrada actualizada
   - Botón "Marcar entrada" deshabilitado
```

### 4.2 Test 2: Marcar Salida

```
1. Mismo usuario, misma pantalla
2. Click "Marcar salida"

❌ ERROR → Revisar:
   - ¿Existe registro de entrada?
   - ¿RLS permite update?

✅ ÉXITO → Debe ver:
   - Toast: "Salida registrada a las XX:XX"
   - Hora de salida actualizada
   - Horas trabajadas calculadas
   - Botón "Marcar salida" deshabilitado
```

### 4.3 Test 3: Ver Historial

```
1. Recargar pantalla (volver atrás y volver)
2. Debe mostrar último registro en historial

❌ ERROR → Revisar:
   - ¿Query getUserAttendanceHistory retorna datos?
   - ¿Datos formateados correctamente?

✅ ÉXITO → Debe ver:
   - Historial con fecha formateada
   - Entrada y salida
   - Horas trabajadas
   - Estado (Completo, Presente, etc.)
```

### 4.4 Test 4: Panel Admin

```
1. Logout del empleado
2. Login con admin@demo.com / Demo123!
3. Navega a Asistencia

❌ ERROR → Revisar:
   - ¿role = 'admin' está en users?
   - ¿Query getAttendanceByDate retorna datos?

✅ ÉXITO → Debe ver:
   - Lista de TODOS los empleados
   - Estados correctamente mostrados
   - Filtros y búsqueda funcionando
   - Click en empleado → detalle
```

### 4.5 Test 5: Sincronización BD

```
1. Registrar asistencia en app
2. Abrir Supabase SQL Editor
3. Ejecutar:
   SELECT * FROM attendance 
   WHERE date = CURRENT_DATE 
   ORDER BY created_at DESC;

❌ NO VES DATOS → Revisar:
   - ¿RLS permite SELECT?
   - ¿user_id es correcto?
   - ¿date está en formato correcto?

✅ VES DATOS → Verificar:
   - entry_time y exit_time con valores
   - status correcto
   - location guardado
   - created_at y updated_at actualizados
```

---

## Paso 5: Debugging 🔧

### 5.1 Ver logs en consola

```typescript
// Los servicios loguean errores automáticamente
// Abre DevTools (Ctrl+Shift+I) → Console
// Busca errores de tipo:
// "Error al registrar entrada:"
// "Error al obtener asistencia:"
```

### 5.2 Verificar permisos RLS

```sql
-- Como admin, ejecuta:
SELECT * FROM attendance WHERE user_id = 'TU_USER_ID';

-- Debe retornar tus registros
-- Si retorna vacio = problema de RLS o user_id
```

### 5.3 Verificar datos en Supabase

```sql
-- Ver todos los registros de hoy
SELECT a.*, u.name, u.role 
FROM attendance a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.date = CURRENT_DATE
ORDER BY a.created_at DESC;

-- Ver registros de un usuario específico
SELECT * FROM attendance 
WHERE user_id = 'UUID_DEL_USUARIO'
ORDER BY date DESC LIMIT 10;
```

---

## Paso 6: Solución de Problemas 🚨

### Problema: "No autorizado para acceder a la tabla"

**Solución:**
```sql
-- Verificar que RLS está habilitado
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Verificar que la política existe
SELECT * FROM pg_policies WHERE tablename = 'attendance';

-- Si no existen, ejecutar attendance_schema.sql nuevamente
```

### Problema: "Usuario no autenticado"

**Solución:**
1. Verificar que `supabase.auth.getSession()` retorna sesión
2. Verificar que token es válido
3. Hacer logout/login

### Problema: "Tabla attendance no existe"

**Solución:**
1. Ir a Supabase SQL Editor
2. Ejecutar: `SELECT * FROM attendance LIMIT 1;`
3. Si falla, ejecutar `attendance_schema.sql` completo

### Problema: "No puedo ver datos como admin"

**Solución:**
1. Verificar que rol = 'admin' en tabla users
2. Ejecutar esta query como admin:
   ```sql
   SELECT * FROM attendance LIMIT 1;
   ```
3. Si falla, política RLS no está permitiendo

---

## Verificación Final ✅

Marca como completado cada paso:

- [ ] Tabla `attendance` creada en Supabase
- [ ] Tabla `users` tiene campos `name` y `role`
- [ ] RLS habilitado en tabla `attendance`
- [ ] Políticas de seguridad creadas
- [ ] Archivos de código copiados correctamente
- [ ] Usuarios de prueba creados
- [ ] Test 1: Marcar entrada ✅
- [ ] Test 2: Marcar salida ✅
- [ ] Test 3: Ver historial ✅
- [ ] Test 4: Panel admin ✅
- [ ] Test 5: Datos en Supabase ✅
- [ ] Todos los tests pasan ✅

---

## 🎉 ¡LISTO!

Una vez completados todos los pasos, tu sistema de asistencia está **100% funcional** y conectado al backend.

**Próximos pasos:**
1. Crear más usuarios de prueba
2. Probar en dispositivo real
3. Validar datos en reportes
4. Implementar notificaciones (opcional)
5. Agregar estadísticas y gráficos (opcional)

**Soporte:**
- Revisar `CHANGES_SUMMARY.md` para entender los cambios
- Revisar `VERIFICATION_CHECKLIST.md` para verificación completa
- Revisar `ATTENDANCE_INTEGRATION.md` para documentación detallada

---

**¡Éxito con tu integración! 🚀**
