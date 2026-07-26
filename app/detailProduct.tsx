import { Presentation } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { Text, View } from "react-native";

export default function DetailProduct() {
    const params = useLocalSearchParams<{
        id: string,
        name: string,
        price: string,
        presentations: string
    }>()
    const presentations = JSON.parse(params.presentations) as Presentation[]
    const price = parseFloat(params.price)
    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 15 }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                    <Ionicons name="cube-outline" size={100} />
                </View>
                <View style={{ justifyContent: 'center', gap: 10, flex: 1 }}>
                    <Text style={{ fontSize: 19, fontWeight: 'bold'}}>
                        {params.name}
                    </Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'limegreen' }}>
                        S/ {(price).toFixed(2)}
                    </Text>
                </View>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, padding: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
                    <Ionicons name="ticket" size={20} />
                    <Text style={{ fontWeight: '800', fontSize: 15 }}>Presentaciones</Text>
                </View>
                <View style={{ gap: 15}}>
                    {presentations.length === 0 ? (
                        <Text style={{color: 'grey', fontStyle: 'italic'}}>
                            No hay presentaciones para este producto aún. Precio único arriba.
                        </Text>
                    ) : (
                        <>
                            {presentations.map((presentation) => (
                                <View style={{ flexDirection: 'row' }} key={presentation.id}>
                                    <Ionicons name="file-tray-outline" size={20} />
                                    <Text style={{ marginLeft: 10, fontWeight: '800' }}>{presentation.name}</Text>
                                    <Text style={{ color: 'silver', fontWeight: 'bold' }}>  ({presentation.unit_quantity} unid)</Text>
                                    <Text style={{ marginLeft: 'auto', fontWeight: '800' }}>S/ {(presentation.sale_price).toFixed(2)}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>
            </View>
        </View>
    )
}