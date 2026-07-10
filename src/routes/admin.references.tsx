import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  adminLogin,
  adminLogout,
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

async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  // Use a fake worker in-thread to avoid worker setup
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

function AdminReferences() {
  const status = useServerFn(adminStatus);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    status().then((r) => setUnlocked(r.unlocked));
  }, [status]);

  if (unlocked === null) {
    return (
      <div className="min-h-screen bg-[#f2efee] flex items-center justify-center text-black">
        Loading…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <LoginForm
        onLogin={async (password) => {
          const r = await login({ data: { password } });
          if (r.ok) setUnlocked(true);
          return r.ok;
        }}
      />
    );
  }

  return (
    <Manager
      onLogout={async () => {
        await logout();
        setUnlocked(false);
      }}
    />
  );
}

function LoginForm({ onLogin }: { onLogin: (p: string) => Promise<boolean> }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen bg-[#f2efee] flex items-center justify-center text-black p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(false);
          const ok = await onLogin(pw);
          setBusy(false);
          if (!ok) setErr(true);
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
        {err && <p className="text-sm text-red-700">Incorrect password.</p>}
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

function Manager({ onLogout }: { onLogout: () => Promise<void> }) {
  const list = useServerFn(listReferences);
  const upload = useServerFn(uploadReference);
  const toggle = useServerFn(toggleReference);
  const remove = useServerFn(deleteReference);
  const fetchContent = useServerFn(getReferenceContent);

  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, string | "loading">>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const r = await list();
    setDocs(r.documents as Doc[]);
    setPreviews({});
  };

  const loadPreview = async (id: string) => {
    if (previews[id] !== undefined) return;
    setPreviews((p) => ({ ...p, [id]: "loading" }));
    try {
      const r = await fetchContent({ data: { id } });
      setPreviews((p) => ({ ...p, [id]: r.content }));
    } catch (e: any) {
      setPreviews((p) => ({ ...p, [id]: `Failed to load: ${e?.message ?? e}` }));
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch (e: any) {
      setStatus(`Failed to read ${file.name}: ${e?.message ?? e}`);
    }
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setStatus("Saving…");
    try {
      await upload({ data: { title: title.trim(), content: content.trim() } });
      setTitle("");
      setContent("");
      setStatus("Saved.");
      await refresh();
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? e}`);
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
          <button
            onClick={onLogout}
            className="text-sm underline underline-offset-4"
          >
            Sign out
          </button>
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
          {docs === null && <p className="text-sm">Loading…</p>}
          {docs && docs.length === 0 && (
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
                      {d.content.length.toLocaleString()} chars · added{" "}
                      {new Date(d.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={d.is_active}
                        onChange={async (e) => {
                          await toggle({
                            data: { id: d.id, is_active: e.target.checked },
                          });
                          await refresh();
                        }}
                      />
                      Active
                    </label>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${d.title}"?`)) return;
                        await remove({ data: { id: d.id } });
                        await refresh();
                      }}
                      className="text-xs underline text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <details className="text-xs text-black/70">
                  <summary className="cursor-pointer">Preview</summary>
                  <pre className="whitespace-pre-wrap font-mono mt-2 max-h-64 overflow-auto">
                    {d.content.slice(0, 2000)}
                    {d.content.length > 2000 ? "\n…" : ""}
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
