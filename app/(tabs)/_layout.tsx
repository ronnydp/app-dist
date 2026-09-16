import { HapticTab } from '@/components/haptic-tab';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export const unstable_settings = {
  initialRouteName: 'order',
};

export default function TabLayout() {
  type ScreenOptions = React.ComponentProps<typeof Tabs.Screen>['options'];
  const colorScheme = useColorScheme();
  const getScreenOptions = (title: string, iconName: keyof typeof Ionicons.glyphMap): ScreenOptions => ({
    title,
    tabBarIcon: ({ color }: { color: string }) => (<Ionicons size={30} name={iconName} color={color} />),
    headerLeft: () => <Ionicons name={iconName} size={22} color="#fff" style={{ marginLeft: 16, marginRight: 8 }} />,
    headerStyle: { backgroundColor: BrandColors.primary },
    headerTintColor: "#fff",
    headerTitleStyle: { fontWeight: 'bold', fontSize: 20},
    headerShadowVisible: false,
    
  })

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 75
        }
      }}>
      <Tabs.Screen
        name="order"
        options={getScreenOptions('Pedidos', "receipt")}
      />
      <Tabs.Screen
        name="product"
        options={getScreenOptions('Productos', 'bag')}
      />
      <Tabs.Screen
        name="customer"
        options={getScreenOptions('Clientes', 'people')}
      />
      <Tabs.Screen
        name="summary"
        options={getScreenOptions('Montos', "wallet")}
      />
      <Tabs.Screen
        name="profile"
        options={getScreenOptions('Perfil', 'person')}
      />
    </Tabs>
  );
}
