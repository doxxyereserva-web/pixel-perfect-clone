import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";

const path = z.string().min(1).max(300).regex(/\.md$/i, "Note paths end in .md").refine(p => !p.includes("..") && !p.startsWith("/"), "Relative paths only")
  .describe("Vault-relative Markdown path, e.g. 'Systems/Combat.md'.");

export const listNotes = defineTool({
  name: "list_notes",
  title: "List vault notes",
  description: "List the Obsidian-style Markdown notes in a project's vault.",
  inputSchema: { project_id: z.string().uuid() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("project_notes").select("path, updated_at").eq("project_id", project_id).order("path").limit(1000);
    if (error) return fail(error.message);
    const notes = (data ?? []).map(n => ({ path: n.path, updated_at: n.updated_at }));
    return { ...text(notes.map(n => n.path).join("\n") || "(empty vault)"), structuredContent: { notes } };
  },
});

export const readNote = defineTool({
  name: "read_note",
  title: "Read note",
  description: "Read a Markdown note from a project's vault.",
  inputSchema: { project_id: z.string().uuid(), path },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ project_id, path }, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("project_notes").select("content").eq("project_id", project_id).eq("path", path).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("Note not found.");
    return text(data.content);
  },
});

export const writeNote = defineTool({
  name: "write_note",
  title: "Write note",
  description: "Create or replace a Markdown note in a project's vault. [[wikilinks]] are kept as-is.",
  inputSchema: { project_id: z.string().uuid(), path, content: z.string().max(200000) },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, path, content }, ctx) => {
    const { error } = await supabaseForUser(ctx).from("project_notes")
      .upsert({ project_id, path, content, updated_by: ctx.getUserId() ?? null }, { onConflict: "project_id,path" });
    if (error) return fail(error.message);
    return text(`Saved ${path}.`);
  },
});

export const deleteNote = defineTool({
  name: "delete_note",
  title: "Delete note",
  description: "Delete a Markdown note from a project's vault.",
  inputSchema: { project_id: z.string().uuid(), path },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, path }, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("project_notes").delete().eq("project_id", project_id).eq("path", path).select("id");
    if (error) return fail(error.message);
    if (!data?.length) return fail("Note not found or you can't delete it.");
    return text(`Deleted ${path}.`);
  },
});
