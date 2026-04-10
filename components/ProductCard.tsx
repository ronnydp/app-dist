import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductWithPresentations } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: ProductWithPresentations;
  onEdit?: (p: ProductWithPresentations) => void;
  onToggleActive?: (id: string, nombre: string, isActive: boolean) => void;
};

export default memo(function ProductCard({ item, onEdit, onToggleActive }: Props) {
  const inactive = !item.is_active;
  const presentations = item.presentations || [];
  const defaultPres = presentations.find((p) => p.is_default) || presentations[0];
  const hasMultiple = presentations.length > 1;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[cardStyles.card, inactive && { opacity: 0.5 }]}>
      <View style={{ flex: 1 }}>
        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
          <Text style={cardStyles.price}>S/ {item.price.toFixed(2)}</Text>
          {item.image_url ? <Text style={cardStyles.info}>{item.image_url}</Text> : null}
        </View>

        {/* Presentaciones */}
        {presentations.length > 0 && (
          <View style={styles.presentationsSection}>
            {/* Presentación por defecto o única */}
            <TouchableOpacity
              style={styles.defaultRow}
              onPress={() => hasMultiple && setExpanded(!expanded)}
              
            >
              <View style={styles.presInfo}>
                <Text style={styles.presName} numberOfLines={1}>{defaultPres?.name}</Text>
                <Text style={styles.presQty}>x{defaultPres?.unit_quantity}</Text>
              </View>
              <View style={styles.presRight}>
                <Text style={styles.presPrice}>S/ {defaultPres?.sale_price.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>

            {/* Otras presentaciones (expandible) */}
            {expanded && presentations.filter((p) => p.id !== defaultPres?.id).map((p) => (
              <View key={p.id} style={styles.otherRow}>
                <View style={styles.presInfo}>
                  <Text style={styles.presName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.presQty}>x{p.unit_quantity}</Text>
                </View>
                <Text style={styles.presPrice}>S/ {p.sale_price.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {(onEdit || onToggleActive) && (
        <View style={{ alignItems: 'center', gap: 8 }}>
          {onEdit && (
            <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onEdit(item)}>
              <Ionicons name="create-outline" size={20} color="#cfbb09" />
            </TouchableOpacity>
          )}
          {onToggleActive && (
            <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onToggleActive(item.id, item.name, item.is_active)}>
              <Ionicons name={inactive ? 'checkmark-circle-outline' : 'ban-outline'} size={20} color={inactive ? '#16a34a' : '#ef4444'} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.price === next.item.price &&
    prev.item.image_url === next.item.image_url &&
    prev.item.is_active === next.item.is_active &&
    prev.item.presentations === next.item.presentations &&
    !!prev.onEdit === !!next.onEdit &&
    !!prev.onToggleActive === !!next.onToggleActive
  );
});

const styles = StyleSheet.create({
  presentationsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  otherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  presInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  presRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#d97706',
  },
  presName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flexShrink: 1,
  },
  presQty: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  presPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
});
