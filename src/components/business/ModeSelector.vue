<script setup lang="ts">
import KbChips from "../ui/KbChips.vue";
import type { MakeMode } from "../../core/skeleton";
defineProps<{ modelValue: MakeMode }>();
defineEmits<{ "update:modelValue": [mode: MakeMode] }>();
const modes = [
  { label: "专项练习", value: "practice" },
  { label: "举一反三", value: "variant" },
  { label: "只录题", value: "intake" },
];
</script>
<template>
  <KbChips
    :model-value="modelValue"
    :options="modes"
    @update:model-value="$emit('update:modelValue', $event as MakeMode)"
  />
</template>
