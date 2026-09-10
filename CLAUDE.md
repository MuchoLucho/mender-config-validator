# CLAUDE.md

Guidance for Claude Code (or any future contributor) working in this repo.

## What this is

A client-side Vue 3 + Vite app that validates Mender `mender.conf` and
`mender-connect.conf` files against a hand-maintained schema, with
plan-aware rules (Hosted Mender vs on-premises). No backend, no telemetry.
`npm run build` must always produce a single double-clickable
`dist/index.html` (via `vite-plugin-singlefile`) — don't introduce anything
that needs a server to *use* the built app (code-split dynamic imports,
external asset references, etc.). A dev server is fine for `npm run dev`.

## Keep these docs in sync

**This file and README.md must be updated in the same change** whenever you:
- Add/remove/rename a config key in `src/schema.js`.
- Add a new validation rule or format check in `src/validate.js`.
- Add or change plan-specific behavior in `src/plans.js`.
- Change the file/component layout.

Stale docs here are worse than no docs — update the relevant section
below rather than leaving it to rot.

## Schema sources (src/schema.js)

The `FIELDS` array was built from, and should be re-checked against, when
Mender ships config changes:
- https://docs.mender.io/client-installation/configuration
- https://docs.mender.io/client-installation/configuration/polling-intervals
- https://docs.mender.io/client-installation/configuration/configuration-options
- https://docs.mender.io/add-ons/mender-connect#configuration
- `examples/mender.conf.production` in github.com/mendersoftware/mender
- mender-connect's `config.go` (`Validate()` there defines mender-connect's
  actual constraints — e.g. `ShellCommand` must be in `/etc/shells`, `User`
  must be a real system user; **this validator can't check either of those
  from a browser** and deliberately doesn't try — they're documented in the
  field description only)

At the time this was written, `client_shared/conf.hpp` (the C++ client's
config struct) was not found at any predictable path in
github.com/mendersoftware/mender master — the docs pages + production
example + mender-connect source were used instead. If you're updating the
schema, try that source again in case the path resolved since.

## Limits (src/plans.js) — what's modeled and what's deliberately excluded

Source: https://docs.mender.io/overview/limits. Only limits that map to an
actual client config key are modeled. Everything else on that page is
enforced against server/account state that has no corresponding key in
`mender.conf` or `mender-connect.conf`, so there's nothing for a config
*file* validator to check:

| Limit on the docs page | Modeled here? | Why / why not |
|---|---|---|
| Update-check polling interval (micro: 604800s, standard: 1800s) | Yes | `UpdatePollIntervalSeconds`, Hosted-only floor, keyed off `Connectivity.DeviceTier` |
| Inventory polling interval (micro: 604800s, standard: 28800s) | Yes | `InventoryPollIntervalSeconds`, same mechanism |
| Max download retries (1–10000, default 10) | Yes | `RetryDownloadCount` — this one's enforced by the client itself, so it applies regardless of plan (not gated by `plans.js`) |
| TenantToken / multi-tenancy | Yes (indirectly) | Not a numeric limit on that page, but the page's Hosted/on-prem distinction is exactly why `TenantToken` is plan-gated in `schema.js`. Required (error if missing) for both Hosted and On-Prem Enterprise — both are multi-tenant — and rejected (error if set) for Open Source, which has no multi-tenancy at all. |
| Test device count/changes per day | No | Account-level, no client key |
| Artifact size (micro 5MiB / standard 10GiB) | No | Deployments-service limit on the Artifact itself, not a client config key |
| API payload size, single-file upload size | No | Server API limits |
| Device inventory data size, max tags per device | No | Server-side inventory service limit |
| String length limits (deployment/group/role/release names, emails, passwords, org names, Configure strings) | No | Server/DB field constraints, not client config |
| Max active deployments | No | Server-side deployments limit |
| Server-side delta max Artifact size | No | Deployments-service config, not client |
| Audit log retention | No | Server-side (Helm value), not client |
| RBAC max permission sets per role | No | Server-side RBAC limit |

`Connectivity.DeviceTier` has a third value, `system`, that the limits page
doesn't address separately from `standard` — it's treated the same as
`standard` in `HOSTED_POLLING_FLOORS.default`. Revisit if Mender's docs
ever call it out with its own floor.

## Code conventions

- `src/validate.js` is pure (no Vue, no DOM) and returns
  `{ isValidJson, isValid, parseError, parseErrorRange, errors, warnings }`.
  Each error/warning carries `{ path, message, hint, range, segs, actions }`:
  `range` is a character offset pair from `json-source-map` (used by
  `ConfigEditor.vue` for CodeMirror diagnostic positions); `segs` is the raw
  path array (strings and/or array indices); `actions` is computed in
  `finalize()` and is an array of zero or more of `{type:'insert', field}`,
  `{type:'reset', field}`, `{type:'remove'}` — whichever fixes are safe for
  that row (see `canResetField()` for what "safe" means and why
  `serverArray`/legacy `any` fields and mutual-exclusivity conflicts are
  excluded from "reset"). `DiagnosticsPanel.vue` just renders whatever
  `actions` it's given; `App.vue`'s `applyFix()` is the only place that
  interprets `action.type`. Keep `validate.js` side-effect-free so it can be
  called from both the editor's linter and the side panels without
  duplicating logic.
