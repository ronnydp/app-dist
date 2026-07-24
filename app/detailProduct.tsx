import { useProduct } from "@/contexts/ProductContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function DetailProduct() {
    const {products, isLoading, error} = useProduct();
    const params = useLocalSearchParams<{
        id?: string,
        nombre?: string,
        precio?: number

    }>()

    }
    return (
        products.map((product) => {
            <View style={{ flex: 1, backgroundColor: '#fff', padding: 15 }}>
            <View style={{flexDirection: 'row'}}>
                <View style={{paddingHorizontal: 20, paddingVertical: 10}}>
                    <Ionicons name="cube-outline" size={100}/>
                </View>
                <View style={{justifyContent: 'center', gap: 10}}>
                    <Text style={{fontSize: 25, fontWeight: 'bold'}}>
                        _nombre
                    </Text>
                    <Text style={{fontSize: 20, fontWeight: 'bold', color: 'green'}}>
                        _precio
                    </Text>
                </View>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10, padding: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
                    <Ionicons name="ticket" size={20} />
                    <Text style={{fontWeight: '800', fontSize: 15 }}>Presentaciones</Text>
                </View>
                <View>
                    <View style={{ flexDirection: 'row'}}>
                        <Ionicons name="file-tray-outline" size={20} />
                        <Text style={{ marginLeft: 10, fontWeight: '800' }}>_presentacion</Text>
                        <Text style={{ marginLeft: 2, color: 'silver', fontWeight: 'bold' }}>(_unidades)</Text>
                        <Text style={{ marginLeft: 'auto', fontWeight: '800'  }}>_precio</Text>
                    </View>
                </View>
            </View>
        </View>
        })
    )
}