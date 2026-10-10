import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (key) => (e) =>
    setForm((s) => ({ ...s, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    const res = await login(form.email, form.password);
    if (res.success) navigate("/dashboard");
    else setErrors(res.errors);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-cyan-100 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-slate-500 text-center mb-6">
          Login to your account
        </p>

        {/* Errors */}
        {errors && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4">
            {Object.entries(errors).map(([field, msgs]) =>
              msgs.map((msg, i) => (
                <p key={i} className="text-sm">
                  <strong>{field}</strong>: {msg}
                </p>
              ))
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="example@mail.com"
              value={form.email}
              onChange={onChange("email")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Your password"
              value={form.password}
              onChange={onChange("password")}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition shadow-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-600">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
