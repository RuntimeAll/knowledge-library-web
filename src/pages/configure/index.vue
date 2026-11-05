<script setup lang="ts">
import { ref, watch } from "vue";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbChips from "../../components/ui/KbChips.vue";
import KbBottomAction from "../../components/ui/KbBottomAction.vue";
import SpecForm from "../../components/business/SpecForm.vue";
import AttachmentPicker from "../../components/business/AttachmentPicker.vue";
import { useDraftStore } from "../../stores/draft";
import { useWorkflowStore } from "../../stores/workflow";
import { draftError, submissionError, modeLabels } from "../../core/skeleton";
import { go, notify } from "../../adapters/platform/navigation";
import { ensureSession } from "../../adapters/platform/auth";
import { workflowError } from "../../components/business/workflow-display";
const draft = useDraftStore();
const workflow = useWorkflowStore();
const error = ref("");
const submitting = ref(false);
const unknownKey = ref("");
const lastReceipt = ref<{ workOrderId: string; submissionId: string } | null>(
  null,
);
const showScenarios = ref(false);
const delivery = ref("queued");
watch(
  () => draft.spec,
  () => {
    error.value = "";
    if (!unknownKey.value) {
      draft.submissionKey = "";
      lastReceipt.value = null;
    }
  },
  { deep: true },
);
function save() {
  if (!ensureSession()) return;
  error.value = draftError(draft.spec);
  if (!error.value) {
    draft.save();
    notify("草稿已保存，可继续调整");
  }
}
function openReceipt(receipt: { workOrderId: string; submissionId: string }) {
  go(
    `/pages/record-detail/index?id=${receipt.workOrderId}&submission=${receipt.submissionId}`,
  );
}
function rememberReceipt(receipt: {
  workOrderId: string;
  submissionId: string;
}) {
  const submitted = workflow.getSubmission(
    receipt.workOrderId,
    receipt.submissionId,
  );
  if (submitted) draft.save(submitted.snapshot);
  draft.clearEdit();
  lastReceipt.value = receipt;
}
function submit() {
  if (submitting.value || unknownKey.value) return;
  if (lastReceipt.value) {
    openReceipt(lastReceipt.value);
    return;
  }
  error.value = submissionError(draft.spec);
  if (error.value) return;
  submitting.value = true;
  const key = draft.submissionKey || draft.newKey();
  try {
    const receipt = workflow.submit(draft.spec, {
      key,
      workOrderId: draft.editingWorkOrderId || undefined,
      baseRevision: draft.baseRevision ?? undefined,
      delivery: delivery.value as "queued" | "offline" | "unknown",
    });
    rememberReceipt(receipt);
    openReceipt(receipt);
  } catch (e) {
    if ((e as { code?: string }).code === "RESULT_UNKNOWN")
      unknownKey.value = key;
    error.value = workflowError(e);
  } finally {
    submitting.value = false;
  }
}
function recover() {
  try {
    const receipt = workflow.recover(unknownKey.value);
    if (!receipt) {
      error.value = "尚未查到记录，请保留页面稍后再查";
      return;
    }
    unknownKey.value = "";
    rememberReceipt(receipt);
    error.value = "";
    openReceipt(receipt);
  } catch (e) {
    error.value = workflowError(e);
  }
}
</script>
<template>
  <KbPage
    :title="modeLabels[draft.spec.mode]"
    :subtitle="
      draft.editingWorkOrderId
        ? `修改第 ${draft.baseRevision} 版，提交后保留旧版`
        : '把要求整理好，再提交本次任务'
    "
    backable
  >
    <view class="form-card kb-card"><SpecForm /></view>
    <KbSection title="参考资料"><AttachmentPicker /></KbSection>
    <text v-if="error" class="form-error" data-testid="submit-error">{{
      error
    }}</text>
    <view v-if="unknownKey" class="unknown-card"
      ><text>提交结果尚未确认，请先查回，避免重复创建。</text
      ><KbButton label="查回这次提交" secondary @click="recover"
    /></view>
    <button class="scenario-toggle" @click="showScenarios = !showScenarios">
      {{ showScenarios ? "收起演示情景" : "演示情景：正常提交" }}
    </button>
    <KbChips
      v-if="showScenarios"
      v-model="delivery"
      small
      :options="[
        { label: '正常提交', value: 'queued' },
        { label: '离线等待', value: 'offline' },
        { label: '提交结果未知', value: 'unknown' },
      ]"
    />
    <text class="kb-preview-note"
      >当前为 admin 演示，不上传文件，不执行真实制作。</text
    >
    <KbBottomAction
      ><view class="submit-actions"
        ><view class="save-action"
          ><KbButton
            label="保存草稿"
            secondary
            :disabled="submitting || !!unknownKey"
            @click="save" /></view
        ><view class="submit-action"
          ><KbButton
            label="提交模拟任务"
            :loading="submitting"
            :disabled="!!unknownKey"
            @click="submit" /></view></view
    ></KbBottomAction>
  </KbPage>
</template>
<style scoped>
.form-card {
  padding: 20px;
}
.form-error {
  display: block;
  color: #bd6262;
  font-size: 12px;
  line-height: 1.8;
  margin: 16px 4px;
}
.submit-actions {
  display: flex;
  gap: 10px;
}
.save-action {
  flex: 0 0 32%;
}
.submit-action {
  flex: 1;
  min-width: 0;
}
.unknown-card {
  padding: 18px;
  border-radius: 14px;
  background: #fff5e5;
  font-size: 12px;
  color: #967a48;
  line-height: 1.8;
}
.unknown-card > text {
  display: block;
  margin-bottom: 14px;
}
.scenario-toggle {
  display: block;
  margin: 24px 0 10px;
  background: transparent;
  padding: 0;
  color: #9890aa;
  font-size: 11px;
  line-height: 32px;
}
.scenario-toggle::after {
  border: 0;
}
</style>
