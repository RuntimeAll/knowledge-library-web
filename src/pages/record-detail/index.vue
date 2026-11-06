<script setup lang="ts">
import { displayTitle } from "../../core/skeleton";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbChips from "../../components/ui/KbChips.vue";
import KbState from "../../components/ui/KbState.vue";
import SubmissionSummary from "../../components/business/SubmissionSummary.vue";
import WorkflowControls from "../../components/business/WorkflowControls.vue";
import { useWorkflowStore } from "../../stores/workflow";
import { useDraftStore } from "../../stores/draft";
import {
  workflowStatusLabel,
  workflowTime,
  workflowError,
} from "../../components/business/workflow-display";
import type { WorkflowAction } from "../../core/workflow";
import { go } from "../../adapters/platform/navigation";
const workflow = useWorkflowStore();
const draft = useDraftStore();
const id = ref("");
const selected = ref("");
const error = ref("");
onLoad((q) => {
  id.value = q?.id || "";
  selected.value = q?.submission || "";
});
const order = computed(() => workflow.getOrder(id.value));
const submission = computed(() =>
  workflow.getSubmission(id.value, selected.value || undefined),
);
const versions = computed(
  () =>
    order.value?.submissions.map((sub) => ({
      label: `第 ${sub.revision} 版${sub.revision === order.value?.currentRevision ? " · 当前" : ""}`,
      value: sub.id,
    })) || [],
);
function advance(action: WorkflowAction) {
  if (!submission.value) return;
  try {
    workflow.advance(id.value, submission.value.id, action);
    error.value = "";
  } catch (e) {
    error.value = workflowError(e);
  }
}
function edit() {
  if (
    !submission.value ||
    !order.value ||
    submission.value.revision !== order.value.currentRevision
  )
    return;
  draft.beginEdit(
    submission.value.snapshot,
    id.value,
    order.value.currentRevision,
  );
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="记录详情" backable>
    <template v-if="order && submission">
      <view class="record-heading kb-card"
        ><view class="heading-row"
          ><text class="record-version"
            >第 {{ submission.revision }} 版{{
              submission.revision === order.currentRevision
                ? " · 当前版本"
                : " · 历史版本"
            }}</text
          ><text class="record-status" :class="submission.status">{{
            workflowStatusLabel(submission.status)
          }}</text></view
        ><text class="record-title">{{
          displayTitle(submission.snapshot, submission.id)
        }}</text
        ><text class="record-note">{{ submission.statusNote }}</text
        ><text class="record-time"
          >更新于 {{ workflowTime(submission.updatedAt) }}</text
        ></view
      >
      <text class="kb-preview-note"
        >本条为模拟任务，状态由下方演示控制推进。</text
      >
      <KbSection v-if="versions.length > 1" title="版本记录"
        ><KbChips
          :model-value="submission.id"
          :options="versions"
          small
          @update:model-value="
            selected = $event;
            error = '';
          "
      /></KbSection>
      <KbSection title="本次提交的要求"
        ><SubmissionSummary :spec="submission.snapshot"
      /></KbSection>
      <WorkflowControls :status="submission.status" @action="advance" />
      <text v-if="error" class="flow-error">{{ error }}</text>
      <view class="record-actions"
        ><KbButton
          v-if="submission.result"
          :label="
            submission.snapshot.mode === 'intake' ? '查看录题回执' : '查看结果'
          "
          @click="
            go(`/pages/result/index?id=${id}&submission=${submission.id}`)
          " /><view class="secondary-action"
          ><KbButton
            label="修改配置再提交"
            secondary
            :disabled="submission.revision !== order.currentRevision"
            @click="edit" /></view
        ><view class="secondary-action"
          ><KbButton
            label="返回全部记录"
            secondary
            @click="go('/pages/records/index')" /></view
      ></view>
    </template>
    <KbState
      v-else
      state="empty"
      title="没有找到这条记录"
      description="请从模拟记录列表重新进入"
      action="查看全部记录"
      @retry="go('/pages/records/index')"
    />
  </KbPage>
</template>
<style scoped>
.heading-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.record-version {
  font-size: 11px;
  color: #9c93ad;
}
.record-status {
  font-size: 11px;
  padding: 5px 9px;
  border-radius: 7px;
  background: #edeaf8;
  color: #8876b8;
  flex-shrink: 0;
}
.record-status.completed {
  background: #e7f5ee;
  color: #61a38e;
}
.record-title {
  display: block;
  font-size: 19px;
  line-height: 1.7;
  font-weight: 600;
  color: #52556f;
  margin: 18px 0 10px;
  overflow-wrap: anywhere;
}
.record-note {
  display: block;
  font-size: 12px;
  color: #9295a9;
  line-height: 1.9;
}
.record-time {
  display: block;
  font-size: 10px;
  color: #acafbf;
  margin-top: 16px;
}
.record-actions {
  margin-top: 24px;
}
.secondary-action {
  margin-top: 12px;
}
.flow-error {
  display: block;
  font-size: 12px;
  color: #bc7777;
  line-height: 1.8;
  margin: 14px 4px;
}
</style>
