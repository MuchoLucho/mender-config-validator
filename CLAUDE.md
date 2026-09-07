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
| TenantToken / multi-tenancy | Yes (indirectly) | Not a numeric limit on that page, but the page's Hosted/on-prem distinction is exactly why `TenantToken` is plan-gated in `schema.js` |
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
