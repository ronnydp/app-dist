import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  type ScreenOptions = React.ComponentProps<typeof Tabs.Screen>['options'];
  const colorScheme = useColorScheme();
  const { role } = useAuth();
  const getScreenOptions = (title: string, iconName: keyof typeof Ionicons.glyphMap): ScreenOptions => ({
    title,
    tabBarIcon: ({ color }: { color: string }) => (<Ionicons size={28} name={iconName} color={color} />),
    headerStyle: { backgroundColor: '#fff' },
    headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
    headerTitleAlign: 'center',
    headerShadowVisible: false,
    headerRight: () => (
      <TouchableOpacity
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        }}
        onPress={() => router.push('/menuOptions')}>
        <Ionicons name="menu" size={22} color="#717c7e" />
      </TouchableOpacity>)
  })

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="customer"
        options={getScreenOptions('Clientes', 'people')}
      />
      <Tabs.Screen
        name="product"
        options={getScreenOptions('Productos', 'bag')}
      />
      <Tabs.Screen
        name="order"
        options={getScreenOptions('Pedidos', "receipt")}
      />
      <Tabs.Screen
        name="summary"
        options={getScreenOptions('Resumen semanal', "stats-chart")}
      />
    </Tabs>
  );
}
