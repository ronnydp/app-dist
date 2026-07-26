import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductWithPresentations } from '../types';
import ConfirmDialog from './ConfirmDialogProps';
import cardStyles from './ui/cardStyles';

type Props = {
  item: ProductWithPresentations;
  onOpen: (c: ProductWithPresentations) => void
  onEdit?: (p: ProductWithPresentations) => void;
  onToggleActive?: (id: string, nombre: string, isActive: boolean) => Promise<void>;
};

export default memo(function ProductCard({ item, onOpen, onEdit, onToggleActive }: Props) {
  const inactive = !item.is_active;
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
  const [isToggling, setIsToggling] = useState(false);

  const handleActiveProduct = () => {
    setIsConfirmVisible(true)
  }
  const handleCancelActiveProduct = () => {
    setIsConfirmVisible(false)
  }
  const handleConfirmToggle = async () => {
    try {
      if (onToggleActive) {
        setIsToggling(true);
        await onToggleActive(item.id, item.name, item.is_active);
      }
    } finally {
      setIsToggling(false);
      setIsConfirmVisible(false)
    }
  }

  return (
    <TouchableOpacity 
      onPress={() => onOpen(item)}
      >
      <View style={[cardStyles.card, inactive && { opacity: 0.5 }]}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={cardStyles.cardContent}>
            <Text style={cardStyles.nombre} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            <Text style={cardStyles.price}>S/ {item.price.toFixed(2)}</Text>
            {item.image_url ? <Text style={cardStyles.info}>{item.image_url}</Text> : null}
          </View>
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Ionicons name="chevron-forward-outline" size={16}></Ionicons>
          </View>
        </View>

        {/* {(onEdit || onToggleActive) && (
          <View style={{ alignItems: 'center', gap: 8 }}>
            {onEdit && (
              <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onEdit(item)}>
                <Ionicons name="create-outline" size={20} color="#08859b" />
              </TouchableOpacity>
            )}
            {onToggleActive && (
              <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => handleActiveProduct()}>
                <Ionicons name={inactive ? 'checkmark-circle-outline' : 'ban-outline'} size={20} color={inactive ? '#16a34a' : '#ef4444'} />
                <ConfirmDialog
                  visible={isConfirmVisible}
                  title={inactive ? "Habilitar" : "Dar de baja"}
                  confirmText='Confirmar'
                  isLoading={isToggling}
                  message={inactive ? "Habilitar producto?" : 'Seguro que deseas inhabilitar este producto?'}
                  onConfirm={handleConfirmToggle}
                  onCancel={handleCancelActiveProduct}

                />
              </TouchableOpacity>
            )}
          </View>
        )} */}
      </View>
    </TouchableOpacity>
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
