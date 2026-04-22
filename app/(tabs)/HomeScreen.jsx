import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../assets/theme/color";

// ============================================================
// MOCK DATA — khớp với Transaction / Wallet / Category model
// ============================================================
const MOCK_WALLETS = [
  {
    id: "w1",
    name: "Ví tiền mặt",
    type: "cash",
    balance: 2335000,
    currency: "VND",
  },
  {
    id: "w2",
    name: "Techcombank",
    type: "bank",
    balance: 10000000,
    currency: "VND",
  },
  {
    id: "w3",
    name: "MoMo",
    type: "e-wallet",
    balance: 2000000,
    currency: "VND",
  },
];

const MOCK_CATEGORIES = [
  { id: "c1", name: "Lương", type: "income", icon: "💼", color: "#10B981" },
  { id: "c2", name: "Thưởng", type: "income", icon: "🎁", color: "#34D399" },
  { id: "c3", name: "Ăn uống", type: "expense", icon: "🍜", color: "#F59E0B" },
  {
    id: "c4",
    name: "Di chuyển",
    type: "expense",
    icon: "🚗",
    color: "#EF4444",
  },
  { id: "c5", name: "Mua sắm", type: "expense", icon: "🛍️", color: "#EC4899" },
  { id: "c6", name: "Hoá đơn", type: "expense", icon: "📄", color: "#8B5CF6" },
  { id: "c7", name: "Giải trí", type: "expense", icon: "🎮", color: "#F97316" },
  { id: "c8", name: "Sức khoẻ", type: "expense", icon: "🏥", color: "#06B6D4" },
];

