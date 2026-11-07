<script setup lang="ts">
withDefaults(defineProps<{ title: string; action?: string; hint?: string }>(), {
  action: "",
  hint: "",
});
defineEmits<{ action: [] }>();
</script>
<template>
  <view class="section"
    ><view class="section-head"
      ><view
        ><text class="section-title">{{ title }}</text
        ><text v-if="hint" class="section-hint">{{ hint }}</text></view
      ><button v-if="action" class="text-action" @click="$emit('action')">
        {{ action }} <text>›</text>
      </button></view
    ><slot
  /></view>
</template>
<style scoped>
.section {
  margin-top: 28px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-title {
  font-size: 17px;
  font-weight: 650;
  color: #30334b;
}
.section-hint {
  display: block;
  font-size: 12px;
  color: #999caf;
  margin-top: 5px;
}
.text-action {
  border: 0;
  background: none;
  padding: 6px 0 6px 12px;
  margin: 0;
  font-size: 12px;
  color: #9296aa;
  line-height: 2;
}
.text-action::after {
  border: 0;
}
.text-action text {
  margin-left: 5px;
}
</style>
