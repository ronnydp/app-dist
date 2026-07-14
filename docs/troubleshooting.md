# Troubleshooting

Registro de bugs difíciles de diagnosticar y sus soluciones, para no volver a perder tiempo en ellos.

---

## Sesión de Supabase: cuelgues en web y al volver de background

**Fecha:** Julio 2026
**Síntomas:**
- En web, la carga de clientes, productos o pedidos a veces se quedaba en "cargando" indefinidamente, sin error visible. Solo se solucionaba recargando la página completa.
- En mobile y web, al minimizar la app / cambiar de pestaña y volver, las pantallas de clientes y productos también se quedaban sin cargar.

**Causa raíz:**
Ambos síntomas vienen del mismo origen: el manejo interno de sesión de `supabase-js` (`gotrue-js`).

1. **Web:** `supabase-js` usa `navigator.locks` para serializar operaciones de auth (evitar refrescos concurrentes de token). Este lock podía quedar atascado — cualquier operación que dependiera de sesión se quedaba esperando el lock para siempre. Confirmado en consola con:
   ```
   Lock "lock:sb-xxxxx-auth-token" acquisition timed out after 10000ms.
   This may be caused by another operation holding the lock.
   ```
2. **Mobile + Web:** el auto-refresh de token de Supabase seguía intentando operar en segundo plano sin saber que la app/pestaña estaba inactiva. Al volver, esa operación podía quedar en un estado inconsistente y bloquear las siguientes queries.

**Solución:**

1. Se cambió el mecanismo de lock del cliente de Supabase a `processLock` (incluido en el propio paquete `@supabase/supabase-js`, no requiere instalar nada nuevo):

   ```ts
   // lib/supabase.ts
   import { createClient, processLock } from '@supabase/supabase-js';

   export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
       auth: {
           storage: isServer ? undefined : AsyncStorage,
           autoRefreshToken: true,
           persistSession: true,
           detectSessionInUrl: false,
           lock: isServer ? undefined : processLock,
       },
   });
   ```

2. Se agregó un listener de `AppState` en el layout raíz para pausar/reanudar el auto-refresh según si la app está activa o en segundo plano:

   ```tsx
   // app/_layout.tsx
   useEffect(() => {
       const subscription = AppState.addEventListener('change', (state) => {
           if (state === 'active') {
               supabase.auth.startAutoRefresh();
           } else {
               supabase.auth.stopAutoRefresh();
           }
       });

       return () => {
           subscription.remove();
       };
   }, []);
   ```

**Referencias:**
- https://supabase.com/docs/reference/javascript/auth-startautorefresh
- https://github.com/supabase/gotrue-js (manejo de locks)

---

## `ConfirmDialog` desmontado prematuramente durante logout

**Fecha:** Julio 2026
**Síntoma:** el spinner de carga no aparecía durante el logout en `SessionActionsMenu`, aunque el mismo componente `ConfirmDialog` funcionaba bien en otras pantallas (`CustomerCard`, etc.).

**Causa raíz:** `ConfirmDialog` estaba anidado dentro de `{isOpen && (...)}`. Un `Pressable` de backdrop, hermano de ese bloque, podía disparar `setIsOpen(false)` mientras el logout seguía en curso (si el usuario tocaba fuera del diálogo). Esto desmontaba todo el bloque — incluyendo el `ConfirmDialog` con su spinner — sin importar que `isLoggingOut` siguiera en `true`.

En `CustomerCard` no pasaba porque el diálogo estaba anidado dentro de una condición estable (`onToggleActive && (...)`), sin ningún backdrop que pudiera desmontarlo a mitad de la operación.

**Solución:** sacar `ConfirmDialog` fuera del bloque `{isOpen && ...}`, controlándolo solo con su propio estado (`isConfirmVisible`). Opcionalmente, bloquear el backdrop mientras el diálogo de confirmación está abierto:

```tsx
{isOpen && !isConfirmVisible && (
    <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} ... />
)}
```

---

## Modal de éxito no se mostraba tras guardar un pedido

**Fecha:** Julio 2026
**Síntoma:** después de guardar un pedido, el modal de "Éxito" nunca aparecía en pantalla, pese a llamar `setIsSuccessVisible(true)` justo después de que la operación terminara bien.

**Causa raíz:** el bloque `finally` tenía `setIsSuccessVisible(false)` heredado de una versión anterior del código. Esto anulaba el `true` recién establecido en el mismo ciclo de renderizado — React nunca llegaba a pintar el estado `true`.

```ts
// MAL
} finally {
    setLoading(false);
    setIsSuccessVisible(false); // anula el true que se acaba de setear
}
```

**Solución:** el `finally` solo debe controlar el loading. El cierre del modal de éxito lo maneja su propio `onConfirm`:

```ts
// BIEN
} finally {
    setLoading(false);
}
```

---

## `Alert.alert` con botones no funciona en web

**Síntoma:** `Alert.alert(title, message, [{ text: 'OK', onPress: ... }])` no mostraba nada (o mostraba un alert plano sin ejecutar el callback) en `react-native-web`.

**Causa raíz:** `react-native-web` no tiene una implementación nativa completa de `Alert.alert`. El array de botones con callbacks no se soporta de forma consistente entre versiones — en el mejor de los casos cae a `window.alert()`, que no soporta múltiples acciones ni callbacks.

**Solución:** usar un componente propio (`ConfirmDialog`) en vez de `Alert.alert` para cualquier flujo que dependa de un callback tras la interacción del usuario, especialmente si la app corre en web.