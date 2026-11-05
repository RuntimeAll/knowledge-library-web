<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    secondary?: boolean;
    disabled?: boolean;
    loading?: boolean;
  }>(),
  { secondary: false, disabled: false, loading: false },
);
defineEmits<{ click: [] }>();
</script>
<template>
  <up-button
    :text="label"
    :type="secondary ? 'info' : 'primary'"
    :plain="secondary"
    :color="secondary ? '#a69dd4' : '#6c5ce7'"
    :disabled="disabled"
    :loading="loading"
    :custom-style="{
      width: '100%',
      height: '48px',
      borderRadius: '14px',
      fontSize: '15px',
      fontWeight: '600',
    }"
    @click="$emit('click')"
  />
</template>
