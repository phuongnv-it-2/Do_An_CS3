import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import LottieView from "lottie-react-native";
import Appdialog from "../../components/AppDialog";

export default function Register() {
  const animation = useRef(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      console.log("response:", data);

      if (!res.ok || data.error) {
        setDialogMsg(data.error || "Đăng ký thất bại");
        setDialogVisible(true);
        return;
      }

      setDialogMsg("Đăng ký thành công 🎉");
      setDialogVisible(true);
    } catch (err) {
      console.log(err);
      setDialogMsg("Không kết nối được server");
      setDialogVisible(true);
    }

    console.log(fullName, email, password);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => animation.current.play()}>
        <LottieView
          ref={animation}
          source={require("../../assets/wallet.json")}
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

      <Text style={styles.loginText}>Already have account? Login</Text>
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
});
