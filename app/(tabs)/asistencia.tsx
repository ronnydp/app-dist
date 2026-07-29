import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AttendanceAdminScreen from '../attendanceAdmin';

type AttendanceRecord = {
  id: string;
  dateLabel: string;
  entryTime: string;
  exitTime: string;
  statusLabel: string;
  statusTone: 'success' | 'neutral' | 'warning';
};

type StatusTone = 'success' | 'neutral' | 'warning';

const LOCATION_LABEL = 'Av. Grau 250, Ica, Ica, Perú';
const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Av.+Grau+250,+Ica,+Ica,+Per%C3%BA';

const RECENT_HISTORY: AttendanceRecord[] = [
  {
    id: '2025-06-21',
    dateLabel: 'Sábado, 21 jun. 2025',
    entryTime: '08:07 a. m.',
    exitTime: '06:12 p. m.',
    statusLabel: 'Completo',
    statusTone: 'success',
  },
  {
    id: '2025-06-20',
    dateLabel: 'Viernes, 20 jun. 2025',
    entryTime: '08:10 a. m.',
    exitTime: '06:05 p. m.',
    statusLabel: 'Completo',
    statusTone: 'success',
  },
  {
    id: '2025-06-19',
    dateLabel: 'Jueves, 19 jun. 2025',
    entryTime: '08:05 a. m.',
    exitTime: '05:58 p. m.',
    statusLabel: 'Completo',
    statusTone: 'success',
  },
];

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

function getStatusTone(entryTime: Date | null, exitTime: Date | null): StatusTone {
  if (entryTime && exitTime) {
    return 'success';
  }
  if (entryTime) {
    return 'warning';
  }
  return 'neutral';
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
  subtitle,
  timeLabel,
  icon,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
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
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
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

export default function AttendanceScreen() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [entryTime, setEntryTime] = useState<Date | null>(null);
  const [exitTime, setExitTime] = useState<Date | null>(null);
  const [history] = useState(RECENT_HISTORY);

  const today = new Date();
  const hasEntry = entryTime !== null;
  const hasExit = exitTime !== null;
  const dayTone = getStatusTone(entryTime, exitTime);
  const dayLabel = formatDateLabel(today);
  const todayEntryLabel = entryTime ? formatTime(entryTime) : '--:--';
  const todayExitLabel = exitTime ? formatTime(exitTime) : '--:--';

  const statusLabel =
    dayTone === 'success'
      ? 'Asistencia registrada'
      : dayTone === 'warning'
        ? 'Jornada en curso'
        : 'Asistencia pendiente';

  const helperText = hasEntry
    ? hasExit
      ? 'Tu jornada de hoy ya quedó completa.'
      : 'Recuerda registrar tu salida al finalizar tu jornada.'
    : 'Toca una vez para marcar tu entrada y empezar el día.';

  const handleRegisterEntry = () => {
    if (hasEntry) {
      showToast('La entrada de hoy ya fue registrada', 'error');
      return;
    }

    const now = new Date();
    setEntryTime(now);
    showToast(`Entrada registrada a las ${formatTime(now)}`, 'success');
  };

  const handleRegisterExit = () => {
    if (!hasEntry) {
      showToast('Primero registra tu entrada', 'error');
      return;
    }

    if (hasExit) {
      showToast('La salida de hoy ya fue registrada', 'error');
      return;
    }

    const now = new Date();
    setExitTime(now);
    showToast(`Salida registrada a las ${formatTime(now)}`, 'success');
  };

  const openMap = async () => {
    const canOpen = await Linking.canOpenURL(MAP_URL);
    if (!canOpen) {
      showToast('No se pudo abrir el mapa', 'error');
      return;
    }

    await Linking.openURL(MAP_URL);
  };

  if (role === 'admin') {
    return <AttendanceAdminScreen />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryDate}>Hoy, {dayLabel}</Text>
            <StatusPill label={statusLabel} tone={dayTone} />
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
                  {hasExit ? 'Registrada' : 'No registrada'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.helperRow}>
            <View style={styles.helperIcon}>
              <Ionicons name="information-circle" size={18} color="#1d4ed8" />
            </View>
            <Text style={styles.helperText}>{helperText}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>¿Qué deseas registrar?</Text>

        <View style={styles.actionsGrid}>
          <ActionCard
            title="Marcar entrada"
            subtitle={hasEntry ? 'Entrada registrada' : 'Un solo toque para iniciar tu jornada'}
            timeLabel={todayEntryLabel}
            icon="log-in-outline"
            tone="success"
            disabled={hasEntry}
            onPress={handleRegisterEntry}
          />

          <ActionCard
            title="Marcar salida"
            subtitle={!hasEntry ? 'Primero registra tu entrada' : hasExit ? 'Salida registrada' : 'Un solo toque para cerrar tu jornada'}
            timeLabel={todayExitLabel}
            icon="log-out-outline"
            tone="neutral"
            disabled={!hasEntry || hasExit}
            onPress={handleRegisterExit}
          />
        </View>

        <Pressable style={styles.locationCard} onPress={openMap}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={24} color="#1d4ed8" />
          </View>
          <View style={styles.locationBody}>
            <Text style={styles.locationLabel}>Ubicación actual</Text>
            <Text style={styles.locationValue}>{LOCATION_LABEL}</Text>
          </View>
          <View style={styles.locationAction}>
            <Text style={styles.locationActionText}>Ver en mapa</Text>
            <Ionicons name="chevron-forward" size={18} color="#1d4ed8" />
          </View>
        </Pressable>

        {/* <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Historial de asistencia</Text>
          <Text style={styles.historyLink}>Ver historial completo</Text>
          <Ionicons name="chevron-forward" size={16} color="#1d4ed8" />
        </View> */}

        {/* <View style={styles.historyCard}>
          {history.map((item, index) => (
            <View key={item.id}>
              <HistoryRow item={item} />
              {index < history.length - 1 ? <View style={styles.historyDivider} /> : null}
            </View>
          ))}
        </View> */}
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
  },
  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
  StatusTone,
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
};
