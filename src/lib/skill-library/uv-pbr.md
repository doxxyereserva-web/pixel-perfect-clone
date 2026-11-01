# UV unwrapping and photographic PBR materials

## Trigger and inputs
Use for UV repair, material authoring, texture baking, texel-density planning and SurfaceAppearance setup on Roblox MeshParts. Collect target resolution, intended viewing distance, material scale, asset license and whether the material needs alpha. Inspect actual available texture maps rather than guessing filenames.

## Licensed reference workflow
Use the linked Poly Haven assets as CC0 photographic material references. Keep each asset's source URL, creator and license in the handoff even though attribution is optional. These diffuse textures are processed real-surface images, not object photographs and not complete PBR sets. Retrieve matching roughness and OpenGL normal maps from each official asset page when required. Do not invent roughness or metalness measurements from diffuse colors alone.

## UV workflow
1. Stabilize geometry on an export copy and apply relevant transforms. Mark seams on hidden areas, sharp material boundaries and natural construction joins.
2. Unwrap the relevant faces. Re-running Unwrap overwrites their selected UV coordinates; protect deliberate existing islands first.
3. Apply a checker and inspect distortion, unexpected mirrored text, and grain direction. Match texel density across comparable parts, allocating more area to genuinely prominent surfaces.
4. Pack with padding suitable for the intended resolution and mipmaps. Inspect the smallest mip levels and seam bleed; a visually empty gap at full resolution does not guarantee separation at lower resolution.
5. Overlap islands only when intentionally sharing material detail. Separate UVs when unique baking or directional wear requires it. Explain any mirrored tangent-space normal consequences.

## PBR workflow
1. In Blender, treat base color as color data. Set roughness, metalness and normal textures to Non-Color. Pass tangent-space normal images through a Normal Map node, not directly into the shader normal input.
2. Match physical surface scale with the asset dimensions. Timber grain should not appear as huge stripes on a small crate, nor concrete aggregate as meter-sized stones.
3. Choose the OpenGL-style normal variant for Roblox. Poly Haven may offer both nor_gl and nor_dx; the variants are not interchangeable without convention conversion.
4. Build the supported SurfaceAppearance maps on the MeshPart using approved uploaded texture IDs. A displacement image does not automatically become actual geometry or Roblox normal shading.
5. If using an ARM packed image, extract the intended channels before assigning separate roughness/metalness maps. Check the actual packing convention from its source; do not guess that all vendors use the same arrangement.
6. Distinguish exposed metal from rust or dirt coverage: oxidized regions are not automatically fully metallic. Preserve material contrast primarily through roughness and normal structure rather than painting baked illumination into base color.
7. Test neutral daylight, warm/cool environments and low/high quality. Normal maps change shading, not silhouette or collision.

## Bake and export checks
For a high-to-low bake, check matching UVs, cage/ray distances, triangulation and tangent basis. Run a small diagnostic bake first. Inspect seams, skewing and projection from nearby unrelated geometry. Preserve source maps and a channel manifest. Do not rename a DirectX map to OpenGL without converting the actual convention.

## Deliverables and acceptance
Provide UV layout, map manifest with color-space/channel assignments, licensing record and SurfaceAppearance configuration. Include checker, neutral-light and gameplay-distance comparisons when real tools are available. Verify final resolution, island padding, grain orientation and missing-map fallback. If uploads/Studio access are unavailable, explicitly mark actual texture upload and render verification pending.

## Official references
- Blender UV tools: https://docs.blender.org/manual/en/latest/modeling/meshes/editing/uv.html
- Roblox PBR: https://create.roblox.com/docs/art/modeling/surface-appearance
- Poly Haven CC0 license: https://polyhaven.com/license