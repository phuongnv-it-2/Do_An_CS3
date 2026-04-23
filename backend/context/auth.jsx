import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      const userData = await SecureStore.getItemAsync("user");

      setUserToken(token);
      setUser(userData ? JSON.parse(userData) : null);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const signIn = async (token, userData) => {
    setUserToken(token);
    setUser(userData);

    await SecureStore.setItemAsync("userToken", token);
    await SecureStore.setItemAsync("user", JSON.stringify(userData));
  };

  const signOut = async () => {
    setUserToken(null);
    setUser(null);

    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("user");
  };

  return (
    <AuthContext.Provider
      value={{ signIn, signOut, userToken, user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
