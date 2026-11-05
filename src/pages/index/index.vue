<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import AttachmentPicker from "../../components/business/AttachmentPicker.vue";
import WorkflowRecordCard from "../../components/business/WorkflowRecordCard.vue";
import KbState from "../../components/ui/KbState.vue";
import { useWorkflowStore } from "../../stores/workflow";
import { useDraftStore } from "../../stores/draft";

import { go } from "../../adapters/platform/navigation";
import type { MakeMode } from "../../core/skeleton";
const draft = useDraftStore();
const workflow = useWorkflowStore();
function start(mode: MakeMode) {
  draft.clearEdit();
  draft.spec.mode = mode;
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="工作台" eyebrow="我的教学资料空间">
    <template #action
      ><button class="avatar" @click="go('/pages/mine/index')">
        我
      </button></template
    >
    <view class="greeting"
      ><text class="hero-title"
        >今天，想做一份<text class="accent">什么资料？</text></text
      ><text class="hero-caption">先说说要求，再选资料和制作方式。</text
      ><view class="hero-decor"><view /><view /><view /></view
    ></view>
    <view class="composer kb-card">
      <view class="input-heading"
        ><text>想制作什么？</text
        ><text class="input-count">{{ draft.spec.goal.length }}/300</text></view
      >
      <view class="goal-field">
        <textarea
          v-model="draft.spec.goal"
          class="goal-input"
          maxlength="300"
          :adjust-position="true"
          :cursor-spacing="24"
          placeholder="例如：根据下面的母题做一份同类练习，保留原题，留足书写空间……"
          placeholder-style="color:#aaa5ba"
        />
      </view>
      <AttachmentPicker compact @practice="start('practice')" />
      <view class="mode-actions"
        ><button class="variant-action" @click="start('variant')">
          <up-icon name="plus-circle" color="#ffffff" size="19" /><text
            >举一反三</text
          ></button
        ><button class="intake-action" @click="start('intake')">
          <up-icon name="file-text" color="#8877bd" size="19" /><text
            >只录题</text
          >
        </button></view
      >
      <text class="composer-footnote"
        >参考题按所选顺序处理，要求会带入下一页</text
      >
    </view>
    <view class="library-entry" @click="go('/pages/library/index')"
      ><view class="library-symbol"
        ><up-icon name="grid" size="23" color="#8e85c9" /></view
      ><view
        ><text class="library-entry-title">从已有题目开始</text
        ><text class="library-entry-caption"
          >选好母题，直接带入制作配置</text
        ></view
      ><up-icon name="arrow-right" color="#aaa5c2" size="13"
    /></view>
    <KbSection
      title="最近制作"
      action="全部记录"
      hint="admin 的模拟制作记录"
      @action="go('/pages/records/index')"
      ><WorkflowRecordCard
        v-for="order in workflow.orders.slice().reverse().slice(0, 2)"
        :key="order.id"
        :order="order"
        @open="go(`/pages/record-detail/index?id=${$event}`)" /><KbState
        v-if="!workflow.orders.length"
        state="empty"
        title="从这一次制作开始"
        description="提交后，记录和结果会出现在这里"
    /></KbSection>
  </KbPage>
</template>
<style scoped>
.avatar {
  width: 42px;
  height: 42px;
  line-height: 42px;
  padding: 0;
  border-radius: 50%;
  background: #eeeaff;
  color: #8b7cd6;
  font-size: 14px;
  margin: 0;
  border: 3px solid white;
}
.avatar::after {
  border: 0;
}
.greeting {
  position: relative;
  margin: 6px 4px 24px;
  overflow: hidden;
}
.hero-title {
  display: block;
  font-size: 27px;
  line-height: 1.55;
  font-weight: 700;
  letter-spacing: -0.6px;
  color: #34364f;
}
.accent {
  display: block;
  color: #7764d6;
}
.hero-caption {
  display: block;
  margin-top: 12px;
  font-size: 12px;
  color: #9291a7;
  line-height: 1.8;
}
.hero-decor {
  position: absolute;
  right: 12px;
  top: 6px;
  transform: rotate(13deg);
  width: 70px;
  height: 78px;
  opacity: 0.45;
}
.hero-decor view {
  position: absolute;
  width: 46px;
  height: 62px;
  background: #eee8ff;
  border: 2px solid white;
  border-radius: 10px;
  right: 0;
  top: 0;
}
.hero-decor view:nth-child(2) {
  right: 14px;
  top: 8px;
  background: #e6e0fa;
  transform: rotate(-13deg);
}
.hero-decor view:nth-child(3) {
  right: 27px;
  top: 16px;
  background: #f0ecff;
  transform: rotate(-25deg);
}
.composer {
  padding: 20px 18px;
}
.input-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #5b536e;
  font-weight: 600;
  margin-bottom: 12px;
}
.input-count {
  font-size: 10px;
  font-weight: 400;
  color: #b0a8bf;
}
.goal-field {
  padding: 13px 14px;
  border: 1px solid #ded9ef;
  border-radius: 13px;
  background: #faf9fe;
  margin-bottom: 12px;
}
.goal-field:focus-within {
  border-color: #a494dc;
  box-shadow: 0 0 0 3px #9d86db12;
}
.goal-input {
  width: 100%;
  height: 96px;
  font-size: 14px;
  line-height: 1.85;
  color: #5b536e;
}
.mode-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.mode-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  margin: 0;
  padding: 0;
  height: 48px;
  line-height: 48px;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 600;
}
.mode-actions button::after {
  border: 0;
}
.variant-action {
  background: #7560d7;
  color: white;
  box-shadow: 0 4px 12px #7560d724;
}
.intake-action {
  background: #f4f0fc;
  color: #8877bd;
}
.composer-footnote {
  display: block;
  text-align: center;
  font-size: 10px;
  color: #aca4bb;
  margin-top: 13px;
  line-height: 1.8;
}
.library-entry {
  display: flex;
  align-items: center;
  background: #f0edf9;
  border-radius: 16px;
  padding: 16px;
  margin-top: 16px;
}
.library-symbol {
  margin-right: 12px;
}
.library-entry-title {
  display: block;
  font-size: 13px;
  color: #77708f;
  font-weight: 600;
}
.library-entry-caption {
  display: block;
  font-size: 10px;
  color: #aaa2bd;
  margin-top: 6px;
}
.library-entry > view:nth-child(2) {
  flex: 1;
}
</style>
