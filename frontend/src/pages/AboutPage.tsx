const GITHUB_URL = "https://github.com/Haochen-S/OpenTransit";

const FEATURES = [
  "Save up to 10 frequent trips",
  "Upcoming departures & arrivals",
  "Platforms and line information",
  "Real-time delay status",
];

const TECH_STACK = [
  "React",
  "TypeScript",
  "Vite",
  "FastAPI",
  "PostgreSQL",
  "SQLAlchemy",
  "Alembic",
  "Docker",
  "AWS",
];

function FeatureIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0 text-sydney-blue dark:text-sky-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function AboutPage() {
  return (
    <div className="px-4 pb-2">
      <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className="shrink-0 w-10 h-10 rounded-lg bg-sydney-sky/80 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-sydney-navy dark:text-white"
            >
              OT
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">About</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">OpenTransit Sydney</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A mobile-first Sydney Trains app for saving frequent trips and checking upcoming services
            quickly—without searching a full transport planner every time.
          </p>
        </div>

        <div className="px-4 py-4 space-y-5">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Built for commuters who want fast access to regular routes on their phone. Sign in to keep trips
              across devices, or use guest mode with trips stored in this browser session.
            </p>
            <p>
              Powered by Transport for NSW Open Data, with authentication, persistent storage, and a backend
              API that keeps external credentials off the frontend.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Features</h2>
            <ul className="grid grid-cols-1 gap-2">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200"
                >
                  <FeatureIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Tech stack</h2>
            <div className="flex flex-wrap gap-2">
              {TECH_STACK.map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">GitHub</h2>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </span>
                <span className="text-sm font-medium text-sydney-blue dark:text-sky-400 truncate">
                  Haochen-S/OpenTransit
                </span>
              </span>
              <svg
                className="w-5 h-5 shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
