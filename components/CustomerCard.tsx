import { BrandColors } from '@/constants/theme';
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
      <View style={[cardStyles.card, inactive && [cardStyles.inactiveCard, { opacity: 0.58 }]]}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={cardStyles.cardContent}>
            <View style={cardStyles.header}>
              <Text style={cardStyles.nombre} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
              <Text style={cardStyles.codigo}>#{item.cod_customer}</Text>
            </View>
            {item.ruc ? (
              <View style={cardStyles.infoRow}>
                <Ionicons name="business" size={14} color="#6b7280" style={cardStyles.infoIcon} />
                <Text style={cardStyles.info}>RUC: {item.ruc}</Text>
              </View>
            ) : null}
            {item.phone ? (
              <View style={cardStyles.infoRow}>
                <Ionicons name="call" size={14} color={BrandColors.primary} style={cardStyles.infoIcon} />
                <Text style={cardStyles.info}>{item.phone}</Text>
              </View>
            ) : null}
            <View style={cardStyles.infoRow}>
              <Ionicons name="location" size={14} color={BrandColors.primary} style={cardStyles.infoIcon} />
              <Text style={cardStyles.info} numberOfLines={2} ellipsizeMode="tail">{item.address}</Text>
            </View>
          </View>
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Ionicons name={inactive ? 'eye-off-outline' : 'chevron-forward'} size={16} color={inactive ? '#94a3b8' : '#475569'} />
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
