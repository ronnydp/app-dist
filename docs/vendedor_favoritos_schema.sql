-- Script para crear la tabla de favoritos de vendedores por día de la semana
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vendedor_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_vendedor_cliente_dia UNIQUE (usuario_id, cliente_id, dia_semana)
);

CREATE INDEX IF NOT EXISTS idx_vendedor_favoritos_lookup 
  ON vendedor_favoritos(usuario_id, dia_semana);

CREATE INDEX IF NOT EXISTS idx_vendedor_favoritos_cliente 
  ON vendedor_favoritos(cliente_id);

-- RLS (Row Level Security)
ALTER TABLE vendedor_favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Vendedores gestionan sus propios favoritos" ON vendedor_favoritos;
CREATE POLICY "Vendedores gestionan sus propios favoritos"
  ON vendedor_favoritos
  FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
