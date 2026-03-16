import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Product } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: Product;
  onEdit?: (p: Product) => void;
  onDelete?: (id: string, nombre: string) => void;
};

export default memo(function ProductCard({ item, onEdit, onDelete }: Props) {
  return (
    <View style={cardStyles.card}>
      <View style={{ flex: 1 }}>
        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
          <Text style={cardStyles.price}>S/ {item.price.toFixed(2)}</Text>
          {item.image_url ? <Text style={cardStyles.info}>{item.image_url}</Text> : null}
        </View>
      </View>
      {(onEdit || onDelete) && (
        <View style={{ alignItems: 'center', gap: 8 }}>
          {onEdit && (
            <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onEdit(item)}>
              <Ionicons name="create-outline" size={20} color="#cfbb09" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onDelete(item.id, item.name)}>
              <Ionicons name="trash" size={20} color="#ef4444" />
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
    prev.item.image_url === next.item.image_url
  );
});
