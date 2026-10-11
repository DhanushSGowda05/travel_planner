

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./auth-context";

const BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:5000";


export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto login on refresh
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${BASE}/me`, {
          credentials: "include",
        });

        const data = await res.json();

        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Signup and login
  const authenticate = async (endpoint, payload) => {
    let response;

    try {
      response = await fetch(`${BASE}/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return {
        success: false,
        errors: {
          network: [
            "Unable to reach the server. Check your connection and try again.",
          ],
        },
      };
    }

    let data;

    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        errors: {
          server: [
            "The server returned an invalid response. Please try again.",
          ],
        },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        errors: data.errors || {
          auth: ["The request could not be completed."],
        },
      };
    }

    setUser(data.user);
    return { success: true };
  };

  const signup = (name, email, password) =>
    authenticate("signup", { name, email, password });

  const login = (email, password) =>
    authenticate("login", { email, password });

  // Logout
  const logout = async () => {
    try {
      await fetch(`${BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
