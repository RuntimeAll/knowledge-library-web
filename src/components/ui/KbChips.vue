<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { label: string; value: string }[];
  small?: boolean;
}>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>
<template>
  <scroll-view scroll-x class="chips-scroll"
    ><view class="chips"
      ><button
        v-for="option in options"
        :key="option.value"
        class="chip"
        :class="{ active: modelValue === option.value, small }"
        @click="$emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button></view
    ></scroll-view
  >
</template>
<style scoped>
.chips-scroll {
  width: 100%;
  white-space: nowrap;
}
.chips {
  display: flex;
  align-items: center;
  padding: 2px 0;
}
.chip {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 44px;
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  color: #8a8da1;
  background: #eef0f7;
  margin: 0 8px 0 0;
  font-weight: 500;
}
.chip::after {
  border: 0;
}
.chip.active {
  background: #6c5ce7;
  color: white;
  box-shadow: 0 4px 10px #6c5ce720;
}
.chip.small {
  font-size: 12px;
  line-height: 34px;
  height: 34px;
  padding: 0 14px;
  border-radius: 9px;
}
.chip.small.active {
  background: #ece9ff;
  color: #6c5ce7;
  box-shadow: none;
}
</style>
