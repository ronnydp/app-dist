import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as attendanceService from '@/services/attendance';
import { AttendanceRecord } from '@/types';

type AttendanceParams = {
  id?: string;
  name?: string;
  roleLabel?: string;
  initials?: string;
  entryTime?: string;
  exitTime?: string;
  statusLabel?: string;
  statusTone?: 'success' | 'warning' | 'error';
  dateLabel?: string;
  entryLocation?: string;
  exitLocation?: string;
  workedTime?: string;
};

type DisplayAttendance = {
  entryRegistered: boolean;
  exitRegistered: boolean;
  entryTone: 'success' | 'warning' | 'neutral';
  exitTone: 'success' | 'warning' | 'neutral';
  entryLabel: string;
  exitLabel: string;
};

function buildDisplayAttendance(params: AttendanceParams): DisplayAttendance {
  const entryRegistered = Boolean(params.entryTime && params.entryTime !== '--:--');
  const exitRegistered = Boolean(params.exitTime && params.exitTime !== '--:--');

  return {
    entryRegistered,
    exitRegistered,
    entryTone: entryRegistered ? 'success' : 'neutral',
    exitTone: exitRegistered ? 'success' : 'neutral',
    entryLabel: entryRegistered ? 'Registrada' : 'No registrada',
    exitLabel: exitRegistered ? 'Registrada' : 'No registrada',
  };
}

