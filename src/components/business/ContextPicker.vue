<script setup lang="ts">
import { computed, ref } from "vue";
import { useDraftStore } from "../../stores/draft";
import KbChips from "../ui/KbChips.vue";
import KbButton from "../ui/KbButton.vue";
const draft = useDraftStore();
const show = ref(false);
const points = computed(() =>
  draft.spec.textbook === "人教版七上"
    ? [{ label: "有理数运算", value: "有理数运算" }]
    : draft.spec.textbook === "人教版六上"
      ? [{ label: "圆的周长", value: "圆的周长" }]
      : draft.spec.textbook === "浙教版七上"
        ? [{ label: "观察与测量", value: "观察与测量" }]
        : [],
);
function textbook(value: string) {
  draft.spec.textbook = value;
  draft.spec.point = "";
}
const subjects = [
  { label: "数学", value: "数学" },
  { label: "科学", value: "科学" },
];
function subject(value: string) {
  draft.spec.subject = value;
  draft.spec.textbook = "";
  draft.spec.point = "";
}
</script>
<template>
  <view class="context-entry" @click="show = true"
    ><view
      ><text class="context-title">教材与考点</text
      ><text class="context-value">{{
        [draft.spec.subject, draft.spec.textbook, draft.spec.point]
          .filter(Boolean)
          .join(" · ") || "请选择教材与考点"
      }}</text></view
    ><up-icon name="arrow-right" size="13" color="#b2afc5"
  /></view>
  <up-popup :show="show" mode="bottom" :round="24" @close="show = false"
    ><view class="picker-sheet"
      ><text class="picker-title">教材与考点</text
      ><text class="kb-preview-note">以下为选择器示例，正式教材列表待接入</text
      ><KbChips
        :model-value="draft.spec.subject"
        :options="subjects"
        @update:model-value="subject" /><text class="picker-label">教材</text
      ><KbChips
        :model-value="draft.spec.textbook"
        @update:model-value="textbook"
        :options="
          draft.spec.subject === '数学'
            ? [
                { label: '人教版 · 七年级上册', value: '人教版七上' },
                { label: '人教版 · 六年级上册', value: '人教版六上' },
              ]
            : [{ label: '浙教版 · 七年级上册', value: '浙教版七上' }]
        "
        small /><text class="picker-label">考点</text
      ><KbChips v-model="draft.spec.point" :options="points" small /><view
        class="picker-done"
        ><KbButton label="确认选择" @click="show = false" /></view></view
  ></up-popup>
</template>
<style scoped>
.context-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  border-top: 1px solid #f0f0f7;
  border-bottom: 1px solid #f0f0f7;
}
.context-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555972;
}
.context-value {
  display: block;
  font-size: 11px;
  color: #a3a0b9;
  line-height: 1.7;
  margin-top: 8px;
  max-width: 270px;
}
.picker-sheet {
  padding: 26px 24px 20px;
  max-width: 760px;
  margin: auto;
}
.picker-title {
  font-size: 20px;
  font-weight: 700;
}
.picker-label {
  display: block;
  font-size: 13px;
  color: #7e829a;
  margin: 24px 0 12px;
}
.picker-done {
  margin-top: 30px;
}
</style>
