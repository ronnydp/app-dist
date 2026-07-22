import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const {session} = useAuth();

export default function UsersScreen() {
  return (
    <View>
      <View>
        <Ionicons name="person-circle-outline" size={50} color="#2563eb" />
        <Text >{session?.user?.name || "Vendedor"}</Text>
        <Text >{session?.user?.role || "Sin rol"}</Text>
      </View>
    </View>
  );
}
