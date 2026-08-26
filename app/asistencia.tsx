import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import * as attendanceService from '@/services/attendance';
import { Attendance, AttendanceRecord } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AttendanceAdminScreen from './attendanceAdmin';

type StatusTone = 'success' | 'neutral' | 'warning';
type DeviceLocation = {
  label: string;
  mapUrl: string;
  latitude: number;
  longitude: number;
};

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Av.+Grau+250,+Ica,+Ica,+Per%C3%BA';

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getStatusTone(entryTime: string | null, exitTime: string | null): StatusTone {
  if (entryTime && exitTime) {
    return 'success';
  }
  if (entryTime) {
    return 'warning';
  }
  return 'neutral';
}

function buildMapUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function formatLocationLabel(
  address: Location.LocationGeocodedAddress | null,
  latitude: number,
  longitude: number
) {
  const parts = [
    address?.name,
    address?.street,
    address?.streetNumber,
    address?.city,
    address?.region,
    address?.country,
  ].filter((part): part is string => Boolean(part));

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

async function getCurrentDeviceLocation(): Promise<DeviceLocation> {
    const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Activa los permisos de ubicación para registrar asistencia');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  const { latitude, longitude } = position.coords;
  const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });

  return {
    latitude,
    longitude,
    label: formatLocationLabel(address ?? null, latitude, longitude),
    mapUrl: buildMapUrl(latitude, longitude),
  };
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <View style={[styles.pill, toneStyles[tone].pill]}>
      <Ionicons
        name={tone === 'success' ? 'checkmark-circle' : tone === 'warning' ? 'time' : 'ellipse'}
        size={16}
        color={toneStyles[tone].text}
      />
      <Text style={[styles.pillText, toneStyles[tone].textStyle]}>{label}</Text>
    </View>
  );
}

function ActionCard({
  title,
  timeLabel,
  icon,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  timeLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'success' | 'neutral';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionCard,
        tone === 'success' ? styles.actionCardSuccess : styles.actionCardNeutral,
        disabled && styles.actionCardDisabled,
        pressed && !disabled && styles.actionCardPressed,
      ]}
    >
      <View style={[styles.actionIcon, tone === 'success' ? styles.actionIconSuccess : styles.actionIconNeutral]}>
        <Ionicons
          name={icon}
          size={32}
          color={tone === 'success' ? '#fff' : '#fff'}
        />
      </View>
      <Text style={[styles.actionTitle, tone === 'success' ? styles.actionTitleSuccess : styles.actionTitleNeutral]}>
        {title}
      </Text>
      <Text style={[styles.actionTime, disabled && styles.actionTimeDisabled]}>
        {timeLabel}
      </Text>
    </Pressable>
  );
}

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

