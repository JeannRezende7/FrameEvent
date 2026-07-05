import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || "admin";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || "C@dius";
const STORAGE_KEY = "moldura_admin_session";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem(STORAGE_KEY) === "1"
  );

  function login(user, pass) {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
