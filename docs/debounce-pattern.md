# Patrón Debounce en el Proyecto

## ¿Qué es Debounce?

**Debounce** es una técnica de optimización que retrasa la ejecución de una función hasta que haya pasado un tiempo determinado desde la última vez que fue invocada. Es especialmente útil para eventos que se disparan frecuentemente, como el tipeo en un campo de búsqueda.

## Implementación en el Proyecto

### Estados Utilizados

```tsx
const [searchQuery, setSearchQuery] = useState('');      // Valor actual del input
const [debouncedQuery, setDebouncedQuery] = useState(''); // Valor con retraso
```

- **`searchQuery`**: Se actualiza **inmediatamente** con cada tecla presionada
- **`debouncedQuery`**: Se actualiza **después de 250ms** de inactividad

### Código del useEffect

```tsx
useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
}, [searchQuery]);
```

**Explicación línea por línea:**

1. `useEffect(() => {` - Se ejecuta cada vez que `searchQuery` cambia
2. `const t = setTimeout(...)` - Crea un temporizador de 250ms
3. `setDebouncedQuery(searchQuery.trim())` - Actualiza el valor con el trimming aplicado
4. `return () => clearTimeout(t)` - **Cleanup**: Cancela el timer si el usuario sigue escribiendo
5. `}, [searchQuery])` - Dependencia: se ejecuta cuando cambia `searchQuery`

### Filtrado con useMemo

```tsx
const filteredProducts = useMemo(() => {
    const q = debouncedQuery; // Usa el valor con debounce, NO searchQuery
    if (!q) return products;
    const qNorm = normalizeString(q);
    return products.filter((p) => {
        const name = p.name ? normalizeString(p.name) : '';
        return name.includes(qNorm);
    });
}, [debouncedQuery, products]); // Se recalcula solo cuando cambia debouncedQuery
```

## Flujo Completo - Ejemplo Visual

### Escenario: Usuario busca "cafe"

```
Tiempo    Acción del Usuario         searchQuery    Timer Status          debouncedQuery    Filtrado
------    ------------------         -----------    -------------         --------------    --------
0ms       Escribe "c"                "c"            Timer inicia (250ms)  ""                ❌ NO
100ms     Escribe "a"                "ca"           Timer CANCELADO       ""                ❌ NO
                                                    Nuevo timer (250ms)
200ms     Escribe "f"                "caf"          Timer CANCELADO       ""                ❌ NO
                                                    Nuevo timer (250ms)
350ms     Escribe "e"                "cafe"         Timer CANCELADO       ""                ❌ NO
                                                    Nuevo timer (250ms)
600ms     [Usuario deja de escribir] "cafe"         Timer COMPLETO ✅      "cafe"            ✅ SÍ
```

### Resultado

- **Teclas presionadas**: 4 veces
- **Filtros ejecutados**: 1 vez (solo cuando el timer se completa)
- **Tiempo de espera**: 250ms después de la última tecla

## Beneficios del Patrón

### ✅ Con Debounce (Implementación actual)

```
Usuario escribe "cafe" → 4 teclas presionadas
├─ searchQuery se actualiza 4 veces (instantáneo)
├─ Timers se cancelan 3 veces
├─ debouncedQuery se actualiza 1 vez
└─ Filtro se ejecuta 1 vez ✅
```

**Ventajas:**
- Menos cálculos (1 filtro en lugar de 4)
- Mejor rendimiento
- No hay lag mientras se escribe
- Reduce carga del dispositivo

### ❌ Sin Debounce (Alternativa no recomendada)

```
Usuario escribe "cafe" → 4 teclas presionadas
├─ Filtro con "c" (todos los productos con "c")
├─ Filtro con "ca" (menos productos)
├─ Filtro con "caf" (aún menos)
└─ Filtro con "cafe" (resultado final)
```

**Desventajas:**
- 4 filtros ejecutados
- Puede causar lag en dispositivos lentos
- Consumo innecesario de recursos
- Mala experiencia de usuario

## Archivos Relacionados

- **Implementación**: [`app/(tabs)/product.tsx`](../app/(tabs)/product.tsx) (líneas 39-42, 75-83)
- **También usado en**: 
  - [`app/(tabs)/customer.tsx`](../app/(tabs)/customer.tsx)
  - [`app/(tabs)/order.tsx`](../app/(tabs)/order.tsx)

## Parámetros Configurables

### Tiempo de Espera (250ms)

```tsx
setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
//                                                        ^^^
//                                                    Ajustable
```

**Valores recomendados:**
- **200-300ms**: Búsquedas en texto (balance ideal)
- **500-1000ms**: Búsquedas que requieren peticiones al servidor
- **50-100ms**: Validaciones simples

### Normalización del Texto

```tsx
searchQuery.trim() // Elimina espacios al inicio/final
```

Esto previene búsquedas con espacios vacíos accidentales.

## Consideraciones Técnicas

### ¿Por qué usar dos estados separados?

```tsx
const [searchQuery, setSearchQuery] = useState('');      // UI inmediata
const [debouncedQuery, setDebouncedQuery] = useState(''); // Lógica diferida
```

- **`searchQuery`**: Mantiene la UI responsive (el usuario ve lo que escribe sin delay)
- **`debouncedQuery`**: Controla cuándo ejecutar operaciones costosas

### Cleanup Function

```tsx
return () => clearTimeout(t);
```

Esta función es **crítica**. Sin ella:
- Se acumularían múltiples timers
- Todos se ejecutarían eventualmente
- Causaría múltiples filtros innecesarios

## Testing Manual

Para verificar que funciona correctamente:

1. Abre la pantalla de productos
2. Escribe rápidamente en el campo de búsqueda
3. Observa que el filtro NO se aplica mientras escribes
4. Espera 250ms después de dejar de escribir
5. El filtro se aplica y los resultados aparecen

## Mejoras Futuras

### Opción 1: Hook Personalizado

```tsx
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    
    return debouncedValue;
}

// Uso:
const debouncedQuery = useDebounce(searchQuery, 250);
```

### Opción 2: Librería Externa

```bash
npm install use-debounce
```

```tsx
import { useDebounce } from 'use-debounce';

const [debouncedQuery] = useDebounce(searchQuery, 250);
```

---

**Última actualización**: Febrero 2026  
**Mantenido por**: Equipo de desarrollo
