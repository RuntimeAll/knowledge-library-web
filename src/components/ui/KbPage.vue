<script setup lang="ts">
import { back, headerInset } from "../../adapters/platform/navigation";
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    backable?: boolean;
    eyebrow?: string;
  }>(),
  { subtitle: "", backable: false, eyebrow: "" },
);
const top = headerInset();
</script>
<template>
  <view class="kb-page" :style="{ paddingTop: `${top}px` }">
    <view class="kb-header">
      <view class="kb-header-main">
        <button v-if="backable" class="kb-back" aria-label="返回" @click="back">
          <up-icon name="arrow-left" size="21" color="#252841" />
        </button>
        <view class="kb-heading"
          ><text v-if="eyebrow" class="kb-eyebrow">{{ eyebrow }}</text
          ><text class="kb-title">{{ title }}</text
          ><text v-if="subtitle" class="kb-subtitle">{{ subtitle }}</text></view
        >
      </view>
      <slot name="action" />
    </view>
    <view class="kb-content"><slot /></view>
  </view>
</template>
<style scoped lang="scss">
.kb-page {
  max-width: 760px;
  margin: 0 auto;
  min-height: 100vh;
  padding-bottom: 32px;
}
.kb-header {
  padding: 24px 22px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kb-header-main {
  display: flex;
  align-items: center;
  min-width: 0;
}
.kb-heading {
  min-width: 0;
}
.kb-eyebrow {
  display: block;
  color: #8d91a6;
  font-size: 12px;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.kb-title {
  display: block;
  color: #252841;
  font-size: 26px;
  line-height: 1.4;
  font-weight: 700;
}
.kb-subtitle {
  display: block;
  font-size: 13px;
  line-height: 1.7;
  color: #979aac;
  margin-top: 6px;
}
.kb-back {
  margin: 0 12px 0 -10px;
  padding: 10px;
  width: 44px;
  height: 44px;
  background: transparent;
  line-height: 1;
  flex-shrink: 0;
}
.kb-back::after {
  border: 0;
}
.kb-content {
  padding: 0 20px;
}
</style>
