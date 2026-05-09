import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48; // padding 24 mỗi bên

// ─── Màu sắc ──────────────────────────────────────────────────────────────────
const COLOR_EXPENSE = "#FF4757";
const COLOR_INCOME = "#2ECC71";
const COLOR_TOOLTIP_BG = "#1C1C1E";

// ─── Tạo dữ liệu mẫu theo ngày trong tháng ───────────────────────────────────
function buildChartData(transactions = []) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  // Tạo map ngày → { income, expense }
  const dayMap = {};
  for (let d = 1; d <= today; d++) {
    dayMap[d] = { income: 0, expense: 0 };
  }

  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (dayMap[day] !== undefined) {
        if (tx.type === "income") dayMap[day].income += Number(tx.amount);
        else dayMap[day].expense += Number(tx.amount);
      }
    }
  });

  const expenseData = [];
  const incomeData = [];

  Object.keys(dayMap)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((day) => {
      const label = day % 5 === 0 || day === 1 || day === today ? `${day}` : "";
      expenseData.push({
        value: dayMap[day].expense,
        label,
        date: day,
        dataPointText: "",
      });
      incomeData.push({
        value: dayMap[day].income,
        label,
        date: day,
        dataPointText: "",
      });
    });

  return { expenseData, incomeData };
}

function formatVND(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("vi-VN");
}

