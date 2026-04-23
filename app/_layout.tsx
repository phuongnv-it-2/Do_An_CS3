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
        <Stack.Screen name="(tabs)" />
         <Stack.Screen name="WalletScreen" /> 
      </Stack>
    </AuthProvider>
  );
}