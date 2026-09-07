<script setup>
import { computed, ref, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { basicSetup } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { linter, lintGutter, forceLinting } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { validateText } from '../validate.js';

const props = defineProps({
  modelValue: { type: String, required: true },
  file: { type: String, required: true },
  plan: { type: String, required: true },
  invalid: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const view = ref(null);
function onReady(payload) { view.value = payload.view; }
// The plan dropdown doesn't touch the document, so CodeMirror's linter
// (which only reruns on doc changes) needs a manual nudge to reflect it.
watch(() => props.plan, () => { if (view.value) forceLinting(view.value); });

const content = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

function toDiagnostic(entry, severity, docLen) {
  const clamp = (n) => Math.max(0, Math.min(n, docLen));
  let from = 0, to = Math.min(1, docLen);
  if (entry.range) { from = clamp(entry.range.from); to = clamp(Math.max(entry.range.to, entry.range.from + 1)); }
  return {
    from, to, severity,
    message: entry.hint ? `${entry.message}\n${entry.hint}` : entry.message,
    source: entry.path,
    renderMessage() {
      const wrap = document.createElement('div');
      wrap.style.maxWidth = '320px';
      const main = document.createElement('div');
      main.textContent = entry.message;
      wrap.appendChild(main);
      if (entry.hint) {
        const hint = document.createElement('div');
        hint.style.cssText = 'color:#8a93a6;margin-top:4px;font-size:12px;line-height:1.4;';
        hint.textContent = entry.hint;
        wrap.appendChild(hint);
      }
      return wrap;
    },
  };
}

function lintSource(view) {
  const text = view.state.doc.toString();
  const docLen = view.state.doc.length;
  const result = validateText(text, props.file, props.plan);
  if (!result.isValidJson) {
    const r = result.parseErrorRange;
    const clamp = (n) => Math.max(0, Math.min(n, docLen));
    const from = r ? clamp(r.from) : 0;
    const to = r ? clamp(Math.max(r.to, r.from + 1)) : Math.min(1, docLen);
    return [{ from, to, severity: 'error', message: result.parseError, source: 'JSON' }];
  }
  return [
    ...result.errors.map(e => toDiagnostic(e, 'error', docLen)),
    ...result.warnings.map(w => toDiagnostic(w, 'warning', docLen)),
  ];
}

const editorTheme = EditorView.theme({
  '&': { fontSize: '13px', backgroundColor: 'var(--panel)', height: '70vh' },
  '.cm-content': { fontFamily: 'var(--font-mono)', padding: '12px 0', caretColor: 'var(--accent)' },
  '.cm-gutters': { backgroundColor: 'var(--panel)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.03)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px solid var(--err)' },
  '.cm-lintRange-warning': { backgroundImage: 'none', borderBottom: '2px solid var(--warn)' },
}, { dark: true });

const extensions = [
  basicSetup,
  json(),
  linter(lintSource, { delay: 250 }),
  lintGutter(),
  editorTheme,
];
</script>

<template>
  <div class="editor-shell" :class="{ invalid }">
    <Codemirror v-model="content" :extensions="extensions" :tab-size="2" @ready="onReady" />
  </div>
</template>

<style scoped>
.editor-shell {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color .15s;
}
.editor-shell.invalid { border-color: var(--err); }
</style>
