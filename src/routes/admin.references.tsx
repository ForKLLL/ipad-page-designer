import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  adminLogin,
  adminStatus,
  deleteReference,
  getReferenceContent,
  listReferences,
  toggleReference,
  uploadReference,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/references")({
  head: () => ({
    meta: [
      { title: "References — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminReferences,
});

type Doc = {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const TOKEN_KEY = "admin-token";
const MOUNT_TIMEOUT_MS = 15_000;

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

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const chunks: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str).join(" ");
    chunks.push(text);
  }
  return chunks.join("\n\n");
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2efee] flex items-center justify-center text-black p-6">
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Shell>
      <div className="w-full max-w-md space-y-3">
        <div className="h-6 w-1/3 bg-black/10 animate-pulse" />
        <div className="h-4 w-2/3 bg-black/10 animate-pulse" />
        <div className="h-4 w-1/2 bg-black/10 animate-pulse" />
      </div>
    </Shell>
  );
}

function ErrorCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Shell>
      <div className="w-full max-w-md border border-black/30 p-5 space-y-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-black/70 break-words">{message}</p>
        <button
          onClick={onRetry}
          className="bg-black text-white px-4 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    </Shell>
  );
}

function AdminReferences() {
  const status = useServerFn(adminStatus);
  const list = useServerFn(listReferences);
  const login = useServerFn(adminLogin);

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialDocs, setInitialDocs] = useState<Doc[] | null>(null);
  const [nonce, setNonce] = useState(0);

  const mount = useCallback(async () => {
    setError(null);
    setUnlocked(null);
    setInitialDocs(null);
    try {
      const token = getToken();
      const statusRes = await withTimeout(
        status({ data: { token } }),
        MOUNT_TIMEOUT_MS,
        "Admin gate",
      );
      const isUnlocked = statusRes.unlocked;
      setUnlocked(isUnlocked);
      if (isUnlocked) {
        const listRes = await withTimeout(
          list({ data: { token } }),
          MOUNT_TIMEOUT_MS,
          "Documents list",
        );
        setInitialDocs(listRes.documents as Doc[]);
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

  if (error) {
    return (
      <ErrorCard
        title="Couldn't reach the admin gate"
        message={error}
        onRetry={() => {
          clearToken();
          setNonce((n) => n + 1);
        }}
      />
    );
  }

  if (unlocked === null) {
    return <LoadingSkeleton />;
  }

  if (!unlocked) {
    return (
      <LoginForm
        onLogin={async (password) => {
          try {
            const r = await login({ data: { password } });
            if (r.ok) {
              setToken(r.token);
              setNonce((n) => n + 1);
              return { ok: true };
            }
            return { ok: false };
          } catch (e) {
            return { ok: false, message: errMsg(e) };
          }
        }}
      />
    );
  }

  return (
    <Manager
      initialDocs={initialDocs}
      onLogout={() => {
        clearToken();
        setNonce((n) => n + 1);
      }}
    />
  );
}

function LoginForm({
  onLogin,
}: {
  onLogin: (p: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen bg-[#f2efee] flex items-center justify-center text-black p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            const result = await onLogin(pw);
            if (!result.ok) {
              setErr(result.message ?? "Incorrect password.");
            }
          } catch (e) {
            setErr(errMsg(e));
          } finally {
            setBusy(false);
          }
        }}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-serif">Reference Admin</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Admin password"
          className="w-full border border-black/40 bg-transparent px-3 py-2"
          autoFocus
        />
        {err && <p className="text-sm text-red-700 break-words">{err}</p>}
        <button
          type="submit"
          disabled={busy || !pw}
          className="w-full bg-black text-white px-4 py-2 disabled:opacity-40"
        >
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

function Manager({
  initialDocs,
  onLogout,
}: {
  initialDocs: Doc[] | null;
  onLogout: () => void;
}) {
  const list = useServerFn(listReferences);
  const upload = useServerFn(uploadReference);
  const toggle = useServerFn(toggleReference);
  const remove = useServerFn(deleteReference);
  const fetchContent = useServerFn(getReferenceContent);

  const [docs, setDocs] = useState<Doc[] | null>(initialDocs);
  const [listError, setListError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string | "loading">>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setListError(null);
    try {
      const r = await withTimeout(
        list({ data: { token: getToken() } }),
        MOUNT_TIMEOUT_MS,
        "Documents list",
      );
      setDocs(r.documents as Doc[]);
      setPreviews({});
    } catch (e) {
      setListError(errMsg(e));
    }
  }, [list]);

  const loadPreview = async (id: string) => {
    if (previews[id] !== undefined) return;
    setPreviews((p) => ({ ...p, [id]: "loading" }));
    try {
      const r = await fetchContent({ data: { token: getToken(), id } });
      setPreviews((p) => ({ ...p, [id]: r.content }));
    } catch (e) {
      setPreviews((p) => ({ ...p, [id]: `Failed to load: ${errMsg(e)}` }));
    }
  };

  useEffect(() => {
    if (initialDocs === null) void refresh();
  }, [initialDocs, refresh]);

  const onFile = async (file: File) => {
    setStatus(`Reading ${file.name}…`);
    try {
      let text = "";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      setTitle((t) => t || file.name.replace(/\.[^.]+$/, ""));
      setContent(text.trim());
      setStatus(`Loaded ${text.length.toLocaleString()} chars from ${file.name}.`);
    } catch (e) {
      setStatus(`Failed to read ${file.name}: ${errMsg(e)}`);
    }
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setStatus("Saving…");
    try {
      await upload({
        data: {
          token: getToken(),
          title: title.trim(),
          content: content.trim(),
        },
      });
      setTitle("");
      setContent("");
      setStatus("Saved.");
      await refresh();
    } catch (e) {
      setStatus(`Save failed: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2efee] text-black p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif">Reference Documents</h1>
            <p className="text-sm text-black/60 mt-1">
              Active documents are injected into every analysis as grounding material.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/submissions"
              className="text-sm underline underline-offset-4"
            >
              Submissions
            </a>
            <button
              onClick={onLogout}
              className="text-sm underline underline-offset-4"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="border border-black/20 p-5 space-y-4">
          <h2 className="text-lg font-medium">Add a document</h2>
          <label className="block text-sm">
            <span className="block mb-1">Upload file (PDF, TXT, MD)</span>
            <input
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf,text/markdown"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
              className="block"
            />
          </label>
          <label className="block text-sm">
            <span className="block mb-1">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-black/40 bg-transparent px-3 py-2"
              placeholder="e.g. Curator statement"
            />
          </label>
          <label className="block text-sm">
            <span className="block mb-1">
              Content ({content.length.toLocaleString()} chars)
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full border border-black/40 bg-transparent px-3 py-2 font-mono text-xs"
              placeholder="Paste text or upload a file above."
            />
          </label>
          {status && <p className="text-xs text-black/70">{status}</p>}
          <button
            onClick={submit}
            disabled={busy || !title.trim() || !content.trim()}
            className="bg-black text-white px-5 py-2 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save document"}
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">
            Existing documents {docs ? `(${docs.length})` : ""}
          </h2>
          {listError && (
            <div className="border border-red-700/40 p-3 text-sm space-y-2">
              <p className="text-red-700 break-words">
                Couldn't load documents: {listError}
              </p>
              <button
                onClick={refresh}
                className="bg-black text-white px-3 py-1 text-xs"
              >
                Retry
              </button>
            </div>
          )}
          {docs === null && !listError && (
            <div className="space-y-2">
              <div className="h-16 bg-black/5 animate-pulse" />
              <div className="h-16 bg-black/5 animate-pulse" />
            </div>
          )}
          {docs && docs.length === 0 && !listError && (
            <p className="text-sm text-black/60">No documents yet.</p>
          )}
          <ul className="space-y-3">
            {docs?.map((d) => (
              <li
                key={d.id}
                className="border border-black/20 p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.title}</div>
                    <div className="text-xs text-black/60">
                      added {new Date(d.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={d.is_active}
                        onChange={async (e) => {
                          await toggle({
                            data: {
                              token: getToken(),
                              id: d.id,
                              is_active: e.target.checked,
                            },
                          });
                          await refresh();
                        }}
                      />
                      Active
                    </label>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${d.title}"?`)) return;
                        await remove({ data: { token: getToken(), id: d.id } });
                        await refresh();
                      }}
                      className="text-xs underline text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <details
                  className="text-xs text-black/70"
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open) loadPreview(d.id);
                  }}
                >
                  <summary className="cursor-pointer">Preview</summary>
                  <pre className="whitespace-pre-wrap font-mono mt-2 max-h-64 overflow-auto">
                    {previews[d.id] === undefined
                      ? ""
                      : previews[d.id] === "loading"
                        ? "Loading…"
                        : (previews[d.id] as string).slice(0, 2000) +
                          ((previews[d.id] as string).length > 2000 ? "\n…" : "")}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
