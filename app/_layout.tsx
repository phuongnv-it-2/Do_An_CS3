import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { AuthProvider } from "../backend/context/auth";
import PetOverlay from "../components/Petoverlay";

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth */}
          <Stack.Screen name="Login" />
          <Stack.Screen name="Register" />
          {/* App chính */}
          <Stack.Screen name="WalletScreen" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="AddTransaction"
            options={{
              presentation: "modal",
              headerTitle: "Thêm giao dịch",
            }}
          />
        </Stack>

        {/* Pet nằm trên tất cả màn hình */}
        <PetOverlay />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});