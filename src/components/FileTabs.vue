<script setup>
defineProps({ activeFile: { type: String, required: true } });
const emit = defineEmits(['change']);
</script>

<template>
  <div class="tabs">
    <button :class="{ active: activeFile === 'mender' }" @click="emit('change', 'mender')">mender.conf</button>
    <button :class="{ active: activeFile === 'connect' }" @click="emit('change', 'connect')">mender-connect.conf</button>
  </div>
  <div class="file-note" v-if="activeFile === 'mender'">
    Loaded from <code>/var/lib/mender/mender.conf</code> first, then <code>/etc/mender/mender.conf</code> (later file wins on conflicting keys).
  </div>
  <div class="file-note" v-else>
    Loaded from <code>/etc/mender/mender-connect.conf</code> (falls back to <code>/var/lib/mender/mender-connect.conf</code>).
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 4px; padding: 0 24px; border-bottom: 1px solid var(--border); background: var(--panel); }
.tabs button {
  background: none; border: none; color: var(--muted); padding: 12px 18px; font-size: 13.5px;
  font-weight: 500; border-bottom: 2px solid transparent; transition: color .15s, border-color .15s;
}
.tabs button:hover { color: var(--text); }
.tabs button.active { color: var(--text); border-bottom-color: var(--accent); }
.file-note {
  padding: 8px 24px; font-size: 12px; color: var(--muted); background: var(--panel);
  border-bottom: 1px solid var(--border);
}
.file-note code { color: var(--accent); font-family: var(--font-mono); }
</style>
