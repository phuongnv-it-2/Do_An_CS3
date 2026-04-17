import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
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

import TransactionItem from "../components/TransactionItem";
import { fakeTransactions } from "../mock_data/fakeTransactions";
import { colors } from "../theme/colors";

export default function HomeScreen() {
  // State lưu tên người dùng và trạng thái loading
  const [userName, setUserName] = useState("...");
  const [isLoading, setIsLoading] = useState(true);

  // Tự động lấy dữ liệu từ AsyncStorage khi vừa mở màn hình
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");

        if (userDataString !== null) {
          const userData = JSON.parse(userDataString);
          // Cập nhật tên lên màn hình
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Chào buổi sáng,</Text>
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

      {/* Thẻ hiển thị số dư */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Tổng số dư</Text>
        <Text style={styles.balanceAmount}>14.335.000đ</Text>

        <View style={styles.incomeExpenseContainer}>
          <View style={styles.incomeExpenseItem}>
            <Text style={styles.incomeLabel}>⬇ Thu nhập</Text>
            <Text style={styles.incomeAmount}>+15.000.000đ</Text>
          </View>
          <View style={styles.incomeExpenseItem}>
            <Text style={styles.expenseLabel}>⬆ Chi tiêu</Text>
            <Text style={styles.expenseAmount}>-665.000đ</Text>
          </View>
        </View>
      </View>

      {/* Tiêu đề danh sách giao dịch */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Giao dịch gần đây</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách giao dịch dùng Component đã tách */}
      <FlatList
        data={fakeTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Nút thêm giao dịch (Floating Action Button) */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
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
