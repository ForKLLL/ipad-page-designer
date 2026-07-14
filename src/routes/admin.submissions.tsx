import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  adminLogin,
  adminStatus,
  deleteResult,
  listResults,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/submissions")({
  head: () => ({
    meta: [
      { title: "Submissions — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminSubmissions,
});

type Result = {
  id: string;
  created_at: string;
  b_value: number;
  shade_name: string;
  hex: string;
  analysis: string;
  free_text: string | null;
};

const TOKEN_KEY = "admin-token";
const TIMEOUT_MS = 15_000;

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}
function setToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2efee] text-black p-6 md:p-10">
      {children}
    </div>
  );
}

function AdminSubmissions() {
  const status = useServerFn(adminStatus);
  const list = useServerFn(listResults);
  const login = useServerFn(adminLogin);
  const remove = useServerFn(deleteResult);

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Result[] | null>(null);
  const [nonce, setNonce] = useState(0);

  const mount = useCallback(async () => {
    setError(null);
    setUnlocked(null);
    setRows(null);
    try {
      const token = getToken();
      const s = await withTimeout(
        status({ data: { token } }),
        TIMEOUT_MS,
        "Admin gate",
      );
      setUnlocked(s.unlocked);
      if (s.unlocked) {
        const r = await withTimeout(
          list({ data: { token } }),
          TIMEOUT_MS,
          "Submissions",
        );
        setRows(r.results as Result[]);
      } else {
        clearToken();
      }
    } catch (e) {
      setError(errMsg(e));
    }
  }, [status, list]);

  useEffect(() => {
    void mount();
  }, [mount, nonce]);

  const onDelete = async (row: Result) => {
    if (!confirm(`Take down submission "${row.shade_name}" (${row.hex})?`)) return;
    try {
      await remove({ data: { token: getToken(), id: row.id } });
      setRows((prev) => (prev ? prev.filter((r) => r.id !== row.id) : prev));
    } catch (e) {
      alert(`Delete failed: ${errMsg(e)}`);
    }
  };

  if (error) {
    return (
      <Shell>
        <div className="max-w-md mx-auto border border-black/30 p-5 space-y-3">
          <h2 className="text-lg font-medium">Couldn't reach the admin gate</h2>
          <p className="text-sm text-black/70 break-words">{error}</p>
          <button
            onClick={() => {
              clearToken();
              setNonce((n) => n + 1);
            }}
            className="bg-black text-white px-4 py-2 text-sm"
          >
            Retry
          </button>
        </div>
      </Shell>
    );
  }

  if (unlocked === null) {
    return (
      <Shell>
        <div className="max-w-md mx-auto space-y-3">
          <div className="h-6 w-1/3 bg-black/10 animate-pulse" />
          <div className="h-4 w-2/3 bg-black/10 animate-pulse" />
        </div>
      </Shell>
    );
  }

  if (!unlocked) {
    return (
      <Shell>
        <form
          className="max-w-sm mx-auto space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const pw = String(fd.get("password") ?? "");
            try {
              const r = await login({ data: { password: pw } });
              if (r.ok) {
                setToken(r.token);
                setNonce((n) => n + 1);
              } else {
                setError("Incorrect password.");
              }
            } catch (err) {
              setError(errMsg(err));
            }
          }}
        >
          <h1 className="text-2xl font-serif">Submissions Admin</h1>
          <input
            name="password"
            type="password"
            placeholder="Admin password"
            className="w-full border border-black/40 bg-transparent px-3 py-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-black text-white px-4 py-2"
          >
            Enter
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif">Submissions</h1>
            <p className="text-sm text-black/60 mt-1">
              {rows ? `${rows.length} results in the gallery.` : "loading…"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/references"
              className="text-sm underline underline-offset-4"
            >
              References
            </a>
            <button
              onClick={() => setNonce((n) => n + 1)}
              className="text-sm underline underline-offset-4"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clearToken();
                setNonce((n) => n + 1);
              }}
              className="text-sm underline underline-offset-4"
            >
              Sign out
            </button>
          </div>
        </header>

        {rows === null && (
          <div className="space-y-2">
            <div className="h-16 bg-black/5 animate-pulse" />
            <div className="h-16 bg-black/5 animate-pulse" />
          </div>
        )}

        {rows && rows.length === 0 && (
          <p className="text-sm text-black/60">No submissions yet.</p>
        )}

        <ul className="space-y-3">
          {rows?.map((r) => (
            <li
              key={r.id}
              className="border border-black/20 p-4 flex flex-col gap-3 md:flex-row md:items-start"
            >
              <div
                className="shrink-0"
                style={{
                  width: 72,
                  height: 72,
                  backgroundColor: r.hex,
                  border: r.hex.toUpperCase() === "#FFFFFF" ? "1px solid #d8d6d1" : "none",
                }}
                aria-hidden
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-medium">{r.shade_name}</span>
                  <span className="text-xs font-mono opacity-60">{r.hex}</span>
                  <span className="text-xs font-mono opacity-60">B={r.b_value}</span>
                  <span className="text-xs opacity-60">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  <span className="text-xs font-mono opacity-40">
                    #{r.id.slice(0, 8)}
                  </span>
                </div>
                {r.free_text && (
                  <p className="text-sm italic text-black/70 break-words">
                    “{r.free_text}”
                  </p>
                )}
                <p className="text-sm text-black/80 whitespace-pre-line break-words">
                  {r.analysis}
                </p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => onDelete(r)}
                  className="text-xs underline text-red-700"
                >
                  Take down
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
