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
