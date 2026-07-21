import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

export default function DetailCustomer() {
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        ruc?: string;
        address?: string;
        district?: string;
        phone?: string;
        cod_customer?: string,
        created_at?: string,
        updated_at?: string
    }>()
    const emptyIfMissing = (value: any) => (value || value === 0 ? String(value) : '-');
    return (
        <View style={styles.container}>
            <View style={styles.modalHeader}>
                <View style={styles.avatar}>
                    <Ionicons name="storefront-outline" size={50} color="#fff" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.customerName}>{params?.name}</Text>
                    <Text style={styles.badgeText}>#{params ? String(params.cod_customer) : 'no tiene'}</Text>
                </View>
            </View>
            <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>RUC</Text>
                    <Text style={styles.detailValue}>{params ? emptyIfMissing(params.ruc) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{params ? emptyIfMissing(params.phone) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dirección</Text>
                    <Text style={styles.detailValue}>{params ? emptyIfMissing(params.address) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distrito</Text>
                    <Text style={styles.detailValue}>{params ? emptyIfMissing(params.district) : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Creado</Text>
                    <Text style={styles.detailValue}>{params ? (params.created_at ? new Date(params.created_at).toLocaleString('es-PE') : 'no tiene') : 'no tiene'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Actualizado</Text>
                    <Text style={styles.detailValue}>{params ? (params.updated_at ? new Date(params.updated_at).toLocaleString('es-PE') : 'no tiene') : 'no tiene'}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#fbfbfb',
    },
    detailLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '800',
    },
    detailValue: {
        fontSize: 13,
        color: '#111827',
        flex: 1,
        textAlign: 'right',
        marginLeft: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        paddingBottom: 15,
        paddingHorizontal: 15
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#08859b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    badgeText: {
        fontSize: 15,
        color: '#08859b',
        fontWeight: '700',
    },
    modalBody: {
        padding: 15,
        borderWidth: 0.5,
        borderRadius: 10,
        borderColor: '#b8b8b8',
        gap: 12
    }
})