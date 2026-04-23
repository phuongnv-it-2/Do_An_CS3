import { Stack } from "expo-router";
import { AuthProvider } from "../backend/context/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
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
            presentation: "modal", // Hiệu ứng trượt từ dưới lên
            headerTitle: "Thêm giao dịch",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
