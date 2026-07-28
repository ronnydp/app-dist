import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Customer } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: Customer;
  onOpen: (c: Customer) => void;
};

export default memo(function CustomerCard({ item, onOpen }: Props) {
  const inactive = !item.is_active;

  return (
    <TouchableOpacity 
      onPress={() => onOpen(item)}
    >
      <View style={[cardStyles.card, inactive && { opacity: 0.5 }]}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
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
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Ionicons name="chevron-forward-outline" size={16}></Ionicons>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.ruc === next.item.ruc &&
    prev.item.phone === next.item.phone &&
    prev.item.address === next.item.address &&
    prev.item.cod_customer === next.item.cod_customer &&
    prev.item.is_active === next.item.is_active
  );
});
