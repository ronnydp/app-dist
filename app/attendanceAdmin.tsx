import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as attendanceService from '@/services/attendance';
import { AttendanceWithUser } from '@/types';

type AttendanceTone = 'success' | 'warning' | 'error';

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeLabel(dateString?: string): string {
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
}

function calculateWorkedTime(entryTime?: string, exitTime?: string): string {
  if (!entryTime || !exitTime) return '0h 00m';

  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = exit.getTime() - entry.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export default function AttendanceAdminScreen() {
  const [attendanceList, setAttendanceList] = useState<AttendanceWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | AttendanceTone>('all');

  // Cargar datos cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      loadAttendanceData();
    }, [])
  );

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendanceByDate();
      setAttendanceList(data);
    } catch (error) {
      console.error('Error al cargar asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convertir datos de Attendance a AttendanceItem para mostrar
  const attendanceItems = useMemo(() => {
    return attendanceList.map((att) => {
      let statusTone: AttendanceTone = 'error';
      let statusLabel = 'Ausente';

      if (att.status === 'present') {
        statusTone = 'success';
        statusLabel = 'Presente';
      } else if (att.status === 'late') {
        statusTone = 'warning';
        statusLabel = 'Tardanza';
      } else if (att.status === 'half_day') {
        statusTone = 'warning';
        statusLabel = 'Media jornada';
      }

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

      return {
        id: att.id,
        name: att.user_name,
        roleLabel: att.user_role,
        initials: att.initials,
        entryTime: formatTimeLabel(att.entry_time),
        exitTime: formatTimeLabel(att.exit_time),
        statusLabel,
        statusTone,
        entryLocation: att.entry_location || 'Ubicación no registrada',
        exitLocation: att.exit_location || 'Ubicación no registrada',
        workedTime: calculateWorkedTime(att.entry_time, att.exit_time),
      };
    });
  }, [attendanceList]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return attendanceItems.filter((item) => {
      const matchesFilter = filter === 'all' || item.statusTone === filter;
      const matchesQuery = !term || item.name.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter, attendanceItems]);

  const counts = useMemo(
    () => ({
      all: attendanceItems.length,
      success: attendanceItems.filter((i) => i.statusTone === 'success').length,
      warning: attendanceItems.filter((i) => i.statusTone === 'warning').length,
      error: attendanceItems.filter((i) => i.statusTone === 'error').length,
    }),
    [attendanceItems]
  );

  const today = new Date();
  const dayLabel = formatDateLabel(today);

  if (loading && attendanceList.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{dayLabel}</Text>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: '/detailAttendance',
                params: {
                  id: item.id,
                  name: item.name,
                  roleLabel: item.roleLabel,
                  initials: item.initials,
                  entryTime: item.entryTime,
                  exitTime: item.exitTime,
                  statusLabel: item.statusLabel,
                  statusTone: item.statusTone,
                  dateLabel: dayLabel,
                  entryLocation: item.entryLocation,
                  exitLocation: item.exitLocation,
                  workedTime: item.workedTime,
                },
              })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.times}>Entrada: {item.entryTime}  •  Salida: {item.exitTime}</Text>
            </View>
            <View style={styles.meta}>
              <View style={[styles.chip, chipTone[item.statusTone]]}>
                <Text style={[styles.chipText, textTone[item.statusTone]]}>{item.statusLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadAttendanceData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterPillActive: {
    backgroundColor: '#4338ca',
  },
  filterPillInactive: {
    backgroundColor: '#eef2ff',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  filterPillTextInactive: {
    color: '#4338ca',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  times: {
    fontSize: 12,
    color: '#64748b',
  },
  meta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 54,
  },
});

const chipTone: Record<AttendanceTone, { backgroundColor: string }> = {
  success: { backgroundColor: '#dcfce7' },
  warning: { backgroundColor: '#fef3c7' },
  error: { backgroundColor: '#fee2e2' },
};

const textTone: Record<AttendanceTone, { color: string }> = {
  success: { color: '#15803d' },
  warning: { color: '#a16207' },
  error: { color: '#dc2626' },
};
