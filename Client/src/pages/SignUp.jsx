import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (key) => (e) =>
    setForm((s) => ({ ...s, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    const res = await signup(form.name, form.email, form.password);

    if (res.success) navigate("/dashboard");
    else setErrors(res.errors);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-blue-100 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
        
        {/* Heading */}
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">
          Create Account
        </h1>
        <p className="text-slate-500 text-center mb-6">
          Join Travel Planner Today
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="John Doe"
              value={form.name}
              onChange={onChange("name")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
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
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={onChange("password")}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-2 rounded-xl hover:from-cyan-700 hover:to-blue-700 transition shadow-lg"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-cyan-600 font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
