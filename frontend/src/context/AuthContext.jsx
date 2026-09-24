import { useEffect, useState } from "react";

import AuthContext from "./authContext";
import {
  login as loginRequest,
  logout as logoutRequest,
  getCurrentUser,
} from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated user from the backend JWT cookie.
  useEffect(() => {
    async function restoreSession() {
      try {
        const result = await getCurrentUser();

        if (result?.success && result?.data) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch {
        // No valid session or backend unavailable.
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(credentials) {
    const result = await loginRequest({
      email: credentials.email,
      password: credentials.password,
    });

    if (result?.success && result?.data) {
      setUser(result.data);
    }

    return result;
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Clear frontend session even if backend logout fails.
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