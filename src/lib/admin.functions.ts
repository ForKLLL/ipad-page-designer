import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  adminPasswordMatches,
  requireAdminToken,
  signAdminToken,
  verifyAdminToken,
} from "./admin.server";

const tokenField = z.object({ token: z.string().optional() });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ password: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD is not set");
    if (!adminPasswordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    return { ok: true as const, token: signAdminToken() };
  });

export const adminStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenField.parse(data ?? {}))
  .handler(async ({ data }) => {
    return { unlocked: verifyAdminToken(data.token) };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => ({ ok: true as const }),
);

export const listReferences = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenField.parse(data ?? {}))
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("reference_documents")
      .select("id, title, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { documents: rows ?? [] };
  });

export const getReferenceContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().optional(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("reference_documents")
      .select("content")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { content: row?.content ?? "" };
  });

export const uploadReference = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().optional(),
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(200_000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("reference_documents")
      .insert({ title: data.title, content: data.content, is_active: true });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const toggleReference = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().optional(),
        id: z.string().uuid(),
        is_active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("reference_documents")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteReference = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().optional(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("reference_documents")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listResults = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenField.parse(data ?? {}))
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("results")
      .select("id, created_at, b_value, shade_name, hex, analysis, free_text")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { results: rows ?? [] };
  });

export const deleteResult = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().optional(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("results")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
