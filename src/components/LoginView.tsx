"use client";

import { FormEvent, useState } from "react";
import { getSupabase } from "@/utils/supabase";

export function LoginView() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const { error } = await getSupabase().auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setStep("code");
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setLoading(true);
    setError(null);

    const { error } = await getSupabase().auth.verifyOtp({
      email,
      token: otpCode,
      type: "email",
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    }
  }

  return (
    <div
      className="flex h-screen flex-col items-center justify-between px-4 py-12"
      style={{
        background: "linear-gradient(to bottom, #222831, #0B131F)",
        fontFamily: "Manrope, system-ui, sans-serif",
      }}
    >
      {/* Upper section: logo + tagline */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <img
          src="/vera-logo.png"
          alt="Vera"
          className="w-48"
          draggable={false}
        />
        <p className="max-w-xs text-center text-2xl leading-snug text-white">
          Practice with confidence
        </p>
      </div>

      {/* Lower section: glass card */}
      <div
        className="w-full max-w-sm rounded-[32px] border border-white/10 p-8"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {step === "email" ? (
          <form onSubmit={handleSendOtp}>
            <h2 className="mb-6 text-xl font-bold text-[#EDF1F5]">
              Sign in with email
            </h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              disabled={loading}
              className="w-full rounded-xl border border-white/5 bg-white/5 p-4 text-[#EDF1F5] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#EDF1F5]"
            />
            {error && (
              <p className="mt-2 text-sm text-[#d63152]">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-4 w-full rounded-xl bg-[#EDF1F5] p-4 font-semibold text-[#151718] transition-opacity hover:opacity-90 active:opacity-80 disabled:bg-[#C0C9D5] disabled:text-[#8090A6]"
            >
              {loading ? "Sending..." : "Continue with Email"}
            </button>
            <p className="mt-6 text-center text-xs text-[#8090A6]">
              By signing in, you agree to our{" "}
              <a
                href="https://www.verahealth.ai/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="https://www.verahealth.ai/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Privacy Policy
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <h2 className="mb-2 text-xl font-bold text-[#EDF1F5]">
              Enter your code
            </h2>
            <p className="mb-6 text-sm text-[#8090A6]">
              We sent a verification code to{" "}
              <strong className="text-[#EDF1F5]">{email}</strong>
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              autoFocus
              disabled={loading}
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-xl border border-white/5 bg-white/5 p-4 text-center text-2xl tracking-[0.3em] text-[#EDF1F5] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#EDF1F5]"
            />
            {error && (
              <p className="mt-2 text-sm text-[#d63152]">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !otpCode.trim()}
              className="mt-4 w-full rounded-xl bg-[#EDF1F5] p-4 font-semibold text-[#151718] transition-opacity hover:opacity-90 active:opacity-80 disabled:bg-[#C0C9D5] disabled:text-[#8090A6]"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setError(null);
              }}
              className="mt-3 w-full rounded-xl border border-[#C0C9D5]/20 bg-transparent p-4 font-semibold text-[#EDF1F5] transition-opacity hover:opacity-80"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
