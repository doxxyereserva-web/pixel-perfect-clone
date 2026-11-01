import particles from './skill-library/particle-impact.md?raw';
import ribbons from './skill-library/beams-trails.md?raw';
import modeling from './skill-library/hard-surface.md?raw';
import materials from './skill-library/uv-pbr.md?raw';
import rigging from './skill-library/rigging.md?raw';
import optimization from './skill-library/optimization.md?raw';
import wood from '@/assets/skill-references/brown_planks_03.jpg.asset.json';
import concrete from '@/assets/skill-references/concrete_floor_01.jpg.asset.json';
import metal from '@/assets/skill-references/rusty_metal_02.jpg.asset.json';
import { targetLabel, type SkillTarget } from './ai-models';
import type { SkillLike } from './skills';

export const skillCategories = ['All', 'VFX', '3D modeling', 'Materials', 'Animation', 'Optimization'] as const;
export type SkillCategory = typeof skillCategories[number];
export type VisualReference = { title: string; url: string; image: string; credit: string };
export const visualReferences: VisualReference[] = [
  { title: 'Brown Planks 03', url: 'https://polyhaven.com/a/brown_planks_03', image: wood.url, credit: 'Rob Tuytel / Poly Haven · CC0' },
  { title: 'Concrete Floor 01', url: 'https://polyhaven.com/a/concrete_floor_01', image: concrete.url, credit: 'Rob Tuytel / Poly Haven · CC0' },
  { title: 'Rusty Metal 02', url: 'https://polyhaven.com/a/rusty_metal_02', image: metal.url, credit: 'Rob Tuytel / Poly Haven · CC0' },
];
export type LibrarySkill = { id: string; title: string; description: string; category: SkillCategory; content: string; sources: { title: string; url: string }[]; references: VisualReference[] };
const roblox = (title: string, path: string) => ({ title, url: `https://create.roblox.com/docs/${path}` });
const blender = (title: string, path: string) => ({ title, url: `https://docs.blender.org/manual/en/latest/${path}.html` });

export const readySkills: LibrarySkill[] = [
  { id: 'roblox-particle-impact', title: 'Particle impacts', category: 'VFX', description: 'Use when building or debugging hit sparks, explosions, smoke and magic bursts with Roblox ParticleEmitter. Includes layer timing, local rendering, cleanup and performance checks.', content: particles, sources: [roblox('Particle emitters', 'effects/particle-emitters'), roblox('Performance', 'performance-optimization/improve')], references: [] },
  { id: 'roblox-beams-trails', title: 'Beams & combat trails', category: 'VFX', description: 'Use for laser tethers, curved beams, sword slashes and movement ribbons in Roblox. Covers attachment geometry, animation windows, interrupted effects and trail resets.', content: ribbons, sources: [roblox('Beams', 'effects/beams'), roblox('Trails', 'effects/trails')], references: [] },
  { id: 'blender-hard-surface-props', title: 'Hard-surface props', category: '3D modeling', description: 'Use when modeling crates, machinery, weapons and modular rigid props in Blender for Roblox. Covers reference interpretation, bevels, topology, UVs, scale and export checks.', content: modeling, sources: [blender('Bevel modifier', 'modeling/modifiers/generate/bevel'), roblox('Blender workflow', 'art/blender'), roblox('Export requirements', 'art/modeling/export-requirements')], references: [visualReferences[0], visualReferences[2]].filter((r): r is VisualReference => !!r) },
  { id: 'uv-photographic-pbr', title: 'UV & photographic PBR', category: 'Materials', description: 'Use for UV repair, baking and SurfaceAppearance materials. Includes texel density, real CC0 surface references, color spaces, OpenGL normal maps and channel validation.', content: materials, sources: [blender('UV tools', 'modeling/meshes/editing/uv'), roblox('Surface appearance', 'art/modeling/surface-appearance'), { title: 'CC0 license', url: 'https://polyhaven.com/license' }], references: visualReferences },
  { id: 'blender-rig-animation', title: 'Rigging & animation', category: 'Animation', description: 'Use for creature or mechanical rigs, weight correction, looping clips and Blender-to-Roblox animation export. Includes deformation tests, control-rig baking and diagnostic imports.', content: rigging, sources: [blender('Armature parenting', 'animation/armatures/skinning/parenting'), blender('FBX export', 'files/import_export/fbx'), roblox('Export requirements', 'art/modeling/export-requirements')], references: [] },
  { id: 'roblox-asset-export-audit', title: 'Optimization & export', category: 'Optimization', description: 'Use when auditing Roblox assets or diagnosing Blender import issues and slow scenes. Covers final geometry, textures, transparency, collision, export round trips and evidence-based profiling.', content: optimization, sources: [roblox('Performance', 'performance-optimization/improve'), roblox('Export requirements', 'art/modeling/export-requirements'), blender('FBX export', 'files/import_export/fbx')], references: [] },
];

/** Each generated edition remains locked to the selected tool and model family. */
export function librarySkillForTarget(skill: LibrarySkill, target: SkillTarget): SkillLike {
  const referenceText = skill.references.length ? `\n\n## Photographic material references\nThese are real-surface diffuse references, not finished props or VFX sprites.\n${skill.references.map(r => `- [${r.title}](${r.url}) — ${r.credit}\n  ![${r.title}, photographic material reference](${r.image})`).join('\n')}\n` : '';
  return {
    name: skill.id, target, description: skill.description,
    content: `# ${targetLabel(target)} edition\n\nUse these instructions only in ${targetLabel(target)} with its matching model family. Inspect the current project's purpose, guide, notes and available tools first. Adapt the workflow to existing conventions. A skill supplies instructions; it does not install Blender, Studio, plugins or tool access. Never claim a file, upload, render or test exists unless the connected tool actually produced it.\n\n${skill.content.trim()}${referenceText}\n\n## Source provenance\nOriginal Ágata instructions, informed by the official sources below. Not endorsed by Roblox, Blender or Poly Haven.\n${skill.sources.map(s => `- [${s.title}](${s.url})`).join('\n')}\n`,
  };
}

export function filterLibrarySkills(category: SkillCategory, query: string) {
  const q = query.trim().toLowerCase();
  return readySkills.filter(s => (category === 'All' || s.category === category) && (!q || `${s.title} ${s.description} ${s.category}`.toLowerCase().includes(q)));
}