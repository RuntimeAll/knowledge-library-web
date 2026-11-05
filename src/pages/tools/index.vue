<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import { notify } from "../../adapters/platform/navigation";
const entries = [
  { name: "教学上下文", icon: "grid", desc: "教材与考点关系，便于资料定位" },
  { name: "科学素材", icon: "photo", desc: "实验器材与教学配图，方便重复使用" },
  { name: "课时小账", icon: "calendar", desc: "课时与课堂记录，集中查看" },
];
</script>
<template>
  <KbPage title="教学工具" subtitle="常用的小工具，放在一起" backable
    ><KbSection title="我的工具箱"
      ><view
        v-for="item in entries"
        :key="item.name"
        class="tool-card"
        @click="notify(`${item.name}入口待接入，当前仅展示骨架`)"
        ><view class="tool-icon"
          ><up-icon :name="item.icon" color="#aa9ed8" size="26" /></view
        ><view class="tool-copy"
          ><text>{{ item.name }}</text
          ><text>{{ item.desc }}</text></view
        ><text class="tool-state">待接入</text></view
      ></KbSection
    ><text class="kb-preview-note"
      >工具入口集中在「我的」，资料浏览仍从「题库」进入。</text
    ></KbPage
  >
</template>
<style scoped>
.tool-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 22px 18px;
  border-radius: 18px;
  margin-bottom: 14px;
}
.tool-icon {
  background: #f5f2fd;
  padding: 13px;
  border-radius: 16px;
  margin-right: 14px;
}
.tool-copy {
  flex: 1;
  font-size: 15px;
  color: #7e7b92;
}
.tool-copy text {
  display: block;
}
.tool-copy text:last-child {
  font-size: 10px;
  line-height: 1.9;
  color: #b0acbf;
  margin-top: 8px;
}
.tool-state {
  font-size: 10px;
  color: #b8b0cb;
  margin-left: 10px;
}
</style>
