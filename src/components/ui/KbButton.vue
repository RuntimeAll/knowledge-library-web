<script setup lang="ts">
withDefaults(defineProps<{ label: string; secondary?: boolean; disabled?: boolean }>(), { secondary: false, disabled: false });
defineEmits<{ click: [] }>();
</script>
<template>
  <up-button :text="label" :type="secondary ? 'info' : 'primary'" :plain="secondary" :color="secondary ? undefined : '#167b76'" :disabled="disabled" shape="circle" @click="$emit('click')" />
</template>
