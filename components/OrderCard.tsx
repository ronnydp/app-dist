import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { OrderWithDetails } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: OrderWithDetails;
  onOpen?: (o: OrderWithDetails) => void;
};

const formatOrderTime = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export default memo(function OrderCard({ item, onOpen }: Props) {
  const orderTime = formatOrderTime(item.created_at || item.date);

  return (
    <View style={cardStyles.card}>
      <View style={{ flex: 1 }}>
        <View style={cardStyles.cardContent}>
          <View style={cardStyles.header}>
            <View style={cardStyles.headerLeft}>
              <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">
                {item.customer_name}
              </Text>
              {orderTime ? <Text style={cardStyles.orderTime}>{orderTime}</Text> : null}
            </View>
            <View style={cardStyles.headerRight}>
              <Text style={cardStyles.codigo}>#{item.customer_cod}</Text>
              <Text style={cardStyles.total}>S/ {item.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={cardStyles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#08859b" style={cardStyles.infoIcon} />
            <Text style={cardStyles.info}>{item.customer_address}</Text>
          </View>
          {item.customer_phone && (
            <View style={cardStyles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#08859b" style={cardStyles.infoIcon} />  
              <Text style={cardStyles.info}>{item.customer_phone}</Text>
            </View>
          )}

          <View style={cardStyles.divider} />

          <View style={cardStyles.productsSection}>
            {item.products && item.products.length > 0 ? (
              item.products.map((product, idx) => (
                <View key={idx} style={cardStyles.productItem}>
                  <Text style={cardStyles.productQty}>{product.amount}</Text>
                  <Text style={cardStyles.productName} numberOfLines={1}>
                    {product.product_name}{product.presentation_name ? ` · ${product.presentation_name}` : ''}
                  </Text>
                  <Text style={cardStyles.productPrice}>S/ {product.sub_total.toFixed(2)}</Text>
                </View>
              ))
            ) : null}
          </View>

          {item.note ? (
            <View style={cardStyles.noteSnippet}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#92400e" style={{marginRight:8}} />
              <Text style={cardStyles.noteSnippetText} numberOfLines={1} ellipsizeMode="tail">
                {item.note.length > 80 ? item.note.slice(0, 80) + '…' : item.note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.total === next.item.total &&
    prev.item.note === next.item.note &&
    prev.item.customer_phone === next.item.customer_phone
  );
});
