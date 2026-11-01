# Roblox asset optimization and export audit

## Trigger and inputs
Use before delivering Blender assets, when imported meshes look wrong, or when a Roblox scene loses performance. Collect target devices, viewing distances, current measured frame times, asset category, source/export formats and a representative crowded scene. Do not promise a universal triangle or draw-call budget without profiling context.

## Establish evidence
Export and import a simple dimensioned test object. Verify size, forward axis, origin and hierarchy in Studio. Record the source Blender version and actual exporter settings. Keep source and optimized/export files distinct. Compare the complete scene, not just a lone optimized prop.

## Geometry audit
1. Count final evaluated triangles rather than only edit-mode faces. Inspect modifiers, hidden duplicates and accidentally exported helper objects.
2. Remove unseen internal surfaces only when they are not needed for openings, animation or another camera angle. Retain silhouette detail that actually reads at gameplay distance.
3. Reduce tiny bevel/subdivision density and inspect shading after changes. Establish predictable triangulation on the export copy for baked normal consistency.
4. Reuse shared mesh assets where the production pipeline permits it. Do not assume every duplicated source object automatically becomes an efficient engine instance.
5. Separate collision from visual detail. Choose collision fidelity from gameplay requirements and the current MeshPart API; a dense rendered mesh is not automatically a good collision mesh.

## Material and VFX audit
1. Inventory material slots, texture resolutions and repeated unique images. Reduce waste based on on-screen size, not a fixed arbitrary resolution cap.
2. Share maps or atlas only when UV, filtering and material behavior remain correct. Test padding and mip bleed after atlas changes.
3. Inspect transparent screen coverage and stacked particles, beams and trails. Large blended layers can cost more than their particle count implies.
4. Remove unnecessary per-frame effect updates and unbounded event subscriptions. Check emitter lifetime and repeated pooling cycles for residue.

## Export round trip
1. Follow Roblox's requirements for the actual asset category. Avatar accessories, skinned characters and environment props are distinct pipelines.
2. For the documented Blender FBX route, use Apply Scalings: FBX Unit Scale and disable Add Leaf Bones. Disable Bake Animation for static assets; set up and validate baking deliberately for animation.
3. When embedding textures on that route, use Path Mode: Copy with Embed Textures as documented. Inspect imported material maps; success from the exporter alone is insufficient.
4. Verify the export's selection, normals, scale, hierarchy, pivot, materials and animation inside Studio. OpenGL normal maps must remain the intended variant.
5. Profile the representative scene on lower-end target hardware after import. Compare frame time and memory against the baseline. State measured values, test conditions and remaining bottlenecks.

## Report format
Return: asset/version and test setup; observed issue; measured baseline; changes; measured result; visual tradeoffs; remaining risks; exact reproduction and rollback steps. Separate verified results from estimates and recommended changes. Do not fabricate profiler numbers or claim collision/playback tests without actual engine access.

## Acceptance
- Round-trip scale, orientation and pivot match the source intent.
- No missing texture maps, unexpected bones or shading seams.
- Collision supports intended interactions.
- Crowded-scene measurement improves or exposes the true bottleneck without hiding visual regressions.
- Editable source and documented export settings remain available.

## Official references
- Roblox optimization: https://create.roblox.com/docs/performance-optimization/improve
- Roblox export requirements: https://create.roblox.com/docs/art/modeling/export-requirements
- Blender workflow: https://create.roblox.com/docs/art/blender
- Blender FBX: https://docs.blender.org/manual/en/latest/files/import_export/fbx.html