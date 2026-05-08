## Goals

Four related changes spanning Execute, a new Pipeline page, and the Plan table.

---

### 1. New Pipeline page (`/pipeline`)

Create `src/routes/pipeline.tsx` that reads `useContents()` and groups items by status: **idea → draft → scheduled → posted** (4 columns, kanban-style on desktop, stacked on tablet).

Each card shows:
- Title (bold)
- Platform · Format · Goal (small badges)
- Status badge (color-coded)
- Created date (formatted via current locale)
- **Edit** button → navigates to `/execute?id={content.id}`

Add the Pipeline link in two places:
- Sidebar (`AppSidebar.tsx`) — new item between Execute and AI Writer, icon `Workflow` or `Kanban`, dictionary key `nav.pipeline`
- Execute page header — secondary button "View Pipeline" next to Save, navigating to `/pipeline`

After saving in Execute, change the toast to "Saved to pipeline" with an **action button** that links to `/pipeline` so users can find it immediately.

---

### 2. Hashtag field in Execute

Add a `hashtag` text input below the caption textarea in `src/routes/execute.tsx`.
- Stored as new optional field `hashtags?: string` on `ContentItem` (in `src/lib/storage.ts`)
- Free-text (user types `#tag1 #tag2 ...`)
- Preserved across versions and shown on Pipeline cards

---

### 3. Share Setup between Execute and Plan

Today Execute uses hardcoded arrays (`platforms`, `formats`, `goals`, `statuses` in `execute.tsx`) while Plan uses `usePlannerConfig()` (editable in Plan → Thiết lập).

Refactor Execute's right-side **Setup** card to source dropdown options from `usePlannerConfig()`:
- Channel ← `config.platforms`
- Format ← `config.formats`
- Mục tiêu ← `config.goals`
- Trạng thái ← `config.statuses`

Implications:
- `ContentItem` typed fields become plain `string` (since planner config is user-editable text), keeping back-compat for existing localStorage records
- Defaults for new items use the first option from the planner config
- Editing options in Plan → Thiết lập now updates Execute dropdowns automatically

---

### 4. Trim Plan → Kế hoạch table

In `src/components/planner/PlanTable.tsx`, remove these columns from `buildCols`:
- `hashtag` (HASHTAG)
- `recordedAt` (NGÀY GHI LẠI)
- `body` (NỘI DUNG)

Make the **TIÊU ĐỀ / NỘI DUNG CHÍNH** cell clickable: opens a modal (shadcn `Dialog`) showing read-only `body` (plus title, hashtag, note). Modal also includes an **Edit** mode (textarea) so users can still update the body without it cluttering the table.

Data is preserved — only the column display is removed; `body`, `hashtag`, `recordedAt` remain in `PlannerRow` and the modal.

---

## Technical notes

- All storage stays in `localStorage` (no DB changes)
- `ContentItem.platform/format/goal/status` types loosened to `string` — adjust `Status` filter logic where used (`isPosted` style checks already string-compare)
- Pipeline page route registered automatically by TanStack Router file convention; no manual edits to `routeTree.gen.ts`
- i18n: add `nav.pipeline`, `pipeline.title`, `pipeline.eyebrow`, `pipeline.desc`, `pipeline.col.idea/draft/scheduled/posted`, `execute.hashtag`, `plan.row.read` keys to `src/lib/i18n.ts` (vi/en/zh)

## Files touched

- **new** `src/routes/pipeline.tsx`
- `src/routes/execute.tsx` — hashtag field, planner config dropdowns, Pipeline button, toast action
- `src/lib/storage.ts` — add `hashtags?: string`, loosen status/platform/format/goal types to `string`
- `src/components/planner/PlanTable.tsx` — drop 3 columns, add title-click reader modal
- `src/components/AppSidebar.tsx` — add Pipeline nav item
- `src/lib/i18n.ts` — new keys

No database migrations required.