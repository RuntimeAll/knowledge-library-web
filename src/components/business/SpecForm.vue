<script setup lang="ts">
import { ref } from "vue";
import { useDraftStore } from "../../stores/draft";
import { go } from "../../adapters/platform/navigation";
import KbChips from "../ui/KbChips.vue";
import PracticeQuantity from "./PracticeQuantity.vue";
import VariantRecipe from "./VariantRecipe.vue";
import ContextPicker from "./ContextPicker.vue";
const draft = useDraftStore();
const requirementsOpen = ref(false);
const rangeOpen = ref(false);
</script>
<template>
  <view class="spec-form">
    <view class="field title-field" data-testid="draft-title"
      ><view class="label-row"
        ><text class="field-label"
          >资料名称 <text class="optional">选填</text></text
        ><button
          v-if="draft.saved"
          class="text-action"
          @click="draft.restore()"
        >
          用上次配置
        </button></view
      ><up-input
        v-model="draft.spec.title"
        placeholder="可选填，留空也可以开始制作"
        maxlength="80"
        border="none"
        :custom-style="{
          padding: '12px 14px',
          background: '#f7f8fc',
          borderRadius: '12px',
        }"
    /></view>
    <PracticeQuantity v-if="draft.spec.mode === 'practice'" />
    <VariantRecipe v-if="draft.spec.mode === 'variant'" />
    <ContextPicker />
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
        ><text class="field-label"
          >{{ draft.spec.template }}
          <text class="template-version">{{
            draft.spec.templateVersion
          }}</text></text
        ><text class="field-hint">排版经验 · 查看学生版与答案版</text></view
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
    <view class="collapsible-field"
      ><view
        class="collapse-heading"
        @click="requirementsOpen = !requirementsOpen"
        ><view class="collapse-copy"
          ><text class="field-label"
            >补充要求 <text class="optional">选填</text></text
          ><text v-if="!requirementsOpen" class="collapsed-value">{{
            draft.spec.goal || "可补充书写留白、题目顺序等要求"
          }}</text></view
        ><up-icon
          :name="requirementsOpen ? 'arrow-up' : 'arrow-down'"
          size="12"
          color="#aea4bd" /></view
      ><view v-if="requirementsOpen" data-testid="draft-requirements"
        ><up-textarea
          v-model="draft.spec.goal"
          placeholder="如：保留原题、题目由易到难、留足书写空间"
          count
          maxlength="300"
          :height="100"
          border="none"
          :custom-style="{ background: '#f7f8fc', borderRadius: '12px' }"
        /><text class="field-hint">与首页“想制作什么？”保持同步</text></view
      ></view
    >
    <view v-if="draft.spec.attachments.length" class="collapsible-field"
      ><view class="collapse-heading" @click="rangeOpen = !rangeOpen"
        ><view class="collapse-copy"
          ><text class="field-label"
            >处理范围 <text class="optional">选填</text></text
          ><text v-if="!rangeOpen" class="collapsed-value">{{
            draft.spec.range || "默认处理所选资料，可指定页码或题号"
          }}</text></view
        ><up-icon
          :name="rangeOpen ? 'arrow-up' : 'arrow-down'"
          size="12"
          color="#aea4bd" /></view
      ><up-input
        v-if="rangeOpen"
        v-model="draft.spec.range"
        placeholder="如：第 1—2 页、圈出的题目"
        border="none"
        :custom-style="{
          padding: '12px 14px',
          background: '#f7f8fc',
          borderRadius: '12px',
        }"
    /></view>
  </view>
</template>
<style scoped>
.field {
  padding: 16px 0;
}
.title-field {
  padding-top: 0;
}
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
.template-entry {
  display: flex;
  align-items: center;
  background: #f8f6ff;
  border-radius: 14px;
  padding: 16px;
  margin-top: 12px;
  gap: 12px;
}
.template-copy {
  flex: 1;
  min-width: 0;
}
.template-copy .field-label {
  margin: 0;
  font-size: 13px;
}
.template-version {
  font-size: 10px;
  font-weight: 400;
  color: #aaa0bb;
  margin-left: 4px;
}
.optional {
  font-size: 10px;
  color: #b2a7bf;
  font-weight: 400;
  margin-left: 5px;
}
.collapsible-field {
  border-bottom: 1px solid #f2eff7;
  padding-bottom: 16px;
}
.collapse-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 0 4px;
}
.collapse-copy {
  flex: 1;
  min-width: 0;
}
.collapse-heading .field-label {
  margin-bottom: 8px;
}
.collapsed-value {
  display: block;
  font-size: 11px;
  line-height: 1.8;
  color: #a298b1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
