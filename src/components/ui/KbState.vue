<script setup lang="ts">
import type { DisplayState } from "../../core/skeleton";
withDefaults(
  defineProps<{
    state: DisplayState;
    title?: string;
    description?: string;
    action?: string;
  }>(),
  { title: "", description: "", action: "" },
);
defineEmits<{ retry: [] }>();
</script>
<template>
  <view v-if="state !== 'ready'" class="state-box">
    <up-loading-icon v-if="state === 'loading'" color="#6c5ce7" size="28" />
    <view v-else class="state-symbol"
      ><up-icon
        :name="state === 'error' ? 'info-circle' : 'folder'"
        size="32"
        color="#aaa4df"
    /></view>
    <text class="state-title">{{
      title ||
      (state === "loading"
        ? "正在加载"
        : state === "error"
          ? "暂时没能加载"
          : "这里还没有内容")
    }}</text>
    <text class="state-description">{{
      description ||
      (state === "error"
        ? "请稍后重试，已有内容会保留"
        : "从一份资料开始，慢慢积累")
    }}</text>
    <button
      v-if="action || state === 'error'"
      class="state-action"
      @click="$emit('retry')"
    >
      {{ action || "重新加载" }}
    </button>
  </view>
</template>
<style scoped>
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  background: white;
  border-radius: 20px;
}
.state-symbol {
  background: #f1efff;
  padding: 18px;
  border-radius: 50%;
}
.state-title {
  font-size: 16px;
  color: #53576f;
  margin-top: 20px;
  font-weight: 600;
}
.state-description {
  font-size: 12px;
  line-height: 1.8;
  color: #a0a3b4;
  margin-top: 10px;
}
.state-action {
  margin: 20px 0 0;
  background: #eeebff;
  color: #6c5ce7;
  font-size: 13px;
  padding: 0 24px;
  line-height: 42px;
  border-radius: 12px;
}
.state-action::after {
  border: 0;
}
</style>
