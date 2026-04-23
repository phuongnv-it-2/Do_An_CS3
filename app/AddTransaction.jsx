import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../backend/context/auth";
import * as CategoryApi from "../backend/controllers/categoryApi";
import * as TransactionApi from "../backend/controllers/transactionApi";
import * as WalletApi from "../backend/controllers/walletAPi";

// ─── Hằng số màu sắc ───────────────────────────────────────────────────────
const COLORS = {
  bg: "#0d0d0d",
  surface: "#181818",
  surface2: "#222222",
  border: "#2a2a2a",
  green: "#00c853",
  greenDim: "#1a3d2b",
  red: "#ff3b30",
  redDim: "#3d1a1a",
  orange: "#ff9500",
  orangeDim: "#3d2a00",
  text: "#f0f0f0",
  textMuted: "#666",
  textDim: "#999",
};

// ─── Màu theo loại giao dịch ───────────────────────────────────────────────
const TYPE_CONFIG = {
  expense: { color: COLORS.red, dimColor: COLORS.redDim, label: "Khoản chi" },
  income: {
    color: COLORS.green,
    dimColor: COLORS.greenDim,
    label: "Khoản thu",
  },
};

// ─── Danh sách ví mặc định (fallback nếu API chưa có) ─────────────────────
const DEFAULT_WALLETS = [
  { id: "cash", name: "Tiền mặt", icon: "💵" },
  { id: "bank", name: "Ngân hàng", icon: "🏦" },
  { id: "momo", name: "Ví Momo", icon: "🩷" },
  { id: "zalopay", name: "ZaloPay", icon: "💙" },
];

// ─── Danh mục mặc định (fallback) ─────────────────────────────────────────
const DEFAULT_CATEGORIES = {
  expense: [
    {
      id: "food",
      name: "Ăn uống",
      icon: "🍜",
      color: "#FF9F0A",
      type: "expense",
    },
    {
      id: "transport",
      name: "Di chuyển",
      icon: "🚗",
      color: "#FF375F",
      type: "expense",
    },
    {
      id: "shopping",
      name: "Mua sắm",
      icon: "🛍️",
      color: "#BF5AF2",
      type: "expense",
    },
    {
      id: "housing",
      name: "Nhà cửa",
      icon: "🏠",
      color: "#5E5CE6",
      type: "expense",
    },
    {
      id: "bills",
      name: "Hóa đơn",
      icon: "🧾",
      color: "#FFD60A",
      type: "expense",
    },
    {
      id: "entertainment",
      name: "Giải trí",
      icon: "🎮",
      color: "#64D2FF",
      type: "expense",
    },
    {
      id: "health",
      name: "Sức khỏe",
      icon: "🏥",
      color: "#30D158",
      type: "expense",
    },
    {
      id: "education",
      name: "Giáo dục",
      icon: "📚",
      color: "#0A84FF",
      type: "expense",
    },
    {
      id: "other_exp",
      name: "Khác",
      icon: "📦",
      color: "#8E8E93",
      type: "expense",
    },
  ],
  income: [
    {
      id: "salary",
      name: "Lương",
      icon: "💰",
      color: "#30D158",
      type: "income",
    },
    {
      id: "bonus",
      name: "Thưởng",
      icon: "🎁",
      color: "#FFD60A",
      type: "income",
    },
    {
      id: "investment",
      name: "Tiền lãi",
      icon: "📈",
      color: "#64D2FF",
      type: "income",
    },
    {
      id: "gift",
      name: "Được tặng",
      icon: "🎀",
      color: "#BF5AF2",
      type: "income",
    },
    {
      id: "other_inc",
      name: "Khác",
      icon: "✨",
      color: "#8E8E93",
      type: "income",
    },
  ],
};

// ─── Helper: format số theo VND ───────────────────────────────────────────
const formatVND = (numStr) => {
  if (!numStr || numStr === "") return "0";
  const n = parseInt(numStr, 10);
  if (isNaN(n)) return "0";
  return n.toLocaleString("vi-VN");
};

