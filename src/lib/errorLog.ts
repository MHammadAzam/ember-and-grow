// Global error logging pipeline. Captures render errors, unhandled exceptions
// and promise rejections into localStorage so the user can inspect what
// caused a white-screen crash (e.g. after claiming rewards or switching themes).

export interface ErrorLogEntry {
  at: string;            // ISO timestamp
  source: "render" | "window" | "promise" | "manual";
  message: string;
  stack?: string;
  context?: string;      // e.g. "theme-switch", "reward-claim"
  url?: string;
}

const STORE_KEY = "lifeforge_error_log";
const MAX_ENTRIES = 50;

export function getErrorLog(): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearErrorLog(): void {
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
}

export function logError(entry: Omit<ErrorLogEntry, "at" | "url"> & { at?: string }): void {
  try {
    const list = getErrorLog();
    list.unshift({
      at: entry.at ?? new Date().toISOString(),
      source: entry.source,
      message: entry.message?.slice(0, 500) ?? "Unknown error",
      stack: entry.stack?.slice(0, 2000),
      context: entry.context,
      url: typeof location !== "undefined" ? location.pathname : undefined,
    });
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    /* swallow — logging must never throw */
  }
}

let installed = false;
/** Install global window listeners. Idempotent. Call once on app start. */
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e: ErrorEvent) => {
    logError({
      source: "window",
      message: e.message || String(e.error ?? "Unknown window error"),
      stack: e.error instanceof Error ? e.error.stack : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const reason = e.reason;
    logError({
      source: "promise",
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
