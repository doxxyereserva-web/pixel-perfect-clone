import asset0 from '@/assets/library/blaster-kit.zip.asset.json';
import asset1 from '@/assets/library/blaster-kit.png.asset.json';
import asset2 from '@/assets/library/car-kit.zip.asset.json';
import asset3 from '@/assets/library/car-kit.png.asset.json';
import asset4 from '@/assets/library/castle-kit.zip.asset.json';
import asset5 from '@/assets/library/castle-kit.png.asset.json';
import asset6 from '@/assets/library/space-kit.zip.asset.json';
import asset7 from '@/assets/library/space-kit.png.asset.json';
import asset8 from '@/assets/library/nature-kit.zip.asset.json';
import asset9 from '@/assets/library/nature-kit.png.asset.json';
import asset10 from '@/assets/library/survival-kit.zip.asset.json';
import asset11 from '@/assets/library/survival-kit.png.asset.json';
import asset12 from '@/assets/library/furniture-kit.zip.asset.json';
import asset13 from '@/assets/library/furniture-kit.png.asset.json';
import asset14 from '@/assets/library/pirate-kit.zip.asset.json';
import asset15 from '@/assets/library/pirate-kit.png.asset.json';
import asset16 from '@/assets/library/blaster-blaster-a.glb.asset.json';
import asset17 from '@/assets/library/blaster-blaster-a.png.asset.json';
import asset18 from '@/assets/library/blaster-blaster-b.glb.asset.json';
import asset19 from '@/assets/library/blaster-blaster-b.png.asset.json';
import asset20 from '@/assets/library/blaster-blaster-c.glb.asset.json';
import asset21 from '@/assets/library/blaster-blaster-c.png.asset.json';
import asset22 from '@/assets/library/blaster-blaster-d.glb.asset.json';
import asset23 from '@/assets/library/blaster-blaster-d.png.asset.json';
import asset24 from '@/assets/library/car-ambulance.glb.asset.json';
import asset25 from '@/assets/library/car-ambulance.png.asset.json';
import asset26 from '@/assets/library/car-box.glb.asset.json';
import asset27 from '@/assets/library/car-box.png.asset.json';
import asset28 from '@/assets/library/car-cone-flat.glb.asset.json';
import asset29 from '@/assets/library/car-cone-flat.png.asset.json';
import asset30 from '@/assets/library/car-cone.glb.asset.json';
import asset31 from '@/assets/library/car-cone.png.asset.json';
import asset32 from '@/assets/library/castle-bridge-draw.glb.asset.json';
import asset33 from '@/assets/library/castle-bridge-draw.png.asset.json';
import asset34 from '@/assets/library/castle-bridge-straight-pillar.glb.asset.json';
import asset35 from '@/assets/library/castle-bridge-straight-pillar.png.asset.json';
import asset36 from '@/assets/library/castle-bridge-straight.glb.asset.json';
import asset37 from '@/assets/library/castle-bridge-straight.png.asset.json';
import asset38 from '@/assets/library/castle-door.glb.asset.json';
import asset39 from '@/assets/library/castle-door.png.asset.json';
import asset40 from '@/assets/library/survival-barrel-open.glb.asset.json';
import asset41 from '@/assets/library/survival-barrel-open.png.asset.json';
import asset42 from '@/assets/library/survival-barrel.glb.asset.json';
import asset43 from '@/assets/library/survival-barrel.png.asset.json';
import asset44 from '@/assets/library/survival-bedroll-frame.glb.asset.json';
import asset45 from '@/assets/library/survival-bedroll-frame.png.asset.json';
import asset46 from '@/assets/library/survival-bedroll-packed.glb.asset.json';
import asset47 from '@/assets/library/survival-bedroll-packed.png.asset.json';
import asset48 from '@/assets/library/pirate-barrel.glb.asset.json';
import asset49 from '@/assets/library/pirate-barrel.png.asset.json';
import asset50 from '@/assets/library/pirate-boat-row-large.glb.asset.json';
import asset51 from '@/assets/library/pirate-boat-row-large.png.asset.json';
import asset52 from '@/assets/library/pirate-boat-row-small.glb.asset.json';
import asset53 from '@/assets/library/pirate-boat-row-small.png.asset.json';
import asset54 from '@/assets/library/pirate-bottle-large.glb.asset.json';
import asset55 from '@/assets/library/pirate-bottle-large.png.asset.json';
import asset56 from '@/assets/library/arc-slash.zip.asset.json';
import asset57 from '@/assets/library/slash.png.asset.json';
import asset58 from '@/assets/library/crimson-slash.zip.asset.json';
import asset59 from '@/assets/library/slash.png.asset.json';
import asset60 from '@/assets/library/cross-slash.zip.asset.json';
import asset61 from '@/assets/library/slash.png.asset.json';
import asset62 from '@/assets/library/portal-intro.zip.asset.json';
import asset63 from '@/assets/library/ring.png.asset.json';
import asset64 from '@/assets/library/spawn-intro.zip.asset.json';
import asset65 from '@/assets/library/spark.png.asset.json';
import asset66 from '@/assets/library/energy-intro.zip.asset.json';
import asset67 from '@/assets/library/spark.png.asset.json';
import asset68 from '@/assets/library/fire-explosion.zip.asset.json';
import asset69 from '@/assets/library/spark.png.asset.json';
import asset70 from '@/assets/library/smoke-explosion.zip.asset.json';
import asset71 from '@/assets/library/smoke.png.asset.json';
import asset72 from '@/assets/library/shockwave.zip.asset.json';
import asset73 from '@/assets/library/ring.png.asset.json';
import asset74 from '@/assets/library/muzzle-flash.zip.asset.json';
import asset75 from '@/assets/library/spark.png.asset.json';
import asset76 from '@/assets/library/bullet-impact.zip.asset.json';
import asset77 from '@/assets/library/spark.png.asset.json';
import asset78 from '@/assets/library/tracer-burst.zip.asset.json';
import asset79 from '@/assets/library/spark.png.asset.json';

