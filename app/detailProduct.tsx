import ConfirmDialog from "@/components/ConfirmDialogProps";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastsContext";
import { activateProduct, deleteProduct } from "@/services/database";
import { Presentation } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function DetailProduct() {
    const { role } = useAuth();
    const { showToast } = useToast();
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const [isToggling, setIsToggling] = useState(false);
    const params = useLocalSearchParams<{
        id: string,
        name: string,
        price: string,
        presentations: string,
        is_active: string

    }>()
    const presentations = JSON.parse(params.presentations) as Presentation[]
    const price = parseFloat(params.price)
    const is_active = JSON.parse(params.is_active)

    const handleActiveDialog = () => {
        setIsConfirmVisible(true)
    }
    const handleCancelActiveProduct = () => {
        setIsConfirmVisible(false)
    }

    const handleEdit = useCallback(() => {
        router.push({
            pathname: '/newProduct',
            params: {
                id: params.id,
                name: params.name,
                price: params.price
            }
        })
    }, []);

    const handleRemove = async () => {
        if (is_active) {
            try {
                setIsToggling(true)
                await deleteProduct(params.id)
                showToast('Producto deshabilitado', 'success');
                router.back()
            } catch (error) {
                showToast('No se pudo deshabilitar producto', 'error');
                console.error(error);
            } finally {
                setIsToggling(false)
                setIsConfirmVisible(false)
            }
        } else {
            try {
                setIsToggling(true)
                await activateProduct(params.id);
                showToast('Producto habilitado', 'success');
                router.back()
            } catch (error) {
                showToast('No se pudo habilitar producto', 'error');
                console.error(error);
            } finally {
                setIsToggling(false)
                setIsConfirmVisible(false)
            }
        }

    }
    const getBadgeColor = (is_active: boolean) => {
        if (is_active) {
            return '#dcfce7'
        } else {
            return '#fcdcdc'
        }
    }
    const getStatusColor = (is_active: boolean) => {
        if (is_active) {
            return 'limegreen'
        } else {
            return 'red'
        }
    }
    const getStatusColorButton = (is_active: boolean) => {
        if (is_active) {
            return 'red'
        } else {
            return 'limegreen'
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 15 }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                    <Ionicons name="cube-outline" size={100} color="#08859b" />
                </View>
                <View style={{ justifyContent: 'center', gap: 10, flex: 1 }}>
                    <Text style={{ fontSize: 19, fontWeight: 'bold' }}>
                        {params.name}
                    </Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'limegreen' }}>
                        S/ {(price).toFixed(2)}
                    </Text>
                    <View style={{justifyContent: 'flex-end', flexDirection: 'row', backgroundColor: getBadgeColor(is_active), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: getStatusColor(is_active) }}>
                            {is_active ? 'Activo' : 'Deshabilitado'}
                        </Text>
                    </View>
                    </View>
                </View>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, padding: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
                    <Ionicons name="ticket" size={20} />
                    <Text style={{ fontWeight: '800', fontSize: 15 }}>Presentaciones</Text>
                </View>
                <View style={{ gap: 15 }}>
                    {presentations.length === 0 ? (
                        <Text style={{ color: 'grey', fontStyle: 'italic' }}>
                            No hay presentaciones para este producto aún. Precio único arriba.
                        </Text>
                    ) : (
                        <>
                            {presentations.map((presentation) => (
                                <View style={{ flexDirection: 'row' }} key={presentation.id}>
                                    <Ionicons name="file-tray-outline" size={20} color="#08859b" />
                                    <Text style={{ marginLeft: 10, fontWeight: '800' }}>{presentation.name}</Text>
                                    <Text style={{ color: 'silver', fontWeight: 'bold' }}>  ({presentation.unit_quantity} unid)</Text>
                                    <Text style={{ marginLeft: 'auto', fontWeight: '800' }}>S/ {(presentation.sale_price).toFixed(2)}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>
            </View>
            {role === 'admin' && (
                <View style={{
                    flexDirection: "row", justifyContent: 'flex-end', margin: 'auto', gap: 10
                }}>
                    <TouchableOpacity style={{
                        padding: 16, borderRadius: 8, alignItems: "center", backgroundColor: '#fff', borderColor: getStatusColorButton(is_active), borderWidth: 1
                    }}
                        onPress={() => handleActiveDialog()}
                    >
                        <Text style={{
                            fontSize: 16, fontWeight: '600', color: getStatusColorButton(is_active),
                        }}>
                            {is_active ? 'Deshabilitar' : 'Habilitar'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                        padding: 16, borderRadius: 8, alignItems: "center", backgroundColor: '#08859b',
                    }}
                        onPress={() => handleEdit()}
                    >
                        <Text style={{
                            fontSize: 16, fontWeight: '600', color: '#fff', marginHorizontal: 10
                        }}>
                            Editar
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <ConfirmDialog
                visible={isConfirmVisible}
                title={is_active ? "Deshabilitar" : "Habilitar"}
                confirmText='Confirmar'
                isLoading={isToggling}
                message={is_active ? 'Los vendedores no podrán seleccionar este producto' : "Los vendedores podrán seleccionar este producto"}
                onConfirm={handleRemove}
                onCancel={handleCancelActiveProduct}

            />
        </View>

    )
}