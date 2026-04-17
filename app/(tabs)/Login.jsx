import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const animation = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "498688513240-cforopo0p92b378aelafu7j2vvcvgo8u.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("Google User Info:", userInfo);
      Alert.alert("Thành công", `Chào ${userInfo.user.name}!`);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Người dùng hủy đăng nhập");
      } else {
        console.log("Lỗi Google Sign-In:", error);
        Alert.alert("Lỗi", "Không thể đăng nhập bằng Google");
      }
    }
  };

  const handleLogin = async () => {
    animation.current?.play();

    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ Email và Password");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await res.json();
      console.log("Kết quả Login:", data);

      if (!res.ok) {
        Alert.alert("Thất bại", data.error || "Sai tài khoản hoặc mật khẩu");
        return;
      }
      try {
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
      } catch (e) {
        console.log("Lỗi lưu dữ liệu:", e);
      }

      Alert.alert("Đăng nhập thành công 🎉");
      router.replace("/Overall");
    } catch (err) {
      console.log("Lỗi kết nối:", err);
      Alert.alert("Lỗi", "Không thể kết nối đến server. Kiểm tra lại Backend.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login 💰</Text>

      <LottieView
        ref={animation}
        source={require("../../assets/wallet.json")}
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

      {/* Nút Đăng nhập thường */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Nút Đăng nhập Google */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#de4d41", marginTop: 10 }]}
        onPress={signInWithGoogle}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
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
});
