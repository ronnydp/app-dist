import { HapticTab } from '@/components/haptic-tab';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: 'order',
};

export default function TabLayout() {
  type ScreenOptions = React.ComponentProps<typeof Tabs.Screen>['options'];
  const colorScheme = useColorScheme();
  const { role } = useAuth();
  const getScreenOptions = (
    title: string,
    iconName: keyof typeof Ionicons.glyphMap,
    action?: { icon: keyof typeof Ionicons.glyphMap; route: '/newOrder' | '/newProduct' | '/newCustomer'; roles?: string[] },
  ): ScreenOptions => ({
    title,
    tabBarIcon: ({ color }: { color: string }) => (<Ionicons size={30} name={iconName} color={color} />),
    headerLeft: () => <Ionicons name={iconName} size={22} color="#fff" style={{ marginLeft: 16, marginRight: 8 }} />,
    headerRight: action && (!action.roles || action.roles.includes(role || '')) ? () => (
      <Pressable
        onPress={() => router.push(action.route)}
        accessibilityRole="button"
        accessibilityLabel={`Crear ${title.toLowerCase()}`}
        hitSlop={10}
        style={{ marginRight: 16 }}
      >
        <Ionicons name={action.icon} size={25} color="#fff" />
      </Pressable>
    ) : undefined,
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
        options={getScreenOptions('Pedidos', "receipt", { icon: 'add-circle-outline', route: '/newOrder' })}
      />
      <Tabs.Screen
        name="product"
        options={getScreenOptions('Productos', 'bag', { icon: 'add-circle-outline', route: '/newProduct', roles: ['admin', 'supervisor'] })}
      />
      <Tabs.Screen
        name="customer"
        options={getScreenOptions('Clientes', 'people', { icon: 'person-add-outline', route: '/newCustomer' })}
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
