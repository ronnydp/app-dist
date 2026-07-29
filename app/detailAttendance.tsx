import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  location?: string;
  workedTime?: string;
};

export default function DetailAttendance() {
  const params = useLocalSearchParams<AttendanceParams>();
  const name = params.name ?? 'Carlos Mendoza';
  const roleLabel = params.roleLabel ?? 'Vendedor';
  const initials = params.initials ?? 'CM';
  const entryTime = params.entryTime ?? '08:15 a. m.';
  const exitTime = params.exitTime ?? '06:12 p. m.';
  const statusLabel = params.statusLabel ?? 'Presente';
  const statusTone = params.statusTone ?? 'success';
  const dateLabel = params.dateLabel ?? 'Hoy, 22 de junio de 2025';
  const location = params.location ?? 'Av. Grau 250, Ica';
  const workedTime = params.workedTime ?? '9h 57m';

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

        <View style={styles.dateCard}>
          <Ionicons name="calendar-outline" size={18} color="#4338ca" />
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </View>

        <ActionDetail
          title="Entrada"
          time={entryTime}
          tone={statusTone === 'error' ? 'neutral' : statusTone}
          label={statusTone === 'error' ? 'No registrada' : 'Registrada'}
          location={location}
        />

        <ActionDetail
          title="Salida"
          time={exitTime}
          tone={statusTone === 'error' ? 'neutral' : statusTone}
          label={statusTone === 'error' ? 'No registrada' : 'Registrada'}
          location={location}
        />

        <View style={styles.summaryCard}>
          <SummaryRow label="Tiempo trabajado" value={workedTime} />
          <SummaryRow label="Estado del día" value={statusLabel} valueTone={statusTone} />
          <SummaryRow label="Registro completo" value="" icon="checkmark-circle" valueTone="success" />
        </View>
      </ScrollView>
    </View>
  );
}

function ActionDetail({
  title,
  time,
  label,
  location,
  tone,
}: {
  title: string;
  time: string;
  label: string;
  location: string;
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
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
      <Text style={styles.actionTime}>{time}</Text>
      <Text style={[styles.actionStatus, { color }]}>{label}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color="#64748b" />
        <Text style={styles.locationText}>{location}</Text>
      </View>
      <Pressable
        onPress={async () => {
          await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`);
        }}
      >
        <Text style={styles.mapLink}>Ver en mapa</Text>
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
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
  },
  mapLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338ca',
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
});
