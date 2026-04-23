import { router } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { colors as theme } from "../../assets/theme/colors";
import * as categoryApi from "../../backend/controllers/categoryApi";
import * as transactionApi from "../../backend/controllers/transactionApi";
import * as walletApi from "../../backend/controllers/walletAPi";
import { styles } from "../screens/HomeScreenStyle";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " ₫";
};

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [wRes, sRes, tRes, cRes] = await Promise.all([
        walletApi.getAll(),
        transactionApi.getSummary(),
        transactionApi.getAll({ limit: 5 }),
        categoryApi.getVisible(),
      ]);

      setWallets(wRes.data || []);
      setSummary(sRes.data || { totalIncome: 0, totalExpense: 0 });
      setRecentTransactions(tRes.data || []);
      setCategories(cRes.data || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
        <View style={styles.topHeader}>
          <View>
            <View style={styles.balanceRow}>
              <Text style={styles.totalBalanceText}>
                {formatCurrency(totalBalance)}
              </Text>
              <Text style={{ fontSize: 18, marginLeft: 10 }}>👁️</Text>
            </View>
            <Text style={styles.subText}>Tổng số dư</Text>
          </View>
          <View style={styles.headerIcons}>
            <Text style={styles.iconAction}>🔍</Text>
            <Text style={styles.iconAction}>🔔</Text>
          </View>
        </View>

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

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Báo cáo tháng này</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem báo cáo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reportRow}>
            <View style={styles.reportHalf}>
              <Text style={styles.reportLabel}>Tổng đã chi</Text>
              <Text style={[styles.reportValue, { color: theme.danger }]}>
                {formatCurrency(summary.totalExpense)}
              </Text>
              <View
                style={[styles.indicator, { backgroundColor: theme.danger }]}
              />
            </View>
            <View style={styles.reportHalf}>
              <Text style={styles.reportLabel}>Tổng thu</Text>
              <Text style={[styles.reportValue, { color: theme.blue }]}>
                {formatCurrency(summary.totalIncome)}
              </Text>
              <View
                style={[styles.indicator, { backgroundColor: theme.blue }]}
              />
            </View>
          </View>

          <View style={styles.chartPlaceholder}>
            <Text style={styles.placeholderText}>
              Nhập giao dịch để xem báo cáo
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chi tiêu nhiều nhất</Text>
            <TouchableOpacity>
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

        {/* --- SECTION 5: RECENT TRANSACTIONS --- */}
        <View style={[styles.sectionCard, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity>
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

const TabItem = ({ icon, label, active }) => (
  <TouchableOpacity style={styles.tabBtn}>
    <Text style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{icon}</Text>
    <Text style={[styles.tabLabel, active && { color: "#FFF" }]}>{label}</Text>
  </TouchableOpacity>
);
