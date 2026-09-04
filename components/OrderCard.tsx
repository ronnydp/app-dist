import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { BrandColors } from '../constants/theme';
import { decodeOrderObservation } from '../lib/utils/orderObservation';
import { OrderWithDetails } from '../types';
import cardStyles from './ui/cardStyles';

type Props = {
  item: OrderWithDetails
};

export default memo(function OrderCard({ item }: Props) {
  const decodedObservation = decodeOrderObservation(item.note);
  const lastObservation = decodedObservation.text
    ? decodedObservation.text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-1)[0]
    : null;

  return (
    <View style={cardStyles.card}>
      <View style={{ flex: 1 }}>
        <View style={cardStyles.cardContent}>
          <View style={cardStyles.header}>
            <View style={cardStyles.headerLeft}>
              <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">
                {item.customer_name}
              </Text>
            </View>
            <View style={cardStyles.headerRight}>
              <Text style={cardStyles.codigo}>#{item.customer_cod}</Text>
              <Text style={cardStyles.total}>S/ {item.total.toFixed(2)}</Text>
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

          {lastObservation ? (
            <View style={cardStyles.noteSnippet}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#92400e" style={{marginRight:8}} />
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
