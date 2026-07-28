import ConfirmDialog from "@/components/ConfirmDialogProps";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastsContext";
import { activateCustomer, deleteCustomer } from "@/services/database";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function DetailCustomer() {
    const { role } = useAuth();
    const { showToast } = useToast();
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const [isToggling, setIsToggling] = useState(false);
    const params = useLocalSearchParams<{
        id: string,
        name: string,
        ruc?: string,
        address: string,
        district: string,
        phone?: string,
        cod_customer: string,
        is_active: string
    }>()
    
    const is_active = JSON.parse(params.is_active)

    const handleActiveDialog = () => {
        setIsConfirmVisible(true)
    }
    const handleCancelActiveCustomer = () => {
        setIsConfirmVisible(false)
    }

    const handleEdit = useCallback(() => {
        router.push({
            pathname: '/newCustomer',
            params: {
                id: params.id,
                name: params.name,
                ruc: params.ruc || '',
                address: params.address,
                district: params.district,
                phone: params.phone || '',
                cod_customer: params.cod_customer
            }
        })
    }, [params]);

    const handleRemove = async () => {
        if (is_active) {
            try {
                setIsToggling(true)
                await deleteCustomer(params.id)
                showToast('Cliente deshabilitado', 'success');
                router.back()
            } catch (error) {
                showToast('No se pudo deshabilitar cliente', 'error');
                console.error(error);
            } finally {
                setIsToggling(false)
                setIsConfirmVisible(false)
            }
        } else {
            try {
                setIsToggling(true)
                await activateCustomer(params.id);
                showToast('Cliente habilitado', 'success');
                router.back()
            } catch (error) {
                showToast('No se pudo habilitar cliente', 'error');
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
                    <Ionicons name="storefront-outline" size={100} color="#08859b" />
                </View>
                <View style={{ justifyContent: 'center', gap: 10, flex: 1 }}>
                    <Text style={{ fontSize: 19, fontWeight: 'bold' }}>
                        {params.name}
                    </Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                            #{params.cod_customer}
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
                <View style={{ flexDirection: 'row', marginBottom: 12, gap: 10 }}>
                    <Ionicons name="information-circle-outline" size={20} color="#08859b" />
                    <Text style={{ fontWeight: '800', fontSize: 15, color: '#111827' }}>Información</Text>
                </View>
                <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>RUC</Text>
                        <Text style={{ fontSize: 13, color: '#111827', fontWeight: '500' }}>{params.ruc || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>Teléfono</Text>
                        <Text style={{ fontSize: 13, color: '#111827', fontWeight: '500' }}>{params.phone || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>Dirección</Text>
                        <Text style={{ fontSize: 13, color: '#111827', fontWeight: '500', textAlign: 'right', marginLeft: 12, flex: 1 }}>{params.address}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>Distrito</Text>
                        <Text style={{ fontSize: 13, color: '#111827', fontWeight: '500' }}>{params.district}</Text>
                    </View>
                </View>
            </View>
            {role === 'admin' && (
                <View style={{
                    flexDirection: "row", justifyContent: 'flex-end', margin: 'auto', gap: 10, marginTop: 'auto'
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
                message={is_active ? '¿Seguro que deseas inhabilitar este cliente?' : "¿Deseas habilitar este cliente?"}
                onConfirm={handleRemove}
                onCancel={handleCancelActiveCustomer}

            />
        </View>

    )
}