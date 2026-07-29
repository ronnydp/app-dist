-- ============================================
-- TABLA DE ASISTENCIA (ATTENDANCE)
-- ============================================
-- Ejecutar esto en Supabase SQL Editor

-- Migración segura para bases existentes
ALTER TABLE IF EXISTS attendance
  ADD COLUMN IF NOT EXISTS entry_location VARCHAR(255);

ALTER TABLE IF EXISTS attendance
  ADD COLUMN IF NOT EXISTS exit_location VARCHAR(255);

ALTER TABLE IF EXISTS attendance
  DROP COLUMN IF EXISTS location;

-- Si la tabla ya existía con el campo viejo, puedes desactivarlo con:
-- ALTER TABLE attendance DROP COLUMN IF EXISTS location;

-- Crear tabla attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  entry_location VARCHAR(255),
  exit_location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent', 'half_day')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un registro de asistencia por usuario por día
  UNIQUE(user_id, date)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS en la tabla attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios normales solo ven sus propios registros
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuarios normales solo crean/actualizan sus propios registros
CREATE POLICY "Users can insert own attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins pueden ver todos los registros
CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Política: Admins pueden actualizar registros
CREATE POLICY "Admins can update attendance"
  ON attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- ============================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_attendance_updated_at();

-- ============================================
-- FUNCIONES AUXILIARES (Opcional)
-- ============================================

-- Función para calcular asistencia diaria automáticamente
CREATE OR REPLACE FUNCTION calculate_attendance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si tiene entrada pero no salida, está presente pero jornada en curso
  IF NEW.entry_time IS NOT NULL AND NEW.exit_time IS NULL THEN
    -- Verificar si la entrada fue después de las 08:30 (tardanza)
    IF EXTRACT(HOUR FROM NEW.entry_time) > 8 
       OR (EXTRACT(HOUR FROM NEW.entry_time) = 8 AND EXTRACT(MINUTE FROM NEW.entry_time) > 30) THEN
      NEW.status = 'late';
    ELSE
      NEW.status = 'present';
    END IF;
  END IF;
  
  -- Si tiene entrada y salida
  IF NEW.entry_time IS NOT NULL AND NEW.exit_time IS NOT NULL THEN
    -- Verificar si la entrada fue tardía
    IF EXTRACT(HOUR FROM NEW.entry_time) > 8 
       OR (EXTRACT(HOUR FROM NEW.entry_time) = 8 AND EXTRACT(MINUTE FROM NEW.entry_time) > 30) THEN
      NEW.status = 'late';
    ELSE
      NEW.status = 'present';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_status
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_attendance_status();

-- ============================================
-- VISTA PARA REPORTES (Opcional)
-- ============================================

-- Vista que combina attendance con datos del usuario
CREATE OR REPLACE VIEW attendance_with_users AS
SELECT 
  a.id,
  a.user_id,
  a.date,
  a.entry_time,
  a.exit_time,
  a.entry_location,
  a.exit_location,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  u.email,
  u.name,
  u.role
FROM attendance a
LEFT JOIN users u ON a.user_id = u.id;

-- Nota:
-- La app debe mostrar entry_location para la entrada y exit_location para la salida.

-- ============================================
-- DATOS DE PRUEBA (Opcional)
-- ============================================
-- Descomentar solo si necesitas datos de prueba

/*
-- Insertar registros de prueba para hoy
INSERT INTO attendance (user_id, date, entry_time, exit_time, entry_location, exit_location, status, notes)
SELECT 
  id, 
  CURRENT_DATE, 
  CURRENT_TIMESTAMP - INTERVAL '8 hours', 
  CURRENT_TIMESTAMP - INTERVAL '1 hour',
  'Av. Grau 250, Ica, Perú',
  'Av. Grau 250, Ica, Perú',
  'present',
  'Registro de prueba'
FROM users 
WHERE email LIKE '%demo%' OR email LIKE '%@test.com'
LIMIT 3
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- PERMISOS (Si es necesario)
-- ============================================
-- Dar permisos de lectura a usuarios autenticados
GRANT SELECT ON attendance TO authenticated;
GRANT INSERT, UPDATE ON attendance TO authenticated;
GRANT SELECT ON attendance_with_users TO authenticated;
