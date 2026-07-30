import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth-service";
import {
    getAllSellersWeeklySales,
    getWeeklySalesTotal,
} from "../../services/database";
import { SellerWeeklySales, WeeklySales } from "../../types";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const year = now.getFullYear();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  return `${fmt(start)} - ${fmt(end)}, ${year}`;
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function DailyBars({ daily }: { daily: WeeklySales["daily"] }) {
  const maxTotal = Math.max(...daily.map((d) => d.total), 1);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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
              {day.total > 0 ? `${Math.round(day.total)}` : "-"}
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
              style={[styles.dailyLabel, isToday && styles.dailyLabelToday]}
            >
              {isToday ? "Hoy" : day.dayLabel}
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
  const todayKey = useMemo(() => getTodayKey(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === "admin") {
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
      console.error("Error cargando resumen semanal:", e);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const adminTotal = useMemo(
    () => allSellers.reduce((sum, s) => sum + s.total, 0),
    [allSellers],
  );

  const adminDailyTotals = useMemo(() => {
    return allSellers.reduce<
      Array<{ date: string; dayLabel: string; total: number }>
    >((acc, seller) => {
      seller.daily.forEach((day) => {
        const existing = acc.find((item) => item.date === day.date);
        if (existing) {
          existing.total += day.total;
        } else {
          acc.push({
            date: day.date,
            dayLabel: day.dayLabel,
            total: day.total,
          });
        }
      });
      return acc;
    }, []);
  }, [allSellers]);

  const adminTodayTotal = useMemo(() => {
    const todayEntry = adminDailyTotals.find((day) => day.date === todayKey);
    return todayEntry?.total ?? 0;
  }, [adminDailyTotals, todayKey]);

  const adminTodayOrderCount = useMemo(() => {
    return allSellers.reduce((sum, seller) => sum + seller.orderCount, 0);
  }, [allSellers]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#08859b" />
        </View>
      </View>
    );
  }

  // Vista vendedor
  if (role !== "admin") {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
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
      </View>
    );
  }

  // Vista admin
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.weekRange}>{weekRange}</Text>

        <View style={styles.metricCardsRow}>
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <Text style={styles.metricCardLabel}>Total del día</Text>
            <Text style={styles.metricCardAmount}>
              S/ {adminTodayTotal.toFixed(2)}
            </Text>
            <Text style={styles.metricCardSubtext}>
              {adminTodayOrderCount} boleta
              {adminTodayOrderCount !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Monto de la semana</Text>
            <Text style={styles.metricCardAmount}>
              S/ {adminTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.dailySummaryCard}>
          <Text style={styles.dailySummaryTitle}>Total por día</Text>
          {adminDailyTotals.length > 0 ? (
            adminDailyTotals.map((day) => {
              const isToday = day.date === todayKey;
              return (
                <View
                  key={day.date}
                  style={[
                    styles.dailySummaryRow,
                    isToday && styles.dailySummaryRowActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dailySummaryLabel,
                      isToday && styles.dailySummaryLabelActive,
                    ]}
                  >
                    {isToday ? "Hoy" : day.dayLabel}
                  </Text>
                  <Text
                    style={[
                      styles.dailySummaryAmount,
                      isToday && styles.dailySummaryAmountActive,
                    ]}
                  >
                    S/ {day.total.toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Sin ventas esta semana</Text>
          )}
        </View>

        {allSellers.map((seller) => (
          <View key={seller.sellerId} style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Ionicons name="person" size={18} color="#08859b" />
                  <Text style={styles.sellerName}>{seller.sellerName}</Text>
                </View>
              </View>
              <View style={styles.sellerAmountBlock}>
                <Text style={styles.sellerAmountLabel}>Semanal</Text>
                <Text style={styles.sellerTotal}>
                  S/ {seller.total.toFixed(2)}
                </Text>
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  content: {
    padding: 20,
    marginBottom: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  weekRange: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "900",
    marginBottom: 16,
    textAlign: "center",
  },
  totalCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  totalIconContainer: {
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  totalIconAdmin: {
    backgroundColor: "#dbeafe",
  },
  totalLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#16a34a",
    marginTop: 2,
  },
  totalAmountAdmin: {
    color: "#2563eb",
  },
  sellerCount: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  metricCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 110,
    justifyContent: "center",
  },
  metricCardPrimary: {
    backgroundColor: "#ecfeff",
    borderColor: "#a7f3d0",
  },
  metricCardLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  metricCardAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  metricCardSubtext: {
    fontSize: 12,
    color: "#0f766e",
    marginTop: 6,
    fontWeight: "600",
  },
  dailySummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  dailySummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  dailySummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dailySummaryRowActive: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  dailySummaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  dailySummaryLabelActive: {
    color: "#16a34a",
    fontWeight: "700",
  },
  dailySummaryAmount: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
  },
  dailySummaryAmountActive: {
    color: "#16a34a",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  sellerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  sellerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sellerInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  sellerOrderCount: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  sellerAmountBlock: {
    alignItems: "flex-end",
    minWidth: 96,
  },
  sellerAmountLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sellerTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
  },
  dailyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dailyItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  dailyAmount: {
    fontSize: 10,
    fontWeight: "600",
    color: "#16a34a",
  },
  dailyAmountZero: {
    color: "#d1d5db",
  },
  dailyBar: {
    width: 20,
    borderRadius: 4,
    backgroundColor: "#86efac",
  },
  dailyBarToday: {
    backgroundColor: "#16a34a",
    width: 24,
    shadowColor: "#16a34a",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dailyBarEmpty: {
    backgroundColor: "#e5e7eb",
  },
  dailyLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6b7280",
  },
  dailyLabelToday: {
    fontWeight: "700",
    color: "#16a34a",
    transform: [{ scale: 1.02 }],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
