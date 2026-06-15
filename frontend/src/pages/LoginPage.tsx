import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function getRegisterPasswordIssue(password: string, confirmPassword: string): string | null {
  if (password.length > 0 && password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const registerPasswordIssue = useMemo(
    () => (mode === "register" ? getRegisterPasswordIssue(password, confirmPassword) : null),
    [mode, password, confirmPassword],
  );

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && registerPasswordIssue) {
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-8 max-w-sm mx-auto">
      <Link to="/" className="text-sydney-blue dark:text-sky-400 text-sm font-medium">← Back</Link>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Save trips to your account. You can use the app without logging in.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sydney-blue/30 focus:border-sydney-blue"
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sydney-blue/30 focus:border-sydney-blue"
              />
            </div>
          )}

          {registerPasswordIssue && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-red-700 dark:text-red-300 text-sm">
              {registerPasswordIssue}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] py-3 rounded-xl bg-sydney-blue text-white font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            {submitting ? "…" : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="mt-4 text-sm text-sydney-blue dark:text-sky-400 font-medium w-full text-center"
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