function HistorySummaryCard({ count }: { count: number }) {
  return (
    <Pressable style={styles.historySummaryCard} onPress={() => router.push('/detailAttendance')}>
      <View style={styles.historySummaryIcon}>
        <Ionicons name="time-outline" size={22} color="#1d4ed8" />
      </View>
      <View style={styles.historySummaryBody}>
        <Text style={styles.historySummaryLabel}>Historial de asistencia</Text>
        <Text style={styles.historySummaryValue}>
          {count > 0 ? `${count} registro${count === 1 ? '' : 's'} recientes` : 'Sin registros aún'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  );
}

export default function AttendanceScreen() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<DeviceLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const loadAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const [today, historyData] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getUserAttendanceHistory(10),
      ]);
      setTodayAttendance(today);
      setHistory(historyData);
    } catch (error) {
      console.error('Error al cargar asistencia:', error);
      showToast('Error al cargar asistencia', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log(status)
      if (status !== 'granted') {
        showToast('Debes aceptar los permisos de ubicación para continuar', 'error');
        router.back();
        return;
      }
      const location = await getCurrentDeviceLocation();
      setCurrentLocation(location);
    } catch (error) {
      showToast("Debe activar la ubicación", 'error')
      // console.error('Error al obtener ubicación actual:', error);
      setCurrentLocation(null);
      router.back();
    } finally {
      setLocationLoading(false);
    }
  }, [showToast]);

  // Cargar datos de asistencia y ubicación cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      void loadAttendanceData();
      void refreshCurrentLocation();
    }, [loadAttendanceData, refreshCurrentLocation])
  );

  const today = new Date();
  const hasEntry = todayAttendance?.entry_time !== null && todayAttendance?.entry_time !== undefined;
  const hasExit = todayAttendance?.exit_time !== null && todayAttendance?.exit_time !== undefined;
  const dayLabel = formatDateLabel(today);
  const todayEntryLabel = hasEntry && todayAttendance?.entry_time
    ? formatTime(new Date(todayAttendance.entry_time))
    : '--:--';
  const todayExitLabel = hasExit && todayAttendance?.exit_time
    ? formatTime(new Date(todayAttendance.exit_time))
    : '--:--';

  const handleRegisterEntry = async () => {
    if (hasEntry) {
      showToast('La entrada de hoy ya fue registrada', 'error');
      return;
    }

    try {
      setLoading(true);
      const location = await getCurrentDeviceLocation();
      setCurrentLocation(location);
      const result = await attendanceService.registerEntry(location.label);
      setTodayAttendance(result);
      showToast(`Entrada registrada a las ${formatTime(new Date(result.entry_time!))}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al registrar entrada', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterExit = async () => {
    if (!hasEntry) {
      showToast('Primero registra tu entrada', 'error');
      return;
    }

    if (hasExit) {
      showToast('La salida de hoy ya fue registrada', 'error');
      return;
    }

    try {
      setLoading(true);
      const location = await getCurrentDeviceLocation();
      setCurrentLocation(location);
      const result = await attendanceService.registerExit(location.label);
      setTodayAttendance(result);
      showToast(`Salida registrada a las ${formatTime(new Date(result.exit_time!))}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al registrar salida', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openMap = async () => {
    const targetMapUrl = currentLocation?.mapUrl ?? MAP_URL;
    const canOpen = await Linking.canOpenURL(targetMapUrl);
    if (!canOpen) {
      showToast('No se pudo abrir el mapa', 'error');
      return;
    }

    await Linking.openURL(targetMapUrl);
  };

  if (role === 'admin') {
    return <AttendanceAdminScreen />;
  }

  if (loading && !todayAttendance) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryDate}>{dayLabel}</Text>
          </View>

          <View style={styles.summaryTimesRow}>
            <View style={styles.summaryTimeBlock}>
              <Text style={styles.summaryTimeLabel}>Hora de entrada</Text>
              <Text style={styles.summaryTimeValue}>{todayEntryLabel}</Text>
              <View style={styles.summaryStateRow}>
                <Ionicons
                  name={hasEntry ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasEntry ? '#16a34a' : '#64748b'}
                />
                <Text style={[styles.summaryStateText, hasEntry ? styles.summaryStateTextSuccess : styles.summaryStateTextMuted]}>
                  {hasEntry ? 'Registrada' : 'Pendiente'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryTimeBlock}>
              <Text style={styles.summaryTimeLabel}>Hora de salida</Text>
              <Text style={styles.summaryTimeValue}>{todayExitLabel}</Text>
              <View style={styles.summaryStateRow}>
                <Ionicons
                  name={hasExit ? 'checkmark-circle' : 'time-outline'}
                  size={16}
                  color={hasExit ? '#16a34a' : '#64748b'}
                />
                <Text style={[styles.summaryStateText, hasExit ? styles.summaryStateTextSuccess : styles.summaryStateTextMuted]}>
                  {hasExit ? 'Registrada' : 'Pendiente'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>¿Qué deseas registrar?</Text>

        <View style={styles.actionsGrid}>
          <ActionCard
            title="Marcar entrada"
            timeLabel={todayEntryLabel}
            icon="log-in-outline"
            tone="success"
            disabled={hasEntry || loading}
            onPress={handleRegisterEntry}
          />

          <ActionCard
            title="Marcar salida"
            timeLabel={todayExitLabel}
            icon="log-out-outline"
            tone="neutral"
            disabled={!hasEntry || hasExit || loading}
            onPress={handleRegisterExit}
          />
        </View>

        <Pressable style={styles.locationCard} onPress={openMap}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={24} color="#1d4ed8" />
          </View>
          <View style={styles.locationBody}>
            <Text style={styles.locationLabel}>Ubicación actual</Text>
            <Text style={styles.locationValue}>
              {currentLocation?.label ?? (locationLoading ? 'Obteniendo ubicación...' : 'Ubicación no disponible')}
            </Text>
          </View>
          <View style={styles.locationAction}>
            <Text style={styles.locationActionText}>Ver en mapa</Text>
            <Ionicons name="chevron-forward" size={18} color="#1d4ed8" />
          </View>
        </Pressable>

        <HistorySummaryCard count={history.length} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#64748b',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 16,
    gap: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryDate: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryTimesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  summaryTimeBlock: {
    flex: 1,
    gap: 8,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 14,
  },
  summaryTimeLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryTimeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  summaryStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryStateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryStateTextSuccess: {
    color: '#16a34a',
  },
  summaryStateTextMuted: {
    color: '#64748b',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  helperIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minHeight: 168,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  actionCardNeutral: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  actionCardDisabled: {
    opacity: 0.7,
  },
  actionCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  actionIcon: {
    width: 76,
    height: 76,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionIconSuccess: {
    backgroundColor: '#16a34a',
  },
  actionIconNeutral: {
    backgroundColor: '#64748b',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionTitleSuccess: {
    color: '#16a34a',
  },
  actionTitleNeutral: {
    color: '#475569',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    minHeight: 34,
    lineHeight: 18,
  },
  actionTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  actionTimeDisabled: {
    color: '#94a3b8',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  locationValue: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    flexShrink: 1,
  },
  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  locationActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historySummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
  },
  historySummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySummaryBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  historySummaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  historySummaryValue: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  historyLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
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

const toneStyles: Record<
  StatusTone,
  { pill: { backgroundColor: string; borderWidth: number; borderColor: string }; text: string; textStyle: { color: string } }
> = {
  success: {
    pill: {
      backgroundColor: '#dcfce7',
      borderWidth: 1,
      borderColor: '#bbf7d0',
    },
    text: '#15803d',
    textStyle: {
      color: '#15803d',
    },
  },
  neutral: {
    pill: {
      backgroundColor: '#eff6ff',
      borderWidth: 1,
      borderColor: '#bfdbfe',
    },
    text: '#1d4ed8',
    textStyle: {
      color: '#1d4ed8',
    },
  },
  warning: {
    pill: {
      backgroundColor: '#fef9c3',
      borderWidth: 1,
      borderColor: '#fde68a',
    },
    text: '#a16207',
    textStyle: {
      color: '#a16207',
    },
  },
};

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
