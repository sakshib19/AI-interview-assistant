"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Adjust path as needed
import Link from "next/link"; 

export default function LoginPage() {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden p-4 sm:p-6 transition-colors duration-500">
      
      {/* ==================== DYNAMIC BACKGROUND ==================== */}
      {/* Responsive blobs: Smaller on mobile, larger on desktop */}
      <div className="absolute top-0 left-0 md:left-1/4 w-64 h-64 md:w-96 md:h-96 bg-[#cbe557]/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 md:right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] md:bg-[size:24px_24px] pointer-events-none"></div>

      {/* ==================== LOGIN CARD ==================== */}
      <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-[#cbe557]/10 transition-shadow">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#cbe557]/10 text-[#cbe557] mb-3 md:mb-4 border border-[#cbe557]/20 shadow-[0_0_15px_rgba(203,229,87,0.1)] transform hover:scale-110 hover:rotate-3 transition-all duration-300">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-neutral-400 mt-2 text-xs md:text-sm font-medium">Please enter your details to sign in</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
          
          {/* Email Input */}
          <div className="group">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-[#cbe557]">Email Address</label>
            <div className="relative transition-all duration-300 focus-within:scale-[1.02] focus-within:-translate-y-0.5">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-neutral-500 group-focus-within:text-[#cbe557] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-neutral-950/50 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#cbe557] focus:border-[#cbe557] transition-all duration-300 shadow-inner"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-[#cbe557]">Password</label>
            <div className="relative transition-all duration-300 focus-within:scale-[1.02] focus-within:-translate-y-0.5">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-neutral-500 group-focus-within:text-[#cbe557] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-neutral-950/50 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#cbe557] focus:border-[#cbe557] transition-all duration-300 shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-2">
              <a href="#" className="text-xs font-bold text-neutral-500 hover:text-[#cbe557] transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full relative group overflow-hidden flex justify-center py-3.5 md:py-4 px-4 border border-transparent rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-300 shadow-lg ${
              loading 
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-[#cbe557] text-neutral-950 hover:bg-[#b5cc4e] hover:scale-[1.02] active:scale-[0.98] hover:shadow-[#cbe557]/25"
            }`}
          >
            {/* Button Shine Effect */}
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            )}
            
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-neutral-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Footer / Switch to Signup */}
        <p className="mt-8 text-center text-xs md:text-sm text-neutral-500">
          Don't have an account?{" "}
          <Link href="/Auth/signup" className="font-bold text-[#cbe557] hover:text-[#e2fa7d] transition-colors hover:underline decoration-2 underline-offset-4">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}