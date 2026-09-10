# Mender Config Validator

A browser-based editor and validator for [Mender](https://mender.io) client
config files: `mender.conf` and `mender-connect.conf`. Runs entirely
client-side — nothing is uploaded anywhere.

**Live at: https://mucholucho.github.io/mender-config-validator/**

## Features

- **Live editing** of either config file in a JSON-aware code editor
  (CodeMirror 6), with per-line error/warning underlines and gutter markers,
  not just a side list.
- **Schema-based validation**: unknown keys (with "did you mean…"
  suggestions), wrong types, and format checks for URLs, absolute paths,
  PKCS#11 URIs, device paths, octal permission strings, and enums.
- **Contextual advice**, not just pass/fail — e.g. a raw IP address in
  `ServerURL` is technically valid but warns about TLS hostname
  verification and suggests an `/etc/hosts` entry.
- **Deployment-type aware**: a "Hosted Mender / On-Prem Enterprise / On-Prem
  Open Source" selector changes which keys apply and which limits are
  enforced (see [Plan-specific behavior](#plan-specific-behavior) below).
- **Key browser**: searchable list of every recognized key — description,
  type, required/deprecated/set status, and the default value the client
  uses if you leave it out. One-click insert adds the key with that
  default already filled in.
- **One-click fixes on errors/warnings**: depending on the problem, a
  diagnostic row gets an "insert default" (missing required key), "reset
  to default" (bad value, but a safe default exists), and/or "remove"
  button — so most problems are fixable without hand-editing the JSON.
- Upload an existing config file (auto-detects which one) and download your
  edits back out.
- **Material-inspired UI**, responsive down to phone widths, with a
  light/dark toggle (persisted, defaults to the OS preference). Accent
  color is Northern.tech's brand blue (`#28AEE4`, taken directly from
  their logo SVG).

## Getting started

```sh
npm install
npm run dev      # local dev server with hot reload
npm run build    # produces dist/index.html — a single self-contained file
```

`dist/index.html` has everything inlined (JS, CSS) and opens directly via
`file://` — no server needed to use the built app, only to develop it.

## Deployment

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub
Pages on every push to `main` (Pages is configured with source "GitHub
Actions" — no `gh-pages` branch involved). Since the build's `base` is
relative (`./`) and everything is inlined into one file anyway, the same
`dist/index.html` works unchanged whether it's opened from `file://`, a
project Pages subpath, or a custom domain at the root.

## Plan-specific behavior

Config keys and some validation rules depend on which Mender deployment
type you pick from the dropdown:

| | Hosted Mender | On-Prem Enterprise | On-Prem Open Source |
|---|---|---|---|
| `TenantToken` | required | required | invalid — error if set |
| Update/inventory polling floor | enforced (warns if you poll faster) | not enforced | not enforced |
| `ServerURL` domain sanity check | warns if it doesn't look like `*.mender.io` | not checked | not checked |

This is sourced from [docs.mender.io/overview/limits](https://docs.mender.io/overview/limits),
which documents more limits than are modeled here — see
[CLAUDE.md](./CLAUDE.md) for the full list and why most of them (device
counts, API payload sizes, RBAC/audit-log limits, etc.) don't apply to a
client config file and were left out.

## Project structure

```
index.html                    Vite entry point
src/
  main.js                     App bootstrap
  App.vue                     Top-level layout & state (active file, plan, theme, text buffers)
  schema.js                   FIELDS: the full mender.conf / mender-connect.conf key schema
  plans.js                    Deployment types + the Hosted-only limits that key off them
  validate.js                 Pure validation logic (JSON parse, type/format checks, plan rules)
  style.css                   Material-inspired theme tokens (light/dark CSS variables)
  components/
    FileTabs.vue               mender.conf / mender-connect.conf switcher
    PlanSelector.vue            Hosted / On-Prem Enterprise / On-Prem Open Source dropdown
    ThemeToggle.vue              Light/dark switch
    Toolbar.vue                 Upload / download / reset / status
    ConfigEditor.vue            CodeMirror wrapper (JSON + lint extension)
    DiagnosticsPanel.vue        Errors/warnings list, each with its fix-it action buttons
    KeyBrowser.vue              Searchable full key list, showing defaults, with insert
```

## Theming

Light/dark is a `data-theme` attribute on `<html>`, set by an inline
script in `index.html` *before* Vue mounts (reads `localStorage`, falls
back to `prefers-color-scheme`) so there's no flash of the wrong theme.
`ThemeToggle.vue` flips it and persists the choice; `App.vue` is the only
place that writes `data-theme`/`localStorage` afterwards. All colors are
CSS custom properties in `style.css`, scoped per-theme under
`:root[data-theme='dark']` / `:root[data-theme='light']` — components
never hardcode a color.

Two accent variables matter: `--accent` is the raw brand blue
(`#28AEE4`) for non-text uses (borders, focus rings, filled chips/badges);
`--accent-ink` is a darkened variant used wherever the accent is *text*
color, since the raw brand blue doesn't have enough contrast against a
white surface (see CLAUDE.md for the contrast math). Don't use `--accent`
for text — use `--accent-ink`.

The app is responsive down to phone widths (tested at 390px). If you add
a new panel/row layout, avoid `float`-based button placement (wrap
poorly) and watch out for CSS Grid/Flexbox's default `min-width: auto`,
which lets an unbreakable child (e.g. a long CodeMirror line or a long
field name) blow out the layout on narrow screens — see the `min-width:
0` comments in `App.vue` and `ConfigEditor.vue` if you hit this again.

## Keeping this up to date

If you add or change a config key, a validation rule, or plan-specific
behavior, update this README's tables/structure section and
[CLAUDE.md](./CLAUDE.md)'s schema/limits notes in the same change — see
CLAUDE.md for what to keep in sync and why.