// ─── Helper: format ngày ──────────────────────────────────────────────────
const formatDate = (date) => {
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${days[date.getDay()]}, ${d}/${m}/${y}`;
};

// ══════════════════════════════════════════════════════════════════════════
// Component chính
// ══════════════════════════════════════════════════════════════════════════
export default function AddTransaction() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES.expense);
  const [wallets, setWallets] = useState(DEFAULT_WALLETS);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(DEFAULT_WALLETS[0]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNumpad, setShowNumpad] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // ── Fetch data ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      const [catRes, wallRes] = await Promise.all([
        CategoryApi.getVisible(type),
        WalletApi.getAll(),
      ]);
      const catsData = catRes?.data || catRes || DEFAULT_CATEGORIES[type] || [];
      const wallData = wallRes?.data || wallRes || DEFAULT_WALLETS;

      setCategories(
        catsData.length > 0 ? catsData : DEFAULT_CATEGORIES[type] || []
      );
      if (wallData.length > 0) {
        setWallets(wallData);
        setSelectedWallet(wallData[0]);
      }
      setSelectedCategory(null);
    } catch (err) {
      console.error("Lỗi fetch:", err);
      setCategories(DEFAULT_CATEGORIES[type] || []);
      setWallets(DEFAULT_WALLETS);
    }
  };

  // ── Đổi loại giao dịch ────────────────────────────────────────────────
  const handleSetType = (t) => {
    setType(t);
    setSelectedCategory(null);
    setAmount("");
  };

  // ── Bàn phím số ───────────────────────────────────────────────────────
  const handleNumInput = (key) => {
    if (key === "del") {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      setAmount((prev) => {
        if (prev === "0") return key;
        if (prev.length >= 13) return prev;
        return prev + key;
      });
    }
  };

  // ── Đổi ngày ──────────────────────────────────────────────────────────
  const changeDate = (dir) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir);
      return d;
    });
  };

  // ── Lưu giao dịch ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ lớn hơn 0");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn một danh mục");
      return;
    }
    if (!selectedWallet) {
      Alert.alert("Lỗi", "Vui lòng chọn ví");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: numAmount, // FLOAT trong model
        type: type, // ENUM('income', 'expense')
        note: note.trim(), // TEXT
        date: currentDate.toISOString(), // DATE (Sequelize hiểu ISO string)
        walletId: selectedWallet?.id, // STRING (FK)
        categoryId: selectedCategory, // STRING (FK)
        userId: user.id,
        // location: null              // Model cho phép null, có thể bổ sung sau
      };

      console.log("Saving transaction with payload:", payload);

      await TransactionApi.create(payload);

      Alert.alert("Thành công", "Giao dịch đã được lưu!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      const errorMsg =
        err?.response?.data?.error || err?.message || "Lỗi khi lưu giao dịch";
      Alert.alert("Thất bại", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Màu theo type ─────────────────────────────────────────────────────
  const typeColor = TYPE_CONFIG[type]?.color || COLORS.green;
  const typeDim = TYPE_CONFIG[type]?.dimColor || COLORS.greenDim;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm giao dịch</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {["expense", "income"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              type === t && { backgroundColor: TYPE_CONFIG[t].color },
            ]}
            onPress={() => handleSetType(t)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                type === t ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              {TYPE_CONFIG[t].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Chọn ví */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowWalletModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.rowIcon}>
            <Text style={styles.rowIconText}>👛</Text>
          </View>
          <Text style={styles.rowValue}>
            {selectedWallet?.name || "Chọn ví"}
          </Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        {/* Số tiền */}
        <TouchableOpacity
          style={styles.amountSection}
          onPress={() => setShowNumpad((v) => !v)}
          activeOpacity={0.9}
        >
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>VND</Text>
          </View>
          <Text style={[styles.amountValue, { color: typeColor }]}>
            {formatVND(amount)}
          </Text>
        </TouchableOpacity>

        {/* Danh mục */}
        <Text style={styles.sectionTitle}>Chọn nhóm</Text>
        <View style={styles.categoryGrid}>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catItem,
                  selectedCategory === cat.id && {
                    borderColor: typeColor,
                    backgroundColor: typeDim,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.catIcon}>{cat.icon || "📁"}</Text>
                <Text style={styles.catName} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Đang tải danh mục...</Text>
          )}
        </View>

        {/* Ghi chú */}
        <View style={styles.noteRow}>
          <View style={styles.rowIcon}>
            <Text style={styles.rowIconText}>📝</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Thêm ghi chú..."
            placeholderTextColor={COLORS.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* Ngày */}
        <View style={styles.dateRow}>
          <View style={styles.rowIcon}>
            <Text style={styles.rowIconText}>📅</Text>
          </View>
          <TouchableOpacity
            style={styles.dateNav}
            onPress={() => changeDate(-1)}
          >
            <Text style={[styles.dateNavText, { color: typeColor }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.dateLabel, { color: typeColor }]}>
            {formatDate(currentDate)}
          </Text>
          <TouchableOpacity
            style={styles.dateNav}
            onPress={() => changeDate(1)}
          >
            <Text style={[styles.dateNavText, { color: typeColor }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Thêm chi tiết */}
        <TouchableOpacity
          style={styles.moreDetails}
          onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển!")}
        >
          <Text style={[styles.moreDetailsText, { color: typeColor }]}>
            + THÊM CHI TIẾT
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Bàn phím số ── */}
      {showNumpad && (
        <View style={styles.numpad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "del"].map(
            (k) => (
              <TouchableOpacity
                key={k}
                style={styles.numKey}
                onPress={() => handleNumInput(k)}
                activeOpacity={0.6}
              >
                <Text
                  style={[styles.numKeyText, k === "del" && styles.numKeyDel]}
                >
                  {k === "del" ? "⌫" : k}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* ── Nút Lưu ── */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: typeColor }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : "LƯU"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal chọn ví ── */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowWalletModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Chọn ví</Text>
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.walletOption}
                    onPress={() => {
                      setSelectedWallet(w);
                      setShowWalletModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.walletIcon}>{w.icon || "💳"}</Text>
                    <Text
                      style={[
                        styles.walletName,
                        selectedWallet?.id === w.id && { color: typeColor },
                      ]}
                    >
                      {w.name}
                    </Text>
                    {selectedWallet?.id === w.id && (
                      <Text style={[styles.walletCheck, { color: typeColor }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Styles
// ══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },
  headerPlaceholder: { width: 34 },

  // Tabs
  tabs: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  tabTextInactive: { color: COLORS.textMuted },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { fontSize: 18 },
  rowValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
  rowArrow: { color: COLORS.textMuted, fontSize: 18 },

  // Amount
  amountSection: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface2,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  currencyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },

  // Category
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  catItem: {
    width: "22%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 5,
  },
  catIcon: { fontSize: 26 },
  catName: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textDim,
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.textMuted,
    width: "100%",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
    fontSize: 14,
  },

  // Note
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  noteInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 100,
    paddingTop: 4,
  },

  // Date
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  dateNav: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavText: { fontSize: 18, fontWeight: "700" },
  dateLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },

  // More details
  moreDetails: {
    padding: 18,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  moreDetailsText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },

  // Numpad
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  numKey: {
    width: "33.33%",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  numKeyText: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.text,
  },
  numKeyDel: { fontSize: 18, color: COLORS.textDim },

  // Save bar
  saveBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Modal ví
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    textAlign: "center",
    color: COLORS.textDim,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  walletOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
    gap: 14,
  },
  walletIcon: { fontSize: 24 },
  walletName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  walletCheck: { fontSize: 18 },
});
