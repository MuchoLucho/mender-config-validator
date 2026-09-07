import jsonMap from 'json-source-map';
import { fieldsFor } from './schema.js';

// ---- generic helpers -------------------------------------------------

function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur === null || typeof cur !== 'object' || !(k in cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

export function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (typeof cur[k] !== 'object' || cur[k] === null || Array.isArray(cur[k])) cur[k] = {};
    cur = cur[k];
  }
  cur[path[path.length - 1]] = value;
}

export function defaultForType(f) {
  if (f.default !== undefined) return JSON.parse(JSON.stringify(f.default));
  switch (f.type) {
    case 'string': return '';
    case 'integer': return 0;
    case 'boolean': return false;
    case 'string[]': return [];
    case 'serverArray': return [{ ServerURL: '' }];
    default: return '';
  }
}

function fmtPath(segs) {
  let s = '';
  segs.forEach((seg, i) => {
    if (typeof seg === 'number') s += `[${seg}]`;
    else s += (i === 0 ? '' : '.') + seg;
  });
  return s;
}
function toPointer(segs) {
  return '/' + segs.map(String).join('/');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : 1 + Math.min(d[i - 1][j - 1], d[i - 1][j], d[i][j - 1]);
    }
  }
  return d[m][n];
}
function closestKey(input, candidates) {
  let best = null, bestDist = Infinity;
  for (const c of candidates) {
    const dist = levenshtein(input.toLowerCase(), c.toLowerCase());
    if (dist < bestDist) { best = c; bestDist = dist; }
  }
  return bestDist <= 3 && bestDist < best?.length ? best : null;
}

function isAbsolutePath(v) { return typeof v === 'string' && v.startsWith('/') && v.length > 1; }
function isPkcs11(v) { return typeof v === 'string' && v.startsWith('pkcs11:'); }
function isOctal(v) { return typeof v === 'string' && /^[0-7]{3,4}$/.test(v); }

// ---- format-specific checks with advice ------------------------------

function checkUrl(v) {
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v);
  if (!hasScheme) {
    return { ok: false, message: 'must be a full URL including a scheme (http:// or https://)', hint: `Try "https://${v}"` };
  }
  let u;
  try { u = new URL(v); } catch (e) {
    return { ok: false, message: 'is not a valid URL', hint: e.message };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, message: 'must use the http:// or https:// scheme', hint: `Got "${u.protocol}"` };
  }
  const host = u.hostname;
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIPv6 = host.startsWith('[') || (/^[0-9a-fA-F:]+$/.test(host) && host.includes(':'));
  if (isIPv4 || isIPv6) {
    return {
      ok: true, warn: true,
      message: 'host is a raw IP address, not a DNS name',
      hint: 'Mender verifies the server\'s TLS certificate against a hostname. Connecting via a bare IP will fail certificate verification unless the certificate itself covers that IP. Add an entry to /etc/hosts (or your DNS server) mapping a hostname to this IP, then use that hostname here instead.',
    };
  }
  return { ok: true };
}

function checkPkcs11(v) {
  const re = /^pkcs11:([a-zA-Z0-9_-]+=[^;?]+)(;[a-zA-Z0-9_-]+=[^;?]+)*(\?[a-zA-Z0-9_-]+=[^&]+(&[a-zA-Z0-9_-]+=[^&]+)*)?$/;
  if (!re.test(v)) {
    return { ok: false, message: 'is not a valid PKCS#11 URI', hint: 'Expected a format like "pkcs11:token=my-token;object=my-key;type=private?pin-value=1234"' };
  }
  return { ok: true };
}

// ---- field validation --------------------------------------------------

function validateField(f, value, segs, push) {
  if (f.deprecated) push('warning', segs, 'deprecated key — may be ignored or unsupported by current clients');
  if (f.type === 'any') return;

  if (f.type === 'string') {
    if (typeof value !== 'string') { push('error', segs, 'expected a string'); return; }
    if (f.format === 'url') {
      const r = checkUrl(value);
      if (!r.ok) push('error', segs, r.message, r.hint);
      else if (r.warn) push('warning', segs, r.message, r.hint);
    }
    if (f.format === 'path' && !isAbsolutePath(value)) {
      push('error', segs, 'expected an absolute filesystem path', `Paths must start with "/", e.g. "/etc/mender/${value || 'file'}"`);
    }
    if (f.format === 'device-path') {
      if (!isAbsolutePath(value)) push('error', segs, 'expected an absolute device path', 'e.g. "/dev/mmcblk0p2"');
      else if (!value.startsWith('/dev/')) push('warning', segs, 'path does not start with /dev/', 'verify this is really a block device path');
    }
    if (f.format === 'path-or-pkcs11') {
      if (isPkcs11(value)) {
        const r = checkPkcs11(value);
        if (!r.ok) push('error', segs, r.message, r.hint);
      } else if (!isAbsolutePath(value)) {
        push('error', segs, 'expected an absolute path or a PKCS#11 URI', 'Paths start with "/"; PKCS#11 URIs start with "pkcs11:"');
      }
    }
    if (f.format === 'enum' && !f.enum.includes(value)) {
      const suggestion = closestKey(value, f.enum);
      push('error', segs, `expected one of: ${f.enum.join(', ')}`, suggestion ? `Did you mean "${suggestion}"?` : null);
    }
    if (f.format === 'octal' && value !== '' && !isOctal(value)) {
      push('error', segs, 'expected an octal permission string', 'e.g. "600"');
    }
    return;
  }
  if (f.type === 'integer') {
    if (!Number.isInteger(value)) { push('error', segs, 'expected an integer'); return; }
    if (value < 0) push('error', segs, 'expected a non-negative integer');
    if (f.format === 'range' && (value < f.min || value > f.max)) {
      push('error', segs, `expected a value between ${f.min} and ${f.max}`);
    }
    return;
  }
  if (f.type === 'boolean') {
    if (typeof value !== 'boolean') push('error', segs, 'expected true or false');
    return;
  }
  if (f.type === 'string[]') {
    if (!Array.isArray(value)) { push('error', segs, 'expected an array of strings'); return; }
    value.forEach((item, i) => {
      if (typeof item !== 'string') push('error', segs.concat(i), 'expected a string');
    });
    return;
  }
  if (f.type === 'serverArray') {
    if (!Array.isArray(value)) { push('error', segs, 'expected an array of {"ServerURL": "..."} objects'); return; }
    if (value.length === 0) push('warning', segs, 'array is empty');
    value.forEach((item, i) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        push('error', segs.concat(i), 'expected an object with a ServerURL key');
      } else if (typeof item.ServerURL !== 'string') {
        push('error', segs.concat(i, 'ServerURL'), 'expected a string');
      } else {
        const r = checkUrl(item.ServerURL);
        if (!r.ok) push('error', segs.concat(i, 'ServerURL'), r.message, r.hint);
        else if (r.warn) push('warning', segs.concat(i, 'ServerURL'), r.message, r.hint);
      }
    });
  }
}

