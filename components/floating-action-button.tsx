import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

type FloatingActionButtonProps = {
  onPress: () => void;
  iconName?: 'add';
};

export default function FloatingActionButton({ onPress, iconName = 'add' }: FloatingActionButtonProps) {
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <Ionicons name={iconName} size={28} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
