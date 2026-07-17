import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

type AppSearchBarProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  iconSize?: number;
};

export default function AppSearchBar({
  placeholder,
  value,
  onChangeText,
  iconSize = 18,
}: AppSearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={iconSize} color="#6b7280" style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f5f7',
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ececec',
    marginHorizontal: 15,
    height: 44
  },
  icon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
    paddingVertical: 5,
  },
});