function parseErrorPosition(text, message) {
  const m = message.match(/position (\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function validateText(text, file) {
  const result = {
    isValidJson: true, isValid: true, parseError: null, parseErrorRange: null,
    errors: [], warnings: [], missingWithDefault: [],
  };

  let parsed;
  try {
    parsed = text.trim() === '' ? {} : JSON.parse(text);
  } catch (e) {
    result.isValidJson = false;
    result.isValid = false;
    result.parseError = e.message;
    const pos = parseErrorPosition(text, e.message);
    result.parseErrorRange = pos !== null ? { from: pos, to: Math.min(pos + 1, text.length) } : null;
    return result;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    result.isValidJson = false;
    result.isValid = false;
    result.parseError = 'Root of the config file must be a JSON object ({ ... }).';
    return result;
  }

  let pointers = {};
  try { pointers = jsonMap.parse(text).pointers; } catch { /* fall back to no ranges */ }

  const fields = fieldsFor(file);
  const rawErrors = [];
  const rawWarnings = [];
  const push = (severity, segs, message, hint) => {
    (severity === 'error' ? rawErrors : rawWarnings).push({ segs, message, hint: hint || null });
  };

  fields.forEach(f => {
    const value = getPath(parsed, f.path);
    if (value !== undefined) {
      validateField(f, value, f.path, push);
    } else if (f.default !== undefined) {
      result.missingWithDefault.push(f);
    }
  });

  // mandatory groups: at least one required, mutually exclusive
  const groups = {};
  fields.forEach(f => { if (f.mandatoryGroup) (groups[f.mandatoryGroup] ??= []).push(f); });
  Object.values(groups).forEach(members => {
    const present = members.filter(f => getPath(parsed, f.path) !== undefined);
    if (present.length === 0) {
      push('error', members[0].path, `one of ${members.map(m => m.pathStr).join(' / ')} is required`);
    } else if (present.length > 1) {
      present.forEach(f => push('error', f.path, `mutually exclusive with ${present.filter(x => x !== f).map(x => x.pathStr).join(', ')} — set only one`));
    }
  });

  // exclusive-only groups
  const exGroups = {};
  fields.forEach(f => { if (f.exclusiveGroup) (exGroups[f.exclusiveGroup] ??= []).push(f); });
  Object.values(exGroups).forEach(members => {
    const present = members.filter(f => getPath(parsed, f.path) !== undefined);
    if (present.length > 1) {
      present.forEach(f => push('error', f.path, `mutually exclusive with ${present.filter(x => x !== f).map(x => x.pathStr).join(', ')} — set only one`));
    }
  });

  // unknown keys (recursive walk, only descending into known container prefixes)
  const known = new Set(fields.map(f => f.pathStr));
  const containers = new Set();
  fields.forEach(f => { for (let i = 1; i < f.path.length; i++) containers.add(f.path.slice(0, i).join('.')); });
  const allKeyNames = fields.map(f => f.pathStr);
  (function walk(obj, prefix) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;
    Object.keys(obj).forEach(key => {
      const segs = prefix.concat(key);
      const fullStr = segs.join('.');
      if (known.has(fullStr)) return; // validated above
      if (containers.has(fullStr)) { walk(obj[key], segs); return; }
      const suggestion = closestKey(fullStr, allKeyNames);
      push('warning', segs, 'unrecognized key', suggestion ? `Did you mean "${suggestion}"?` : null);
    });
  })(parsed, []);

  // attach display path + source range
  const finalize = (list) => list.map(({ segs, message, hint }) => {
    const path = fmtPath(segs);
    const ptr = toPointer(segs);
    const p = pointers[ptr];
    let range = null;
    if (p) {
      if (p.key && p.keyEnd) range = { from: p.key.pos, to: p.keyEnd.pos };
      else if (p.value && p.valueEnd) range = { from: p.value.pos, to: p.valueEnd.pos };
    }
    return { path, message, hint, range };
  });

  result.errors = finalize(rawErrors);
  result.warnings = finalize(rawWarnings);
  result.isValid = result.errors.length === 0;
  return result;
}
