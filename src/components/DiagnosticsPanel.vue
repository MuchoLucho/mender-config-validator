<script setup>
defineProps({ validation: { type: Object, required: true } });
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
        <span class="path">{{ e.path }}</span> — <span class="msg">{{ e.message }}</span>
        <div class="hint" v-if="e.hint">{{ e.hint }}</div>
      </div>
    </div>

    <div class="panel" v-if="validation.warnings.length">
      <h2>Warnings ({{ validation.warnings.length }})</h2>
      <div class="row warn" v-for="(w, i) in validation.warnings" :key="'w' + i">
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
</style>
