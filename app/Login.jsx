import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../assets/wallet.json";
import api from "../backend/Service/api";
import { useAuth } from "../backend/context/auth";

export default function Login() {
  const animation = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    console.log("👉 Bắt đầu login");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);

    animation.current?.play();

    if (!email || !password) {
      console.log("❌ Thiếu email hoặc password");
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ Email và Password");
      return;
    }

    try {
      console.log("🚀 Gửi request tới /auth/login...");

      const response = await api.post("/auth/login", { email, password });

      const { data } = response;
      await signIn(data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      console.log("🎉 Đăng nhập thành công");

      Alert.alert("Đăng nhập thành công 🎉");

      router.replace("/(tabs)");
    } catch (err) {
      console.log("❌ Lỗi login:", err);

      if (err.response) {
        console.log("📡 Server trả về:", err.response.data);
        console.log("🔢 Status:", err.response.status);
      } else if (err.request) {
        console.log("📭 Không nhận được response:", err.request);
      } else {
        console.log("⚠️ Lỗi khác:", err.message);
      }

      const message =
        err.response?.data?.error || "Sai tài khoản hoặc mật khẩu";

      Alert.alert("Thất bại", message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login 💰</Text>

      <LottieView
        ref={animation}
        source={require("../assets/wallet.json")}
        autoPlay
        loop
        style={{ width: 180, height: 180 }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Register")}>
        <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
  linkText: {
    marginTop: 15,
    color: "#007BFF",
    fontWeight: "500",
  },
});
