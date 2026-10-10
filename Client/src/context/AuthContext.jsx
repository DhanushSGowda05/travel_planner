import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const BASE = "http://127.0.0.1:5000";


  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading until /me completes

  // ----------------------------
  //  Auto login on refresh
  // ----------------------------
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
      } catch (err) {
        setUser(null);
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  // ----------------------------
  //  Signup
  // ----------------------------
  const signup = async (name, email, password) => {
    const res = await fetch(`${BASE}/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, errors: data.errors };
    }
  };

  // ----------------------------
  //  Login
  // ----------------------------
  const login = async (email, password) => {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, errors: data.errors };
    }
  };

  // ----------------------------
  //  Logout
  // ----------------------------
  const logout = async () => {
    await fetch(`${BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    navigate("/"); // redirect to landing page
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
