import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as walletApi from "../backend/controllers/walletAPi";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";

export default function WalletScreen() {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    walletApi.getAll().then((res) => setWallets(res.data || []));
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1a1a2e" }}
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
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>
          Ví của tôi
        </Text>
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18 }}>ⓘ</Text>
          <TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
              SỬA
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Tổng cộng */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: "#242436",
            borderBottomWidth: 0.5,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: "#2d6ee0",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 20 }}>🌐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "500" }}>
              Tổng cộng
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {formatCurrency(totalBalance)}
            </Text>
          </View>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#2ecc71",
            }}
          />
        </View>

        {/* Label */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: "#1f1f30",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
            Tính vào tổng
          </Text>
        </View>

        {/* Danh sách ví */}
        {wallets.map((wallet) => (
          <View
            key={wallet.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "#242436",
              borderBottomWidth: 0.5,
              borderBottomColor: "rgba(255,255,255,0.06)",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: wallet.type === "bank" ? "#3498DB" : "#E67E22",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {wallet.type === "bank" ? "🏦" : "👛"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "500" }}>
                {wallet.name}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {formatCurrency(wallet.balance)}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 0.5,
                borderColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}
              >
                •••
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 30,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#2ECC71",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 30, lineHeight: 34 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
