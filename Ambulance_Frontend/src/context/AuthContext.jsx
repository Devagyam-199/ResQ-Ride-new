import { useState, useCallback, createContext, useContext, useEffect } from "react";
import api, { setAuthToken } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithToken = useCallback(async (accessToken) => {
    const res = await api.post("/api/v1/auth/verify", { accessToken });
    const { accessToken: jwt, user: userData } = res.data.data;
    localStorage.setItem("accessToken", jwt);
    setToken(jwt);
    setUser(userData);
    setAuthToken(jwt);
    return userData;
  }, []);

  const restoreFromJwt = useCallback(async (jwt) => {
    setAuthToken(jwt);
    const res = await api.get("/api/v1/auth/user");
    const userData = res.data.user;
    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("accessToken");
      if (savedToken) {
        try {
          await restoreFromJwt(savedToken);
        } catch {
          localStorage.removeItem("accessToken");
          setAuthToken(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, [restoreFromJwt]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    setAuthToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default useAuth;