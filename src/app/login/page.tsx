"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { APP_CONFIG } from "@/config/app.config";
import { soundFX } from "@/lib/sound/sound-effects";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
      soundFX.playSuccess();
      router.push("/");
    } catch (err: any) {
      soundFX.playWarning();
      setError(err.message || (isVi ? "Xác thực không thành công. Vui lòng kiểm tra lại thông tin đăng nhập." : "Authentication failed. Please check credentials."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      soundFX.playSuccess();
      router.push("/");
    } catch (err: any) {
      soundFX.playWarning();
      setError(err.message || (isVi ? "Đăng nhập bằng Google không thành công." : "Google sign in failed."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdmin = () => {
    soundFX.playClick();
    setEmail("qtusdev@admin.com");
    setPassword("Qtusdev");
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Top right language switch */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* Subtle background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bento-card p-6 sm:p-8 space-y-6 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white font-bold font-mono text-xl mx-auto shadow-lg shadow-brand-500/25">
            OS
          </div>
          <h2 className="text-xl font-bold text-txt-primary tracking-tight font-mono">
            {APP_CONFIG.name}
          </h2>
          <p className="text-xs text-txt-secondary font-sans">
            {isSignUp
              ? isVi ? "Tạo tài khoản giao dịch định lượng chuẩn mực" : "Create your institutional trading account"
              : isVi ? "Đăng nhập truy cập terminal vận hành" : "Sign in to access your operating terminal"}
          </p>
        </div>

        {/* Google Login for Customers */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-bg-surface-subtle hover:bg-bg-surface-hover border border-border text-txt-primary text-xs font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isVi ? "Đăng nhập bằng Google (Khách hàng)" : "Continue with Google (Trader)"}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] font-mono text-txt-muted uppercase">
              {isVi ? "Hoặc Đăng Nhập Email / Admin" : "Or with Email / Master Admin"}
            </span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input
              label={isVi ? "Tên hiển thị" : "Trader Display Name"}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Trader"
              required
            />
          )}

          <Input
            label={isVi ? "Địa chỉ Email" : "Email Address"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trader@aitrading.os"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label={isVi ? "Mật khẩu" : "Password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {error && (
            <div className="p-3 rounded-xl bg-loss-subtle border border-loss/30 text-loss text-xs font-mono">
              {error}
            </div>
          )}

          <Button variant="primary" size="md" type="submit" isLoading={isLoading} className="w-full">
            <span>
              {isSignUp
                ? isVi ? "Tạo Tài Khoản Vận Hành" : "Create Operating Account"
                : isVi ? "Truy Cập Terminal" : "Access Operating Terminal"}
            </span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Admin ENV quick-hint */}
        <div className="p-3.5 bg-bg-surface-subtle rounded-xl border border-amber-500/30 text-[11px] font-mono text-txt-secondary space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> {isVi ? "Tài khoản Master Admin:" : "Master Admin Login:"}
            </span>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="text-[10px] text-sky-400 hover:underline cursor-pointer font-bold"
            >
              {isVi ? "Điền Tự Động" : "Fill Credentials"}
            </button>
          </div>
          <div className="text-txt-primary">
            Email: <span className="text-txt-primary font-bold">qtusdev@admin.com</span> | Pass: <span className="text-txt-primary font-bold">Qtusdev</span>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              soundFX.playSwitch();
              setIsSignUp(!isSignUp);
            }}
            className="text-xs text-sky-400 hover:underline cursor-pointer font-sans"
          >
            {isSignUp
              ? isVi ? "Đã có tài khoản? Đăng nhập ngay" : "Already have an account? Sign in"
              : isVi ? "Người dùng mới? Đăng ký tài khoản" : "New to AI Trading OS? Create account"}
          </button>
        </div>

        {/* Security Badge */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-center gap-2 text-[11px] text-txt-muted font-mono">
          <ShieldCheck className="w-4 h-4 text-gain" />
          <span>{isVi ? "Bảo vệ phép tính tài chính chuẩn xác 100%" : "Deterministic Calculations Protected"}</span>
        </div>
      </div>
    </div>
  );
}
