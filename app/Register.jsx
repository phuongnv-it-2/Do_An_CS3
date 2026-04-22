import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../backend/Service/api";
import Appdialog from "../components/AppDialog";

export default function Register() {
  const animation = useRef(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setDialogMsg("Vui lòng nhập đầy đủ thông tin");
      setDialogVisible(true);
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        full_name: fullName,
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log("Đăng ký thành công:", response.data);
      setDialogMsg("Đăng ký thành công 🎉");
      router.replace("/Login");
      setDialogVisible(true);
    } catch (err) {
      console.log("Lỗi đăng ký:", err.response?.data || err.message);

      const errorMessage =
        err.response?.data?.error || "Không thể kết nối đến server ngrok";
      setDialogMsg(errorMessage);
      setDialogVisible(true);
    }
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => animation.current.play()}>
        <LottieView
          ref={animation}
          source={require("../assets/wallet.json")}
          loop={false}
          style={styles.animation}
        />
      </TouchableOpacity>
      <Appdialog
        visible={dialogVisible}
        message={dialogMsg}
        onClose={() => setDialogVisible(false)}
      />

      <Text style={styles.title}>Create Account 💰</Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/Login")}
        style={styles.linkText}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  animation: {
    width: 180,
    height: 180,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  loginText: {
    marginTop: 15,
    color: "gray",
  },
  linkText: {
    marginTop: 15,
    color: "#007BFF",
    fontWeight: "500",
  },
});
