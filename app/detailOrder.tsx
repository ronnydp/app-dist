import ConfirmDialog from '@/components/ConfirmDialogProps';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastsContext';
import { cancelOrder } from '@/services/database';
import { OrderWithDetails } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function formatOrderDate(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(date);
}

function formatMoney(value: number) {
    return `S/ ${value.toFixed(2)}`;
}

export default function DetailOrderScreen() {
    const { session } = useAuth();
    const { showToast } = useToast();
    const [isConfirmCancelVisible, setIsConfirmCancelVisible] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const params = useLocalSearchParams<{ order?: string }>();

    const order = useMemo<OrderWithDetails | null>(() => {
        if (!params.order) return null;

        try {
            return JSON.parse(params.order) as OrderWithDetails;
        } catch {
            return null;
        }
    }, [params.order]);

    const isOwner = session?.user?.id === order?.seller_id;
    const isInSystem = order?.status === 'in_system';

    const handleConfirmCancel = async () => {
        if (!order) return;
        try {
            setIsCanceling(true);
            await cancelOrder(order.id, session?.user?.id);
            showToast('Pedido cancelado correctamente', 'success');
            router.back();
        } catch (error: any) {
            showToast(error?.message || 'No se pudo cancelar el pedido', 'error');
            console.error(error);
        } finally {
            setIsCanceling(false);
            setIsConfirmCancelVisible(false);
        }
    };

    const handleEdit = () => {
        if (!order) return;
        if (!isOwner) {
            showToast('Solo el vendedor que creó el pedido puede editarlo', 'error');
            return;
        }
        if (isInSystem) {
            showToast('El pedido ya fue enviado y no se puede editar', 'error');
            return;
        }
        router.push({
            pathname: '/newOrder',
            params: {
                orderId: order.id,
                orderData: JSON.stringify(order),
            },
        });
    };

    if (!order) {
        return (
            <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={42} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No se pudo cargar el pedido</Text>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Volver</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.customerSection}>
                    <View style={styles.sectionHeading}>
                        <Ionicons name="person" size={18} color={BrandColors.primary} />
                        <Text style={styles.customerName}>{order.customer_name}</Text>
                    </View>
                    <InfoRow icon="call" value={order.customer_phone || 'Teléfono no registrado'} />
                    <InfoRow
                        icon="location"
                        value={[order.customer_address, order.customer_district].filter(Boolean).join(', ') || 'Dirección no registrada'}
                    />
                    {order.seller_name ? (
                        <InfoRow icon="person-circle-outline" value={`Vendedor: ${order.seller_name}`} />
                    ) : null}
                </View>

                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={18} color={BrandColors.primary} />
                    <Text style={styles.dateText}>{formatOrderDate(order.created_at || order.date)}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeading}>
                        <Ionicons name="cube-outline" size={18} color={BrandColors.primary} />
                        <Text style={styles.sectionTitle}>Productos ({order.products.length})</Text>
                    </View>
                    {order.products.map((item) => (
                        <View key={`${item.product_id}-${item.presentation_name}`} style={styles.productRow}>
                            <View style={styles.productImagePlaceholder}>
                                <Ionicons name="cube-outline" size={22} color="#7294b2" />
                            </View>
                            <View style={styles.productCopy}>
                                <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
                                <Text style={styles.productMeta}>{item.amount} x{item.presentation_name ? ` ${item.presentation_name}` : ''}</Text>
                            </View>
                            <View style={styles.productPriceCopy}>
                                <Text style={styles.productPrice}>{formatMoney(item.sub_total)}</Text>
                                <Text style={styles.unitPrice}>c/u {formatMoney(item.unit_price)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total del pedido</Text>
                    <Text style={styles.orderTotal}>{formatMoney(order.total)}</Text>
                </View>

                {order.note ? (
                    <View style={styles.noteCard}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#a16207" />
                        <Text style={styles.noteText}>{order.note}</Text>
                    </View>
                ) : null}
            </ScrollView>

            {isOwner && !isInSystem ? (
                <View style={styles.actionsBar}>
                    <Pressable
                        style={styles.cancelButton}
                        onPress={() => setIsConfirmCancelVisible(true)}
                        disabled={isCanceling}
                    >
                        <Ionicons name="trash-outline" size={17} color="#ef4444" />
                        <Text style={styles.cancelButtonText}>Cancelar pedido</Text>
                    </Pressable>
                    <Pressable
                        style={styles.editButton}
                        onPress={handleEdit}
                        disabled={isCanceling}
                    >
                        <Ionicons name="create-outline" size={17} color="#fff" />
                        <Text style={styles.editButtonText}>Editar pedido</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.nonOwnerNotice}>
                    <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
                    <Text style={styles.nonOwnerNoticeText}>
                        {isInSystem
                            ? 'Pedido enviado al sistema. Ya no se puede editar.'
                            : 'Solo el vendedor que creó este pedido puede editarlo o cancelarlo.'}
                    </Text>
                </View>
            )}

            <ConfirmDialog
                visible={isConfirmCancelVisible}
                title="Cancelar Pedido"
                message="¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer."
                confirmText="Sí, cancelar"
                cancelText="Volver"
                isLoading={isCanceling}
                onConfirm={handleConfirmCancel}
                onCancel={() => setIsConfirmCancelVisible(false)}
            />
        </View>
    );
}

function InfoRow({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={16} color="#47719c" />
            <Text style={styles.infoText}>{value}</Text>
        </View>
    );
}

function SummaryRow({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
    return (
        <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, emphasized && styles.summaryLabelEmphasized]}>{label}</Text>
            <Text style={[styles.summaryValue, emphasized && styles.summaryValueEmphasized]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 16, paddingBottom: 24, backgroundColor: '#fff' },
    orderHeader: {
        backgroundColor: BrandColors.primary,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
    orderHeaderCopy: { flex: 1, marginLeft: 12 },
    orderLabel: { color: '#dbeafe', fontSize: 12, fontWeight: '600' },
    orderCode: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
    orderTotal: { color: '#3d6491', fontSize: 18, fontWeight: '800', marginLeft: 'auto' },
    customerSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5eaf0' },
    sectionHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
    sectionTitle: { color: '#172b4d', fontSize: 15, fontWeight: '800' },
    customerName: { color: '#172b4d', fontSize: 16, fontWeight: '700', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
    infoText: { flex: 1, color: '#55718e', fontSize: 13 },
    dateRow: { flexDirection: 'row', margin: "auto", alignItems: 'center', gap: 9, paddingVertical: 15, marginHorizontal: 2, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    dateText: { color: '#55718e', fontSize: 13, fontWeight: '600' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5eaf0', borderRadius: 12 },
    totalLabel: { color: '#55718e', fontSize: 14, fontWeight: '700' },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5eaf0' },
    productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eef2f6' },
    productImagePlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    productCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
    productName: { color: '#29415d', fontSize: 12, fontWeight: '700' },
    productMeta: { color: '#7390aa', fontSize: 11, marginTop: 5 },
    productPriceCopy: { alignItems: 'flex-end' },
    productPrice: { color: '#29415d', fontSize: 13, fontWeight: '800' },
    unitPrice: { color: '#7390aa', fontSize: 10, marginTop: 4 },
    summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5eaf0' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    summaryLabel: { color: '#67829d', fontSize: 13 },
    summaryValue: { color: '#29415d', fontSize: 13, fontWeight: '700' },
    summaryLabelEmphasized: { color: '#172b4d', fontWeight: '800', fontSize: 15 },
    summaryValueEmphasized: { color: '#172b4d', fontSize: 16, fontWeight: '800' },
    summaryDivider: { height: 1, backgroundColor: '#e5eaf0', marginVertical: 8 },
    noteCard: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 13, marginTop: 12, flexDirection: 'row', gap: 9 },
    noteText: { flex: 1, color: '#854d0e', fontSize: 13 },
    actionsBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5eaf0' },
    cancelButton: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#fb7185', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    cancelButtonText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
    editButton: { flex: 1, minHeight: 48, borderRadius: 8, backgroundColor: '#2878df', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    editButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    nonOwnerNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e5eaf0'},
    nonOwnerNoticeText: { color: '#64748b', fontSize: 12, fontWeight: '500'},
    emptyState: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyTitle: { color: '#475569', fontSize: 16, fontWeight: '700', marginTop: 12 },
    backButton: { backgroundColor: BrandColors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18 },
    backButtonText: { color: '#fff', fontWeight: '700' },
});
