# Growth Lab — Round of fixes

Eight changes across navigation, Hub, Settings, Dashboard, and a real email invite flow.

## 1. Multi-language (VI / EN / ZH)

- Add a tiny i18n layer in `src/lib/i18n.ts`:
  - `useLanguage()` hook reading/writing `gl_lang` in localStorage (`vi` | `en` | `zh`), default `vi`.
  - `t(key)` function backed by a flat dictionary `{ vi: {...}, en: {...}, zh: {...} }`.
  - Broadcast change via `window.dispatchEvent` so all components re-render.
- Add `LanguageSwitcher.tsx` in the top-right of the `TopBar` (in `src/routes/__root.tsx`):
  - Shows current flag (🇻🇳 / 🇬🇧 / 🇨🇳) as a small button → dropdown with the 3 options.
- Translate all visible static strings on: Sidebar labels, TopBar tab labels, Dashboard, Settings tabs/labels, Hub, AI Writer headers, PageHeader copy.
  - Dynamic user content (ideas, plan rows, file names) stays as entered.

## 2. Hub: links, folders, rename, password gate

Rebuild `src/routes/hub.tsx` into a small file manager:

- **Folders**: virtual folders implemented as path prefixes inside the `hub` storage bucket (`folder/file.pdf`). Track current folder in component state with breadcrumb navigation. "New folder" creates a `.keep` placeholder so the prefix is listable.
- **Links**: new table `hub_links` (id, parent_path, title, url, created_at) with public RLS (matches existing pattern). UI shows links inline with files, with their own icon and "Open" button.
- **Rename**:
  - Files: `supabase.storage.from('hub').move(old, new)`.
  - Folders: list children, move each under new prefix.
  - Links: update row in `hub_links`.
- **Password gate**: when `hub.passwordEnabled` is on (settings), show an unlock screen first. Password compared against stored hash (SHA-256 via `crypto.subtle`) in `gl_settings_hub`. Unlock state kept in `sessionStorage` so it re-prompts each session.
- Keep existing preview dialog; preview also works for links via "Open in new tab".

## 3. Remove "Dashboard appearance" tab

- Drop the `appearance` tab + `AppearanceSection` from `src/routes/settings.tsx`.
- Keep `DashboardBackground` rendering with a sane neutral default (no UI to change it).

## 4. Dashboard: remove Focus Sound mini-player

- In `src/routes/index.tsx`, remove the `<FocusMiniPlayer />` card. Re-flow the top row to: DateTime + Quick Links (full-width or 2-col), removing the focus card entirely.
- The Focus Sound settings section in Settings stays (still controllable there).

## 5. Real email invites for Share workflow

- New edge function `supabase/functions/send-invite/index.ts`:
  - Input: `{ email, permission, inviter }`.
  - Uses Lovable's built-in email infrastructure (transactional) once the email domain is set up.
  - On the first call where no domain is configured, the agent surfaces the email setup dialog. After domain setup completes, scaffolds the transactional email infra + a `share-invite` template (subject: "{Inviter} invited you to Growth Lab"), then deploys.
- `ShareSection.send()` in `src/routes/settings.tsx`:
  - Inserts `shared_invites` row, then calls the send function.
  - Toast reflects email send result; failure does not roll back the invite row but is shown clearly.

> Requires the email domain dialog to be confirmed by you before invites actually deliver.

## 6. Hub password setting (toggle in Settings)

- New `useHubSettings()` in `src/lib/settings.ts` (key `gl_settings_hub`):
  - `{ passwordEnabled: boolean, passwordHash: string | null }`.
- New "Hub" tab in Settings:
  - Switch to enable/disable password.
  - When enabling, prompt for new password, store SHA-256 hash. When disabling, clear hash.
  - "Change password" button.

## 7. Remove "Data & preferences" tab

- Drop the `data` tab + `DataSection` from `src/routes/settings.tsx`. Remove the unused `useDataPrefs` import. Language is moved to the global switcher (item 1).

## 8. Dashboard greeting → "Hello {Name}"

- Update `DateTimeWidget.tsx`:
  - Greeting line becomes `Hello, {account.displayName}` (still localized via i18n: "Hello" / "Xin chào" / "你好").
  - Drop the time-of-day branch (or keep as a smaller secondary line — confirm if you want both).
- `displayName` is already editable in Settings → Account; that field drives this.

## Technical notes

- New table `hub_links` via migration with public RLS (consistent with `shared_invites`).
- New edge function `send-invite` (deployed automatically). Email sending via Lovable Cloud email infra; will trigger the email-domain setup dialog on the first run if not yet configured.
- No changes to auth model; everything stays single-user/local-first plus Cloud for invites/storage.
- Files touched/created:
  - new: `src/lib/i18n.ts`, `src/components/LanguageSwitcher.tsx`, `supabase/functions/send-invite/index.ts`, migration for `hub_links`.
  - edited: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/settings.tsx`, `src/routes/hub.tsx`, `src/components/DateTimeWidget.tsx`, `src/components/AppSidebar.tsx`, `src/lib/settings.ts`.
  - deleted: focus mini-player usage on Dashboard (file kept for future).

Approve this and I'll implement in one pass, then trigger the email-domain setup dialog if not already configured.
