import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../backend/context/auth";
import * as budgetService from "../../backend/controllers/budgetApi";

const { width } = Dimensions.get("window");
const GAUGE_SIZE = width * 0.75;
const STROKE = 18;
const R = (GAUGE_SIZE - STROKE) / 2;
const CX = GAUGE_SIZE / 2;
const CY = GAUGE_SIZE / 2;

// ─── Utils ────────────────────────────────────────────────────────────────────
function describeArc(cx, cy, r, pct) {
  const startAngle = Math.PI;
  const endAngle = startAngle + Math.PI * Math.min(pct, 1);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function formatVND(n) {
  if (Math.abs(n) >= 1_000_000_000)
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " B";
  if (Math.abs(n) >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + " M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + " K";
  return n.toLocaleString("vi-VN");
}

function formatFull(n) {
  return n.toLocaleString("vi-VN");
}

// Tính start_date và end_date theo period
function getDateRange(period) {
  const now = new Date();
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  } else {
    return {
      start_date: `${now.getFullYear()}-01-01`,
      end_date: `${now.getFullYear()}-12-31`,
    };
  }
}

// Tính ngày/tháng còn lại
function calcTimeLeft(period) {
  const now = new Date();
  if (period === "month") {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(0, Math.ceil((endOfMonth - now) / (1000 * 60 * 60 * 24)));
  } else {
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const diffMs = endOfYear - now;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
  }
}

const CATEGORY_OPTIONS = [
  { id: 1, name: "Ăn uống", icon: "🍜", color: "#FF6B6B" },
  { id: 2, name: "Di chuyển", icon: "🚗", color: "#4ECDC4" },
  { id: 3, name: "Giải trí", icon: "🎮", color: "#FFE66D" },
  { id: 4, name: "Mua sắm", icon: "🛍️", color: "#A29BFE" },
  { id: 5, name: "Sức khỏe", icon: "💊", color: "#55EFC4" },
  { id: 6, name: "Giáo dục", icon: "📚", color: "#FD79A8" },
  { id: 7, name: "Nhà ở", icon: "🏠", color: "#FDCB6E" },
  { id: 8, name: "Khác", icon: "💼", color: "#74B9FF" },
];

const TABS = ["Tháng này", "Năm nay"];

// ─── Gauge ────────────────────────────────────────────────────────────────────
function BudgetGauge({ totalBudget, totalSpent, tab, timeLeft }) {
  const isOver = totalSpent > totalBudget;
  const pct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1.5) : 0;
  const gaugeColor = isOver ? "#FF4757" : "#2ECC71";

  return (
    <View style={gaugeStyles.wrapper}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE / 2 + STROKE}>
        <Path
          d={describeArc(CX, CY, R, 1)}
          stroke="#2C2C2E"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={describeArc(CX, CY, R, pct)}
          stroke={gaugeColor}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <View style={gaugeStyles.centerLabel}>
        <Text style={gaugeStyles.statusText}>
          {isOver ? "Bội chi" : "Còn có thể chi"}
        </Text>
        <Text style={[gaugeStyles.amountText, { color: gaugeColor }]}>
          {formatFull(Math.abs(totalBudget - totalSpent))}
        </Text>
      </View>
      <View style={gaugeStyles.statsRow}>
        <View style={gaugeStyles.statItem}>
          <Text style={gaugeStyles.statValue}>{formatVND(totalBudget)}</Text>
          <Text style={gaugeStyles.statLabel}>Tổng ngân sách</Text>
        </View>
        <View style={gaugeStyles.divider} />
        <View style={gaugeStyles.statItem}>
          <Text style={gaugeStyles.statValue}>{formatVND(totalSpent)}</Text>
          <Text style={gaugeStyles.statLabel}>Tổng đã chi</Text>
        </View>
        <View style={gaugeStyles.divider} />
        <View style={gaugeStyles.statItem}>
          <Text style={gaugeStyles.statValue}>
            {timeLeft} {tab === 0 ? "ngày" : "tháng"}
          </Text>
          <Text style={gaugeStyles.statLabel}>
            Đến cuối {tab === 0 ? "tháng" : "năm"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Budget Item ──────────────────────────────────────────────────────────────
function BudgetItem({ item, onEdit, onDelete }) {
  const limit = parseFloat(item.limit_amount || item.limit || 0);
  const spent = parseFloat(item.spent || 0);
  const pct = limit > 0 ? spent / limit : 0;
  const isOver = spent > limit;
  const cat = CATEGORY_OPTIONS.find((c) => c.id === item.categoryId) || {
    color: "#74B9FF",
    icon: "💼",
  };
  const barColor = isOver ? "#FF4757" : cat.color;

  return (
    <View style={itemStyles.card}>
      <View style={itemStyles.row}>
        <View
          style={[itemStyles.iconBox, { backgroundColor: barColor + "22" }]}
        >
          <Text style={{ fontSize: 20 }}>
            {item.Category?.icon || cat.icon}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={itemStyles.topRow}>
            <Text style={itemStyles.name}>{item.name}</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {isOver && (
                <View style={itemStyles.overBadge}>
                  <Text style={itemStyles.overText}>Bội chi</Text>
                </View>
              )}
              {/* Nút Sửa */}
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={itemStyles.actionBtn}
              >
                <Text style={{ fontSize: 14 }}>✏️</Text>
              </TouchableOpacity>
              {/* Nút Xóa */}
              <TouchableOpacity
                onPress={() => onDelete(item)}
                style={itemStyles.actionBtn}
              >
                <Text style={{ fontSize: 14 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={itemStyles.barBg}>
            <View
              style={[
                itemStyles.barFill,
                {
                  width: `${Math.min(pct * 100, 100)}%`,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          <View style={itemStyles.amountRow}>
            <Text style={itemStyles.spent}>{formatVND(spent)}</Text>
            <Text style={itemStyles.limit}>/ {formatVND(limit)}</Text>
            <Text
              style={[
                itemStyles.pct,
                { color: isOver ? "#FF4757" : "#8E8E93" },
              ]}
            >
              {" "}
              ({Math.round(pct * 100)}%)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Form Modal (Tạo / Sửa) ───────────────────────────────────────────────────
function BudgetFormModal({ visible, onClose, onSave, editItem, period }) {
  const [name, setName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || "");
      setLimitAmount(String(editItem.limit_amount || editItem.limit || ""));
      setSelectedCat(
        CATEGORY_OPTIONS.find((c) => c.id === editItem.categoryId) || null
      );
    } else {
      setName("");
      setLimitAmount("");
      setSelectedCat(null);
    }
  }, [editItem, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên ngân sách");
      return;
    }
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      Alert.alert("Lỗi", "Hạn mức phải lớn hơn 0");
      return;
    }

    const { start_date, end_date } = getDateRange(
      period === 0 ? "month" : "year"
    );

    const payload = {
      name: name.trim(),
      limit_amount: parseFloat(limitAmount),
      categoryId: selectedCat?.id || null,
      period: period === 0 ? "month" : "year",
      start_date,
      end_date,
    };

    setLoading(true);
    try {
      if (editItem) {
        await budgetService.update(editItem.id, payload);
      } else {
        await budgetService.create(payload);
      }
      onSave();
      onClose();
    } catch (err) {
      Alert.alert("Lỗi", err?.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={modalStyles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <View style={modalStyles.sheet}>
              {/* Header */}
              <View style={modalStyles.header}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={modalStyles.cancel}>Hủy</Text>
                </TouchableOpacity>
                <Text style={modalStyles.title}>
                  {editItem ? "Sửa Ngân sách" : "Tạo Ngân sách"}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#2ECC71" />
                  ) : (
                    <Text style={modalStyles.save}>Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Tên */}
              <Text style={modalStyles.label}>Tên ngân sách</Text>
              <TextInput
                style={modalStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="VD: Chi tiêu ăn uống tháng 5"
                placeholderTextColor="#555"
              />

              {/* Hạn mức */}
              <Text style={modalStyles.label}>Hạn mức (₫)</Text>
              <TextInput
                style={modalStyles.input}
                value={limitAmount}
                onChangeText={setLimitAmount}
                placeholder="VD: 3000000"
                placeholderTextColor="#555"
                keyboardType="numeric"
              />
              {limitAmount ? (
                <Text style={modalStyles.preview}>
                  ≈ {formatVND(parseFloat(limitAmount) || 0)}
                </Text>
              ) : null}

              {/* Danh mục */}
              <Text style={modalStyles.label}>Danh mục (tuỳ chọn)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
              >
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCat?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCat(isSelected ? null : cat)}
                      style={[
                        modalStyles.catChip,
                        isSelected && {
                          backgroundColor: cat.color + "33",
                          borderColor: cat.color,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      <Text
                        style={[
                          modalStyles.catLabel,
                          isSelected && { color: cat.color },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Kỳ */}
              <Text style={modalStyles.label}>
                Kỳ: {period === 0 ? "📅 Tháng này" : "📆 Năm nay"}
              </Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BudgetScreen() {
  const { userToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [overview, setOverview] = useState({ totalLimit: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const period = activeTab === 0 ? "month" : "year";
  const timeLeft = calcTimeLeft(period);

  // Fetch dữ liệu
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetService.getAll(period);
      setBudgets(res.data || []);
      setOverview(res.overview || { totalLimit: 0, totalSpent: 0 });
    } catch (err) {
      // Nếu chưa kết nối API, dùng data mẫu
      setBudgets([
        {
          id: 1,
          name: "Ăn uống",
          categoryId: 1,
          limit_amount: 3000000,
          spent: 2100000,
        },
        {
          id: 2,
          name: "Di chuyển",
          categoryId: 2,
          limit_amount: 1500000,
          spent: 400000,
        },
        {
          id: 3,
          name: "Giải trí",
          categoryId: 3,
          limit_amount: 500000,
          spent: 650000,
        },
        {
          id: 4,
          name: "Mua sắm",
          categoryId: 4,
          limit_amount: 2000000,
          spent: 800000,
        },
        {
          id: 5,
          name: "Sức khỏe",
          categoryId: 5,
          limit_amount: 1000000,
          spent: 300000,
        },
      ]);
      setOverview({ totalLimit: 8000000, totalSpent: 4250000 });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Mở form tạo mới
  const handleCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  // Mở form sửa
  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  // Xóa ngân sách
  const handleDelete = (item) => {
    Alert.alert("Xóa ngân sách", `Bạn có chắc muốn xóa "${item.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await budgetService.remove(item.id);
            fetchBudgets();
          } catch (err) {
            Alert.alert("Lỗi", "Không thể xóa ngân sách");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ngân sách</Text>
        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={handleCreate}
          activeOpacity={0.7}
        >
          <Text style={styles.addIconText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(i)}
            style={styles.tabBtn}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabActive]}>
              {t}
            </Text>
            {activeTab === i && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#2ECC71" size="large" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          ListHeaderComponent={
            <>
              <BudgetGauge
                totalBudget={overview.totalLimit}
                totalSpent={overview.totalSpent}
                tab={activeTab}
                timeLeft={timeLeft}
              />

              {/* Nút Tạo ngân sách */}
              <TouchableOpacity
                style={styles.createBtn}
                activeOpacity={0.85}
                onPress={handleCreate}
              >
                <Text style={styles.createBtnText}>+ Tạo Ngân sách</Text>
              </TouchableOpacity>

              {budgets.length > 0 && (
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>
                    Chi tiết từng danh mục ({budgets.length})
                  </Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
              <Text style={styles.emptySubText}>
                {/* Nhấn "+ Tạo Ngân sách" để bắt đầu */}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BudgetItem
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Modal tạo/sửa */}
      <BudgetFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={fetchBudgets}
        editItem={editItem}
        period={activeTab}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  addIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2ECC71",
    justifyContent: "center",
    alignItems: "center",
  },
  addIconText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "300",
    lineHeight: 24,
  },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#38383A",
    marginHorizontal: 20,
  },
  tabBtn: { marginRight: 24, paddingBottom: 8, alignItems: "center" },
  tabText: { fontSize: 15, color: "#8E8E93", fontWeight: "500" },
  tabActive: { color: "#FFF", fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#2ECC71",
    borderRadius: 1,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#8E8E93", fontSize: 14 },

  createBtn: {
    backgroundColor: "#2ECC71",
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  listHeader: { marginBottom: 10, marginLeft: 4 },
  listTitle: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  emptyBox: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#8E8E93", fontSize: 13 },
});

const gaugeStyles = StyleSheet.create({
  wrapper: { alignItems: "center", paddingTop: 16 },
  centerLabel: {
    position: "absolute",
    top: GAUGE_SIZE / 2 - 20,
    alignItems: "center",
  },
  statusText: { color: "#8E8E93", fontSize: 13, marginBottom: 4 },
  amountText: { fontSize: 26, fontWeight: "800" },
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingHorizontal: 8,
    width: "100%",
    justifyContent: "space-evenly",
  },
  statItem: { alignItems: "center" },
  statValue: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#8E8E93", fontSize: 11, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: "#38383A" },
});

const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: { color: "#FFF", fontSize: 15, fontWeight: "600", flex: 1 },
  overBadge: {
    backgroundColor: "#FF475722",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  overText: { color: "#FF4757", fontSize: 11, fontWeight: "600" },
  actionBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
    marginLeft: 4,
  },
  barBg: {
    height: 6,
    backgroundColor: "#2C2C2E",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: 3 },
  amountRow: { flexDirection: "row", marginTop: 5, alignItems: "center" },
  spent: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  limit: { color: "#8E8E93", fontSize: 13, marginLeft: 4 },
  pct: { fontSize: 12 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cancel: { color: "#8E8E93", fontSize: 16 },
  title: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  save: { color: "#2ECC71", fontSize: 16, fontWeight: "700" },
  label: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 15,
  },
  preview: { color: "#2ECC71", fontSize: 12, marginTop: 4, marginLeft: 4 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
  },
  catLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "500" },
});
