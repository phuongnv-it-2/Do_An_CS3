import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../backend/context/auth";
import * as walletApi from "../backend/controllers/walletAPi";

export default function AddWallet() {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState("cash"); // 'cash', 'bank', 'e-wallet'
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const walletTypes = [
    { id: "cash", label: "Tiền mặt", icon: "💵" },
    { id: "bank", label: "Ngân hàng", icon: "🏦" },
    { id: "e-wallet", label: "Ví điện tử", icon: "📱" },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên ví");
      return;
    }

    const numericBalance = parseFloat(balance);
    if (balance && (isNaN(numericBalance) || numericBalance < 0)) {
      Alert.alert("Lỗi", "Số dư không hợp lệ hoặc không được âm");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        balance: numericBalance || 0,
        type: type,
        userId: user?.id,
        is_default: isDefault,
        currency: "VND", // Giá trị mặc định theo Model
      };

      await walletApi.create(payload);
      Alert.alert("Thành công", "Đã tạo ví mới!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Lỗi tạo ví:", error);
      Alert.alert("Thất bại", "Không thể tạo ví, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Thêm ví mới</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Tên ví</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Tiền mặt, MoMo, Techcombank..."
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Số dư ban đầu (VND)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={balance}
          onChangeText={setBalance}
        />

        <Text style={styles.label}>Loại ví</Text>
        <View style={styles.typeRow}>
          {walletTypes.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeBtn, type === t.id && styles.typeBtnActive]}
              onPress={() => setType(t.id)}
            >
              <Text
                style={[styles.typeText, type === t.id && { color: "#fff" }]}
              >
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Option set mặc định */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Đặt làm ví mặc định</Text>
            <Text style={styles.switchSubLabel}>
              Dùng để tự động ghi chép giao dịch
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: "#3e3e3e", true: "#2ECC71" }}
            thumbColor={isDefault ? "#fff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>LƯU VÍ</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  backBtn: { color: "#fff", fontSize: 20 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  label: { color: "#8E8E93", fontSize: 13, marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: "#242436",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  typeRow: { flexDirection: "row", gap: 8, marginTop: 5, flexWrap: "wrap" },
  typeBtn: {
    flex: 1,
    minWidth: "30%",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#242436",
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnActive: { backgroundColor: "#2ECC71" },
  typeText: { color: "#8E8E93", fontWeight: "600", fontSize: 12 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
  },
  switchLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  switchSubLabel: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: "#2ECC71",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
