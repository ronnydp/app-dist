import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="customer"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="product"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="receipt" color={color} />,
        }}
      />
    </Tabs>
  );
}
