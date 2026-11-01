import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";

export const listProjects = defineTool({
  name: "list_projects",
  title: "List projects",
  description: "List the Ágata projects you own or that belong to your workspaces.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db.from("projects").select("id, name, purpose, visibility, updated_at").order("updated_at", { ascending: false }).limit(100);
    if (error) return fail(error.message);
    const rows = (data ?? []).map(p => ({ id: p.id, name: p.name, purpose: p.purpose, visibility: p.visibility, updated_at: p.updated_at }));
    return { ...text(JSON.stringify(rows, null, 2)), structuredContent: { projects: rows } };
  },
});

export const getProject = defineTool({
  name: "get_project",
  title: "Get project",
  description: "Read one project's purpose, guide, MCP and skill links and listed models.",
  inputSchema: { project_id: z.string().uuid().describe("Project id from list_projects.") },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    const db = supabaseForUser(ctx);
    const { data: p, error } = await db.from("projects").select("id, name, purpose, guide, mcp_url, skill_url, models, uses_lovable_api, visibility").eq("id", project_id).maybeSingle();
    if (error) return fail(error.message);
    if (!p) return fail("Project not found or not accessible.");
    const project = { ...p, models: [...p.models] };
    return { ...text(JSON.stringify(project, null, 2)), structuredContent: { project } };
  },
});

export const updateProject = defineTool({
  name: "update_project",
  title: "Update project",
  description: "Update a project's purpose and/or guide. Only owners and workspace admins can edit.",
  inputSchema: {
    project_id: z.string().uuid(),
    purpose: z.string().max(600).optional().describe("New purpose text."),
    guide: z.string().max(20000).optional().describe("New guide (Markdown)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, purpose, guide }, ctx) => {
    if (purpose === undefined && guide === undefined) return fail("Nothing to update.");
    const db = supabaseForUser(ctx);
    const patch: { purpose?: string; guide?: string } = {};
    if (purpose !== undefined) patch.purpose = purpose;
    if (guide !== undefined) patch.guide = guide;
    const { data, error } = await db.from("projects").update(patch).eq("id", project_id).select("id");
    if (error) return fail(error.message);
    if (!data?.length) return fail("Project not found or you can't edit it.");
    return text("Project updated.");
  },
});
