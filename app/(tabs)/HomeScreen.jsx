import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReportChartSection from "../components/ReportChartSection";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors as theme } from "../../assets/theme/colors";
import { useAuth } from "../../backend/context/auth";
import * as categoryApi from "../../backend/controllers/categoryApi";
import * as transactionApi from "../../backend/controllers/transactionApi";
import * as walletApi from "../../backend/controllers/walletAPi";
import { styles } from "../screens/HomeScreenStyle";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " ₫";
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // ← cho biểu đồ
  const [categories, setCategories] = useState([]);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [wRes, sRes, tRes, cRes, allTRes] = await Promise.all([
        walletApi.getAll({ userId: user?.id }),
        transactionApi.getSummary({ userId: user?.id }),
        transactionApi.getAll({ limit: 5, userId: user?.id }),
        categoryApi.getVisible(),
        transactionApi.getAll({ userId: user?.id }), // ← tất cả GD cho chart
      ]);

      setWallets(wRes.data || []);
      setSummary(sRes.data || { totalIncome: 0, totalExpense: 0 });
      setRecentTransactions(tRes.data || []);
      setCategories(cRes.data || []);
      setAllTransactions(allTRes.data || []); // ← set cho biểu đồ
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const totalBalance = wallets.reduce(
    (acc, curr) => acc + (curr.balance || 0),
    0
  );

  const getCategoryInfo = (categoryId) => {
    return (
      categories.find((c) => c.id === categoryId) || {
        name: "Khác",
        icon: "💰",
        color: "#95a5a6",
      }
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const topSpending = categories
    .filter((cat) => cat.type === "expense")
    .slice(0, 3)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      percent: "0%",
      color: cat.color || theme.danger,
      icon: cat.icon || "💰",
    }));

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* ── HEADER ── */}
        <View style={styles.topHeader}>
          <View>
            <View style={styles.balanceRow}>
              <Text style={styles.totalBalanceText}>
                {balanceVisible ? formatCurrency(totalBalance) : "••••••••"}
              </Text>
              <TouchableOpacity
                onPress={() => setBalanceVisible(!balanceVisible)}
                style={{ marginLeft: 10 }}
              >
                <Ionicons
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.subText}>Tổng số dư</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => router.push("/SearchScreen")}
              style={{ marginRight: 14 }}
            >
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/NotificationScreen")}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── VÍ CỦA TÔI ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ví của tôi</Text>
            <TouchableOpacity onPress={() => router.push("/WalletScreen")}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {wallets.map((wallet) => (
            <View
              key={wallet.id}
              style={[styles.walletItem, { marginBottom: 10 }]}
            >
              <View
                style={[
                  styles.walletIconBg,
                  {
                    backgroundColor:
                      wallet.type === "bank" ? "#3498DB" : "#E67E22",
                  },
                ]}
              >
                <Text>{wallet.type === "bank" ? "🏦" : "👛"}</Text>
              </View>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletValue}>
                {formatCurrency(wallet.balance)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── BÁO CÁO + BIỂU ĐỒ (thay chartPlaceholder) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Báo cáo tháng này</Text>
            <TouchableOpacity onPress={() => router.push("/ReportScreen")}>
              <Text style={styles.seeAll}>Xem báo cáo</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Biểu đồ thực tế thay cho placeholder */}
          <ReportChartSection
            transactions={allTransactions}
            summary={summary}
            theme={theme}
            formatCurrency={formatCurrency}
          />
        </View>

        {/* ── CHI TIÊU NHIỀU NHẤT ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chi tiêu nhiều nhất</Text>
            <TouchableOpacity
              onPress={() => router.push("/ExpenseDetailScreen")}
            >
              <Text style={styles.seeAll}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabToggle}>
            <TouchableOpacity style={styles.tabItem}>
              <Text style={styles.tabText}>Tuần</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
              <Text style={styles.tabText}>Tháng</Text>
            </TouchableOpacity>
          </View>

          {topSpending.map((item) => (
            <View key={item.id} style={styles.spendingRow}>
              <View
                style={[
                  styles.spendingIcon,
                  { backgroundColor: item.color + "30" },
                ]}
              >
                <Text>{item.icon}</Text>
              </View>
              <Text style={styles.spendingName}>{item.name}</Text>
              <Text style={[styles.spendingPercent, { color: theme.danger }]}>
                {item.percent}
              </Text>
            </View>
          ))}
        </View>

        {/* ── GIAO DỊCH GẦN ĐÂY ── */}
        <View style={[styles.sectionCard, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity
              onPress={() => router.push("/TransactionListScreen")}
            >
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => {
              const cat = getCategoryInfo(tx.categoryId);
              return (
                <View key={tx.id} style={styles.spendingRow}>
                  <View
                    style={[
                      styles.spendingIcon,
                      { backgroundColor: (cat.color || "#444") + "30" },
                    ]}
                  >
                    <Text>{cat.icon || "💰"}</Text>
                  </View>
                  <Text style={styles.spendingName}>{tx.note || cat.name}</Text>
                  <Text
                    style={[
                      styles.spendingPercent,
                      {
                        color:
                          tx.type === "income" ? theme.primary : theme.danger,
                      },
                    ]}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.placeholderText}>
                Giao dịch đã thêm sẽ hiển thị ở đây 🙌
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
