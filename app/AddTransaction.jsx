import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as CategoryApi from "../backend/controllers/categoryApi";
import * as TransactionApi from "../backend/controllers/transactionApi";
import * as WalletApi from "../backend/controllers/walletAPi";

export default function AddTransaction() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("expense");
  // States cho Dữ liệu từ API
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Gọi API mỗi khi 'type' thay đổi (để cập nhật danh mục thu hoặc chi)
  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      const [catRes, wallRes] = await Promise.all([
        CategoryApi.getVisible(type),
        WalletApi.getAll(),
      ]);
      console.log("Dữ liệu danh mục nhận được:", catRes);

      const categoriesData = catRes.data || catRes || [];
      const walletsData = wallRes.data || wallRes || [];

      setCategories(categoriesData);
      setWallets(walletsData);

      // Tự động chọn ví đầu tiên nếu có dữ liệu
      if (walletsData.length > 0) {
        setSelectedWallet(walletsData[0].id);
      }
    } catch (err) {
      console.error("Lỗi fetch dữ liệu:", err);
      setCategories([]);
      setWallets([]);
    }
  };

  const handleSave = async () => {
    // Kiểm tra tính hợp lệ của dữ liệu
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
      Alert.alert("Lỗi", "Vui lòng chọn một ví để trừ/cộng tiền");
      return;
    }

    try {
      const payload = {
        amount: numAmount,
        type,
        note,
        date: new Date(),
        walletId: selectedWallet,
        categoryId: selectedCategory,
      };

      // Gửi lên backend (Backend của bạn có Hook tự cập nhật số dư ví)
      await TransactionApi.create(payload);

      Alert.alert("Thành công", "Giao dịch đã được lưu!");
      router.back(); // Quay lại màn hình trước đó
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      Alert.alert(
        "Thất bại",
        err.response?.data?.message || "Lỗi khi lưu giao dịch",
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Nút chuyển đổi Thu nhập / Chi tiêu */}
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            type === "expense" && styles.typeBtnActiveExpense,
          ]}
          onPress={() => setType("expense")}
        >
          <Text
            style={[styles.typeText, type === "expense" && styles.textWhite]}
          >
            Chi tiêu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            type === "income" && styles.typeBtnActiveIncome,
          ]}
          onPress={() => setType("income")}
        >
          <Text
            style={[styles.typeText, type === "income" && styles.textWhite]}
          >
            Thu nhập
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phần nhập số tiền */}
      <Text style={styles.label}>Số tiền</Text>
      <TextInput
        style={[
          styles.amountInput,
          { color: type === "expense" ? "#E74C3C" : "#2ECC71" },
        ]}
        placeholder="0"
        placeholderTextColor="#888"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        autoFocus
      />

      {/* Phần nhập ghi chú */}
      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="Hôm nay bạn chi gì?..."
        value={note}
        onChangeText={setNote}
        multiline
      />

      {/* Danh sách danh mục */}
      <Text style={styles.label}>Chọn danh mục:</Text>
      <View style={styles.categoryGrid}>
        {categories.length > 0 ? (
          categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryItem,
                selectedCategory === cat.id && styles.categorySelected,
              ]}
            >
              <Text style={{ fontSize: 28 }}>{cat.icon || "📁"}</Text>
              <Text style={styles.categoryText} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Đang tải danh mục hoặc chưa có dữ liệu...
          </Text>
        )}
      </View>

      {/* Nút Lưu */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          { backgroundColor: type === "expense" ? "#E74C3C" : "#2ECC71" },
        ]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>LƯU GIAO DỊCH</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#FFF", flexGrow: 1 },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 25,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  typeBtnActiveExpense: { backgroundColor: "#E74C3C" },
  typeBtnActiveIncome: { backgroundColor: "#2ECC71" },
  typeText: { fontWeight: "bold", color: "#666" },
  textWhite: { color: "#FFF" },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  amountInput: {
    fontSize: 45,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  noteInput: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 5,
  },
  categoryItem: {
    width: "31%", // 3 cột
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: "1%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
  },
  categorySelected: { borderColor: "#2ECC71", backgroundColor: "#E8F5E9" },
  categoryText: {
    fontSize: 12,
    marginTop: 6,
    color: "#444",
    fontWeight: "500",
  },
  emptyText: {
    color: "#999",
    textAlign: "center",
    width: "100%",
    marginVertical: 30,
    fontStyle: "italic",
  },
  saveBtn: {
    padding: 18,
    borderRadius: 15,
    marginTop: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 18 },
});
