import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../backend/context/auth";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) setUser(JSON.parse(userData));
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await signOut();
    await AsyncStorage.removeItem("userData");
    router.replace("/Login"); // Điều hướng về app/Login.jsx
  };

  if (!user)
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.full_name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user.full_name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Hạng tài khoản</Text>
        <Text style={styles.value}>{user.role?.toUpperCase()}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Số dư hiện tại</Text>
        <Text style={[styles.value, { color: "#2ECC71" }]}>
          {user.balance?.toLocaleString()} đ
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    alignItems: "center",
  },
  header: { alignItems: "center", marginTop: 40, marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2ECC71",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: 32, fontWeight: "bold" },
  userName: { color: "#FFF", fontSize: 22, fontWeight: "bold", marginTop: 15 },
  userEmail: { color: "#8E8E93", fontSize: 14 },
  card: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
  },
  label: { color: "#8E8E93", fontSize: 12, marginBottom: 5 },
  value: { color: "#FFF", fontSize: 18, fontWeight: "600", marginBottom: 15 },
  divider: { height: 1, backgroundColor: "#38383A", marginBottom: 15 },
  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#E74C3C",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#FFF", fontWeight: "bold" },
});
