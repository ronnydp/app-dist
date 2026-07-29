// services/attendance.ts
import { supabase } from '../lib/supabase';
import { Attendance, AttendanceWithUser, NewAttendance, AttendanceRecord } from '../types';

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTimeLabel = (dateString?: string): string => {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

const formatDateLabel = (date: Date): string => {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
};

const calculateWorkedTime = (entryTime?: string, exitTime?: string): string => {
  if (!entryTime || !exitTime) return '0h 00m';

  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = exit.getTime() - entry.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return `${hours}h ${String(mins).padStart(2, '0')}m`;
};

// ==========================================
// FUNCIONES PARA ASISTENCIA (ATTENDANCE)
// ==========================================

/**
 * Obtiene la asistencia de hoy del usuario actual
 */
export const getTodayAttendance = async (): Promise<Attendance | null> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return null;

    const today = formatLocalDate(new Date());

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', session.session.user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error al obtener asistencia de hoy:', error);
    throw error;
  }
};

/**
 * Registra la entrada del usuario
 */
export const registerEntry = async (location?: string): Promise<Attendance> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error('Usuario no autenticado');

    const today = formatLocalDate(new Date());
    const now = new Date().toISOString();

    // Verificar si ya existe asistencia de hoy
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', session.session.user.id)
      .eq('date', today)
      .single();

    if (existing) {
      // Si ya existe y tiene entrada, no permitir cambiarla
      if (existing.entry_time) {
        throw new Error('La entrada de hoy ya fue registrada');
      }
      // Actualizar la entrada
      const { data, error } = await supabase
        .from('attendance')
        .update({
          entry_time: now,
          entry_location: location,
          status: 'present',
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Crear nuevo registro de asistencia
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        user_id: session.session.user.id,
        date: today,
        entry_time: now,
        entry_location: location,
        status: 'present',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    throw error;
  }
};

/**
 * Registra la salida del usuario
 */
export const registerExit = async (location?: string): Promise<Attendance> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error('Usuario no autenticado');

    const today = formatLocalDate(new Date());
    const now = new Date().toISOString();

    // Obtener el registro de hoy
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', session.session.user.id)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!existing) {
      throw new Error('No hay registro de entrada para hoy');
    }

    if (!existing.entry_time) {
      throw new Error('Primero debes registrar tu entrada');
    }

    if (existing.exit_time) {
      throw new Error('La salida de hoy ya fue registrada');
    }

    // Actualizar la salida
    const { data, error } = await supabase
      .from('attendance')
      .update({
        exit_time: now,
        exit_location: location,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al registrar salida:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de asistencia del usuario actual
 */
export const getUserAttendanceHistory = async (limit: number = 30): Promise<AttendanceRecord[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return [];

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((record) => {
      const date = new Date(record.date + 'T00:00:00');
      const dateLabel = formatDateLabel(date);
      const entryTime = formatTimeLabel(record.entry_time);
      const exitTime = formatTimeLabel(record.exit_time);
      const workedTime = calculateWorkedTime(record.entry_time, record.exit_time);

      let statusLabel = 'Ausente';
      let statusTone: 'success' | 'neutral' | 'warning' | 'error' = 'error';

      if (record.status === 'present') {
        statusLabel = 'Presente';
        statusTone = 'success';
      } else if (record.status === 'late') {
        statusLabel = 'Tardanza';
        statusTone = 'warning';
      } else if (record.status === 'half_day') {
        statusLabel = 'Media jornada';
        statusTone = 'warning';
      }

      return {
        id: record.id,
        dateLabel,
        entryTime,
        exitTime,
        statusLabel,
        statusTone,
        entryLocation: record.entry_location || 'Ubicación no registrada',
        exitLocation: record.exit_location || 'Ubicación no registrada',
        workedTime,
      };
    });
  } catch (error) {
    console.error('Error al obtener historial de asistencia:', error);
    throw error;
  }
};

/**
 * Obtiene la asistencia de todos los empleados para una fecha específica
 * (solo para administradores)
 */
export const getAttendanceByDate = async (date?: string): Promise<AttendanceWithUser[]> => {
  try {
    const targetDate = date || formatLocalDate(new Date());

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        users (name, role)
      `)
      .eq('date', targetDate)
      .order('users(name)', { ascending: true });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      ...record,
      user_name: record.users?.name || 'Usuario desconocido',
      user_role: record.users?.role || 'Sin rol',
      initials: getInitials(record.users?.name || 'U'),
    }));
  } catch (error) {
    console.error('Error al obtener asistencia por fecha:', error);
    throw error;
  }
};

/**
 * Obtiene la asistencia de un usuario específico en un rango de fechas
 */
export const getUserAttendanceRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Attendance[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener rango de asistencia:', error);
    throw error;
  }
};

/**
 * Crea o actualiza un registro de asistencia manualmente (para administradores)
 */
export const saveAttendance = async (attendance: NewAttendance): Promise<Attendance> => {
  try {
    const now = new Date().toISOString();

    // Verificar si ya existe asistencia para ese usuario y fecha
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', attendance.user_id)
      .eq('date', attendance.date)
      .single();

    if (existing) {
      // Actualizar
      const { data, error } = await supabase
        .from('attendance')
        .update({
          entry_time: attendance.entry_time,
          exit_time: attendance.exit_time,
          entry_location: attendance.entry_location,
          exit_location: attendance.exit_location,
          status: attendance.status,
          notes: attendance.notes,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          ...attendance,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de asistencia para un período
 */
export const getAttendanceStats = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  total: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const records = data || [];
    return {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      late: records.filter((r) => r.status === 'late').length,
      absent: records.filter((r) => r.status === 'absent').length,
      halfDay: records.filter((r) => r.status === 'half_day').length,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de asistencia:', error);
    throw error;
  }
};
