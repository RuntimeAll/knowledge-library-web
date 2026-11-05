<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbState from "../../components/ui/KbState.vue";
import KbChips from "../../components/ui/KbChips.vue";
import ResultFiles from "../../components/business/ResultFiles.vue";
import SubmissionSummary from "../../components/business/SubmissionSummary.vue";
import { useWorkflowStore } from "../../stores/workflow";
import { useDraftStore } from "../../stores/draft";
import { sampleResources } from "../../fixtures/skeleton";
import { workflowError } from "../../components/business/workflow-display";
import { go, notify } from "../../adapters/platform/navigation";
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
const result = computed(() => submission.value?.result);
const versions = computed(
  () =>
    order.value?.submissions
      .filter((sub) => sub.result)
      .map((sub) => ({ label: `第 ${sub.revision} 版`, value: sub.id })) || [],
);
const itemLabels = {
  original: "原题",
  variant: "同类变式",
  extension: "提升拓展",
  practice: "专项练习",
};
function sourceName(sourceId: string, index: number) {
  return (
    sampleResources.find((item) => item.id === sourceId)?.title ||
    `已核对母题 ${index}`
  );
}
function confirm() {
  if (!submission.value) return;
  try {
    workflow.confirmResult(id.value, submission.value.id);
    error.value = "";
    notify("已确认这份模拟结果");
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
  <KbPage
    :title="submission?.snapshot.mode === 'intake' ? '录题回执' : '制作结果'"
    backable
  >
    <template v-if="result && submission && order">
      <view class="result-heading"
        ><view class="result-symbol"
          ><up-icon name="checkmark" color="#78b8a7" size="28" /></view
        ><text class="result-title">{{ submission.snapshot.title }}</text
        ><text class="result-caption"
          >第 {{ submission.revision }} 版 · {{ result.label }}</text
        ></view
      >
      <KbSection v-if="versions.length > 1" title="结果版本"
        ><KbChips
          :model-value="submission.id"
          :options="versions"
          small
          @update:model-value="
            selected = $event;
            error = '';
          "
      /></KbSection>
      <KbSection v-if="result.mode === 'intake'" title="本次录题回执"
        ><view class="kb-card receipt"
          ><text>已走完资料接收、整理与回传的演示步骤。</text
          ><text
            >题数：{{
              result.totalCount === null
                ? "待正式识别核对"
                : `${result.totalCount} 道参考题`
            }}</text
          ><text
            >没有写入正式题库，也没有授予正式可用或审核通过状态。</text
          ></view
        ></KbSection
      >
      <KbSection
        v-else
        title="结果结构预览"
        :hint="`共 ${result.totalCount} 道 · 按母题选择顺序排列`"
        ><view class="kb-card result-groups"
          ><view
            v-for="group in result.groups"
            :key="group.sourceId"
            class="result-group"
            ><text class="group-title">{{
              result.mode === "variant"
                ? `${group.sourceIndex}. ${sourceName(group.sourceId, group.sourceIndex)}`
                : "专项练习题组"
            }}</text
            ><view class="group-items"
              ><text v-for="item in group.items" :key="item.ordinal"
                >{{ item.ordinal }}. {{ itemLabels[item.kind]
                }}{{ item.index }}</text
              ></view
            ></view
          ><text class="layout-note"
            >此处只呈现题目顺序与数量，尚未生成正式题面。</text
          ></view
        ></KbSection
      >
      <KbSection :title="result.mode === 'intake' ? '回执文件' : '文件与版本'"
        ><ResultFiles :result="result" :spec="submission.snapshot"
      /></KbSection>
      <KbSection title="本版配置"
        ><SubmissionSummary :spec="submission.snapshot"
      /></KbSection>
      <text v-if="error" class="flow-error">{{ error }}</text>
      <view class="result-actions"
        ><KbButton
          :label="
            submission.confirmedAt ? '本版模拟结果已确认' : '确认这份模拟结果'
          "
          :disabled="!!submission.confirmedAt"
          @click="confirm" /><view class="result-action"
          ><KbButton
            label="修改配置再提交"
            secondary
            :disabled="submission.revision !== order.currentRevision"
            @click="edit" /></view
        ><view v-if="result.mode !== 'intake'" class="result-action"
          ><KbButton
            label="发布准备"
            :disabled="!submission.confirmedAt"
            @click="
              go(
                `/pages/publication/index?id=${id}&submission=${submission.id}`,
              )
            " /></view
        ><text
          v-if="result.mode !== 'intake' && !submission.confirmedAt"
          class="action-hint"
          >先确认这版结果，再准备发布资料</text
        ><view class="result-action"
          ><KbButton
            label="查看制作记录"
            secondary
            @click="
              go(
                `/pages/record-detail/index?id=${id}&submission=${submission.id}`,
              )
            " /></view
      ></view>
    </template>
    <KbState
      v-else
      state="empty"
      title="暂无可查看的制作结果"
      description="请从已完成的模拟记录进入"
      action="查看记录"
      @retry="go('/pages/records/index')"
    />
  </KbPage>
</template>
<style scoped>
.result-heading {
  text-align: center;
  padding: 12px 8px 4px;
}
.result-symbol {
  display: inline-flex;
  padding: 17px;
  background: #e6f5ef;
  border-radius: 50%;
  margin-bottom: 20px;
}
.result-title {
  display: block;
  font-size: 19px;
  color: #626880;
  line-height: 1.7;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.result-caption {
  display: block;
  font-size: 11px;
  color: #a29aae;
  margin-top: 10px;
  line-height: 1.8;
}
.result-group {
  padding: 12px 0;
  border-bottom: 1px solid #efedf6;
}
.result-group:first-child {
  padding-top: 0;
}
.group-title {
  font-size: 13px;
  color: #6d6684;
  font-weight: 600;
  line-height: 1.8;
}
.group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 4px;
}
.group-items text {
  background: #f4f2fa;
  color: #8b819e;
  font-size: 11px;
  line-height: 1.6;
  padding: 6px 9px;
  border-radius: 7px;
}
.layout-note {
  display: block;
  font-size: 10px;
  color: #a9a3b5;
  margin-top: 18px;
  line-height: 1.8;
}
.receipt > text {
  display: block;
  font-size: 12px;
  color: #9290a6;
  line-height: 1.9;
  margin: 8px 0;
}
.result-actions {
  margin-top: 24px;
}
.result-action {
  margin-top: 12px;
}
.action-hint {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #a29ab1;
  margin-top: 12px;
}
.flow-error {
  display: block;
  color: #bc7777;
  font-size: 12px;
  line-height: 1.8;
  margin-top: 16px;
}
</style>
