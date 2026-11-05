<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbState from "../../components/ui/KbState.vue";
import { sampleTasks } from "../../fixtures/skeleton";
import { notify } from "../../adapters/platform/navigation";
const id = ref("");
onLoad((q) => {
  id.value = q?.id || "";
});
const task = computed(() => sampleTasks.find((x) => x.id === id.value));
</script>
<template>
  <KbPage title="发布准备" subtitle="确认资料，再进入协同发布" backable
    ><view class="kb-card"
      ><text class="publish-label">当前资料</text
      ><text class="publish-title">{{ task?.title || "还未选择成品" }}</text
      ><text class="publish-copy">{{
        task
          ? "该成品为页面示例，尚无可发布的正式文件。"
          : "可以从制作结果进入，查看对应资料的发布准备。"
      }}</text></view
    ><KbSection title="发布资料"
      ><view class="kb-card"
        ><view
          v-for="line in ['成品文件与版本', '资料介绍与封面', '网盘交付信息']"
          :key="line"
          class="publish-row"
          ><text>{{ line }}</text
          ><text>待接入</text></view
        ></view
      ></KbSection
    ><KbSection title="协同发布台"
      ><KbState
        state="empty"
        title="发布台入口待接入"
        description="发布记录与现有发布台共用，接入后可继续处理"
      /><view class="publish-action"
        ><KbButton label="提交发布" disabled /><text
          class="publish-note"
          @click="notify('当前仅提供页面骨架，未提交任何发布任务')"
          >当前预览不会提交发布任务</text
        ></view
      ></KbSection
    ></KbPage
  >
</template>
<style scoped>
.publish-label {
  font-size: 11px;
  color: #a49cbb;
}
.publish-title {
  display: block;
  font-size: 18px;
  color: #6d6882;
  margin: 14px 0;
  line-height: 1.6;
}
.publish-copy {
  font-size: 12px;
  color: #a4a7b7;
  line-height: 1.9;
}
.publish-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  font-size: 13px;
  color: #85889f;
  border-bottom: 1px solid #f4f4f9;
}
.publish-row:last-child {
  border: 0;
}
.publish-row text:last-child {
  font-size: 11px;
  color: #b0a8c5;
}
.publish-action {
  margin-top: 24px;
}
.publish-note {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #b6b2c8;
  margin-top: 16px;
}
</style>
