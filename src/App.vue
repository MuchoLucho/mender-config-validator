<script setup>
import { reactive, ref, computed } from 'vue';
import FileTabs from './components/FileTabs.vue';
import Toolbar from './components/Toolbar.vue';
import ConfigEditor from './components/ConfigEditor.vue';
import DiagnosticsPanel from './components/DiagnosticsPanel.vue';
import DefaultsPanel from './components/DefaultsPanel.vue';
import KeyBrowser from './components/KeyBrowser.vue';
import { fieldsFor, EXAMPLES } from './schema.js';
import { validateText, setPath, defaultForType } from './validate.js';

const activeFile = ref('mender');
const texts = reactive({ mender: EXAMPLES.mender, connect: EXAMPLES.connect });

const currentText = computed({
  get: () => texts[activeFile.value],
  set: (v) => { texts[activeFile.value] = v; },
});

const validation = computed(() => validateText(texts[activeFile.value], activeFile.value));
const activeFields = computed(() => fieldsFor(activeFile.value));

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

function resetCurrent() {
  texts[activeFile.value] = EXAMPLES[activeFile.value];
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
    <h1>Mender Config Validator</h1>
    <p>Edit, validate and download <code>mender.conf</code> / <code>mender-connect.conf</code></p>
  </header>

  <FileTabs :active-file="activeFile" @change="activeFile = $event" />
  <Toolbar :file-name="fileName" :status="status" @upload="onUpload" @download="download" @reset="resetCurrent" />

  <main>
    <ConfigEditor
      :key="activeFile"
      v-model="currentText"
      :file="activeFile"
      :invalid="!validation.isValidJson"
    />
    <div class="side">
      <DiagnosticsPanel :validation="validation" />
      <DefaultsPanel :fields="validation.missingWithDefault" @insert="insertField" />
      <KeyBrowser :fields="activeFields" :is-present="isPresent" @insert="insertField" />
    </div>
  </main>
</template>

<style scoped>
header { padding: 20px 24px 16px; display: flex; align-items: baseline; gap: 12px; }
header h1 { font-size: 19px; margin: 0; font-weight: 700; letter-spacing: -.01em; }
header p { margin: 0; color: var(--muted); font-size: 13px; }
header code { color: var(--accent); font-family: var(--font-mono); }

main {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  padding: 0 24px 24px; align-items: start; flex: 1;
}
.side { max-height: 70vh; overflow-y: auto; padding-right: 2px; }
</style>
