<script setup lang="ts">
import { computed } from "vue";
import { useDraftStore } from "../../stores/draft";
import { practiceCopyCount } from "../../core/skeleton";
const draft = useDraftStore();
const copies = computed({
  get: () => practiceCopyCount(draft.spec),
  set: (value: number) => {
    draft.spec.practiceCopies = value;
  },
});
</script>
<template>
  <view class="practice-quantity">
    <view class="quantity-row" data-testid="practice-count">
      <view
        ><text class="quantity-label">每次练习题量</text
        ><text class="quantity-hint">每次练习都按这个题量制作</text></view
      >
      <up-number-box
        v-model="draft.spec.count"
        :min="1"
        :max="100"
        button-size="30"
      />
    </view>
    <view class="quantity-row" data-testid="practice-copies">
      <view
        ><text class="quantity-label">一共练习多少次</text
        ><text class="quantity-hint">相同要求，不同题目的专项练习</text></view
      >
      <up-number-box v-model="copies" :min="1" :max="100" button-size="30" />
    </view>
    <text class="quantity-summary"
      >{{ copies }} 次练习 × 每次 {{ draft.spec.count }} 题，共
      {{ copies * draft.spec.count }} 题</text
    >
  </view>
</template>
<style scoped>
.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid #f2f2f8;
}
.quantity-label {
  display: block;
  font-size: 14px;
  color: #565b73;
  font-weight: 500;
}
.quantity-hint {
  display: block;
  font-size: 10px;
  color: #a49bb4;
  margin-top: 6px;
  line-height: 1.8;
}
.quantity-summary {
  display: block;
  font-size: 12px;
  color: #8b70ac;
  line-height: 1.8;
  padding: 12px 0;
}
</style>