export type LibraryAsset = { id: string; title: string; type: '3D packs' | '3D models' | 'VFX particles'; category: string; creator: string; license: string; source: string; image: string; download: string; format: string; count: number; notes: string; preset?: string };
export const libraryAssets: LibraryAsset[] = [
{id: "blaster-kit", title: "Blaster Kit", type: '3D packs', category: "Weapons", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/blaster-kit', image: asset1.url, download: asset0.url, format: 'GLB / FBX / OBJ', count: 40, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "car-kit", title: "Car Kit", type: '3D packs', category: "Vehicles", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/car-kit', image: asset3.url, download: asset2.url, format: 'GLB / FBX / OBJ', count: 50, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "castle-kit", title: "Castle Kit", type: '3D packs', category: "Architecture", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/castle-kit', image: asset5.url, download: asset4.url, format: 'GLB / FBX / OBJ', count: 76, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "space-kit", title: "Space Kit", type: '3D packs', category: "Sci-fi", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/space-kit', image: asset7.url, download: asset6.url, format: 'GLB / FBX / OBJ', count: 153, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "nature-kit", title: "Nature Kit", type: '3D packs', category: "Nature", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/nature-kit', image: asset9.url, download: asset8.url, format: 'GLB / FBX / OBJ', count: 329, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "survival-kit", title: "Survival Kit", type: '3D packs', category: "Props", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/survival-kit', image: asset11.url, download: asset10.url, format: 'GLB / FBX / OBJ', count: 80, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "furniture-kit", title: "Furniture Kit", type: '3D packs', category: "Interiors", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/furniture-kit', image: asset13.url, download: asset12.url, format: 'GLB / FBX / OBJ', count: 140, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "pirate-kit", title: "Pirate Kit", type: '3D packs', category: "Pirates", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/pirate-kit', image: asset15.url, download: asset14.url, format: 'GLB / FBX / OBJ', count: 72, notes: 'Visual source meshes. Import into Blender or Studio; configure materials, scale and collision. No gameplay scripts included.'},
{id: "blaster-blaster-a", title: "Blaster A", type: '3D models', category: "Weapons", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/blaster-kit', image: asset17.url, download: asset16.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "blaster-blaster-b", title: "Blaster B", type: '3D models', category: "Weapons", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/blaster-kit', image: asset19.url, download: asset18.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "blaster-blaster-c", title: "Blaster C", type: '3D models', category: "Weapons", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/blaster-kit', image: asset21.url, download: asset20.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "blaster-blaster-d", title: "Blaster D", type: '3D models', category: "Weapons", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/blaster-kit', image: asset23.url, download: asset22.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "car-ambulance", title: "Ambulance", type: '3D models', category: "Vehicles", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/car-kit', image: asset25.url, download: asset24.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "car-box", title: "Box", type: '3D models', category: "Vehicles", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/car-kit', image: asset27.url, download: asset26.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "car-cone-flat", title: "Cone Flat", type: '3D models', category: "Vehicles", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/car-kit', image: asset29.url, download: asset28.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "car-cone", title: "Cone", type: '3D models', category: "Vehicles", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/car-kit', image: asset31.url, download: asset30.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "castle-bridge-draw", title: "Bridge Draw", type: '3D models', category: "Architecture", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/castle-kit', image: asset33.url, download: asset32.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "castle-bridge-straight-pillar", title: "Bridge Straight Pillar", type: '3D models', category: "Architecture", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/castle-kit', image: asset35.url, download: asset34.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "castle-bridge-straight", title: "Bridge Straight", type: '3D models', category: "Architecture", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/castle-kit', image: asset37.url, download: asset36.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "castle-door", title: "Door", type: '3D models', category: "Architecture", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/castle-kit', image: asset39.url, download: asset38.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "survival-barrel-open", title: "Barrel Open", type: '3D models', category: "Props", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/survival-kit', image: asset41.url, download: asset40.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "survival-barrel", title: "Barrel", type: '3D models', category: "Props", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/survival-kit', image: asset43.url, download: asset42.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "survival-bedroll-frame", title: "Bedroll Frame", type: '3D models', category: "Props", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/survival-kit', image: asset45.url, download: asset44.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "survival-bedroll-packed", title: "Bedroll Packed", type: '3D models', category: "Props", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/survival-kit', image: asset47.url, download: asset46.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "pirate-barrel", title: "Barrel", type: '3D models', category: "Pirates", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/pirate-kit', image: asset49.url, download: asset48.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "pirate-boat-row-large", title: "Boat Row Large", type: '3D models', category: "Pirates", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/pirate-kit', image: asset51.url, download: asset50.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "pirate-boat-row-small", title: "Boat Row Small", type: '3D models', category: "Pirates", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/pirate-kit', image: asset53.url, download: asset52.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "pirate-bottle-large", title: "Bottle Large", type: '3D models', category: "Pirates", creator: 'Kenney', license: 'CC0', source: 'https://kenney.nl/assets/pirate-kit', image: asset55.url, download: asset54.url, format: 'GLB', count: 1, notes: 'Original CC0 mesh with embedded materials. Blender/Studio import required; not a scripted Roblox Tool.'},
{id: "arc-slash", title: "Arc slash", type: 'VFX particles', category: "Slash", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset57.url, download: asset56.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "arc-slash"},
{id: "crimson-slash", title: "Crimson slash", type: 'VFX particles', category: "Slash", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset59.url, download: asset58.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "crimson-slash"},
{id: "cross-slash", title: "Cross slash", type: 'VFX particles', category: "Slash", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset61.url, download: asset60.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "cross-slash"},
{id: "portal-intro", title: "Portal intro", type: 'VFX particles', category: "Intro", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset63.url, download: asset62.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "portal-intro"},
{id: "spawn-intro", title: "Spawn intro", type: 'VFX particles', category: "Intro", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset65.url, download: asset64.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "spawn-intro"},
{id: "energy-intro", title: "Energy intro", type: 'VFX particles', category: "Intro", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset67.url, download: asset66.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "energy-intro"},
{id: "fire-explosion", title: "Fire explosion", type: 'VFX particles', category: "Explosion", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset69.url, download: asset68.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "fire-explosion"},
{id: "smoke-explosion", title: "Smoke explosion", type: 'VFX particles', category: "Explosion", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset71.url, download: asset70.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "smoke-explosion"},
{id: "shockwave", title: "Shockwave", type: 'VFX particles', category: "Explosion", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset73.url, download: asset72.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "shockwave"},
{id: "muzzle-flash", title: "Muzzle flash", type: 'VFX particles', category: "Gunfire", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset75.url, download: asset74.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "muzzle-flash"},
{id: "bullet-impact", title: "Bullet impact", type: 'VFX particles', category: "Gunfire", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset77.url, download: asset76.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "bullet-impact"},
{id: "tracer-burst", title: "Tracer sparks", type: 'VFX particles', category: "Gunfire", creator: 'Ágata', license: 'MIT', source: 'https://create.roblox.com/docs/effects/particle-emitters', image: asset79.url, download: asset78.url, format: 'Luau + PNG', count: 1, notes: 'Original configurable particle preset, not Studio-playback verified. Upload included PNG to Roblox and supply its texture ID. Cosmetic only.', preset: "tracer-burst"}
];
