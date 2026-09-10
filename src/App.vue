<script setup>
import { reactive, ref, computed, watch } from 'vue';
import FileTabs from './components/FileTabs.vue';
import Toolbar from './components/Toolbar.vue';
import PlanSelector from './components/PlanSelector.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import ConfigEditor from './components/ConfigEditor.vue';
import DiagnosticsPanel from './components/DiagnosticsPanel.vue';
import KeyBrowser from './components/KeyBrowser.vue';
import { fieldsFor, EXAMPLES, menderExample } from './schema.js';
import { validateText, setPath, removePath, defaultForType } from './validate.js';

const activeFile = ref('mender');
const plan = ref('hosted');
const texts = reactive({ mender: menderExample(plan.value), connect: EXAMPLES.connect });

// TenantToken doesn't exist for Open Source (no multi-tenancy) — strip it
// from whatever's currently in the mender.conf editor the moment that
// plan is selected, rather than just leaving it to show as an error.
watch(plan, (newPlan) => {
  if (newPlan !== 'opensource') return;
  let obj;
  try { obj = JSON.parse(texts.mender); } catch { return; }
  if (obj && typeof obj === 'object' && 'TenantToken' in obj) {
    delete obj.TenantToken;
    texts.mender = JSON.stringify(obj, null, 2) + '\n';
  }
});

// index.html's inline script already set data-theme before first paint
// (avoids a flash of the wrong theme) — read it back rather than
// re-deriving from matchMedia so the two stay in lockstep.
const theme = ref(document.documentElement.getAttribute('data-theme') || 'dark');
watch(theme, (v) => {
  document.documentElement.setAttribute('data-theme', v);
  localStorage.setItem('mcv-theme', v);
});

const currentText = computed({
  get: () => texts[activeFile.value],
  set: (v) => { texts[activeFile.value] = v; },
});

const validation = computed(() => validateText(texts[activeFile.value], activeFile.value, plan.value));
const activeFields = computed(() => fieldsFor(activeFile.value, plan.value));

const parsedCurrent = computed(() => {
  try { return currentText.value.trim() === '' ? {} : JSON.parse(currentText.value); }
  catch { return null; }
});

function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur === null || typeof cur !== 'object' || !(k in cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}
function isPresent(f) {
  return parsedCurrent.value !== null && getPath(parsedCurrent.value, f.path) !== undefined;
}

function insertField(f) {
  const obj = parsedCurrent.value === null ? {} : parsedCurrent.value;
  setPath(obj, f.path, defaultForType(f));
  texts[activeFile.value] = JSON.stringify(obj, null, 2) + '\n';
}

function applyFix(row, action) {
  const obj = parsedCurrent.value === null ? {} : parsedCurrent.value;
  if (action.type === 'remove') removePath(obj, row.segs);
  else setPath(obj, action.field.path, defaultForType(action.field));
  texts[activeFile.value] = JSON.stringify(obj, null, 2) + '\n';
}

function resetCurrent() {
  texts[activeFile.value] = activeFile.value === 'mender' ? menderExample(plan.value) : EXAMPLES.connect;
}

function download() {
  const name = activeFile.value === 'mender' ? 'mender.conf' : 'mender-connect.conf';
  const blob = new Blob([currentText.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function onUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const content = reader.result;
    const name = file.name.toLowerCase();
    const looksLikeConnect = name.includes('connect') ||
      /"ShellCommand"|"Terminal"|"Sessions"|"FileTransfer"|"ReconnectIntervalSeconds"/.test(content);
    activeFile.value = looksLikeConnect ? 'connect' : 'mender';
    texts[activeFile.value] = content;
  };
  reader.readAsText(file);
}

const status = computed(() => validation.value.isValid
  ? { ok: true, label: '✓ Valid' }
  : { ok: false, label: `${validation.value.errors.length} error(s), ${validation.value.warnings.length} warning(s)` });

const fileName = computed(() => activeFile.value === 'mender' ? 'mender.conf' : 'mender-connect.conf');
</script>

<template>
  <header>
    <div class="titles">
      <h1>Mender Config Validator</h1>
      <p>Edit, validate and download <code>mender.conf</code> / <code>mender-connect.conf</code></p>
    </div>
    <ThemeToggle v-model="theme" />
  </header>

  <div class="privacy-note">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
    Everything runs locally in your browser — nothing you type or paste here, including tokens, is ever sent to a server.
  </div>

  <FileTabs :active-file="activeFile" @change="activeFile = $event" />
  <PlanSelector v-model="plan" />
  <Toolbar :file-name="fileName" :status="status" @upload="onUpload" @download="download" @reset="resetCurrent" />

  <main>
    <ConfigEditor
      :key="activeFile"
      v-model="currentText"
      :file="activeFile"
      :plan="plan"
      :dark="theme === 'dark'"
      :invalid="!validation.isValidJson"
    />
    <div class="side">
      <DiagnosticsPanel :validation="validation" @fix="applyFix" />
      <KeyBrowser :fields="activeFields" :is-present="isPresent" @insert="insertField" />
    </div>
  </main>

  <footer>
    Unofficial, community project — not officially supported by Northern.tech or the Mender project.
    Licensed under <a href="https://github.com/MuchoLucho/mender-config-validator/blob/main/LICENSE" target="_blank" rel="noopener">Apache 2.0</a>.
    Built with <span aria-hidden="true">❤️</span> by <a href="https://github.com/MuchoLucho" target="_blank" rel="noopener">Lucho</a>.
  </footer>
</template>

<style scoped>
header {
  padding: 20px 24px 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
header .titles { min-width: 0; }
header h1 { font-size: 19px; margin: 0; font-weight: 700; letter-spacing: -.01em; }
header p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
header code { color: var(--accent-ink); font-family: var(--font-mono); }

.privacy-note {
  display: flex; align-items: center; gap: 8px; padding: 8px 24px;
  background: var(--surface); border-bottom: 1px solid var(--border);
  color: var(--muted); font-size: 12px;
}
.privacy-note svg { flex: none; color: var(--accent-ink); }

main {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  padding: 0 24px 24px; align-items: start; flex: 1;
}
/* grid items default to min-width:auto, which lets a long unbreakable
   CodeMirror line (or any child) force the column — and the whole
   page — wider than the viewport. Constrain both columns explicitly. */
main > * { min-width: 0; }
.side { max-height: 70vh; overflow-y: auto; padding-right: 2px; }

footer {
  padding: 16px 24px 24px; text-align: center; color: var(--muted); font-size: 12px; line-height: 1.6;
}
footer a { color: var(--accent-ink); text-decoration: none; }
footer a:hover { text-decoration: underline; }

@media (max-width: 860px) {
  footer { padding: 14px 16px 20px; }
  header { padding: 16px 16px 12px; }
  header p { display: none; }
  .privacy-note { padding: 8px 16px; }
  main { grid-template-columns: 1fr; padding: 0 16px 20px; gap: 14px; }
  .side { max-height: none; overflow: visible; padding-right: 0; }
}
</style>
