<script setup>
defineProps({ modelValue: { type: String, required: true } });
const emit = defineEmits(['update:modelValue']);

function toggle(props) {
  emit('update:modelValue', props === 'dark' ? 'light' : 'dark');
}
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="modelValue === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="modelValue === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="toggle(modelValue)"
  >
    <svg v-if="modelValue === 'dark'" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
    <svg v-else viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
      <path d="M20.7 14.6a8.5 8.5 0 0 1-10.3-10.3 1 1 0 0 0-1.2-1.2 9.5 9.5 0 1 0 12.7 12.7 1 1 0 0 0-1.2-1.2Z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--muted);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  transition: color .15s, background-color .15s;
}
.theme-toggle:hover { color: var(--accent-ink); background: var(--accent-soft); }
</style>
