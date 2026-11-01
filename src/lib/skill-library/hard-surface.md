# Blender hard-surface props for Roblox

## Trigger and required inputs
Use for crates, modular machinery, doors, weapons, furniture and other rigid game props. Collect a brief, reference views, target dimensions, camera distance, interaction/collision needs and material style. Identify the installed Blender version and the project's exporter before proposing version-specific bpy operators.

## Reference interpretation
Separate observation from assumption. Record visible silhouette, panel proportions, seams, handles, fasteners and wear distribution. Do not infer hidden dimensions from one perspective image as if they were measured. Use the supplied timber/metal photographic material references for surface scale and grain/corrosion direction only; they are not object blueprints.

## Modeling workflow
1. Establish units, origin and orientation. Create a dimensioned blockout and inspect it with a human/gameplay-scale proxy. Save the editable master before detailed operations.
2. Resolve silhouette first: overall volumes, feet, handles and doors. Separate moving pieces or parts that require distinct collision. Do not model every scratch into geometry.
3. Apply object scale on the working copy before judging bevel consistency. Keep bevels non-destructive during iteration. Select angle/weight controls deliberately so every edge is not equally rounded.
4. Start with few bevel segments. Inspect highlights at gameplay distance and in wireframe. Bevel Offset, Width, Depth and Percent modes represent different measurements; name the chosen mode in any script or handoff.
5. Remove internal surfaces that cannot be seen and do not support deformation or interaction. For boolean cuts, inspect narrow slivers, stretched faces and non-manifold boundaries. More subdivisions do not repair a broken cut.
6. Check face orientation and normal direction. Prefer clean planar surfaces and deliberate smoothing boundaries. Validate shading using a neutral material before relying on a texture to hide errors.
7. Mark UV seams on hidden or naturally separated boundaries. Preserve grain direction on timber panels and texture continuity on major visible surfaces. Use consistent density where comparable surfaces require comparable detail.
8. Prepare a distinct export copy, evaluate necessary modifiers and inspect final triangulation. Keep the editable source untriangulated where useful. Export a dimensioned test first, then the completed prop.

## Blender automation contract
If using bpy, operate on named assets, create a dedicated collection and preserve existing scene objects. Avoid context-sensitive operators when the data API suffices. Explicitly set mode, selection and active object when operators are required. Save a new file rather than overwriting a source without permission. Do not claim a .blend exists until a Blender process or connected tool actually writes it.

## Roblox handoff
Document dimensions, pivot, material map names and intended collision shape. Follow the current Roblox export requirements for the specific asset category. A static crate, skinned character and avatar accessory do not share one universal preset or budget. For static FBX exports disable unnecessary animation baking and leaf bones according to the documented route. Verify scale and forward orientation after import rather than assuming exporter axes succeeded.

## Acceptance
- Recognizable silhouette at intended distance; no invisible high-density bevels.
- Correct dimensions and pivot after Studio import.
- No inverted faces, accidental holes or shading artifacts.
- Checker texture shows intended density and seam placement.
- Collision supports gameplay without copying every render detail.
- Provide editable source, export copy, preview views and a measured triangle/material inventory when tools are available; otherwise label generated scripts and instructions accurately.

## Official references
- Blender bevel modifier: https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/bevel.html
- Blender UV tools: https://docs.blender.org/manual/en/latest/modeling/meshes/editing/uv.html
- Roblox Blender workflow: https://create.roblox.com/docs/art/blender
- Export requirements: https://create.roblox.com/docs/art/modeling/export-requirements