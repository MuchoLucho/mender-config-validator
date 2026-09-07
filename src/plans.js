// Deployment types, and the subset of https://docs.mender.io/overview/limits
// that actually maps to a mender.conf / mender-connect.conf key.
//
// Most limits on that page (test device counts, Artifact/API payload sizes,
// deployment/RBAC/audit-log limits, string-length caps, etc.) are enforced
// server-side against account or API state that has no corresponding client
// config key — there's nothing for this validator to check, so they're
// intentionally not modeled here. See README.md for the full list of what
// was excluded and why.

export const PLANS = [
  { id: 'hosted', label: 'Hosted Mender', hint: 'Northern.tech SaaS at hosted.mender.io' },
  { id: 'enterprise', label: 'On-Prem Enterprise', hint: 'Self-hosted, Enterprise license, multi-tenant capable' },
  { id: 'opensource', label: 'On-Prem Open Source', hint: 'Self-hosted, no multi-tenancy' },
];

// "Polling intervals" section of the limits page: Hosted Mender throttles
// update-check / inventory requests sent more often than these floors.
// On-premises servers (Enterprise or Open Source) impose no such floor —
// it's purely a Hosted rate limit, not a client-enforced minimum.
// The docs only call out "micro" vs the regular case; DeviceTier's
// "system" value isn't discussed separately, so it's treated like the
// default (non-micro) floor here.
export const HOSTED_POLLING_FLOORS = {
  micro: { update: 604800, inventory: 604800 },
  default: { update: 1800, inventory: 28800 },
};

export function planApplicable(field, plan) {
  return !field.plans || !plan || field.plans.includes(plan);
}
