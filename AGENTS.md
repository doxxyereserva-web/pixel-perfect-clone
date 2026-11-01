<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shared Ágata interactions live in a root-mounted experience provider so navigation, search, previews, and mascot assistance share state across preserved routes.
- No catalog or sample content is shown until real content exists; pages describe platform structure (projects, workspaces) only.
- UI copy is localised via the root LanguageProvider (src/lib/i18n.tsx), auto-detected from browser locale; add keys there for every language row.
- Use semantic mineral and hero-surface tokens in the global stylesheet for independently designed light and dark themes.
- Glass effects are implemented in CSS (the `liquid`/`liquid-hover` utilities in src/styles.css), not via expo-glass-effect, which renders a native iOS view and cannot run in this web app.
- Site-wide translation: src/lib/autoTranslate.ts translates rendered text/attributes via the translateBatch server fn (AI + shared ui_translations cache, plus localStorage); keyed strings in i18n.tsx stay for instant hero copy. Mark user content or brand text with translate="no". Why: hand-maintaining every string in 39 languages doesn't scale.
- Third-party secrets (own AI keys, external MCP tokens) are stored only AES-GCM encrypted via src/lib/crypto.server.ts (AGATA_ENCRYPTION_KEY); never store or return them in plain text. Why: rows are readable by their owner through the Data API.
- Ágata's own MCP server lives in src/lib/mcp (OAuth via managed auth, queries run as the caller under RLS); generated routes (src/routes/mcp.ts, [.well-known]) are never hand-edited. Why: the Vite plugin regenerates them.
- The public REST API (/api/public/v1, personal agt_ keys stored as SHA-256 hashes) uses the admin client only after verifying the key and must mirror project RLS rules in src/lib/public-api.server.ts. Why: there is no user JWT on that path.
- Model/skill compatibility rules live in src/lib/ai-models.ts and are enforced both in the UI and in server functions. Why: one source of truth for which model family a skill may run on.
- Obsidian live sync talks to the user's local Obsidian (Local REST API plugin) from the browser only; its key stays in localStorage. Why: the server cannot reach the user's machine.
- Ready-made creative skills use bundled original Markdown plus typed source/visual provenance, with per-tool editions copied into project_skills through the user's RLS client; why: shared templates stay available without mutating or seeding user projects.
- Asset catalogs preserve source licenses and serve imported originals through asset pointers; why: previews and downloads must correspond to real redistributable content, distinct from AI instruction skills.
- Creation uploads enter private quarantine and server inspection publishes only immutable snapshots; database triggers prevent self-verification and legacy/public storage reads remain restricted. Scripts and unsupported binary formats require independent review; why: static checks cannot guarantee absence of malware or backdoors.
