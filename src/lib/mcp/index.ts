import { auth, defineMcp } from "@lovable.dev/mcp-js";
import { getProject, listProjects, updateProject } from "./tools/projects";
import { deleteNote, listNotes, readNote, writeNote } from "./tools/notes";
import { getSkill, listSkills } from "./tools/skills";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "pixel-perfect-clone",
  title: "Pixel-Perfect Clone",
  version: "0.1.0",
  instructions:
    "Tools for Ágata, a home for Roblox Studio projects. List and read your projects, update their purpose and guide, read and write the project's Obsidian-style Markdown vault, and fetch skills. A skill only works with the tool it targets (Claude Code, Codex or Gemini CLI).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjects, getProject, updateProject, listNotes, readNote, writeNote, deleteNote, listSkills, getSkill],
});