const MOCK_TRANSACTIONS = [
  {
    id: "t1",
    amount: 15000000,
    type: "income",
    date: new Date("2025-06-01T09:00:00"),
    note: "Lương tháng 6",
    location: null,
    walletId: "w2",
    categoryId: "c1",
  },
  {
    id: "t2",
    amount: 85000,
    type: "expense",
    date: new Date("2025-06-03T12:30:00"),
    note: "Cơm trưa văn phòng",
    location: { name: "Quán cơm 36" },
    walletId: "w1",
    categoryId: "c3",
  },
  {
    id: "t3",
    amount: 250000,
    type: "expense",
    date: new Date("2025-06-04T18:00:00"),
    note: "Đổ xăng xe máy",
    location: { name: "Xăng Petrolimex Q1" },
    walletId: "w1",
    categoryId: "c4",
  },
  {
    id: "t4",
    amount: 199000,
    type: "expense",
    date: new Date("2025-06-05T20:15:00"),
    note: "Netflix tháng 6",
    location: null,
    walletId: "w3",
    categoryId: "c7",
  },
  {
    id: "t5",
    amount: 131000,
    type: "expense",
    date: new Date("2025-06-06T10:00:00"),
    note: "Tiền điện thoại",
    location: null,
    walletId: "w3",
    categoryId: "c6",
  },
  {
    id: "t6",
    amount: 2000000,
    type: "income",
    date: new Date("2025-06-06T14:00:00"),
    note: "Thưởng dự án Q2",
    location: null,
    walletId: "w2",
    categoryId: "c2",
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Lời chào tự động theo giờ thực
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Chào buổi sáng";
  if (hour >= 12 && hour < 18) return "Chào buổi chiều";
  if (hour >= 18 && hour < 22) return "Chào buổi tối";
  return "Đêm khuya rồi";
};

/**
 * Format số tiền VND
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format ngày giao dịch
 */
const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";

  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

/**
 * Gắn thông tin wallet + category vào transaction
 */
const enrichTransactions = (transactions) =>
  transactions
    .map((tx) => ({
      ...tx,
      wallet: MOCK_WALLETS.find((w) => w.id === tx.walletId),
      category: MOCK_CATEGORIES.find((c) => c.id === tx.categoryId),
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

// ============================================================
// SUB-COMPONENTS
// ============================================================

const WalletChip = ({ wallet, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.walletChip, isSelected && styles.walletChipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.walletChipIcon}>
      {wallet.type === "cash" ? "💵" : wallet.type === "bank" ? "🏦" : "📱"}
    </Text>
    <Text
      style={[
        styles.walletChipName,
        isSelected && styles.walletChipNameSelected,
      ]}
    >
      {wallet.name}
    </Text>
  </TouchableOpacity>
);

const TransactionItem = ({ item }) => {
  const isIncome = item.type === "income";
  return (
    <TouchableOpacity style={styles.txItem} activeOpacity={0.7}>
      {/* Icon danh mục */}
      <View
        style={[
          styles.txIcon,
          { backgroundColor: item.category?.color + "20" },
        ]}
      >
        <Text style={styles.txIconText}>{item.category?.icon ?? "💸"}</Text>
      </View>

      {/* Thông tin */}
      <View style={styles.txInfo}>
        <Text style={styles.txCategory}>{item.category?.name ?? "Khác"}</Text>
        <Text style={styles.txNote} numberOfLines={1}>
          {item.note || item.wallet?.name}
        </Text>
      </View>

      {/* Số tiền + ngày */}
      <View style={styles.txRight}>
        <Text
          style={[styles.txAmount, { color: isIncome ? "#10B981" : "#EF4444" }]}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(item.amount)}
        </Text>
        <Text style={styles.txDate}>{formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// MAIN SCREEN
// ============================================================

export default function HomeScreen() {
  const [userName, setUserName] = useState("...");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState(null); // null = tất cả ví

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString !== null) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.full_name);
        } else {
          setUserName("Khách");
        }
      } catch (error) {
        console.error("Lỗi khi đọc dữ liệu:", error);
        setUserName("Lỗi dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Tổng số dư (tất cả ví hoặc ví được chọn)
  const totalBalance = useMemo(() => {
    if (selectedWalletId) {
      return MOCK_WALLETS.find((w) => w.id === selectedWalletId)?.balance ?? 0;
    }
    return MOCK_WALLETS.reduce((sum, w) => sum + w.balance, 0);
  }, [selectedWalletId]);

  // Giao dịch đã được enrich (gắn wallet + category)
  const enrichedTransactions = useMemo(
    () => enrichTransactions(MOCK_TRANSACTIONS),
    []
  );

  // Lọc giao dịch theo ví đang chọn
  const filteredTransactions = useMemo(() => {
    if (!selectedWalletId) return enrichedTransactions;
    return enrichedTransactions.filter(
      (tx) => tx.walletId === selectedWalletId
    );
  }, [selectedWalletId, enrichedTransactions]);

  // Tính tổng thu / chi từ danh sách đã lọc
  const { totalIncome, totalExpense } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") acc.totalIncome += tx.amount;
        else acc.totalExpense += tx.amount;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );
  }, [filteredTransactions]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        // Header toàn bộ phần trên danh sách
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ alignSelf: "flex-start", marginTop: 5 }}
                  />
                ) : (
                  <Text style={styles.userName}>{userName} 👋</Text>
                )}
              </View>
              <TouchableOpacity style={styles.avatar}>
                <Text>👤</Text>
              </TouchableOpacity>
            </View>

            {/* ── Wallet chips ── */}
            <FlatList
              data={MOCK_WALLETS}
              keyExtractor={(w) => w.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletChipList}
              renderItem={({ item }) => (
                <WalletChip
                  wallet={item}
                  isSelected={selectedWalletId === item.id}
                  onPress={() =>
                    setSelectedWalletId(
                      selectedWalletId === item.id ? null : item.id
                    )
                  }
                />
              )}
            />

            {/* ── Balance card ── */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>
                {selectedWalletId
                  ? MOCK_WALLETS.find((w) => w.id === selectedWalletId)?.name
                  : "Tổng số dư"}
              </Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(totalBalance)}
              </Text>

              <View style={styles.incomeExpenseContainer}>
                <View style={styles.incomeExpenseItem}>
                  <Text style={styles.incomeLabel}>⬇ Thu nhập</Text>
                  <Text style={styles.incomeAmount}>
                    +{formatCurrency(totalIncome)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.incomeExpenseItem}>
                  <Text style={styles.expenseLabel}>⬆ Chi tiêu</Text>
                  <Text style={styles.expenseAmount}>
                    -{formatCurrency(totalExpense)}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Tiêu đề danh sách ── */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Giao dịch gần đây</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 2,
  },
  avatar: {
    width: 45,
    height: 45,
    backgroundColor: "#e0e0e0",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  // Wallet chips
  walletChipList: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  walletChipSelected: {
    backgroundColor: colors.primary + "15",
    borderColor: colors.primary,
  },
  walletChipIcon: {
    fontSize: 14,
  },
  walletChipName: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: "500",
  },
  walletChipNameSelected: {
    color: colors.primary,
    fontWeight: "600",
  },

  // Balance card
  balanceCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 10,
  },
  incomeExpenseContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 15,
  },
  incomeExpenseItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 10,
  },
  incomeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
  },
  expenseLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
  },
  incomeAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  // List header
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
  },

  // Transaction item
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txIconText: {
    fontSize: 20,
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 3,
  },
  txNote: {
    fontSize: 12,
    color: colors.textLight,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "bold",
  },
  txDate: {
    fontSize: 11,
    color: colors.textLight,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textLight,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  fabIcon: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "300",
    marginTop: -2,
  },
});