export default function DetailAttendance() {
  const params = useLocalSearchParams<AttendanceParams>();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const hasDetailParams = Boolean(params.id || params.name || params.entryTime || params.exitTime);
  const name = params.name ?? 'Empleado';
  const roleLabel = params.roleLabel ?? 'Sin rol asignado';
  const initials = params.initials ?? 'E';
  const entryTime = params.entryTime ?? '--:--';
  const exitTime = params.exitTime ?? '--:--';
  const statusLabel = params.statusLabel ?? 'Ausente';
  const statusTone = params.statusTone ?? 'error';
  const entryLocation = params.entryLocation ?? 'Ubicación no registrada';
  const exitLocation = params.exitLocation ?? 'Ubicación no registrada';
  const workedTime = params.workedTime ?? '0h 00m';
  const displayAttendance = buildDisplayAttendance(params);
  const entryMapUrl = entryLocation !== 'Ubicación no registrada'
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entryLocation)}`
    : null;
  const exitMapUrl = exitLocation !== 'Ubicación no registrada'
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exitLocation)}`
    : null;

  useEffect(() => {
    if (hasDetailParams) {
      return;
    }

    let active = true;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const data = await attendanceService.getUserAttendanceHistory(10);
        if (active) {
          setHistory(data);
        }
      } catch (error) {
        console.error('Error al cargar historial de asistencia:', error);
      } finally {
        if (active) {
          setLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [hasDetailParams]);

  if (!hasDetailParams) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>Mi historial</Text>
              <Text style={styles.role}>Últimos registros de asistencia</Text>
              <View style={styles.activeRow}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Vendedor</Text>
              </View>
            </View>
          </View>

          {loadingHistory ? (
            <View style={styles.historyLoadingCard}>
              <ActivityIndicator size="large" color="#1d4ed8" />
            </View>
          ) : history.length > 0 ? (
            <View style={styles.historyListCard}>
              {history.map((item, index) => (
                <View key={item.id}>
                  <HistoryRow item={item} />
                  {index < history.length - 1 ? <View style={styles.historyDivider} /> : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistoryCard}>
              <Ionicons name="time-outline" size={28} color="#94a3b8" />
              <Text style={styles.emptyHistoryText}>Todavía no tienes registros de asistencia</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{roleLabel}</Text>
            <View style={styles.activeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Activo</Text>
            </View>
          </View>
        </View>

        <ActionDetail
          title="Entrada"
          locationTitle="Ubicación de entrada"
          time={entryTime}
          tone={displayAttendance.entryTone}
          label={displayAttendance.entryLabel}
          location={entryLocation}
          mapUrl={entryMapUrl}
        />

        <ActionDetail
          title="Salida"
          locationTitle="Ubicación de salida"
          time={exitTime}
          tone={displayAttendance.exitTone}
          label={displayAttendance.exitLabel}
          location={exitLocation}
          mapUrl={exitMapUrl}
        />

        <View style={styles.summaryCard}>
          <SummaryRow label="Tiempo trabajado" value={workedTime} />
          <SummaryRow label="Estado del día" value={statusLabel} valueTone={statusTone} />
          <SummaryRow label="Ubicación de entrada" value={entryLocation} />
          <SummaryRow label="Ubicación de salida" value={exitLocation} />
          <SummaryRow label="Registro completo" value="" icon="checkmark-circle" valueTone="success" />
        </View>
      </ScrollView>
    </View>
  );
}

function ActionDetail({
  title,
  locationTitle,
  time,
  label,
  location,
  mapUrl,
  tone,
}: {
  title: string;
  locationTitle: string;
  time: string;
  label: string;
  location: string;
  mapUrl: string | null;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const icon = tone === 'success' ? 'log-in-outline' : tone === 'warning' ? 'time-outline' : 'remove-outline';
  const color = tone === 'success' ? '#16a34a' : tone === 'warning' ? '#f59e0b' : '#64748b';

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={[styles.actionIcon, { backgroundColor: `${color}14` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
      </View>
      <Text style={styles.actionTime}>{time}</Text>
      <Text style={[styles.actionStatus, { color }]}>{label}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color="#64748b" />
        <View style={styles.locationBody}>
          <Text style={styles.locationLabel}>{locationTitle}</Text>
          <Text style={styles.locationText}>{location}</Text>
        </View>
      </View>
      <Pressable
        disabled={!mapUrl}
        onPress={async () => {
          if (!mapUrl) return;
          await Linking.openURL(mapUrl);
        }}
      >
        <Text style={[styles.mapLink, !mapUrl && styles.mapLinkDisabled]}>Ver en mapa</Text>
      </Pressable>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  valueTone,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  valueTone?: 'success' | 'warning' | 'error';
}) {
  const color =
    valueTone === 'success' ? '#16a34a' : valueTone === 'warning' ? '#f59e0b' : valueTone === 'error' ? '#dc2626' : '#0f172a';

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValueWrap}>
        {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
        {value ? <Text style={[styles.summaryValue, { color }]}>{value}</Text> : null}
      </View>
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
  content: {
    padding: 16,
    gap: 12,
  },
  historyLoadingCard: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyListCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  emptyHistoryCard: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  role: {
    fontSize: 13,
    color: '#64748b',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  activeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  dateText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#4338ca',
  },
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
    gap: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionTime: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationBody: {
    flex: 1,
    gap: 2,
  },
  locationLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
  },
  mapLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338ca',
  },
  mapLinkDisabled: {
    color: '#94a3b8',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  historyStatus: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBody: {
    flex: 1,
    gap: 4,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyTimes: {
    fontSize: 13,
    color: '#64748b',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  historyChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 54,
  },
});

function HistoryRow({ item }: { item: AttendanceRecord }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyStatus}>
        <Ionicons name="checkmark-circle-outline" size={24} color="#16a34a" />
      </View>
      <View style={styles.historyBody}>
        <Text style={styles.historyDate}>{item.dateLabel}</Text>
        <Text style={styles.historyTimes}>
          Entrada: {item.entryTime}  •  Salida: {item.exitTime}
        </Text>
      </View>
      <View style={styles.historyMeta}>
        <View style={[styles.historyChip, toneChipStyles[item.statusTone].chip]}>
          <Text style={[styles.historyChipText, toneChipStyles[item.statusTone].text]}>
            {item.statusLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
    </View>
  );
}

const toneChipStyles: Record<
  AttendanceRecord['statusTone'],
  { chip: { backgroundColor: string }; text: { color: string } }
> = {
  success: {
    chip: {
      backgroundColor: '#dcfce7',
    },
    text: {
      color: '#15803d',
    },
  },
  neutral: {
    chip: {
      backgroundColor: '#e2e8f0',
    },
    text: {
      color: '#475569',
    },
  },
  warning: {
    chip: {
      backgroundColor: '#fef3c7',
    },
    text: {
      color: '#a16207',
    },
  },
  error: {
    chip: {
      backgroundColor: '#fee2e2',
    },
    text: {
      color: '#dc2626',
    },
  },
};
