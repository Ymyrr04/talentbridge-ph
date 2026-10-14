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

## Architecture rules
- Role gating: role dashboards use `ssr: false` + `beforeLoad: requireRole(role)` from `src/lib/auth.ts` — session lives in browser storage, and one helper keeps redirect rules consistent.
- Roles live only in `public.user_roles` (one row per user, no client write grants); assigned by the `handle_new_user` signup trigger from metadata limited to applicant/client — admin is set manually in the database.
- Route files never use a `.client.` / `.server.` filename segment (e.g. use `signup/client.tsx`, not `signup.client.tsx`) — the bundler treats those as environment-only modules and breaks SSR.
