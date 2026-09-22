import { useState } from "react";

import AuthContext from "./authContext";
import {
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService";

export function AuthProvider({ children }) {
  // Temporary frontend testing user
  const [user, setUser] = useState(null);

  // Backend authentication is not ready yet
  const [loading] = useState(false);

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
    } catch {
      // Backend may not be available during frontend testing
    } finally {
      setUser(null);
    }
  }

  // TEMPORARY: Used only for testing portals without backend
  function setTestUser(role) {
    const testUsers = {
      ADMIN: {
        user_id: 1,
        name: "Test Administrator",
        email: "admin@test.local",
        role: "ADMIN",
      },

      FACULTY: {
        user_id: 2,
        name: "Test Faculty",
        email: "faculty@test.local",
        role: "FACULTY",
      },

      STUDENT: {
        user_id: 3,
        name: "Test Student",
        email: "student@test.local",
        role: "STUDENT",
      },
    };

    setUser(testUsers[role] || null);
  }

  const value = {
    user,
    loading,
    login,
    logout,
    setTestUser,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}