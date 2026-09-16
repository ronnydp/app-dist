-- Ejecutar en Supabase SQL Editor.
-- Los pedidos existentes quedan pendientes hasta que un administrador los envíe.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'in_system'));

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Solo administradores pueden cambiar el estado a enviado.
DROP POLICY IF EXISTS "Admins can send orders to system" ON orders;
CREATE POLICY "Admins can send orders to system"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (status = 'in_system');