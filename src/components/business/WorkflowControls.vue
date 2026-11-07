<script setup lang="ts">
import { computed, ref } from "vue";
import KbButton from "../ui/KbButton.vue";
import {
  availableActions,
  type WorkflowAction,
  type WorkflowStatus,
} from "../../core/workflow";
const props = defineProps<{ status: WorkflowStatus }>();
const emit = defineEmits<{ action: [action: WorkflowAction] }>();
const expanded = ref(false);
const allowed = computed(() => availableActions(props.status));
function act(action: string) {
  if (allowed.value.includes(action as WorkflowAction))
    emit("action", action as WorkflowAction);
}
const primary = computed(
  () =>
    ({
      queued: { label: "模拟接收任务", action: "receive" },
      running: { label: "模拟处理完成", action: "complete" },
      failed: { label: "按原配置重试", action: "retry" },
      waiting_materials: { label: "模拟资料补齐", action: "retry" },
      awaiting_review: { label: "模拟审核通过", action: "approve" },
      offline: { label: "模拟恢复在线", action: "reconnect" },
      unknown: { label: "查回处理结果", action: "recover" },
    })[
      props.status as
        | "queued"
        | "running"
        | "failed"
        | "waiting_materials"
        | "awaiting_review"
        | "offline"
        | "unknown"
    ],
);
</script>
<template>
  <view v-if="status !== 'completed'" class="demo-controls">
    <view class="control-heading"
      ><text>演示控制</text><text>仅推进这条模拟记录</text></view
    >
    <KbButton
      v-if="primary"
      :label="primary.label"
      @click="act(primary.action)"
    />
    <button
      v-if="status === 'queued' || status === 'running'"
      class="scenario-toggle"
      @click="expanded = !expanded"
    >
      {{ expanded ? "收起异常情景" : "演练异常情景" }}
      <text>{{ expanded ? "⌃" : "⌄" }}</text>
    </button>
    <view
      v-if="expanded && (status === 'queued' || status === 'running')"
      class="scenario-grid"
    >
      <button v-if="allowed.includes('disconnect')" @click="act('disconnect')">
        离线等待
      </button>
      <button
        v-if="allowed.includes('wait_materials')"
        @click="act('wait_materials')"
      >
        资料不足
      </button>
      <button
        v-if="allowed.includes('wait_review')"
        @click="act('wait_review')"
      >
        等待审核
      </button>
      <button v-if="allowed.includes('fail')" @click="act('fail')">
        处理失败
      </button>
    </view>
  </view>
</template>
<style scoped>
.demo-controls {
  background: #f0edfb;
  border: 1px dashed #d8d0ec;
  padding: 18px;
  border-radius: 18px;
  margin-top: 22px;
}
.control-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #71688e;
  margin-bottom: 14px;
}
.control-heading > text:last-child {
  font-size: 10px;
  color: #8c859f;
}
.scenario-toggle {
  background: transparent;
  margin: 12px 0 0;
  padding: 0;
  width: 100%;
  font-size: 12px;
  line-height: 34px;
  color: #8b809f;
}
.scenario-toggle::after,
.scenario-grid button::after {
  border: 0;
}
.scenario-toggle text {
  margin-left: 8px;
}
.scenario-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.scenario-grid button {
  width: calc(50% - 4px);
  margin: 0;
  padding: 0 8px;
  color: #81768f;
  font-size: 11px;
  line-height: 40px;
  background: #fff9;
  border-radius: 10px;
}
</style>
