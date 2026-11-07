<script setup lang="ts">
import {
  modeLabels,
  statusLabels,
  type TaskSummary,
} from "../../core/skeleton";
defineProps<{ task: TaskSummary }>();
defineEmits<{ open: [id: string] }>();
</script>
<template>
  <view
    class="task-card"
    hover-class="card-hover"
    @click="$emit('open', task.id)"
    ><view class="task-top"
      ><text class="task-mode"
        >{{ task.subject }} · {{ modeLabels[task.mode] }}</text
      ><text class="status-tag" :class="task.status">{{
        statusLabels[task.status]
      }}</text></view
    ><text class="task-title">{{ task.title }}</text
    ><text class="task-description">{{ task.detail }}</text
    ><view class="task-foot"
      ><text>{{ task.time }}</text
      ><text class="task-arrow">查看记录 <text>›</text></text></view
    ></view
  >
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
}
.task-mode {
  font-size: 11px;
  color: #a0a3b3;
}
.status-tag {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f0f1f5;
  color: #9095a5;
}
.status-tag.completed {
  color: #419a85;
  background: #eaf6f1;
}
.status-tag.running {
  color: #7a68d7;
  background: #efecff;
}
.status-tag.failed {
  color: #c99949;
  background: #fff4e0;
}
.status-tag.queued {
  color: #8095b8;
  background: #edf2fa;
}
.task-title {
  display: block;
  font-size: 15px;
  color: #353952;
  font-weight: 600;
  line-height: 1.6;
  margin-top: 13px;
  overflow-wrap: anywhere;
}
.task-description {
  display: block;
  font-size: 12px;
  color: #9b9fb0;
  margin-top: 6px;
  line-height: 1.7;
}
.task-foot {
  border-top: 1px solid #f3f3f8;
  margin-top: 16px;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #b0b3c0;
}
.task-arrow {
  color: #979bb0;
}
.task-arrow text {
  margin-left: 6px;
}
</style>
