<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import ModeSelector from "../../components/business/ModeSelector.vue";
import AttachmentPicker from "../../components/business/AttachmentPicker.vue";
import TaskCard from "../../components/business/TaskCard.vue";
import { useDraftStore } from "../../stores/draft";
import { sampleTasks } from "../../fixtures/skeleton";
import { go } from "../../adapters/platform/navigation";
const draft = useDraftStore();
</script>
<template>
  <KbPage title="工作台" eyebrow="我的教学资料空间"
    ><template #action
      ><button class="avatar" @click="go('/pages/mine/index')">
        我
      </button></template
    >
    <view class="greeting"
      ><text class="hero-title"
        >今天，想做一份<text class="accent">什么资料？</text></text
      ><text class="hero-caption">让好题有迹可循，让每次备课更轻松。</text
      ><view class="hero-decor"><view /><view /><view /></view
    ></view>
    <view class="composer kb-card"
      ><ModeSelector v-model="draft.spec.mode" /><view class="goal-field">
        <textarea
          v-model="draft.spec.goal"
          class="goal-input"
          maxlength="300"
          placeholder="例如：做一份有理数基础练习，题目由易到难…"
          placeholder-style="color:#b3b4c6"
        /></view
      ><AttachmentPicker /><view class="start-action"
        ><KbButton
          label="开始配置"
          @click="go('/pages/configure/index')" /></view
      ><text class="composer-footnote">先配好要求，再开始制作</text></view
    >
    <view class="library-entry" @click="go('/pages/library/index')"
      ><view class="library-symbol"
        ><up-icon name="grid" size="23" color="#8e85c9" /></view
      ><view
        ><text class="library-entry-title">从已有题目开始</text
        ><text class="library-entry-caption"
          >找一找，或许好题已经在这里</text
        ></view
      ><up-icon name="arrow-right" color="#aaa5c2" size="13"
    /></view>
    <KbSection
      title="最近制作"
      action="全部记录"
      hint="示例记录 · 看看制作后的样子"
      @action="go('/pages/records/index')"
      ><TaskCard
        v-for="task in sampleTasks.slice(0, 2)"
        :key="task.id"
        :task="task"
        @open="go(`/pages/record-detail/index?id=${$event}`)"
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
  color: #a2a3b7;
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
.goal-field {
  margin: 17px 0 12px;
}
.goal-input {
  width: 100%;
  height: 70px;
  font-size: 14px;
  line-height: 1.9;
  color: #5b5c76;
}
.start-action {
  margin-top: 18px;
}
.composer-footnote {
  display: block;
  text-align: center;
  font-size: 10px;
  color: #b5b3c6;
  margin-top: 11px;
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
