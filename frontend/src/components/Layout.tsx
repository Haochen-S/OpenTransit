import { useState } from "react";
import { Link } from "react-router-dom";
import { AUTH_ENABLED, AUTH_PAUSED_MESSAGE } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authPausedNotice, setAuthPausedNotice] = useState(false);

  function showAuthPausedNotice() {
    setAuthPausedNotice(true);
    window.setTimeout(() => setAuthPausedNotice(false), 4000);
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
      {authPausedNotice && (
        <div
          className="fixed top-[3.25rem] left-0 right-0 z-30 px-4 py-2 bg-amber-500 text-white text-sm text-center shadow-md safe-top"
          role="status"
        >
          {AUTH_PAUSED_MESSAGE}
        </div>
      )}
      <header className="sticky top-0 z-20 safe-top bg-sydney-navy text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-sm font-bold">
              OT
            </span>
            <span className="font-semibold text-base truncate">OpenTransit Sydney</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/about" className="text-sm text-white/90 hover:text-white px-2 py-1">
              About
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {theme === "light" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="text-sm text-white/90 hover:text-white px-2 py-1"
              >
                Log out
              </button>
            ) : AUTH_ENABLED ? (
              <Link to="/login" className="text-sm text-white/90 hover:text-white px-2 py-1">
                Log in
              </Link>
            ) : (
              <button
                type="button"
                onClick={showAuthPausedNotice}
                className="text-sm text-white/90 hover:text-white px-2 py-1"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto">
        {children}
        <footer className="mt-8 px-6 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
          <p className="mx-auto max-w-sm text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            Data provided by{" "}
            <a
              href="https://opendata.transport.nsw.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline dark:hover:text-slate-300"
            >
              Transport for NSW Open Data
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
