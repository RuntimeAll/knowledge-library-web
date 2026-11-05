<script setup lang="ts">
import { computed, ref } from "vue";
import { useDraftStore } from "../../stores/draft";
import { recipeSize, sourceCount, totalQuestions } from "../../core/skeleton";
import KbButton from "../ui/KbButton.vue";
const draft = useDraftStore();
const recipeOpen = ref(false);
const motherCount = computed(() => sourceCount(draft.spec));
const total = computed(() => totalQuestions(draft.spec));
const recipeError = computed(() =>
  [
    draft.spec.originalCount,
    draft.spec.variantCount,
    draft.spec.extensionCount,
  ].some((value) => !Number.isInteger(value) || value < 0 || value > 20)
    ? "每类题量需为 0～20 的整数"
    : recipeSize(draft.spec) < 1
      ? "每道母题至少生成 1 题"
      : recipeSize(draft.spec) > 50
        ? "每道母题合计不能超过 50 题"
        : "",
);
function setSourceCount(event: Event) {
  const value = (event as Event & { detail: { value: string } }).detail.value;
  draft.spec.sourceQuestionCount = value === "" ? null : Number(value);
}
</script>
<template>
  <view class="recipe-section">
    <view class="label-row"
      ><text class="field-label">每道母题的题目组合</text
      ><button class="text-action" @click="recipeOpen = true">
        调整
      </button></view
    ><view class="recipe-summary" @click="recipeOpen = true"
      ><view
        ><text class="recipe-number">{{ draft.spec.originalCount }}</text
        ><text>原题</text></view
      ><text class="recipe-plus">＋</text
      ><view
        ><text class="recipe-number">{{ draft.spec.variantCount }}</text
        ><text>同类变式</text></view
      ><text class="recipe-plus">＋</text
      ><view
        ><text class="recipe-number">{{ draft.spec.extensionCount }}</text
        ><text>提升拓展</text></view
      ></view
    >
    <view v-if="draft.spec.attachments.length" class="source-count"
      ><text>本次已核对的母题总数</text
      ><input
        class="source-count-input"
        type="number"
        :value="draft.spec.sourceQuestionCount ?? ''"
        placeholder="填写题数"
        @input="setSourceCount"
      /><text class="field-hint"
        >含已选题库母题；文件可能有多道题，不能用文件数代替。</text
      ></view
    >
    <text class="recipe-total" data-testid="recipe-total"
      >{{ motherCount === null ? "母题数量待核对" : `${motherCount} 道母题` }} ×
      每道母题 {{ recipeSize(draft.spec) }} 题{{
        total === null ? "" : ` = 共 ${total} 题`
      }}</text
    ><text class="field-hint">按母题所选顺序，逐组生成后依次合并</text
    ><text v-if="recipeError" class="recipe-error">{{ recipeError }}</text>
  </view>
  <up-popup
    :show="recipeOpen"
    mode="bottom"
    :round="24"
    @close="recipeOpen = false"
    ><view class="recipe-sheet"
      ><text class="sheet-title">调整每道母题的组合</text
      ><text class="field-hint">每类 0～20 题，每道母题合计 1～50 题</text
      ><view class="form-row"
        ><text>保留原题</text
        ><up-number-box
          v-model="draft.spec.originalCount"
          :min="0"
          :max="20"
          button-size="32" /></view
      ><view class="form-row"
        ><text>同类变式</text
        ><up-number-box
          v-model="draft.spec.variantCount"
          :min="0"
          :max="20"
          button-size="32" /></view
      ><view class="form-row"
        ><text>提升拓展</text
        ><up-number-box
          v-model="draft.spec.extensionCount"
          :min="0"
          :max="20"
          button-size="32" /></view
      ><text class="recipe-total"
        >每道母题合计 {{ recipeSize(draft.spec) }} 题</text
      ><text v-if="recipeError" class="recipe-error">{{ recipeError }}</text
      ><view class="sheet-action"
        ><KbButton
          label="确认组合"
          :disabled="!!recipeError"
          @click="recipeOpen = false" /></view></view
  ></up-popup>
</template>
<style scoped>
.field-label {
  display: block;
  font-size: 14px;
  color: #565b73;
  font-weight: 500;
  margin-bottom: 10px;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.label-row .field-label {
  margin: 0 0 10px;
}
.text-action {
  border: 0;
  background: none;
  font-size: 11px;
  color: #8d7cb6;
  line-height: 28px;
  padding: 0 0 8px;
  margin: 0;
}
.text-action::after {
  border: 0;
}
.field-hint {
  display: block;
  font-size: 10px;
  color: #a49bb4;
  margin-top: 6px;
  line-height: 1.8;
}
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  border-bottom: 1px solid #f2f2f8;
  gap: 12px;
}
.form-row .field-label {
  margin: 0;
}
.recipe-section {
  padding: 16px 0 20px;
}
.recipe-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #f8f5fe;
  border-radius: 14px;
  padding: 15px 12px;
  color: #9686ae;
  font-size: 11px;
}
.recipe-summary > view {
  text-align: center;
}
.recipe-number {
  display: block;
  font-size: 23px;
  color: #77608f;
  font-weight: 650;
  margin-bottom: 6px;
}
.recipe-plus {
  font-size: 13px;
  color: #c0b2d1;
}
.recipe-total {
  display: block;
  font-size: 12px;
  color: #8b70ac;
  line-height: 1.8;
  margin-top: 14px;
}
.recipe-error {
  display: block;
  color: #c47676;
  font-size: 11px;
  line-height: 1.7;
  margin-top: 8px;
}
.source-count {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 16px;
  font-size: 12px;
  color: #82748d;
}
.source-count-input {
  width: 78px;
  height: 34px;
  background: #f7f5fb;
  border: 1px solid #e7e0f0;
  border-radius: 9px;
  text-align: center;
  font-size: 12px;
}
.source-count .field-hint {
  width: 100%;
  margin-top: 0;
}
.recipe-sheet {
  padding: 26px 24px 20px;
  max-width: 760px;
  margin: auto;
}
.sheet-title {
  font-size: 20px;
  font-weight: 650;
  color: #5b4d6b;
  display: block;
  margin-bottom: 10px;
}
.recipe-sheet .form-row {
  font-size: 13px;
  color: #8b7c9a;
}
.sheet-action {
  margin-top: 24px;
}
</style>
