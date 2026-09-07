<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  fields: { type: Array, required: true },
  isPresent: { type: Function, required: true },
});
const emit = defineEmits(['insert']);

const search = ref('');
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.fields;
  return props.fields.filter(f => f.pathStr.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
});

function formatDefault(f) {
  return typeof f.default === 'string' ? `"${f.default}"` : JSON.stringify(f.default);
}
</script>

<template>
  <div class="panel">
    <h2>Available keys</h2>
    <input class="search" v-model="search" placeholder="Filter keys…">
    <div v-for="f in filtered" :key="f.pathStr" class="row">
      <button class="insert" @click="emit('insert', f)">insert</button>
      <span class="path">{{ f.pathStr }}</span>
      <span class="type">{{ f.type }}</span>
      <span class="badge mandatory" v-if="f.mandatoryGroup">required</span>
      <span class="badge deprecated" v-if="f.deprecated">deprecated</span>
      <span class="badge set" v-if="isPresent(f)">set</span>
      <span class="default" v-if="f.default !== undefined">default: {{ formatDefault(f) }}</span>
      <div class="desc">{{ f.description }}</div>
    </div>
  </div>
</template>

<style scoped>
.search {
  width: 100%; padding: 7px 10px; background: var(--panel-2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text); margin-bottom: 10px; font-size: 13px;
}
.search:focus { outline: none; border-color: var(--accent); }
.row { padding: 7px 0; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
.row:last-child { border-bottom: none; }
.row .path { color: var(--accent); font-family: var(--font-mono); font-size: 12.5px; }
.row .type { color: var(--muted); font-size: 11px; margin-left: 6px; }
.row .default { color: var(--muted); font-size: 11px; margin-left: 8px; }
.row .desc { color: var(--muted); font-size: 12px; margin-top: 2px; }
.row button.insert {
  float: right; background: none; border: 1px solid var(--border); color: var(--muted);
  border-radius: 5px; padding: 2px 10px; font-size: 11px;
}
.row button.insert:hover { color: var(--accent); border-color: var(--accent); }
</style>
