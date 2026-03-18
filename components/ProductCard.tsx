import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Product } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: Product;
  onEdit?: (p: Product) => void;
  onToggleActive?: (id: string, nombre: string, isActive: boolean) => void;
};

export default memo(function ProductCard({ item, onEdit, onToggleActive }: Props) {
  const inactive = !item.is_active;
  return (
    <View style={[cardStyles.card, inactive && { opacity: 0.5 }]}>
      <View style={{ flex: 1 }}>
        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
          <Text style={cardStyles.price}>S/ {item.price.toFixed(2)}</Text>
          {item.image_url ? <Text style={cardStyles.info}>{item.image_url}</Text> : null}
        </View>
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
    !!prev.onEdit === !!next.onEdit &&
    !!prev.onToggleActive === !!next.onToggleActive
  );
});
