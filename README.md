# Mender Config Validator

A browser-based editor and validator for [Mender](https://mender.io) client
config files: `mender.conf` and `mender-connect.conf`. Runs entirely
client-side — nothing is uploaded anywhere.

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
- **Defaults panel**: see every key you haven't set and what value the
  client will use instead.
- **Key browser**: searchable list of every recognized key, with
  description, type, required/deprecated/set status, and a one-click insert.
- Upload an existing config file (auto-detects which one) and download your
  edits back out.

## Getting started

```sh
npm install
npm run dev      # local dev server with hot reload
npm run build    # produces dist/index.html — a single self-contained file
```

`dist/index.html` has everything inlined (JS, CSS) and opens directly via
`file://` — no server needed to use the built app, only to develop it.

## Plan-specific behavior

Config keys and some validation rules depend on which Mender deployment
type you pick from the dropdown:

| | Hosted Mender | On-Prem Enterprise | On-Prem Open Source |
|---|---|---|---|
| `TenantToken` | required | optional (multi-tenant setups) | not applicable — flagged if set |
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
  App.vue                     Top-level layout & state (active file, plan, text buffers)
  schema.js                   FIELDS: the full mender.conf / mender-connect.conf key schema
  plans.js                    Deployment types + the Hosted-only limits that key off them
  validate.js                 Pure validation logic (JSON parse, type/format checks, plan rules)
  style.css                   Shared theme (CSS variables)
  components/
    FileTabs.vue               mender.conf / mender-connect.conf switcher
    PlanSelector.vue            Hosted / On-Prem Enterprise / On-Prem Open Source dropdown
    Toolbar.vue                 Upload / download / reset / status
    ConfigEditor.vue            CodeMirror wrapper (JSON + lint extension)
    DiagnosticsPanel.vue        Errors/warnings list
    DefaultsPanel.vue           Unset keys with defaults
    KeyBrowser.vue              Searchable full key list
```

## Keeping this up to date

If you add or change a config key, a validation rule, or plan-specific
behavior, update this README's tables/structure section and
[CLAUDE.md](./CLAUDE.md)'s schema/limits notes in the same change — see
CLAUDE.md for what to keep in sync and why.
