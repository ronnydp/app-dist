import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, TextInput, TextStyle, ViewStyle } from 'react-native';

type AppSearchBarProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  iconSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export default function AppSearchBar({
  placeholder,
  value,
  onChangeText,
  iconSize = 18,
  containerStyle,
  inputStyle,
}: AppSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null)

  return (
    <Pressable style={[styles.searchContainer, isFocused && styles.searchContainerFocused, containerStyle]}
    onPress={() => {searchInputRef.current?.focus()}}>
      <Ionicons name="search" size={iconSize} color="#6b7280" style={styles.icon} />
      <TextInput
      ref={searchInputRef}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        style={[styles.searchInput, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </Pressable>
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
  searchContainerFocused: {
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
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
    textAlignVertical: 'center',
    includeFontPadding: false
  },
});
