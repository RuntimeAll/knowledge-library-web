<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbState from "../../components/ui/KbState.vue";
import TaskCard from "../../components/business/TaskCard.vue";
import { sampleTasks } from "../../fixtures/skeleton";
import { go, notify } from "../../adapters/platform/navigation";
import { useDraftStore } from "../../stores/draft";
const id = ref("");
onLoad((q) => {
  id.value = q?.id || "";
});
const task = computed(() => sampleTasks.find((x) => x.id === id.value));
const draft = useDraftStore();
function reuse() {
  if (task.value) {
    draft.spec.title = task.value.title;
    draft.spec.mode = task.value.mode;
    go("/pages/configure/index");
  }
}
</script>
<template>
  <KbPage title="记录详情" backable
    ><template v-if="task"
      ><TaskCard :task="task" /><text class="kb-preview-note"
        >此记录仅用于预览页面与状态</text
      ><KbSection title="制作进度"
        ><view class="kb-card"
          ><view
            v-for="(step, i) in [
              '资料与要求已准备',
              '等待处理',
              '整理与制作',
              '结果待查看',
            ]"
            :key="step"
            class="timeline-row"
            ><view
              class="timeline-dot"
              :class="{ done: task.status === 'completed' || i === 0 }"
            /><view
              ><text>{{ step }}</text
              ><text class="timeline-caption">{{
                task.status === "completed"
                  ? "完成状态示例"
                  : i === 0
                    ? "输入已保留"
                    : "流程状态展示"
              }}</text></view
            ></view
          ></view
        ></KbSection
      ><KbSection title="制作要求"
        ><view class="kb-card"
          ><view class="summary-row"
            ><text>资料名称</text><text>{{ task.title }}</text></view
          ><view class="summary-row"
            ><text>答案</text><text>独立答案 · 红色</text></view
          ><view class="summary-row"
            ><text>排版经验</text><text>清爽练习</text></view
          ></view
        ></KbSection
      ><view class="detail-actions"
        ><KbButton
          v-if="task.status === 'completed'"
          label="查看结果"
          @click="go(`/pages/result/index?id=${task.id}`)" /><KbButton
          v-else
          :label="task.status === 'failed' ? '查看待处理原因' : '当前状态说明'"
          secondary
          @click="notify(task.detail)" /><view class="secondary-action"
          ><KbButton
            label="复用配置"
            secondary
            @click="reuse" /></view></view></template
    ><KbState
      v-else
      state="empty"
      title="没有找到这条记录"
      description="请返回记录列表重新选择"
  /></KbPage>
</template>
<style scoped>
.timeline-row {
  display: flex;
  padding: 12px 0;
}
.timeline-dot {
  width: 10px;
  height: 10px;
  border: 2px solid #e5e3f0;
  border-radius: 50%;
  margin: 4px 16px 0 2px;
}
.timeline-dot.done {
  border-color: #b2a3e6;
  background: #b2a3e6;
}
.timeline-row > view:last-child {
  font-size: 13px;
  color: #7e8298;
}
.timeline-caption {
  display: block;
  color: #b2b5c3;
  font-size: 10px;
  margin-top: 6px;
}
.summary-row {
  display: flex;
  font-size: 12px;
  padding: 10px 0;
  line-height: 1.8;
}
.summary-row > text:first-child {
  width: 80px;
  flex-shrink: 0;
  color: #a2a7b6;
}
.summary-row > text:last-child {
  color: #747a91;
  flex: 1;
  overflow-wrap: anywhere;
}
.detail-actions {
  margin-top: 28px;
}
.secondary-action {
  margin-top: 12px;
}
</style>
