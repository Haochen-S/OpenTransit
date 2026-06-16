import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/ApiClient";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(true);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    setError("");
    try {
      const data = await api.getLoginCaptcha();
      setCaptchaId(data.captcha_id);
      setCaptchaQuestion(data.question);
      setCaptchaAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verification");
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!captchaId || !captchaAnswer.trim()) {
      setError("Please complete the verification check");
      return;
    }

    setSendingOtp(true);
    try {
      await api.sendOtp(email, captchaId, captchaAnswer);
      navigate("/login/otp", { state: { email: email.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      await loadCaptcha();
    } finally {
      setSendingOtp(false);
    }
  }

  return (
    <div className="px-4 py-8 max-w-sm mx-auto">
      <Link to="/" className="text-sydney-blue dark:text-sky-400 text-sm font-medium">← Back</Link>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Step 1 of 2</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Sign in with email</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          We&apos;ll send a one-time password (OTP) to your inbox. No account signup required.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sydney-blue/30 focus:border-sydney-blue"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <label htmlFor="captcha" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verification
                </label>
                <button
                  type="button"
                  onClick={() => setShowVerificationHelp((open) => !open)}
                  aria-label="Why do we use verification?"
                  aria-expanded={showVerificationHelp}
                  className="shrink-0 w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ?
                </button>
              </div>
              <button
                type="button"
                onClick={loadCaptcha}
                disabled={loadingCaptcha}
                className="text-xs text-sydney-blue dark:text-sky-400 font-medium disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            {showVerificationHelp && (
              <div
                className="mb-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
                role="note"
              >
                We use passwordless email OTP login with a simple backend verification step to keep sign-in
                lightweight, low-cost, and mobile-friendly while reducing automated email abuse. This is a
                practical trade-off between usability, security, performance, and operating cost.
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-mono">
              {loadingCaptcha ? "Loading…" : captchaQuestion}
            </p>
            <input
              id="captcha"
              type="text"
              required
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Your answer"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sydney-blue/30 focus:border-sydney-blue"
            />
          </div>

          <button
            type="submit"
            disabled={sendingOtp || loadingCaptcha}
            className="w-full min-h-[48px] py-3 rounded-xl bg-sydney-blue text-white font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            {sendingOtp ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
