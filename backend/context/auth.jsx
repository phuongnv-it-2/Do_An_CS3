import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      setUserToken(token);
      setIsLoading(false);
    };
    loadToken();
  }, []);

  const signIn = async (token) => {
    setUserToken(token);
    await SecureStore.setItemAsync("userToken", token);
  };

  const signOut = async () => {
    setUserToken(null);
    await SecureStore.deleteItemAsync("userToken");
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, userToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
