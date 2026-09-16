import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { decodeOrderObservation } from '../lib/utils/orderObservation';
import { OrderWithDetails } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: OrderWithDetails;
  onPress?: () => void;
  onStatusChange?: () => void;
};

export default memo(function OrderCard({ item, onPress, onStatusChange }: Props) {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const isInSystem = item.status === 'in_system';
  const decodedObservation = decodeOrderObservation(item.note);
  const lastObservation = decodedObservation.text
    ? decodedObservation.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-1)[0]
    : null;

  return (
    <Pressable style={cardStyles.card} onPress={onPress} disabled={!onPress}>
      {isAdmin ? (
        <View style={{ flex: 1 }}>
          <View style={cardStyles.cardContent}>
            <View style={cardStyles.header}>
              <View style={cardStyles.headerLeft}>
                <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">
                  {item.customer_name}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500' }}>
                  {formatOrderDate(item.created_at || item.date)}
                </Text>
                {isInSystem ? (
                  <View style={styles.systemBadge}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#15803d" />
                    <Text style={styles.systemBadgeText}>En Sistema</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.pendingBadge}
                    onPress={(event) => {
                      event.stopPropagation();
                      onStatusChange?.();
                    }}
                    disabled={!onStatusChange}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar pedido al sistema"
                  >
                    <Ionicons name="time-outline" size={14} color="#d97706" />
                    <Text style={styles.pendingBadgeText}>Pendiente</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={cardStyles.infoRow}>
              <Ionicons name="location-outline" size={14} color={BrandColors.primary} style={cardStyles.infoIcon} />
              <Text style={cardStyles.info}>{item.customer_address}</Text>
            </View>
            {item.customer_phone && (
              <View style={cardStyles.infoRow}>
                <Ionicons name="call-outline" size={14} color={BrandColors.primary} style={cardStyles.infoIcon} />
                <Text style={cardStyles.info}>{item.customer_phone}</Text>
              </View>
            )}

            <View style={cardStyles.divider} />

            <View style={cardStyles.productsSection}>
              {item.products && item.products.length > 0 ? (
                item.products.map((product, idx) => (
                  <View key={idx} style={cardStyles.productItem}>
                    <Text style={cardStyles.productQty}>{product.amount}{product.presentation_name ? ` x ${product.presentation_name}` : ''}</Text>
                    <Text style={cardStyles.productName} numberOfLines={1}>
                      {product.product_name}
                    </Text>
                    <Text style={cardStyles.productPrice}>S/ {product.sub_total.toFixed(2)}</Text>
                  </View>
                ))
              ) : null}
            </View>

            <View style={cardStyles.headerRight}>
              <Text>Total:</Text>
              <Text style={cardStyles.total}>S/ {item.total.toFixed(2)}</Text>
            </View>

            {lastObservation ? (
              <View style={cardStyles.noteSnippet}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#92400e" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={cardStyles.noteSnippetText} numberOfLines={1} ellipsizeMode="tail">
                    {lastObservation}
                  </Text>
                </View>
              </View>
            ) : (
              ''
            )}
          </View>
        </View>
      ) : (
        <View style={styles.compactContent}>
          <View style={styles.compactTopRow}>
            <View style={isInSystem ? styles.systemBadge : styles.pendingBadge}>
              <Ionicons name={isInSystem ? 'checkmark-circle-outline' : 'time-outline'} size={14} color={isInSystem ? '#15803d' : '#d97706'} />
              <Text style={isInSystem ? styles.systemBadgeText : styles.pendingBadgeText}>{isInSystem ? 'En Sistema' : 'Pendiente'}</Text>
            </View>
            <View style={styles.orderMeta}>
              <Text style={styles.orderDate}>{formatOrderDate(item.created_at || item.date)}</Text>
              {/* <View style={{ backgroundColor: '#c7eefe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#3e06d9', fontSize: 12, fontWeight: '600' }}>#{item.customer_cod}</Text>
              </View> */}
            </View>
          </View>

          <View style={styles.compactMainRow}>
            <View style={styles.compactDetails}>
              <View style={styles.compactInfoRow}>
                <Ionicons name="person" size={16} color={BrandColors.primary} />
                <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
              </View>
              <View style={styles.compactInfoRow}>
                <Ionicons name="location" size={16} color={BrandColors.primary} />
                <Text style={styles.address} numberOfLines={1}>{item.customer_address}</Text>
              </View>
            </View>

            <View style={styles.compactSummary}>
              <Text style={styles.compactTotal}>S/ {item.total.toFixed(2)}</Text>
              <Text style={styles.productCount}>{item.products.length} producto{item.products.length !== 1 ? 's' : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.primary} />
          </View>
        </View>
      )}
    </Pressable>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.total === next.item.total &&
    prev.item.note === next.item.note &&
    prev.item.created_at === next.item.created_at &&
    prev.item.customer_phone === next.item.customer_phone &&
    prev.item.status === next.item.status &&
    prev.onPress === next.onPress
    && prev.onStatusChange === next.onStatusChange
  );
});

function formatOrderDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

const styles = StyleSheet.create({
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingBadgeText: { color: '#d97706', fontSize: 12, fontWeight: '600' },
  systemBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  systemBadgeText: { color: '#15803d', fontSize: 12, fontWeight: '600' },
  compactContent: {
    flex: 1,
    gap: 10,
  },
  compactTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    backgroundColor: '#fbbf24',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderCode: {
    color: '#315f99',
    fontSize: 13,
    fontWeight: '800',
    backgroundColor: 'blue'
  },
  orderDate: {
    color: '#6b86a4',
    fontSize: 11,
  },
  compactMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactDetails: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    color: '#172b4d',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  address: {
    color: '#55718e',
    fontSize: 11,
    flex: 1,
  },
  compactSummary: {
    alignItems: 'flex-end',
    gap: 4,
  },
  compactTotal: {
    color: '#172b4d',
    fontSize: 15,
    fontWeight: '800',
  },
  productCount: {
    color: '#55718e',
    fontSize: 11,
  },
});
