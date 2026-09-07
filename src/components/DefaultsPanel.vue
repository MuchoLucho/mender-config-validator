<script setup>
defineProps({ fields: { type: Array, required: true } });
const emit = defineEmits(['insert']);

function formatDefault(f) {
  return typeof f.default === 'string' ? `"${f.default}"` : JSON.stringify(f.default);
}
</script>

<template>
  <div class="panel">
    <h2>Not set — defaults that apply</h2>
    <div class="empty" v-if="!fields.length">Every key with a default is explicitly set.</div>
    <div class="row" v-for="f in fields" :key="f.pathStr">
      <button class="insert" @click="emit('insert', f)">insert</button>
      <span class="path">{{ f.pathStr }}</span>
      <span class="default">= {{ formatDefault(f) }}</span>
    </div>
  </div>
</template>

<style scoped>
.row { padding: 7px 0; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
.row:last-child { border-bottom: none; }
.row .path { color: var(--accent); font-family: var(--font-mono); font-size: 12.5px; }
.row .default { color: var(--muted); font-size: 12px; margin-left: 4px; }
.row button.insert {
  float: right; background: none; border: 1px solid var(--border); color: var(--muted);
  border-radius: 5px; padding: 2px 10px; font-size: 11px;
}
.row button.insert:hover { color: var(--accent); border-color: var(--accent); }
.empty { color: var(--muted); font-size: 13px; }
</style>
