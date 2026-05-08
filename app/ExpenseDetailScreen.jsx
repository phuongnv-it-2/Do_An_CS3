// app/screens/ExpenseDetailScreen.jsx
// Màn hình chi tiết khoản chi

import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";
import { colors as theme } from "../assets/theme/colors";
import { useAuth } from "../backend/context/auth";
import * as categoryApi from "../backend/controllers/categoryApi";
import * as transactionApi from "../backend/controllers/transactionApi";

const { width } = Dimensions.get("window");

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
};

const TABS_PERIOD = ["03/2026", "THÁNG TRƯỚC", "THÁNG NÀY"];

// Donut chart component
const DonutChart = ({ data }) => {
  const size = width * 0.65;
  const strokeWidth = 52;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let cumulativePercent = 0;

  const segments = data.map((item) => {
    const startPercent = cumulativePercent;
    cumulativePercent += item.percent / 100;
    const startAngle = startPercent * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
    const largeArc = item.percent > 50 ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    return { ...item, x1, y1, x2, y2, largeArc };
  });

  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <Svg width={size} height={size}>
        <G>
          {segments.length === 1 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={segments[0].color}
              strokeWidth={strokeWidth}
            />
          ) : (
            segments.map((seg, i) => (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${
                  (seg.percent / 100) * circumference
                } ${circumference}`}
                strokeDashoffset={
                  -(
                    (seg.percent === segments[0].percent
                      ? 0
                      : segments
                          .slice(0, i)
                          .reduce((a, s) => a + s.percent, 0)) / 100
                  ) * circumference
                }
                transform={`rotate(-90, ${cx}, ${cy})`}
              />
            ))
          )}
        </G>
      </Svg>

      {/* Connector line + icon dưới chart */}
      {segments.map((seg, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 2,
              height: 24,
              backgroundColor: "#4CAF50",
              marginBottom: 2,
            }}
          />
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#1e2530",
              borderWidth: 1,
              borderColor: "#333",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>{seg.icon}</Text>
          </View>
          <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
            {seg.percent}%
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function ExpenseDetailScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("THÁNG NÀY");
  const [activeView, setActiveView] = useState("Chi tiết"); // "Chi tiết" | "Xu hướng"
  const [trendVisible, setTrendVisible] = useState(true);

  const [summary, setSummary] = useState({ totalExpense: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [sRes, tRes, cRes] = await Promise.all([
        transactionApi.getSummary({ userId: user?.id }),
        transactionApi.getAll({ userId: user?.id, type: "expense" }),
        categoryApi.getVisible(),
      ]);

      const allTransactions = tRes.data || [];
      const allCategories = cRes.data || [];
      const summaryData = sRes.data || { totalExpense: 0 };

      setSummary(summaryData);
      setCategories(allCategories);

      // Tính chi tiêu theo danh mục
      const expenseMap = {};
      allTransactions
        .filter((tx) => tx.type === "expense")
        .forEach((tx) => {
          const key = tx.categoryId;
          expenseMap[key] = (expenseMap[key] || 0) + (tx.amount || 0);
        });

      const total = Object.values(expenseMap).reduce((a, b) => a + b, 0) || 1;
      const breakdown = Object.entries(expenseMap).map(([catId, amount]) => {
        const cat = allCategories.find((c) => c.id === catId) || {
          name: "Khác",
          icon: "💰",
          color: "#3d7fa6",
        };
        return {
          id: catId,
          name: cat.name,
          icon: cat.icon || "💰",
          color: cat.color || "#3d7fa6",
          amount,
          percent: Math.round((amount / total) * 100),
        };
      });

      breakdown.sort((a, b) => b.amount - a.amount);
      setCategoryBreakdown(breakdown);
    } catch (e) {
      console.error("Lỗi tải chi tiết khoản chi:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dailyAvg =
    summary.totalExpense > 0
      ? Math.round(summary.totalExpense / 8) // giả sử 8 ngày có giao dịch
      : 0;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111820",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.primary || "#4CAF50"} />
      </View>
    );
  }

  const chartData =
    categoryBreakdown.length > 0
      ? categoryBreakdown
      : [
          {
            name: "Ăn uống",
            icon: "🍹",
            color: "#3d7fa6",
            amount: 0,
            percent: 100,
          },
        ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#111820" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          Chi tiết khoản chi
        </Text>
        <TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 22 }}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Period tabs */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#222",
        }}
      >
        {TABS_PERIOD.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: "#fff",
            }}
          >
            <Text
              style={{
                color: activeTab === tab ? "#fff" : "#666",
                fontWeight: activeTab === tab ? "700" : "400",
                fontSize: 13,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tổng cộng + Trung bình */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            paddingVertical: 18,
            gap: 40,
          }}
        >
          <View>
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>
              Tổng cộng
            </Text>
            <Text style={{ color: "#e74c3c", fontSize: 22, fontWeight: "700" }}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>
          <View>
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>
              Trung bình hàng ngày
            </Text>
            <Text style={{ color: "#e74c3c", fontSize: 22, fontWeight: "700" }}>
              {formatCurrency(dailyAvg)}
            </Text>
          </View>
        </View>

        {/* Báo cáo xu hướng toggle */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#1a2230",
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              Báo cáo xu hướng
            </Text>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#333",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#888", fontSize: 11 }}>?</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setTrendVisible(!trendVisible)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: trendVisible ? "#4CAF50" : "#555",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: trendVisible ? "#4CAF50" : "#555",
                }}
              />
            </View>
            <Text style={{ color: "#4CAF50", fontSize: 14, fontWeight: "600" }}>
              {trendVisible ? "Hiện" : "Ẩn"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chi tiết / Xu hướng toggle */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            backgroundColor: "#1a2230",
            borderRadius: 24,
            flexDirection: "row",
            padding: 4,
          }}
        >
          {["Chi tiết", "Xu hướng"].map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => setActiveView(v)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: activeView === v ? "#2d6a4f" : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: activeView === v ? "#fff" : "#888",
                  fontWeight: activeView === v ? "700" : "400",
                  fontSize: 14,
                }}
              >
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Donut chart */}
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <DonutChart data={chartData} />
        </View>

        {/* Danh sách danh mục */}
        <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 100 }}>
          {chartData.map((item) => (
            <TouchableOpacity
              key={item.id || item.name}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#1e2530",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#1e2a38",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  color: "#e0e0e0",
                  fontSize: 16,
                  fontWeight: "500",
                }}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  color: "#e74c3c",
                  fontSize: 16,
                  fontWeight: "600",
                  marginRight: 8,
                }}
              >
                {formatCurrency(item.amount)}
              </Text>
              <Text style={{ color: "#888" }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
