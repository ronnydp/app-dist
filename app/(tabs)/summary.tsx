import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth-service';
import { getAllSellersWeeklySales, getWeeklySalesTotal } from '../../services/database';
import { SellerWeeklySales, WeeklySales } from '../../types';

function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) =>
        d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    return `${fmt(start)} - ${fmt(end)}`;
}

function DailyBars({ daily }: { daily: WeeklySales['daily'] }) {
    const maxTotal = Math.max(...daily.map((d) => d.total), 1);
    const todayStr = new Date().toISOString().slice(0, 10);

    return (
        <View style={styles.dailyContainer}>
            {daily.map((day) => {
                const barHeight =
                    day.total > 0 ? Math.max((day.total / maxTotal) * 40, 4) : 2;
                const isToday = day.date === todayStr;
                return (
                    <View key={day.date} style={styles.dailyItem}>
                        <Text
                            style={[
                                styles.dailyAmount,
                                day.total === 0 && styles.dailyAmountZero,
                            ]}
                        >
                            {day.total > 0 ? `${Math.round(day.total)}` : '-'}
                        </Text>
                        <View
                            style={[
                                styles.dailyBar,
                                { height: barHeight },
                                isToday && styles.dailyBarToday,
                                day.total === 0 && styles.dailyBarEmpty,
                            ]}
                        />
                        <Text
                            style={[
                                styles.dailyLabel,
                                isToday && styles.dailyLabelToday,
                            ]}
                        >
                            {day.dayLabel}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

export default function SummaryScreen() {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [mySales, setMySales] = useState<WeeklySales | null>(null);
    const [allSellers, setAllSellers] = useState<SellerWeeklySales[]>([]);

    const weekRange = useMemo(() => getWeekRange(), []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (role === 'admin') {
                const data = await getAllSellersWeeklySales();
                setAllSellers(data);
            } else {
                const session = await authService.getSession();
                if (session?.user?.id) {
                    const data = await getWeeklySalesTotal(session.user.id);
                    setMySales(data);
                }
            }
        } catch (e) {
            console.error('Error cargando resumen semanal:', e);
        } finally {
            setLoading(false);
        }
    }, [role]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const adminTotal = useMemo(
        () => allSellers.reduce((sum, s) => sum + s.total, 0),
        [allSellers]
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    // Vista vendedor
    if (role !== 'admin') {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.pageTitle}>Resumen semanal</Text>
                    <Text style={styles.weekRange}>{weekRange}</Text>

                    <View style={styles.totalCard}>
                        <View style={styles.totalIconContainer}>
                            <Ionicons name="trending-up" size={28} color="#16a34a" />
                        </View>
                        <Text style={styles.totalLabel}>Total vendido</Text>
                        <Text style={styles.totalAmount}>
                            S/ {(mySales?.total ?? 0).toFixed(2)}
                        </Text>
                    </View>

                    {mySales && mySales.daily.length > 0 && (
                        <View style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Ventas por día</Text>
                            <DailyBars daily={mySales.daily} />
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Vista admin
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.pageTitle}>Resumen semanal</Text>
                <Text style={styles.weekRange}>{weekRange}</Text>

                <View style={styles.totalCard}>
                    <View style={[styles.totalIconContainer, styles.totalIconAdmin]}>
                        <Ionicons name="stats-chart" size={28} color="#2563eb" />
                    </View>
                    <Text style={styles.totalLabel}>Total general</Text>
                    <Text style={[styles.totalAmount, styles.totalAmountAdmin]}>
                        S/ {adminTotal.toFixed(2)}
                    </Text>
                    <Text style={styles.sellerCount}>
                        {allSellers.length} vendedor{allSellers.length !== 1 ? 'es' : ''}
                    </Text>
                </View>

                {allSellers.map((seller) => (
                    <View key={seller.sellerId} style={styles.sellerCard}>
                        <View style={styles.sellerHeader}>
                            <View style={styles.sellerInfo}>
                                <Ionicons name="person" size={18} color="#2563eb" />
                                <Text style={styles.sellerName}>{seller.sellerName}</Text>
                            </View>
                            <Text style={styles.sellerTotal}>
                                S/ {seller.total.toFixed(2)}
                            </Text>
                        </View>
                        <DailyBars daily={seller.daily} />
                    </View>
                ))}

                {allSellers.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                        <Text style={styles.emptyText}>Sin ventas esta semana</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    weekRange: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 16,
    },
    totalCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    totalIconContainer: {
        backgroundColor: '#dcfce7',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    totalIconAdmin: {
        backgroundColor: '#dbeafe',
    },
    totalLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#16a34a',
        marginTop: 2,
    },
    totalAmountAdmin: {
        color: '#2563eb',
    },
    sellerCount: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    sellerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    sellerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    sellerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    sellerTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#16a34a',
    },
    dailyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    dailyItem: {
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    dailyAmount: {
        fontSize: 10,
        fontWeight: '600',
        color: '#16a34a',
    },
    dailyAmountZero: {
        color: '#d1d5db',
    },
    dailyBar: {
        width: 20,
        borderRadius: 4,
        backgroundColor: '#86efac',
    },
    dailyBarToday: {
        backgroundColor: '#16a34a',
    },
    dailyBarEmpty: {
        backgroundColor: '#e5e7eb',
    },
    dailyLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
    },
    dailyLabelToday: {
        fontWeight: '700',
        color: '#16a34a',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#9ca3af',
        fontWeight: '500',
    },
});