// ─── Tooltip hiện khi chạm ───────────────────────────────────────────────────
function TooltipBox({ expense, income, day }) {
  if (day == null) return null;
  return (
    <View style={tooltipStyles.box}>
      <Text style={tooltipStyles.day}>Ngày {day}</Text>
      <View style={tooltipStyles.row}>
        <View style={[tooltipStyles.dot, { backgroundColor: COLOR_EXPENSE }]} />
        <Text style={tooltipStyles.label}>Chi: </Text>
        <Text style={[tooltipStyles.val, { color: COLOR_EXPENSE }]}>
          {formatVND(expense)}
        </Text>
      </View>
      <View style={tooltipStyles.row}>
        <View style={[tooltipStyles.dot, { backgroundColor: COLOR_INCOME }]} />
        <Text style={tooltipStyles.label}>Thu: </Text>
        <Text style={[tooltipStyles.val, { color: COLOR_INCOME }]}>
          {formatVND(income)}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   transactions: array của { date, type, amount }
 *   totalExpense: number
 *   totalIncome:  number
 *   theme:        { danger, blue, ... }
 *   formatCurrency: function
 *   summary:      { totalExpense, totalIncome }
 */
export default function ReportChartSection({
  transactions = [],
  totalExpense = 0,
  totalIncome = 0,
  theme = { danger: "#FF4757", blue: "#4A90E2" },
  formatCurrency = (n) => formatVND(n),
  summary = { totalExpense: 0, totalIncome: 0 },
}) {
  const [tooltip, setTooltip] = useState(null); // { day, expense, income }
  const [activeMode, setActiveMode] = useState("both"); // "both"|"expense"|"income"

  const { expenseData, incomeData } = useMemo(
    () => buildChartData(transactions),
    [transactions]
  );

  // Dùng data mẫu nếu chưa có giao dịch
  const hasData =
    expenseData.some((d) => d.value > 0) || incomeData.some((d) => d.value > 0);

  const sampleExpense = [
    500000, 800000, 300000, 1200000, 600000, 900000, 400000, 1100000, 700000,
    500000,
  ];
  const sampleIncome = [0, 0, 0, 2000000, 0, 0, 0, 0, 0, 3000000];

  const finalExpense = hasData
    ? expenseData
    : sampleExpense.map((v, i) => ({
        value: v,
        label: i % 3 === 0 ? `${i + 1}` : "",
        date: i + 1,
      }));
  const finalIncome = hasData
    ? incomeData
    : sampleIncome.map((v, i) => ({
        value: v,
        label: i % 3 === 0 ? `${i + 1}` : "",
        date: i + 1,
      }));

  const showExpense = activeMode !== "income";
  const showIncome = activeMode !== "expense";

  // Khi người dùng chạm vào điểm
  const handleTouch = (item, index) => {
    const day = finalExpense[index]?.date ?? index + 1;
    const exp = finalExpense[index]?.value ?? 0;
    const inc = finalIncome[index]?.value ?? 0;
    setTooltip({ day, expense: exp, income: inc });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Báo cáo tháng này</Text>
        <View style={styles.filterRow}>
          {["both", "expense", "income"].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => {
                setActiveMode(mode);
                setTooltip(null);
              }}
              style={[
                styles.filterBtn,
                activeMode === mode && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeMode === mode && styles.filterTextActive,
                ]}
              >
                {mode === "both"
                  ? "Tất cả"
                  : mode === "expense"
                  ? "Chi"
                  : "Thu"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tổng thu chi */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: COLOR_EXPENSE }]} />
          <View>
            <Text style={styles.summaryLabel}>Tổng đã chi</Text>
            <Text style={[styles.summaryValue, { color: COLOR_EXPENSE }]}>
              {formatCurrency(summary.totalExpense || totalExpense)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: COLOR_INCOME }]} />
          <View>
            <Text style={styles.summaryLabel}>Tổng thu</Text>
            <Text style={[styles.summaryValue, { color: COLOR_INCOME }]}>
              {formatCurrency(summary.totalIncome || totalIncome)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tooltip */}
      {tooltip && (
        <TooltipBox
          day={tooltip.day}
          expense={tooltip.expense}
          income={tooltip.income}
        />
      )}

      {/* Chart */}
      <View style={styles.chartWrap}>
        <LineChart
          data={showExpense ? finalExpense : [{ value: 0 }]}
          data2={showIncome ? finalIncome : undefined}
          width={CHART_WIDTH - 40}
          height={180}
          // Đường chi
          color={COLOR_EXPENSE}
          thickness={2}
          // Đường thu
          color2={COLOR_INCOME}
          thickness2={2}
          // Vùng tô dưới đường
          areaChart
          startFillColor={COLOR_EXPENSE}
          startOpacity={0.15}
          endOpacity={0}
          startFillColor2={COLOR_INCOME}
          startOpacity2={0.15}
          endOpacity2={0}
          // Điểm dữ liệu
          dataPointsColor={COLOR_EXPENSE}
          dataPointsColor2={COLOR_INCOME}
          dataPointsRadius={4}
          dataPointsRadius2={4}
          // Trục & lưới
          xAxisColor="#38383A"
          yAxisColor="#38383A"
          yAxisTextStyle={{ color: "#8E8E93", fontSize: 10 }}
          xAxisLabelTextStyle={{ color: "#8E8E93", fontSize: 10 }}
          rulesColor="#2C2C2E"
          rulesType="solid"
          noOfSections={4}
          yAxisLabelSuffix=""
          formatYLabel={(v) => formatVND(Number(v))}
          // Background
          backgroundColor="transparent"
          // Chạm
          onPress={handleTouch}
          pressEnabled
          showStripOnPress
          stripColor="#38383A"
          stripWidth={1}
          focusedDataPointColor={COLOR_EXPENSE}
          focusedDataPointColor2={COLOR_INCOME}
          focusedDataPointRadius={6}
          // Đường cong
          curved
          // Ẩn label trục Y mặc định
          hideDataPoints={false}
          // Padding
          initialSpacing={8}
          endSpacing={8}
        />
      </View>

      {!hasData && (
        <Text style={styles.sampleNote}>* Đang hiển thị dữ liệu mẫu</Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#2C2C2E",
  },
  filterBtnActive: { backgroundColor: "#38383A" },
  filterText: { color: "#8E8E93", fontSize: 12 },
  filterTextActive: { color: "#FFF", fontWeight: "600" },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  summaryLabel: { color: "#8E8E93", fontSize: 11 },
  summaryValue: { fontSize: 14, fontWeight: "700" },

  chartWrap: { marginLeft: -8 },

  sampleNote: {
    color: "#555",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});

const tooltipStyles = StyleSheet.create({
  box: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#38383A",
  },
  day: { color: "#FFF", fontSize: 12, fontWeight: "700", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  label: { color: "#8E8E93", fontSize: 12 },
  val: { fontSize: 12, fontWeight: "600" },
});
