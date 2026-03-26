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
    // On success, onAuthStateChange in page.tsx picks up the session
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-600" />
          <span className="text-sm font-semibold">Vera</span>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendOtp}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="mb-3 text-sm text-gray-600">
              We sent a code to <strong>{email}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification code
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
              autoFocus
              inputMode="numeric"
              maxLength={6}
            />
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !otpCode.trim()}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
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
              className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
