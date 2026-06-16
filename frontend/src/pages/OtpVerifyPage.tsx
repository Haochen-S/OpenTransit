import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface OtpLocationState {
  email?: string;
}

export function OtpVerifyPage() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as OtpLocationState | null)?.email?.trim() ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  if (!email) {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP from your email");
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(email, otp);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-8 max-w-sm mx-auto">
      <Link to="/login" className="text-sydney-blue dark:text-sky-400 text-sm font-medium">← Back</Link>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Step 2 of 2</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Enter OTP</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          We sent a one-time password to:
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white break-all">{email}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Check your inbox and spam folder. The OTP expires in a few minutes.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              One-time password (OTP)
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit OTP"
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-base tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-sydney-blue/30 focus:border-sydney-blue"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] py-3 rounded-xl bg-sydney-blue text-white font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Verifying…" : "Verify OTP & sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Wrong email?{" "}
          <Link to="/login" className="text-sydney-blue dark:text-sky-400 font-medium">
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
