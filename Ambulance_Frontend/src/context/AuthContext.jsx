import { useState, useCallback, createContext, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithToken = useCallback(async (accessToken) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/verify`,
      { accessToken }
    );

    const { accessToken: jwt, user: userData } = res.data.data;

    localStorage.setItem("accessToken", jwt);
    setToken(jwt);
    setUser(userData);
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

    return userData;
  }, []);

  // Auto-restore session on refresh
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("accessToken");
      if (savedToken) {
        try {
          await loginWithToken(savedToken);
        } catch (err) {
          console.error("Auto-login failed:", err);
          localStorage.removeItem("accessToken");
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [loginWithToken]);   // ← added this

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    delete axios.defaults.headers.common["Authorization"];
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, loginWithToken, logout }}
    >
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