<script setup lang="ts">
withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), {
  placeholder: "搜索资料",
});
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
function input(event: Event) {
  emit(
    "update:modelValue",
    (event as Event & { detail: { value: string } }).detail.value,
  );
}
</script>
<template>
  <view class="search"
    ><up-icon name="search" size="20" color="#b0b3c2" /><input
      class="search-input"
      :value="modelValue"
      :placeholder="placeholder"
      placeholder-style="color:#b0b3c2"
      @input="input"
  /></view>
</template>
<style scoped>
.search {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #eeeff6;
  border-radius: 14px;
  padding: 0 15px;
  height: 48px;
  margin: 18px 0 14px;
}
.search-input {
  margin-left: 10px;
  font-size: 14px;
  flex: 1;
  min-width: 0;
  height: 44px;
}
</style>
