import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Customer } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: Customer;
  onOpen: (c: Customer) => void;
  onEdit?: (c: Customer) => void;
  onDelete?: (id: string, nombre: string) => void; // opcional, solo muestra botón si se pasa la función, linea 40
};

export default memo(function CustomerCard({ item, onOpen, onEdit, onDelete }: Props) {
  return (
    <View style={cardStyles.card}>
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
        {onDelete && (
          <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onDelete(item.id, item.name)}>
            <Ionicons name="trash" size={20} color="#ef4444" />
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
    prev.item.address === next.item.address
  );
});

// uses shared `cardStyles` from components/ui/cardStyles.ts
