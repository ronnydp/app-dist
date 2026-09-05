/**
 * Redondea correctamente un monto de dinero a 2 decimales
 * Evita problemas de precisión de punto flotante en JavaScript
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Valida que un monto sea un número positivo válido
 */
export function isValidAmount(amount: unknown): boolean {
  if (typeof amount !== 'number') return false;
  return !isNaN(amount) && isFinite(amount) && amount > 0;
}

/**
 * Valida que un precio sea válido (número positivo)
 */
export function isValidPrice(price: unknown): boolean {
  if (typeof price !== 'number') return false;
  return !isNaN(price) && isFinite(price) && price > 0;
}
