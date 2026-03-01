import React, { useState } from "react";
import API from "../services/api";
import StarBackground from "../components/StarBackground";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/register", form);

      setSuccess(true);

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || "Registration failed. Try again."
      );
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      
      <StarBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md p-12 rounded-3xl
        backdrop-blur-3xl bg-white/5 border border-white/10
        shadow-[0_0_80px_rgba(0,255,255,0.15)]
        text-white"
      >
        <h2 className="text-4xl font-extrabold text-center mb-12 tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-8">

          {/* Name */}
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            required
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full rounded-2xl px-5 py-4
            bg-white/90 text-black border border-gray-200
            focus:outline-none focus:ring-2 focus:ring-cyan-400
            transition duration-300"
          />

          {/* Email */}
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="email"
            required
            placeholder="Email Address"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full rounded-2xl px-5 py-4
            bg-white/90 text-black border border-gray-200
            focus:outline-none focus:ring-2 focus:ring-cyan-400
            transition duration-300"
          />

          {/* Password */}
          <div className="relative">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full rounded-2xl px-5 py-4 pr-12
              bg-white/90 text-black border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-cyan-400
              transition duration-300"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {/* Register Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold
            text-slate-900 tracking-wide
            bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400
            shadow-lg transition-all duration-300
            flex justify-center items-center gap-3"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            ) : success ? (
              "Account Created ✓"
            ) : (
              "Register"
            )}
          </motion.button>

          {/* Error */}
          {error && (
            <div className="text-center text-red-400 font-semibold mt-4">
              {error}
            </div>
          )}
        </form>

        {/* Login Link */}
        <div className="text-center mt-6 text-gray-300 text-sm">
          Already have an account?{" "}
          <a
            href="/"
            className="text-cyan-400 hover:text-emerald-400 font-semibold transition"
          >
            Login here
          </a>
        </div>

        <p className="text-center text-gray-500 text-sm mt-12 tracking-wide">
          Mistake Tracking & Analysis System
        </p>
      </motion.div>
    </div>
  );
}