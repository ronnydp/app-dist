import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Customer } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: Customer;
  onOpen: (c: Customer) => void;
  onEdit?: (c: Customer) => void;
  onToggleActive?: (id: string, nombre: string, isActive: boolean) => void;
};

export default memo(function CustomerCard({ item, onOpen, onEdit, onToggleActive }: Props) {
  const inactive = !item.is_active;
  return (
    <View style={[cardStyles.card, inactive && { opacity: 0.5 }]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => onOpen(item)}>
        <View style={cardStyles.cardContent}>
          <View style={cardStyles.header}>
            <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            <Text style={cardStyles.codigo}>#{item.cod_customer}</Text>
          </View>
          {item.ruc ? (
            <View style={cardStyles.infoRow}>
              <Ionicons name="business-outline" size={14} color="#6b7280" style={cardStyles.infoIcon} />
              <Text style={cardStyles.info}>RUC: {item.ruc}</Text>
            </View>
          ) : null}
          {item.phone ? (
            <View style={cardStyles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#6b7280" style={cardStyles.infoIcon} />
              <Text style={cardStyles.info}>{item.phone}</Text>
            </View>
          ) : null}
          <View style={cardStyles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" style={cardStyles.infoIcon} />
            <Text style={cardStyles.info}>{item.address}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
    </View>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.ruc === next.item.ruc &&
    prev.item.phone === next.item.phone &&
    prev.item.address === next.item.address &&
    prev.item.is_active === next.item.is_active
  );
});

// uses shared `cardStyles` from components/ui/cardStyles.ts
