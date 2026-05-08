import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors as theme } from "../assets/theme/colors";
import { useAuth } from "../backend/context/auth";
import * as transactionApi from "../backend/controllers/transactionApi";
import * as categoryApi from "../backend/controllers/categoryApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 48;
const BAR_CHART_HEIGHT = 160;

const MONTHS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value || 0) + " ₫";

const formatShort = (value) => {
  if (!value) return "0";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
  return value.toString();
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data = [], color = "#4CAF50" }) {
  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: (data[i]?.value || 0) / maxVal,
        duration: 600,
        delay: i * 60,
        useNativeDriver: false,
      })
    );
    Animated.stagger(60, animations).start();
  }, [data]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        height: BAR_CHART_HEIGHT,
        gap: 4,
      }}
    >
      {data.map((item, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center" }}>
          <Animated.View
            style={{
              width: "70%",
              height: anims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [2, BAR_CHART_HEIGHT - 24],
              }),
              backgroundColor: color,
              borderRadius: 4,
              opacity: 0.85,
            }}
          />
          <Text style={styles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Donut Chart (pure RN, no SVG dep) ───────────────────────────────────────
function DonutRing({ segments = [], size = 140 }) {
  // Simple visual approximation using stacked arcs via border-radius trick
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = size / 2;
  const r = size / 2 - 12;
  const strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* SVG-free donut: stacked rings using absolute positioned views with borders */}
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const rotation = (offset / total) * 360;
        offset += seg.value;
        const sweep = pct * 360;
        return (
          <View
            key={i}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size / 2,
                borderWidth: strokeW,
                borderColor: "transparent",
                borderTopColor: seg.color,
                transform: [{ rotate: `${rotation}deg` }],
                opacity: sweep < 5 ? 0 : 1,
              },
            ]}
          />
        );
      })}
      <View
        style={{
          width: size - strokeW * 2 - 4,
          height: size - strokeW * 2 - 4,
          borderRadius: (size - strokeW * 2 - 4) / 2,
          backgroundColor: "#1E1E2C",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={styles.donutCenter}>{segments.length}</Text>
        <Text style={styles.donutLabel}>danh mục</Text>
      </View>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? value / max : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState("month"); // "week" | "month" | "year"
  const [tab, setTab] = useState("expense"); // "expense" | "income"
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [sRes, tRes, cRes] = await Promise.all([
        transactionApi.getSummary({ userId: user.id }),
        transactionApi.getAll({ limit: 200, userId: user.id }),
        categoryApi.getVisible(null),
      ]);

      const allTx = tRes.data || [];
      const cats = cRes.data || [];
      setCategories(cats);
      setSummary(sRes.data || { totalIncome: 0, totalExpense: 0 });

      // Build monthly bar data (last 6 months)
      const now = new Date();
      const monthly = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = MONTHS[d.getMonth()];
        const value = allTx
          .filter((tx) => {
            const txDate = new Date(tx.date || tx.createdAt);
            return (
              txDate.getMonth() === d.getMonth() &&
              txDate.getFullYear() === d.getFullYear() &&
              tx.type === tab
            );
          })
          .reduce((s, tx) => s + (tx.amount || 0), 0);
        return { label, value };
      });
      setMonthlyData(monthly);

      // Category breakdown
      const breakdown = cats
        .filter((c) => c.type === tab)
        .map((cat) => {
          const total = allTx
            .filter((tx) => tx.categoryId === cat.id && tx.type === tab)
            .reduce((s, tx) => s + (tx.amount || 0), 0);
          return { ...cat, total };
        })
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
      setCategoryBreakdown(breakdown);
    } catch (err) {
      console.error("Lỗi báo cáo:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tab, user?.id]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData, user?.id]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const net = summary.totalIncome - summary.totalExpense;
  const maxBreakdown = categoryBreakdown[0]?.total || 1;

  const PALETTE = [
    "#FF6B6B",
    "#FFA94D",
    "#FFD43B",
    "#69DB7C",
    "#4DABF7",
    "#DA77F2",
  ];

  const donutSegments = categoryBreakdown.map((c, i) => ({
    value: c.total,
    color: c.color || PALETTE[i % PALETTE.length],
    name: c.name,
  }));

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo tài chính</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* ── Summary Cards ── */}
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, { borderColor: theme.primary + "60" }]}
          >
            <Text style={styles.summaryIcon}>📈</Text>
            <Text style={styles.summaryLabel}>Thu nhập</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>
              {formatShort(summary.totalIncome)}₫
            </Text>
          </View>
          <View
            style={[styles.summaryCard, { borderColor: theme.danger + "60" }]}
          >
            <Text style={styles.summaryIcon}>📉</Text>
            <Text style={styles.summaryLabel}>Chi tiêu</Text>
            <Text style={[styles.summaryValue, { color: theme.danger }]}>
              {formatShort(summary.totalExpense)}₫
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { borderColor: (net >= 0 ? theme.primary : theme.danger) + "60" },
            ]}
          >
            <Text style={styles.summaryIcon}>{net >= 0 ? "💰" : "⚠️"}</Text>
            <Text style={styles.summaryLabel}>Số dư</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: net >= 0 ? theme.primary : theme.danger },
              ]}
            >
              {formatShort(Math.abs(net))}₫
            </Text>
          </View>
        </View>

        {/* ── Tab: Chi / Thu ── */}
        <View style={styles.tabBar}>
          {[
            { key: "expense", label: "Chi tiêu" },
            { key: "income", label: "Thu nhập" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === t.key && styles.tabBtnTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Bar Chart ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {tab === "expense" ? "Chi tiêu" : "Thu nhập"} 6 tháng gần đây
            </Text>
          </View>

          {/* Period toggle */}
          <View style={styles.periodToggle}>
            {["week", "month", "year"].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodBtn,
                  period === p && styles.periodBtnActive,
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    period === p && styles.periodBtnTextActive,
                  ]}
                >
                  {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <BarChart
            data={monthlyData}
            color={
              tab === "expense" ? theme.danger : theme.primary || "#4CAF50"
            }
          />

          {/* Y-axis hint */}
          <View style={styles.chartLegendRow}>
            <Text style={styles.chartLegendText}>0</Text>
            <Text style={styles.chartLegendText}>
              {formatShort(Math.max(...monthlyData.map((d) => d.value), 0))}₫
            </Text>
          </View>
        </View>

        {/* ── Donut + Category List ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Phân tích danh mục</Text>
          </View>

          {categoryBreakdown.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có dữ liệu 🙌</Text>
            </View>
          ) : (
            <>
              <View style={styles.donutRow}>
                <DonutRing segments={donutSegments} size={140} />
                <View style={styles.legendList}>
                  {donutSegments.slice(0, 4).map((s, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, { backgroundColor: s.color }]}
                      />
                      <Text style={styles.legendName} numberOfLines={1}>
                        {s.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ marginTop: 16, gap: 12 }}>
                {categoryBreakdown.map((cat, i) => (
                  <View key={cat.id}>
                    <View style={styles.catRow}>
                      <Text style={styles.catIcon}>{cat.icon || "💰"}</Text>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text
                        style={[
                          styles.catAmount,
                          {
                            color:
                              tab === "expense" ? theme.danger : theme.primary,
                          },
                        ]}
                      >
                        {formatShort(cat.total)}₫
                      </Text>
                    </View>
                    <ProgressBar
                      value={cat.total}
                      max={maxBreakdown}
                      color={cat.color || PALETTE[i % PALETTE.length]}
                    />
                    <Text style={styles.catPct}>
                      {(
                        (cat.total /
                          (summary[
                            tab === "expense" ? "totalExpense" : "totalIncome"
                          ] || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ── Tỉ lệ thu/chi ── */}
        <View style={[styles.card, { marginBottom: 100 }]}>
          <Text style={styles.cardTitle}>Tỉ lệ thu / chi</Text>
          <View style={{ marginTop: 16 }}>
            <View style={styles.ratioRow}>
              <Text style={styles.ratioLabel}>Thu nhập</Text>
              <Text style={[styles.ratioValue, { color: theme.primary }]}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
            <ProgressBar
              value={summary.totalIncome}
              max={Math.max(summary.totalIncome, summary.totalExpense, 1)}
              color={theme.primary || "#4CAF50"}
            />

            <View style={[styles.ratioRow, { marginTop: 14 }]}>
              <Text style={styles.ratioLabel}>Chi tiêu</Text>
              <Text style={[styles.ratioValue, { color: theme.danger }]}>
                {formatCurrency(summary.totalExpense)}
              </Text>
            </View>
            <ProgressBar
              value={summary.totalExpense}
              max={Math.max(summary.totalIncome, summary.totalExpense, 1)}
              color={theme.danger}
            />

            <View style={styles.savingsBox}>
              <Text style={styles.savingsLabel}>
                {net >= 0 ? "🎉 Tiết kiệm được" : "⚠️ Vượt chi"}
              </Text>
              <Text
                style={[
                  styles.savingsValue,
                  { color: net >= 0 ? theme.primary : theme.danger },
                ]}
              >
                {formatCurrency(Math.abs(net))}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#13131F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff15",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { color: "#fff", fontSize: 18 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1E1E2C",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  summaryIcon: { fontSize: 20 },
  summaryLabel: { color: "#8888A0", fontSize: 11, marginTop: 4 },
  summaryValue: { fontSize: 15, fontWeight: "700", marginTop: 2 },

  // Tab
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#1E1E2C",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#2E2E45" },
  tabBtnText: { color: "#8888A0", fontSize: 14, fontWeight: "600" },
  tabBtnTextActive: { color: "#fff" },

  // Card
  card: {
    marginHorizontal: 16,
    backgroundColor: "#1E1E2C",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Period toggle
  periodToggle: {
    flexDirection: "row",
    backgroundColor: "#13131F",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  periodBtn: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 8 },
  periodBtnActive: { backgroundColor: "#2E2E45" },
  periodBtnText: { color: "#8888A0", fontSize: 12, fontWeight: "600" },
  periodBtnTextActive: { color: "#fff" },

  // Bar chart
  barLabel: { color: "#8888A0", fontSize: 10, marginTop: 4 },
  chartLegendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  chartLegendText: { color: "#8888A0", fontSize: 10 },

  // Donut
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  donutCenter: { color: "#fff", fontSize: 22, fontWeight: "700" },
  donutLabel: { color: "#8888A0", fontSize: 11 },
  legendList: { flex: 1, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { color: "#ccc", fontSize: 13, flex: 1 },

  // Category rows
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  catIcon: { fontSize: 18 },
  catName: { color: "#ddd", fontSize: 13, flex: 1 },
  catAmount: { fontSize: 13, fontWeight: "700" },
  catPct: { color: "#8888A0", fontSize: 11, textAlign: "right", marginTop: 2 },

  // Progress bar
  progressTrack: {
    height: 6,
    backgroundColor: "#2E2E45",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  // Ratio section
  ratioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ratioLabel: { color: "#aaa", fontSize: 13 },
  ratioValue: { fontSize: 13, fontWeight: "700" },
  savingsBox: {
    marginTop: 20,
    backgroundColor: "#13131F",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savingsLabel: { color: "#ccc", fontSize: 14, fontWeight: "600" },
  savingsValue: { fontSize: 16, fontWeight: "800" },

  // Empty
  emptyBox: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: "#8888A0", fontSize: 14 },
});
