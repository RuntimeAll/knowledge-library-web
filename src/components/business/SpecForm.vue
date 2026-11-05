<script setup lang="ts">
import { useDraftStore } from "../../stores/draft";
import { go } from "../../adapters/platform/navigation";
import KbChips from "../ui/KbChips.vue";
import ContextPicker from "./ContextPicker.vue";
const draft = useDraftStore();
</script>
<template>
  <view class="spec-form">
    <view class="field" data-testid="draft-title"
      ><text class="field-label">资料名称 <text class="required">*</text></text
      ><up-input
        v-model="draft.spec.title"
        placeholder="给这份资料起个名字"
        maxlength="80"
        border="none"
        :custom-style="{
          padding: '12px 14px',
          background: '#f7f8fc',
          borderRadius: '12px',
        }"
    /></view>
    <ContextPicker />
    <view v-if="draft.spec.mode === 'practice'" class="form-row"
      ><view
        ><text class="field-label">题目数量</text
        ><text class="field-hint">按本次练习安排调整</text></view
      ><up-number-box
        v-model="draft.spec.count"
        :min="1"
        :max="100"
        button-size="30"
    /></view>
    <view v-if="draft.spec.mode === 'variant'" class="recipe"
      ><text class="field-label">题目组合</text
      ><view class="form-row"
        ><text>原题</text
        ><up-number-box
          v-model="draft.spec.originalCount"
          :min="0"
          :max="10"
          button-size="28" /></view
      ><view class="form-row"
        ><text>同类变式</text
        ><up-number-box
          v-model="draft.spec.variantCount"
          :min="0"
          :max="10"
          button-size="28" /></view
      ><view class="form-row"
        ><text>提升拓展</text
        ><up-number-box
          v-model="draft.spec.extensionCount"
          :min="0"
          :max="10"
          button-size="28" /></view
    ></view>
    <view v-if="draft.spec.mode !== 'intake'" class="field"
      ><text class="field-label">难度</text
      ><KbChips
        v-model="draft.spec.difficulty"
        small
        :options="[
          { label: '基础巩固', value: '基础巩固' },
          { label: '保持难度', value: '保持难度' },
          { label: '稍作提升', value: '稍作提升' },
        ]"
    /></view>
    <view
      v-if="draft.spec.mode !== 'intake'"
      class="template-entry"
      @click="go('/pages/templates/index?select=1')"
      ><view class="template-icon"
        ><up-icon name="file-text" color="#a095db" size="22" /></view
      ><view class="template-copy"
        ><text class="field-label">{{ draft.spec.template }}</text
        ><text class="field-hint">排版经验 · 可查看版式</text></view
      ><up-icon name="arrow-right" size="13" color="#b1abc7"
    /></view>
    <view v-if="draft.spec.mode !== 'intake'" class="form-row"
      ><view
        ><text class="field-label">附带独立答案</text
        ><text class="field-hint">学生版不含答案，答案默认红色</text></view
      ><up-switch
        v-model="draft.spec.includeAnswers"
        active-color="#6c5ce7"
        size="22"
    /></view>
    <view class="field"
      ><text class="field-label"
        >处理范围 <text class="optional">选填</text></text
      ><up-input
        v-model="draft.spec.range"
        placeholder="如：第 1—2 页、圈出的题目"
        border="none"
        :custom-style="{
          padding: '12px 14px',
          background: '#f7f8fc',
          borderRadius: '12px',
        }"
    /></view>
    <view class="field"
      ><text class="field-label"
        >补充要求 <text class="optional">选填</text></text
      ><up-textarea
        v-model="draft.spec.note"
        placeholder="如：留足书写空间，题目由易到难"
        count
        maxlength="300"
        :height="82"
        border="none"
        :custom-style="{ background: '#f7f8fc', borderRadius: '12px' }"
    /></view>
  </view>
</template>
<style scoped>
.field {
  padding: 16px 0;
}
.field:first-child {
  padding-top: 0;
}
.field-label {
  display: block;
  font-size: 14px;
  color: #565b73;
  font-weight: 500;
  margin-bottom: 10px;
}
.required {
  color: #b4a9df;
  font-size: 12px;
}
.field-hint {
  display: block;
  font-size: 10px;
  color: #acafbd;
  margin-top: 5px;
  line-height: 1.8;
}
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  border-bottom: 1px solid #f2f2f8;
}
.form-row .field-label {
  margin: 0;
}
.recipe {
  padding-top: 18px;
  font-size: 13px;
  color: #8d91a5;
}
.recipe .form-row {
  padding: 12px 0;
}
.template-entry {
  display: flex;
  align-items: center;
  background: #f8f6ff;
  border-radius: 14px;
  padding: 16px;
  margin-top: 12px;
}
.template-icon {
  margin-right: 12px;
}
.template-copy {
  flex: 1;
}
.template-copy .field-label {
  margin: 0;
  font-size: 13px;
}
.optional {
  font-size: 10px;
  color: #b2b5c2;
  font-weight: 400;
  margin-left: 5px;
}
</style>
