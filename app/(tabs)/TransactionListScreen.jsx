// app/screens/TransactionListScreen.jsx
// Màn hình Sổ giao dịch

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../backend/context/auth";
import * as transactionApi from "../../backend/controllers/transactionApi";
import * as walletApi from "../../backend/controllers/walletAPi";
import * as categoryApi from "../../backend/controllers/categoryApi";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
};

const PERIOD_TABS = ["THÁNG TRƯỚC", "THÁNG NÀY", "TƯƠNG LAI"];

// Nhóm giao dịch theo ngày
const groupByDate = (transactions) => {
  const groups = {};
  transactions.forEach((tx) => {
    const date = tx.date?.split("T")[0] || "unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
};

const formatDateHeader = (dateStr) => {
  if (!dateStr || dateStr === "unknown") return { day: "--", sub: "" };
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return {
    day,
    sub: isToday ? `Hôm nay\ntháng ${month} ${year}` : `tháng ${month} ${year}`,
    isToday,
  };
};

export default function TransactionListScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("THÁNG NÀY");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletModalVisible, setWalletModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tRes, cRes, wRes] = await Promise.all([
        transactionApi.getAll({ userId: user?.id }),
        categoryApi.getVisible(),
        walletApi.getAll({ userId: user?.id }),
      ]);

      const allTx = tRes.data || [];
      setTransactions(allTx);
      setCategories(cRes.data || []);
      setWallets(wRes.data || []);

      const income = allTx
        .filter((t) => t.type === "income")
        .reduce((a, t) => a + (t.amount || 0), 0);
      const expense = allTx
        .filter((t) => t.type === "expense")
        .reduce((a, t) => a + (t.amount || 0), 0);
      setSummary({ income, expense });
    } catch (e) {
      console.error("Lỗi tải giao dịch:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCategoryInfo = (categoryId) =>
    categories.find((c) => c.id === categoryId) || {
      name: "Khác",
      icon: "💰",
      color: "#95a5a6",
    };

  const balance = summary.income - summary.expense;
  const grouped = groupByDate(transactions);

  const currentWalletName = selectedWallet
    ? wallets.find((w) => w.id === selectedWallet)?.name || "Tổng cộng"
    : "Tổng cộng";

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
          paddingVertical: 12,
        }}
      >
        {/* Nút trợ giúp */}
        <TouchableOpacity
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1.5,
            borderColor: "#555",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="help-outline" size={18} color="#aaa" />
        </TouchableOpacity>

        {/* Wallet selector */}
        <TouchableOpacity
          onPress={() => setWalletModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1e2a38",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            gap: 6,
          }}
        >
          <Ionicons name="globe-outline" size={18} color="#4CAF50" />
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
            {currentWalletName}
          </Text>
          <Ionicons name="chevron-expand-outline" size={16} color="#aaa" />
        </TouchableOpacity>

        {/* Action icons */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Số dư */}
      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <Text style={{ color: "#aaa", fontSize: 13 }}>Số dư</Text>
        <Text
          style={{
            color: balance >= 0 ? "#fff" : "#e74c3c",
            fontSize: 28,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          {balance < 0 ? "-" : ""}
          {formatCurrency(Math.abs(balance))} đ
        </Text>
      </View>

      {/* Period tabs */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#222",
        }}
      >
        {PERIOD_TABS.map((tab) => (
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
                color: activeTab === tab ? "#fff" : "#555",
                fontWeight: activeTab === tab ? "700" : "400",
                fontSize: 12,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Income / Expense summary */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#1e2530",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ color: "#aaa", fontSize: 14 }}>Tiền vào</Text>
          <Text
            style={{
              color: summary.income > 0 ? "#4CAF50" : "#3d7fa6",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {summary.income > 0 ? formatCurrency(summary.income) : "0"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#aaa", fontSize: 14 }}>Tiền ra</Text>
          <Text style={{ color: "#e74c3c", fontSize: 14, fontWeight: "600" }}>
            {formatCurrency(summary.expense)}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "#2a3545",
            marginBottom: 10,
          }}
        />

        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Text
            style={{
              color: balance >= 0 ? "#fff" : "#e74c3c",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            {balance < 0 ? "-" : ""}
            {formatCurrency(Math.abs(balance))}
          </Text>
        </View>

        {/* Xem báo cáo button */}
        <TouchableOpacity
          onPress={() => router.push("/ReportScreen")}
          style={{
            marginTop: 14,
            borderWidth: 1.5,
            borderColor: "#4CAF50",
            borderRadius: 24,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#4CAF50", fontSize: 14, fontWeight: "600" }}>
            Xem báo cáo cho giai đoạn này
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction list */}
      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : transactions.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="receipt-outline" size={48} color="#333" />
          <Text style={{ color: "#555", marginTop: 12, fontSize: 15 }}>
            Chưa có giao dịch nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([date]) => date}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item: [date, txList] }) => {
            const { day, sub } = formatDateHeader(date);
            const dayTotal = txList.reduce(
              (acc, tx) =>
                acc + (tx.type === "income" ? tx.amount : -tx.amount),
              0
            );
            return (
              <View>
                {/* Date header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#1e2530",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 32,
                      fontWeight: "700",
                      width: 60,
                    }}
                  >
                    {day}
                  </Text>
                  <Text
                    style={{
                      color: "#aaa",
                      fontSize: 12,
                      flex: 1,
                      lineHeight: 18,
                    }}
                  >
                    {sub}
                  </Text>
                  <Text
                    style={{
                      color: dayTotal >= 0 ? "#4CAF50" : "#e74c3c",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {dayTotal < 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(dayTotal))}
                  </Text>
                </View>

                {/* Transactions */}
                {txList.map((tx) => {
                  const cat = getCategoryInfo(tx.categoryId);
                  return (
                    <TouchableOpacity
                      key={tx.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: "#1a2230",
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
                        <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: "#e0e0e0",
                          fontSize: 15,
                          fontWeight: "500",
                        }}
                      >
                        {cat.name}
                      </Text>
                      <Text
                        style={{
                          color: tx.type === "income" ? "#4CAF50" : "#e74c3c",
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(tx.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
        />
      )}

      {/* Wallet picker modal */}
      <Modal
        visible={walletModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setWalletModalVisible(false)}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#1a2230",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Chọn ví
          </Text>

          <TouchableOpacity
            onPress={() => {
              setSelectedWallet(null);
              setWalletModalVisible(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#2a3545",
            }}
          >
            <Ionicons
              name="globe-outline"
              size={22}
              color="#4CAF50"
              style={{ marginRight: 14 }}
            />
            <Text style={{ color: "#fff", fontSize: 15, flex: 1 }}>
              Tổng cộng
            </Text>
            {!selectedWallet && (
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>

          {wallets.map((w) => (
            <TouchableOpacity
              key={w.id}
              onPress={() => {
                setSelectedWallet(w.id);
                setWalletModalVisible(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#2a3545",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: w.type === "bank" ? "#3498DB" : "#E67E22",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons
                  name={w.type === "bank" ? "card-outline" : "wallet-outline"}
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={{ color: "#fff", fontSize: 15, flex: 1 }}>
                {w.name}
              </Text>
              {selectedWallet === w.id && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
