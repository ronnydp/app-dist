import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AttendanceTone = 'success' | 'warning' | 'error';

type AttendanceItem = {
  id: string;
  name: string;
  roleLabel: string;
  initials: string;
  entryTime: string;
  exitTime: string;
  statusLabel: string;
  statusTone: AttendanceTone;
};

function formatDateLabel(date: Date) {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

const ITEMS: AttendanceItem[] = [
  { id: '1', name: 'Carlos Mendoza', roleLabel: 'Vendedor', initials: 'CM', entryTime: '08:15 a. m.', exitTime: '06:12 p. m.', statusLabel: 'Presente', statusTone: 'success' },
  { id: '2', name: 'Luis Ramirez', roleLabel: 'Vendedor', initials: 'LR', entryTime: '08:27 a. m.', exitTime: '05:48 p. m.', statusLabel: 'Tardanza', statusTone: 'warning' },
  { id: '3', name: 'Andrea Quispe', roleLabel: 'Vendedora', initials: 'AQ', entryTime: '08:05 a. m.', exitTime: '06:02 p. m.', statusLabel: 'Presente', statusTone: 'success' },
  { id: '4', name: 'Miguel Torres', roleLabel: 'Vendedor', initials: 'MT', entryTime: '08:40 a. m.', exitTime: '--:--', statusLabel: 'Tardanza', statusTone: 'warning' },
  { id: '5', name: 'Maria Fernández', roleLabel: 'Vendedora', initials: 'MF', entryTime: '--:--', exitTime: '--:--', statusLabel: 'Ausente', statusTone: 'error' },
  { id: '6', name: 'Juan Flores', roleLabel: 'Vendedor', initials: 'JF', entryTime: '08:10 a. m.', exitTime: '06:15 p. m.', statusLabel: 'Presente', statusTone: 'success' },
  { id: '7', name: 'Pedro Huamán', roleLabel: 'Vendedor', initials: 'PH', entryTime: '08:18 a. m.', exitTime: '06:00 p. m.', statusLabel: 'Presente', statusTone: 'success' },
  { id: '8', name: 'Rosa Paredes', roleLabel: 'Vendedora', initials: 'RP', entryTime: '08:30 a. m.', exitTime: '05:50 p. m.', statusLabel: 'Tardanza', statusTone: 'warning' },
];

export default function AttendanceAdminScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | AttendanceTone>('all');

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      const matchesFilter = filter === 'all' || item.statusTone === filter;
      const matchesQuery = !term || item.name.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const counts = useMemo(() => ({
    all: ITEMS.length,
    success: ITEMS.filter((i) => i.statusTone === 'success').length,
    warning: ITEMS.filter((i) => i.statusTone === 'warning').length,
    error: ITEMS.filter((i) => i.statusTone === 'error').length,
  }), []);
  const today = new Date();
  const dayLabel = formatDateLabel(today);

  

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
                  dateLabel: 'Hoy, 22 de junio de 2025',
                  location: 'Av. Grau 250, Ica',
                  workedTime: item.statusTone === 'error' ? '0h 00m' : item.statusTone === 'warning' ? '9h 10m' : '9h 57m',
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
      />
    </View>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}>
      <Text style={[styles.filterPillText, active ? styles.filterPillTextActive : styles.filterPillTextInactive]}>{label}</Text>
    </Pressable>
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
