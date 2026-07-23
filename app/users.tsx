import { useAuth } from "@/contexts/AuthContext";
import { getUsers } from "@/services/database";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";


export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error al cargar usuarios: ", error)
      }
    };
    loadUsers();
  }, [])

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'vendedor':
        return '#dcfce7';
      case 'admin':
        return '#dbeafe'; // azul clarito
      default:
        return 'transparent';
    }
  }

  const getRoleTextColor = (role?: string) => {
    switch (role) {
      case 'vendedor':
        return '#16a34a';
      case 'admin':
        return '#2563eb';
      default:
        return '#111827';
    }
  };

  const getStatusColor = (isActive?: boolean) => {
    return isActive ? '#16a34a' : '#ef4444'; // verde si activo, rojo si inactivo
  };

  return (
    <View style={{ flex: 1, padding: 15, gap: 10, backgroundColor: '#fff' }}>
      {users.map((user) => (
        <View key={user.id} style={{ borderWidth: 0.5, borderColor: '#c5c3c3', borderRadius: 10, paddingVertical: 10, paddingRight: 15, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="person-circle-outline" size={65} color="#2563eb" />
          <View style={{ flex: 1, gap: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '800' }} numberOfLines={1} ellipsizeMode="tail">
                {user?.name}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#777676' }} numberOfLines={1} ellipsizeMode="tail">
              {user?.email}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: getRoleBadgeColor(user?.role), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: getRoleTextColor(user?.role) }}>
              {user?.role || 'Sin rol'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: getStatusColor(user?.is_active) }}>{(user?.is_active) ? 'Activo' : 'Inhabilitado'}</Text>
        </View>
      ))}
    </View>
  );
}
