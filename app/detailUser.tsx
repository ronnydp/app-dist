import ConfirmDialog from "@/components/ConfirmDialogProps";
import { BrandColors } from "@/constants/theme";
import { useToast } from "@/contexts/ToastsContext";
import { getRoleDescription, getRoleLabel } from "@/lib/utils/roles";
import { setUserActive } from "@/services/database";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DetailUser() {
    const { showToast } = useToast();
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const params = useLocalSearchParams<{
        id: string,
        name: string,
        email: string,
        role: string,
        phone?: string,
        is_active: string,
        created_at: string,
    }>();

    const is_active = JSON.parse(params.is_active);

    const formattedDate = new Date(params.created_at).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const handleActiveDialog = () => setIsConfirmVisible(true);
    const handleCancelActiveDialog = () => setIsConfirmVisible(false);

    const handleEdit = useCallback(() => {
        router.push({
            pathname: '/newUser',
            params: {
                id: params.id,
                name: params.name,
                email: params.email,
                role: params.role,
                phone: params.phone || '',
                is_active: params.is_active,
            },
        });
    }, [params]);

    const handleToggleActive = async () => {
        try {
            setIsToggling(true);
            await setUserActive(params.id, !is_active);
            showToast(is_active ? 'Usuario desactivado' : 'Usuario activado', 'success');
            router.back();
        } catch (error) {
            showToast('No se pudo actualizar el estado del usuario', 'error');
            console.error(error);
        } finally {
            setIsToggling(false);
            setIsConfirmVisible(false);
        }
    };

    const getBadgeColor = (active: boolean) => (active ? '#dcfce7' : '#fcdcdc');
    const getStatusColor = (active: boolean) => (active ? 'limegreen' : 'red');

    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 15 }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                    <Ionicons name="person-circle-outline" size={100} color={BrandColors.primary} />
                </View>
                <View style={{ justifyContent: 'center', gap: 10, flex: 1 }}>
                    <Text style={{ fontSize: 19, fontWeight: 'bold' }} numberOfLines={1}>
                        {params.name}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280' }} numberOfLines={1}>
                            {params.email}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: getBadgeColor(is_active), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                            <Ionicons name={is_active ? 'checkmark-circle' : 'close-circle'} size={12} color={getStatusColor(is_active)} />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: getStatusColor(is_active) }}>
                                {is_active ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="call-outline" size={18} color={BrandColors.primary} />
                    <Text style={styles.cardTitle}>Información de contacto</Text>
                </View>
                <View style={{ gap: 12 }}>
                    <View style={styles.row}>
                        <Ionicons name="mail-outline" size={16} color="#6b7280" />
                        <Text style={styles.rowText}>{params.email}</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="call-outline" size={16} color="#6b7280" />
                        <Text style={styles.rowText}>{params.phone || '--'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="shield-outline" size={18} color={BrandColors.primary} />
                    <Text style={styles.cardTitle}>Rol y permisos</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <Ionicons name="person-outline" size={16} color="#6b7280" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.roleLabel}>{getRoleLabel(params.role)}</Text>
                        <Text style={styles.roleDescription}>{getRoleDescription(params.role)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={18} color={BrandColors.primary} />
                    <View>
                        <Text style={styles.cardTitle}>Fecha de registro</Text>
                        <Text style={styles.rowText}>{formattedDate}</Text>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 'auto', gap: 10 }}>
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Ionicons name="create-outline" size={17} color="#fff" />
                    <Text style={styles.editButtonText}>Editar usuario</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: is_active ? '#ef4444' : 'limegreen' }]}
                    onPress={handleActiveDialog}
                >
                    <Ionicons name={is_active ? 'trash-outline' : 'person-add-outline'} size={17} color={is_active ? '#ef4444' : 'limegreen'} />
                    <Text style={[styles.secondaryButtonText, { color: is_active ? '#ef4444' : 'limegreen' }]}>
                        {is_active ? 'Desactivar usuario' : 'Activar usuario'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ConfirmDialog
                visible={isConfirmVisible}
                title={is_active ? 'Desactivar usuario' : 'Activar usuario'}
                confirmText="Confirmar"
                isLoading={isToggling}
                message={is_active ? '¿Seguro que deseas desactivar a este usuario?' : '¿Deseas activar a este usuario?'}
                onConfirm={handleToggleActive}
                onCancel={handleCancelActiveDialog}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 10,
        padding: 15,
        marginTop: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 10,
        alignItems: 'center',
    },
    cardTitle: {
        fontWeight: '800',
        fontSize: 14,
        color: '#111827',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    rowText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    roleDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    secondaryButton: {
        minHeight: 48,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
    },
    secondaryButtonText: { fontSize: 13, fontWeight: '800' },
    editButton: {
        minHeight: 48,
        borderRadius: 8,
        backgroundColor: BrandColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
    },
    editButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
