import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";
import { skillFiles } from "@/lib/skills";

export const listSkills = defineTool({
  name: "list_skills",
  title: "List skills",
  description: "List a project's skills and the tool each one is built for (Claude Code, Codex or Gemini CLI).",
  inputSchema: { project_id: z.string().uuid() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("project_skills").select("id, name, description, target").eq("project_id", project_id).order("name");
    if (error) return fail(error.message);
    const skills = (data ?? []).map(s => ({ id: s.id, name: s.name, description: s.description, target: s.target }));
    return { ...text(JSON.stringify(skills, null, 2)), structuredContent: { skills } };
  },
});

export const getSkill = defineTool({
  name: "get_skill",
  title: "Get skill",
  description: "Get a skill's SKILL.md and the folder to install it in. Only install it into the tool it targets — it is not designed for other models.",
  inputSchema: { skill_id: z.string().uuid() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ skill_id }, ctx) => {
    const { data: s, error } = await supabaseForUser(ctx).from("project_skills").select("name, description, target, content").eq("id", skill_id).maybeSingle();
    if (error) return fail(error.message);
    if (!s) return fail("Skill not found.");
    const [file] = skillFiles(s);
    return { ...text(`Install at ${file!.path} (target: ${s.target})\n\n${file!.content}`), structuredContent: { target: s.target, path: file!.path, content: file!.content } };
  },
});
