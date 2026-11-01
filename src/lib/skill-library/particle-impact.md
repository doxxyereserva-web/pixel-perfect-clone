# Roblox particle impact design

## Trigger and required inputs
Use for hit sparks, explosions, dust puffs, magic bursts, muzzle flashes, smoke and ParticleEmitter debugging in Roblox Studio. Collect the effect's world scale, readable duration, gameplay camera distance, environment lighting and lowest supported device. Inspect the project's existing VFX module and approved texture IDs before adding another system. If inputs are missing, state provisional assumptions rather than inventing asset IDs.

## Workflow
1. Identify the gameplay event and its authoritative source. Keep damage, cooldowns and hit validation on the server; render cosmetic effects locally after a validated event. Do not trust a client-supplied hit as gameplay truth.
2. Break the effect into a timeline: anticipation if needed, a sharp contact flash, directional motion and a dissipating tail. Give each layer one job. A smoke emitter should not also be the bright spark layer.
3. Place an Attachment at the contact point, orient its emission axis to the surface normal and parent each ParticleEmitter to it. A BasePart parent emits across its bounding box or configured shape; use that deliberately for area effects, not accidentally for a precise impact.
4. For bursts, set Enabled to false and call Emit(count). For continuous exhaust, use Rate and switch Enabled off before cleanup. Build a small effect factory with explicit create, play and release lifecycle steps.
5. Tune lifetime, speed, spread and acceleration with a plain texture first. Build ColorSequence and NumberSequence curves for color, size and transparency. Ensure the final transparency key reaches invisible before particles disappear.
6. Add an approved transparent texture only after timing works. Validate alpha edges against both bright and dark backgrounds. Do not use a photographic concrete or metal diffuse map as a particle sprite; material references describe surfaces, not alpha masks.
7. Derive cleanup from the longest configured particle lifetime plus a small scheduling margin. Disable ongoing emission first. Reuse an existing pool when available; reset all modified properties on reuse. Avoid leaving attachments or event connections alive indefinitely.
8. Compare one effect with a crowded combat scene at representative low and high graphics settings. Reduce transparent screen coverage, lifetime and overlapping layers before compromising gameplay readability.

## Implementation contract
Return a Luau module integrated with the project's current conventions, an instance hierarchy and a parameter table. Parameters must include the accepted position/orientation representation, texture configuration, layer lifetimes and quality variants. Keep example texture slots explicit and unset when the project has not supplied a licensed ID.

Do not run a per-frame loop for a burst that ParticleEmitter already simulates. If attachment movement needs a frame connection, disconnect it when the effect completes. For distant effects use a deliberate simplified variant, not a single global particle setting that makes nearby impacts unreadable.

## Validation and acceptance
- Trigger repeatedly: no orphaned attachments, growing connection count or residual continuous emission.
- Check near/far views, bright/dark scenes and low/high graphics quality. Capture a before/after clip if an actual Studio tool is available.
- Test simultaneous bursts on the target device and measure frame time; particle count alone does not measure overdraw.
- Confirm server-authoritative gameplay remains unchanged.
- If Studio cannot be controlled from this agent session, provide exact reproduction steps and label playback/performance unverified. Never claim a visual effect has run merely because Luau was generated.

## Official references
- Roblox particle emitters: https://create.roblox.com/docs/effects/particle-emitters
- Roblox performance optimization: https://create.roblox.com/docs/performance-optimization/improve

Original Ágata workflow derived from the documentation above; not an official Roblox skill.