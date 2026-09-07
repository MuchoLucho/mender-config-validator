<script setup>
const props = defineProps({
  fileName: { type: String, required: true },
  status: { type: Object, required: true }, // { ok: bool, label: string }
});
const emit = defineEmits(['upload', 'download', 'reset']);

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) emit('upload', file);
  e.target.value = '';
}
</script>

<template>
  <div class="toolbar">
    <label class="btn">
      Upload file
      <input type="file" accept=".conf,.json,text/plain,application/json" @change="onFileChange">
    </label>
    <button class="btn" @click="emit('download')">Download {{ fileName }}</button>
    <button class="btn" @click="emit('reset')">Reset to minimal example</button>
    <span class="status" :class="status.ok ? 'ok' : 'bad'">{{ status.label }}</span>
  </div>
</template>

<style scoped>
/* .btn itself comes from the global tonal-button style in style.css */
.toolbar { display: flex; gap: 10px; padding: 14px 24px; align-items: center; flex-wrap: wrap; }
.btn input[type=file] { display: none; }
.status { margin-left: auto; font-size: 12.5px; font-weight: 600; padding: 6px 14px; border-radius: 999px; }
.status.ok { background: var(--ok-soft); color: var(--ok); }
.status.bad { background: var(--err-soft); color: var(--err); }

@media (max-width: 860px) {
  .toolbar { padding: 12px 16px; }
  .status { margin-left: 0; order: -1; flex-basis: 100%; }
}
</style>
