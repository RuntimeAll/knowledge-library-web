<script setup lang="ts">
import { computed } from "vue";
import { currentSubmission, type WorkOrder } from "../../core/workflow";
import { modeLabels } from "../../core/skeleton";
import { workflowStatusLabel, workflowTime } from "./workflow-display";
const props = defineProps<{ order: WorkOrder }>();
defineEmits<{ open: [id: string] }>();
const submission = computed(() => currentSubmission(props.order));
</script>
<template>
  <view
    class="task-card"
    hover-class="card-hover"
    @click="$emit('open', order.id)"
  >
    <view class="task-top"
      ><text
        >{{ submission.snapshot.subject }} ·
        {{ modeLabels[submission.snapshot.mode] }}</text
      ><text class="status-tag" :class="submission.status">{{
        workflowStatusLabel(submission.status)
      }}</text></view
    >
    <text class="task-title">{{ submission.snapshot.title }}</text>
    <text class="task-description">{{ submission.statusNote }}</text>
    <view class="task-foot"
      ><text>{{ workflowTime(submission.updatedAt) }}</text
      ><text>第 {{ submission.revision }} 版 · 查看记录 ›</text></view
    >
  </view>
</template>
<style scoped>
.task-card {
  padding: 20px;
  background: white;
  border: 1px solid #eeeff6;
  border-radius: 18px;
  margin-bottom: 12px;
}
.card-hover {
  background: #faf9ff;
}
.task-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #989aad;
  font-size: 11px;
}
.status-tag {
  flex-shrink: 0;
  margin-left: 10px;
  font-size: 10px;
  padding: 5px 8px;
  border-radius: 6px;
  background: #eeeff5;
  color: #858ba0;
}
.status-tag.completed {
  color: #419a85;
  background: #eaf6f1;
}
.status-tag.running {
  color: #7a68d7;
  background: #efecff;
}
.status-tag.failed,
.status-tag.waiting_materials,
.status-tag.awaiting_review {
  color: #af884b;
  background: #fff3e0;
}
.task-title {
  display: block;
  font-size: 15px;
  color: #434761;
  font-weight: 600;
  line-height: 1.7;
  margin-top: 14px;
  overflow-wrap: anywhere;
}
.task-description {
  display: block;
  font-size: 12px;
  color: #999bae;
  margin-top: 8px;
  line-height: 1.8;
}
.task-foot {
  border-top: 1px solid #f3f3f8;
  margin-top: 16px;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  color: #a2a5b7;
}
</style>