- There's deliberately no separate "keys with defaults" panel — `KeyBrowser`
  shows the default value inline for every field that has one (set or not),
  and `insertField`/the `insert`-type fix action always insert
  `defaultForType(f)`, so "insert" and "the default is already filled in"
  are the same code path, not two.
- `fieldsFor(file, plan)` in `schema.js`: omit `plan` to get the *full*
  schema for a file (used for structural checks like unknown-key
  detection, so a plan-restricted key like `TenantToken` is still
  recognized rather than flagged as unrecognized); pass `plan` to get only
  what should be surfaced/insertable in the UI for that deployment type.
- CodeMirror's `linter()` only reruns on document changes, not on
  arbitrary prop changes — `ConfigEditor.vue` watches the `plan` prop and
  calls `forceLinting(view)` manually when it changes, since switching
  plans can change diagnostics without touching the text.

## Theming (light/dark, Material look)

- `index.html` has an inline (non-module) script that sets
  `document.documentElement.dataset.theme` from `localStorage` or
  `prefers-color-scheme` *before* Vue mounts — this has to stay a plain
  synchronous `<script>` in the HTML, not something in `main.js`/`App.vue`,
  or there's a flash of the wrong theme on load. `App.vue` reads that
  attribute as its initial state and is the only place that writes it back
  (plus `localStorage`) afterwards, in a `watch`.
- All colors live in `src/style.css` as CSS custom properties scoped under
  `:root[data-theme='dark']` / `:root[data-theme='light']`. Never hardcode
  a color in a component — add/reuse a variable instead, or the light/dark
  toggle silently breaks for that element. `ConfigEditor.vue`'s CodeMirror
  theme is the one place colors are set from JS instead of CSS — it's
  rebuilt as a `computed` keyed on the `dark` prop specifically so
  CodeMirror's own base theme (selection, defaults) switches too, not just
  our custom rules; `vue-codemirror` watches the `extensions` prop and
  reconfigures the live editor, so this "just works" when the prop flips.
- **`--accent` vs `--accent-ink`**: `--accent` is the raw Northern.tech
  brand blue `#28AEE4` (confirmed from the fill color in the logo SVG at
  northern.tech — don't reuse a different blue without checking there
  first). Its contrast against a white surface is only ~2.5:1, well under
  the ~4.5:1 needed for body text, so it's fine for borders/focus
  rings/filled chip backgrounds but **not** for text. `--accent-ink` is a
  darkened tone (`#157fad` in light mode) used for anything textual —
  field paths, links, active-tab labels. In dark mode `--accent-ink` is
  just `--accent` again, since the raw blue already has ~7.6:1 contrast
  against the dark background. If you add a new use of the accent color,
  check whether it's text (`--accent-ink`) or decoration (`--accent`)
  before picking one.
- `--*-soft` background tints (`--accent-soft`, `--ok-soft`, `--warn-soft`,
  `--err-soft`) are computed once via `color-mix(in srgb, var(--X) 12-14%,
  var(--surface))` in the theme-agnostic part of `style.css` — they don't
  need their own per-theme values, since they resolve against whatever
  `--surface`/`--ok`/etc. are active. Follow this pattern for any new
  tinted-background color rather than hand-picking an rgba per theme.
- Global reusable classes (`.btn` — pill-shaped tonal button for the
  toolbar; `.chip` — smaller tonal button for inline insert/reset/remove
  actions; `.badge`, `.panel`) live in `style.css`, not per-component
  `<style scoped>` blocks, specifically so every button/badge/panel stays
  visually consistent without copy-pasted CSS. Reuse these before adding a
  new component-local button style.

## Responsive layout gotchas

- Tested down to a 390px-wide viewport. The recurring trap is CSS Grid's
  and Flexbox's default `min-width: auto` on children/items: an
  unbreakable long child (a long CodeMirror JSON line, a long field name
  like `UpdateControlMapBootExpirationTimeSeconds` next to its insert
  button) will force its container — and via that, the whole page — wider
  than the viewport, even though everything *looks* fine in a quick visual
  check. `main > * { min-width: 0; }` in `App.vue` and `min-width: 0` on
  `.editor-shell` in `ConfigEditor.vue` exist specifically to defeat this.
  If you add a new grid/flex layout and mobile testing shows horizontal
  scroll, check `min-width: auto` first — don't just add `overflow-x:
  hidden` and call it fixed, since that clips content instead of
  reflowing it.
- `KeyBrowser.vue` and `DiagnosticsPanel.vue` both use a `.row-head` flex
  row with `flex-wrap: wrap` so the insert/fix button drops to its own
  line when the path/message next to it is too long to share a row —
  don't remove that wrap, and don't go back to `float: right` for these
  buttons (it doesn't reflow sanely at narrow widths).
- Verify responsive/mobile changes with an actual narrow-viewport
  screenshot (Playwright at e.g. 390×844) and a
  `document.documentElement.scrollWidth > clientWidth` check — a
  desktop-only screenshot won't show this class of bug.
