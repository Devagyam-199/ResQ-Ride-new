import { useState, useCallback, createContext, useContext } from "react"
import axios from "axios"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {

  const [user,  setUser]  = useState(null)
  const [token, setToken] = useState(null)

  const loginWithToken = useCallback(async (accessToken) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/verify`,
      { accessToken }
    )
    const { accessToken: jwt, user: userData } = res.data.data
    setToken(jwt)
    setUser(userData)
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwt}`
    return userData
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common["Authorization"]
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

export default useAuth;