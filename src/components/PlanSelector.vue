<script setup>
import { PLANS } from '../plans.js';

defineProps({ modelValue: { type: String, required: true } });
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="plan-selector">
    <label for="plan">Deployment type</label>
    <select id="plan" :value="modelValue" @change="emit('update:modelValue', $event.target.value)">
      <option v-for="p in PLANS" :key="p.id" :value="p.id">{{ p.label }}</option>
    </select>
    <span class="hint">{{ PLANS.find(p => p.id === modelValue)?.hint }}</span>
  </div>
</template>

<style scoped>
.plan-selector {
  display: flex; align-items: center; gap: 10px; padding: 10px 24px;
  background: var(--panel); border-bottom: 1px solid var(--border); font-size: 13px;
}
.plan-selector label { color: var(--muted); font-weight: 500; }
.plan-selector select {
  background: var(--panel-2); color: var(--text); border: 1px solid var(--border);
  border-radius: 7px; padding: 5px 10px; font-size: 13px; font-family: var(--font-sans);
}
.plan-selector select:focus { outline: none; border-color: var(--accent); }
.plan-selector .hint { color: var(--muted); font-size: 12px; }
</style>
