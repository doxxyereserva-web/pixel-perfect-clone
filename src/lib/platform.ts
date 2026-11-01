import { BookOpen, Compass, Cpu, Download, Plug, Sparkles, Building2, FolderKanban, ShieldCheck, Users } from 'lucide-react';

/** The parts every Ágata project is organised into. Descriptions only — no content exists yet. */
export const projectModules = [
  { icon: Compass, title: 'Purpose', text: 'What the project is for, who it serves and the problem it solves inside Roblox Studio.' },
  { icon: BookOpen, title: 'Guide', text: 'Step-by-step setup and usage documentation, written alongside the project.' },
  { icon: Plug, title: 'MCP connection', text: 'Connect the project to your AI tools through the Model Context Protocol.' },
  { icon: Download, title: 'Skill download', text: 'Packaged skills you can install so assistants understand the project.' },
  { icon: Cpu, title: 'Available models', text: 'The AI models the project supports, listed with what each one is best at.' },
  { icon: Sparkles, title: 'Lovable API', text: 'Run the project’s AI features on Ágata’s own Lovable-powered API.' },
];

export const workspaceSpaces = [
  { icon: FolderKanban, title: 'Workspaces', text: 'A home for every studio or game, with its own projects and settings.' },
  { icon: Users, title: 'Teams', text: 'Invite collaborators and work on the same projects together.' },
  { icon: ShieldCheck, title: 'Roles', text: 'Decide who can view, edit or publish inside each workspace.' },
  { icon: Building2, title: 'Studios', text: 'Group several workspaces under one studio as you grow.' },
];
