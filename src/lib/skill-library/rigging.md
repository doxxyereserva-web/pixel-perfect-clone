# Blender rigging and Roblox animation handoff

## Trigger and inputs
Use for skinned creatures, mechanical characters, bone-weight problems, animation baking and Blender-to-Roblox rig export. Collect target rig type, required clips, root-motion policy, scale, existing skeleton and whether this is an avatar asset or an in-experience creature. Do not silently replace an established hierarchy.

## Rig workflow
1. Preserve the source file and inspect the rest pose. Record root, bone names, parent relationships and intended joint pivots. Resolve scale and orientation before skinning rather than compensating with animation transforms.
2. Create a clean deformation skeleton separate from optional control bones. For a mechanical assembly, assign rigid panels deliberately to their controlling bone instead of allowing unintended rubbery blending.
3. Parent using automatic weights as an initial pass only, or start with empty groups for precise assignment. Automatic weights use a bone-heat calculation and can fail near overlapping or disconnected parts.
4. Inspect vertex groups and pose extreme bends immediately. Fix wrong influences, normalize weights and remove unintended influences according to the target importer's current requirements. Do not assume a generic engine influence limit applies to every Roblox asset category.
5. Verify elbows, knees, shoulders and attachments. A pretty rest pose does not validate deformation. Include asymmetric poses to expose mirrored weighting problems.
6. Keep control-rig constraints in the editable master. Before export, bake evaluated motion to the deformation skeleton on a copy when IK, drivers or non-portable constraints are used. Check the baked clip with controls disabled.

## Animation workflow
1. Define clip names, frame ranges, frame rate, looping intent and marker conventions. Work from the project's actual playback system.
2. Block readable key poses before adding easing and overlap. For locomotion, establish whether the root moves in the clip or gameplay code controls travel.
3. Check contact and planted feet. Compare the first/last frames for a loop and review joint motion between keys rather than only at keyframes.
4. Export a short diagnostic clip first. Verify hierarchy, scale and deformation after Roblox import before producing an entire animation set.
5. Use the current asset-specific animation export settings; do not reuse static-prop Bake Animation settings. Disable additional leaf bones when following Roblox's documented Blender FBX route.

## Failure diagnosis
- Mesh does not move: inspect armature modifier target, vertex-group names and bone deformation flags.
- Nearby panel bends: inspect unwanted shared weights before moving the bone pivot.
- Blender works but import fails: compare the baked deformation skeleton and exported selection against the source controls; control constraints are not portable animation data.
- Loop pops: inspect root transform and seam pose continuity, then review interpolation.
- Scale changes: reproduce with a simple dimensioned skeleton and one clip before changing every animation.

## Deliverables and validation
Provide editable rig, exported deformation skeleton, clip manifest, marker list and diagnostic poses when Blender/Studio access exists. Record import results and playback behavior explicitly. Test an extreme pose, loop seam, clip transition and attachment behavior. If only scripts can be supplied, label them as scripts: do not claim a tested .blend, uploaded animation ID or playback video exists.

## Official references
- Blender armature parenting: https://docs.blender.org/manual/en/latest/animation/armatures/skinning/parenting.html
- Blender FBX: https://docs.blender.org/manual/en/latest/files/import_export/fbx.html
- Roblox export requirements: https://create.roblox.com/docs/art/modeling/export-requirements