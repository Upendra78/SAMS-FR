import { useEffect, useState } from "react";

import AuthContext from "./authContext";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const result = await getCurrentUser();

        if (result?.success && result?.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(credentials) {
    const result = await loginRequest(credentials);

    if (result?.success && result?.user) {
      setUser(result.user);
    }

    return result;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}