# Roblox beams, trails and combat ribbons

## Trigger and inputs
Use for laser tethers, lightning arcs, grappling ropes, healing connections, sword slashes and moving ribbon effects. Identify whether the shape connects current endpoints or records motion history. Collect duration, endpoint ownership, camera behavior, approved textures and interruption events such as character death or unequipping.

## Choose the right primitive
- Use a Beam for a persistent connection between Attachment0 and Attachment1. It renders current endpoints.
- Use a Trail for a ribbon left behind by two moving attachments. Their separation gives the initial ribbon width; Lifetime controls how long historical segments remain.
- Neither primitive is a damage volume. Keep gameplay collision and server hit validation separate.

## Beam workflow
1. Reuse or create two named attachments at the intended anchors. Define which objects own them and what happens if either object disappears.
2. Set Attachment0/Attachment1 explicitly; tune Width0/Width1 at gameplay distance. Configure color and transparency sequences before adding a texture.
3. For a curved tether, orient attachments intentionally. Beam curves use cubic Bézier control geometry: CurveSize0/CurveSize1 depend on attachment axes, not just world positions.
4. Start with a modest Segments value and raise it only when the curve visibly facets. Use FaceCamera only when a camera-facing ribbon matches the intended art direction.
5. Configure texture speed/length/mode from the current Beam API. Verify repetition while changing endpoint distance so the material does not stretch unexpectedly.
6. Disable and release the beam on disconnect, interruption and timeout. Destroy only the attachments owned by this effect, never a shared character attachment.

## Trail workflow
1. Put the two attachments across the blade or emitter width, not both at the same point. Confirm axes and separation in the rest pose.
2. Begin with Enabled false. Enable only during the actual attack window, using the project's animation markers or established event convention.
3. Choose a short Lifetime, then tune Transparency and WidthScale over the segment age. Faster motion leaves a longer streak at the same lifetime.
4. Disable on the end marker, cancellation, death and unequip. Call Clear when teleporting or resetting a pooled effect to prevent a ribbon connecting old and new positions.
5. Keep the historical fade if desired before destroying the container. Disconnect marker subscriptions at teardown.

## Common failures
- Invisible ribbon: inspect attachment assignments, separation, transparency, texture availability and camera orientation before increasing brightness.
- Wrong bend direction: inspect attachment axes and control-size signs.
- Giant streak after teleport: disable and clear history before moving the effect.
- Duplicated slash: confirm one connection per equipped item and one play event per attack.
- Client damage exploit: decorative beams/trails must not make authoritative damage decisions.

## Deliverables and validation
Deliver a configurable Luau effect module, anchor hierarchy, event wiring and interruption cleanup. Test slowly and at full animation speed, from several camera angles and with moving endpoints. Test a teleport, interrupted attack, destroyed anchor and repeated equip cycle. Profile the crowded case, especially transparent overlap. Report actual Studio playback separately from code inspection; if Studio is unavailable, leave playback unverified.

## Official references
- Beams: https://create.roblox.com/docs/effects/beams
- Trails: https://create.roblox.com/docs/effects/trails
- Performance: https://create.roblox.com/docs/performance-optimization/improve

Original Ágata workflow grounded in Roblox documentation; no third-party textures are bundled.