import { Link } from "react-router-dom";
import { AUTH_PAUSED_MESSAGE } from "../constants";

export function LoginPage() {
  return (
    <div className="px-4 py-8 max-w-sm mx-auto">
      <Link to="/" className="text-sydney-blue dark:text-sky-400 text-sm font-medium">← Back</Link>

      <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 shadow-sm p-6 text-center">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{AUTH_PAUSED_MESSAGE}</p>
        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-2">
          You can still save trips in this browser session without an account.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block min-h-[44px] px-5 py-2.5 rounded-xl bg-sydney-blue text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          Back to trips
        </Link>
      </div>
    </div>
  );
}
