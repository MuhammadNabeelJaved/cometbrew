# Portfolio Project Tech Stack Logos — Design Spec
**Date:** 2026-07-01
**Feature:** Searchable tech-logo picker for portfolio project tech stacks
**Approach:** Structured `techStack` entries + static curated icon catalog (`react-icons/si`)

---

## Overview

The public single-project page (`/portfolio/:id`) has a "Powered By" section listing the technologies used to build the project, currently rendered as plain-text pills with one generic icon (`Code2` from lucide-react) for every entry. The admin currently enters tech stack as a single comma-separated text field (e.g. `"React 19 + TypeScript, Tailwind CSS 4, React Router 7, Framer Motion"`), with no per-technology logo.

This feature adds a searchable tech-logo picker to the admin Add/Edit Project modals, so each tech stack entry has its own name, optional version, and brand logo — shown on the public project page.

---

## Data Model

### `AdminProject.model.js` — `techStack` field change

Before:
```js
techStack: [{ type: String, trim: true, maxlength: 50 }]
```

After:
```js
techStack: [{
  name:    { type: String, required: true, trim: true, maxlength: 50 },   // e.g. "React"
  version: { type: String, trim: true, maxlength: 20 },                    // e.g. "19" (optional)
  icon:    { type: String, trim: true, default: 'generic' },               // catalog key, e.g. "react"
}]
```

`icon` stores a lookup key (not a react-icons class name) so the frontend catalog can change its icon library later without a data migration.

No other model or route changes are needed — `createProject`/`updateProject` already forward `techStack` as-is from the request body (fixed in a prior change), and Mongoose will validate against the new subdocument shape automatically.

---

## Frontend: Tech Catalog

**New file:** `client/src/lib/techCatalog.ts`

A static array of ~150–200 curated entries covering common web/mobile/cloud/AI technologies:

```ts
export interface TechCatalogEntry {
  key: string;       // stable id, e.g. "react"
  name: string;      // display label, e.g. "React"
  Icon: IconType;     // react-icons component
  aliases?: string[]; // e.g. ["reactjs"] for search matching
}

export const TECH_CATALOG: TechCatalogEntry[] = [ /* ... */ ];

export function searchTechCatalog(query: string): TechCatalogEntry[];
export function getTechByKey(key: string): TechCatalogEntry | undefined;
```

Built by expanding the existing `client/src/components/TechIcons.tsx` (28 logos today) with more entries from `react-icons/si` (Simple Icons) and `react-icons/fa`. `TechIcons.tsx` is kept as-is (still used by the homepage "Tech Arsenal" CMS section) — `techCatalog.ts` is a separate, purpose-built catalog for search/selection, importing icon components directly from `react-icons` rather than re-exporting through `TechIcons.tsx`.

A fallback `GenericTechIcon` (reuse the existing circular "i" icon from `TechIcons.tsx`'s `DefaultIcon`) is used when `icon` doesn't match any catalog entry (legacy/unmigrated data, or a technology not in the curated list).

---

## Frontend: `TechStackPicker` Component

**New file:** `client/src/components/TechStackPicker.tsx`

```ts
interface TechStackEntry { name: string; version?: string; icon: string; }

interface TechStackPickerProps {
  value: TechStackEntry[];
  onChange: (next: TechStackEntry[]) => void;
}
```

Behavior:
- Text input with a live dropdown of matching `TECH_CATALOG` entries (logo + name), filtered via `searchTechCatalog(query)` as the admin types.
- Clicking a result adds it as a chip: `[logo] Name [small version input] [× remove]`, and clears the search input.
- Version input is free text (not required), inline on the chip, updates that entry's `version` on blur/change.
- If the admin types a name with no catalog match, an "Add “X” without a logo" option appears at the bottom of the dropdown — adds the entry with `icon: 'generic'` so nothing is a dead end.
- No duplicate entries (same catalog `key` can't be added twice).

**Used in:** `client/src/pages/admin/Projects.tsx`, replacing the current single `Input` for Tech Stack in both the Add Project and Edit Project modal (same modal component serves both — see existing `editingId` branching), and in the read-only "View" modal (chips shown with logos, no edit controls).

### Changes to `Projects.tsx`
- `ProjectForm.techStack` type: `string` → `TechStackEntry[]`
- `emptyForm.techStack`: `''` → `[]`
- `formToPayload`: pass `form.techStack` straight through (already structured)
- `projectToForm`: `p.techStack || []` straight through (no `.join()`)
- Replace the Tech Stack `<Input>` JSX with `<TechStackPicker value={form.techStack} onChange={...} />`
- View modal: replace `<Badge>{t}</Badge>` text loop with logo-bearing chips (reuse a small presentational sub-component shared with the picker's chip rendering)
- List row preview (line ~438, `project.techStack.slice(0,3).join(', ')`) stays plain text — it's a compact table cell, logos aren't needed there

---

## Public Display: `ProjectDetail.tsx`

Current:
```ts
const techItems = (project.techStack || []).map((name: string) => ({ name }));
```

New:
```ts
const techItems = (project.techStack || []).map((t: any) => {
  // Backward-compat: tolerate any pre-migration plain-string entries
  if (typeof t === 'string') return { name: t, version: undefined, Icon: GenericTechIcon };
  const catalogEntry = getTechByKey(t.icon);
  return { name: t.name, version: t.version, Icon: catalogEntry?.Icon || GenericTechIcon };
});
```

Marquee pill rendering swaps `<Code2 className="w-5 h-5 text-primary" />` for `<Icon className="w-5 h-5" />`, and the label becomes `{tech.name}{tech.version ? ' ' + tech.version : ''}` (e.g. "React 19").

---

## Migration Script

**New file:** `server/src/scripts/migrateTechStack.js` (one-off, run manually via `node src/scripts/migrateTechStack.js`, not wired into app startup)

For every `AdminProject` document:
1. For each existing `techStack` string entry, split on `+`, `,`, `&` into candidate pieces.
2. For each piece, extract a trailing version number if present (regex, e.g. `"React 19"` → name `"React"`, version `"19"`).
3. Match the remaining name text (case-insensitive) against `TECH_CATALOG` names/aliases — duplicated as a small server-side lookup table (mirrors the frontend catalog's `name`/`aliases`/`key`, kept in sync manually since this script runs once).
4. On match: `{ name: catalogName, version, icon: catalogKey }`. On no match: `{ name: originalPieceText, version: undefined, icon: 'generic' }`.
5. Save the document with the new `techStack` array.
6. Log a per-project summary (original strings → converted entries) to stdout so results can be spot-checked; unmatched entries are called out explicitly in the log.

This script is run once against production after the model/frontend changes are deployed, then discarded (or kept in the repo for reference — not scheduled or repeated).

---

## Out of Scope

- Editing the ~28-entry `TechIcons.tsx` catalog used by the homepage "Tech Arsenal" CMS section (untouched).
- Uploading custom/arbitrary logos for technologies not in the curated catalog (falls back to the generic icon instead).
- Re-ordering tech stack entries via drag-and-drop (append/remove only, consistent with current comma-list behavior).
