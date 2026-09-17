import AppSearchBar from "@/components/app-search-bar";
import { BrandColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastsContext";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getRoleLabel } from "@/lib/utils/roles";
import { getUsers } from "@/services/database";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

export default function UsersScreen() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      showToast("No se pudieron cargar los usuarios", "error");
      console.error("Error al cargar usuarios: ", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const filteredUsers = useMemo(() => {
    if (!debouncedQuery) return users;
    const term = debouncedQuery.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
  }, [users, debouncedQuery]);

  const openUser = useCallback((user: User) => {
    router.push({
      pathname: "/detailUser",
      params: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "",
        phone: user.phone || "",
        is_active: String(user.is_active),
        created_at: user.created_at,
      },
    });
  }, []);

  const handleAddUser = useCallback(() => {
    router.push("/newUser");
  }, []);

  useLayoutEffect(() => {
    if (role !== "admin") return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleAddUser} hitSlop={10} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="person-add" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, role, handleAddUser]);

  const getRoleBadgeColor = (userRole?: string) => {
    switch (userRole) {
      case "vendedor":
        return "#dcfce7";
      case "admin":
        return BrandColors.surface;
      case "supervisor":
        return "#fef3c7";
      default:
        return "#f3f4f6";
    }
  };

  const getRoleTextColor = (userRole?: string) => {
    switch (userRole) {
      case "vendedor":
        return "#16a34a";
      case "admin":
        return BrandColors.primary;
      case "supervisor":
        return "#b45309";
      default:
        return "#111827";
    }
  };

  const getStatusColor = (isActive?: boolean) => (isActive ? "#16a34a" : "#ef4444");

  if (role !== "admin") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 10 }}>
        <Ionicons name="lock-closed-outline" size={48} color="#d1d5db" />
        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
          No tienes permisos para administrar usuarios.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppSearchBar
        placeholder="Buscar usuarios..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        containerStyle={{ marginTop: 14 }}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => loadUsers(true)}
        contentContainerStyle={{ padding: 15, gap: 10, paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 }}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={{ color: "#6b7280" }}>No hay usuarios registrados</Text>
          </View>
        }
        renderItem={({ item: user }) => (
          <TouchableOpacity
            onPress={() => openUser(user)}
            style={{
              borderWidth: 0.5,
              borderColor: "#c5c3c3",
              borderRadius: 10,
              paddingVertical: 10,
              paddingRight: 15,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Ionicons name="person-circle" size={50} color={BrandColors.primary} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ fontSize: 16, fontWeight: "800" }} numberOfLines={1} ellipsizeMode="tail">
                {user?.name}
              </Text>
              <Text style={{ fontSize: 12, color: "#777676" }} numberOfLines={1} ellipsizeMode="tail">
                {user?.email}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View
                style={{
                  backgroundColor: getRoleBadgeColor(user?.role),
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: getRoleTextColor(user?.role) }}>
                  {getRoleLabel(user?.role)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: getStatusColor(user?.is_active),
                  }}
                />
                <Text style={{ fontSize: 12, fontWeight: "700", color: getStatusColor(user?.is_active) }}>
                  {user?.is_active ? "Activo" : "Inhabilitado"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
