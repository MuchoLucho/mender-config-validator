<script setup>
defineProps({ validation: { type: Object, required: true } });
const emit = defineEmits(['fix']);
</script>

<template>
  <div class="panel" v-if="!validation.isValidJson">
    <h2>JSON syntax error</h2>
    <div class="row err"><div class="msg">{{ validation.parseError }}</div></div>
  </div>

  <template v-else>
    <div class="panel" v-if="validation.errors.length">
      <h2>Errors ({{ validation.errors.length }})</h2>
      <div class="row err" v-for="(e, i) in validation.errors" :key="'e' + i">
        <span class="actions">
          <button v-for="a in e.actions" :key="a.type" @click="emit('fix', e, a)">{{ a.label }}</button>
        </span>
        <span class="path">{{ e.path }}</span> — <span class="msg">{{ e.message }}</span>
        <div class="hint" v-if="e.hint">{{ e.hint }}</div>
      </div>
    </div>

    <div class="panel" v-if="validation.warnings.length">
      <h2>Warnings ({{ validation.warnings.length }})</h2>
      <div class="row warn" v-for="(w, i) in validation.warnings" :key="'w' + i">
        <span class="actions">
          <button v-for="a in w.actions" :key="a.type" @click="emit('fix', w, a)">{{ a.label }}</button>
        </span>
        <span class="path">{{ w.path }}</span> — <span class="msg">{{ w.message }}</span>
        <div class="hint" v-if="w.hint">{{ w.hint }}</div>
      </div>
    </div>

    <div class="panel" v-if="!validation.errors.length && !validation.warnings.length">
      <div class="empty">No issues found.</div>
    </div>
  </template>
</template>

<style scoped>
.row { padding: 7px 0; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
.row:last-child { border-bottom: none; }
.row .path { color: var(--accent); font-family: var(--font-mono); font-size: 12.5px; }
.row.err .path::before { content: "✕ "; color: var(--err); }
.row.warn .path::before { content: "! "; color: var(--warn); }
.hint { color: var(--muted); font-size: 12px; margin-top: 3px; line-height: 1.4; }
.empty { color: var(--muted); font-size: 13px; }
.actions { float: right; display: flex; gap: 6px; }
.actions button {
  background: none; border: 1px solid var(--border); color: var(--muted);
  border-radius: 5px; padding: 2px 10px; font-size: 11px;
}
.actions button:hover { color: var(--accent); border-color: var(--accent); }
</style>
