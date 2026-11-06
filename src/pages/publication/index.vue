<script setup lang="ts">
import { displayTitle } from "../../core/skeleton";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbState from "../../components/ui/KbState.vue";
import { useWorkflowStore } from "../../stores/workflow";
import { workflowError } from "../../components/business/workflow-display";
import { go, notify } from "../../adapters/platform/navigation";
const workflow = useWorkflowStore();
const id = ref("");
const selected = ref("");
const title = ref("");
const intro = ref("");
const error = ref("");
const saved = ref(false);
const submission = computed(() =>
  workflow.getSubmission(id.value, selected.value || undefined),
);
const result = computed(() => submission.value?.result);
const publication = computed(() =>
  workflow.publications.find((item) => item.workOrderId === id.value),
);
const canPrepare = computed(
  () =>
    !!(
      submission.value?.confirmedAt &&
      result.value &&
      result.value.mode !== "intake"
    ),
);
onLoad((q) => {
  id.value = q?.id || "";
  selected.value = q?.submission || "";
  const current = workflow.getSubmission(id.value, selected.value || undefined);
  const existing = workflow.publications.find(
    (item) => item.workOrderId === id.value,
  );
  title.value =
    existing?.title ||
    (current ? displayTitle(current.snapshot, current.id) : "");
  intro.value = existing?.intro || current?.snapshot.goal || "";
  saved.value = !!existing && existing.resultId === current?.result?.id;
});
function save() {
  if (!result.value) return;
  try {
    workflow.savePublication(result.value.id, title.value, intro.value);
    saved.value = true;
    error.value = "";
    notify("模拟发布草稿已保存");
  } catch (e) {
    error.value = workflowError(e);
  }
}
</script>
<template>
  <KbPage title="发布准备" subtitle="确认资料，再准备发布内容" backable>
    <template v-if="canPrepare && submission && result">
      <view class="kb-card"
        ><text class="publish-label"
          >关联结果 · 第 {{ submission.revision }} 版</text
        ><text class="publish-title">{{
          displayTitle(submission.snapshot, submission.id)
        }}</text
        ><text class="publish-copy"
          >本页仅保存模拟发布草稿，不会对外发布或同步到现有发布台。</text
        ></view
      >
      <KbSection title="发布内容"
        ><view class="kb-card"
          ><view class="publish-field" data-testid="publication-title"
            ><text>资料标题</text
            ><up-input
              v-model="title"
              placeholder="给资料写一个清楚的标题"
              maxlength="80"
              border="none"
              :custom-style="{
                background: '#f7f6fc',
                padding: '13px',
                borderRadius: '12px',
              }"
              @change="saved = false" /></view
          ><view class="publish-field" data-testid="publication-intro"
            ><text>资料介绍</text
            ><up-textarea
              v-model="intro"
              placeholder="说明内容、适用场景与使用方法"
              maxlength="500"
              count
              border="none"
              :height="120"
              :custom-style="{ background: '#f7f6fc', borderRadius: '12px' }"
              @change="saved = false" /></view></view
      ></KbSection>
      <KbSection title="交付准备"
        ><view class="kb-card"
          ><view class="publish-row"
            ><text>关联文件</text
            ><text>{{
              result.artifacts.includes("answer")
                ? "学生版＋答案版（模拟）"
                : "学生版（模拟）"
            }}</text></view
          ><view class="publish-row"
            ><text>网盘与外部平台</text><text>未接入</text></view
          ><view class="publish-row"
            ><text>发布状态</text
            ><text>{{ saved ? "模拟草稿已保存" : "待保存" }}</text></view
          ></view
        ></KbSection
      >
      <text v-if="error" class="flow-error">{{ error }}</text>
      <view class="publish-actions"
        ><KbButton label="保存模拟发布草稿" @click="save" /><text
          v-if="saved && publication"
          class="saved-note"
          data-testid="publication-saved"
          >已保存，仍是未发布的模拟草稿</text
        ><view class="publish-back"
          ><KbButton
            label="返回制作结果"
            secondary
            @click="
              go(`/pages/result/index?id=${id}&submission=${submission.id}`)
            " /></view
      ></view>
    </template>
    <KbState
      v-else
      state="empty"
      :title="result ? '请先确认这份结果' : '还没有可准备的成品'"
      description="从已完成的制作结果进入；只录题回执不进入发布流程"
      action="查看制作记录"
      @retry="go('/pages/records/index')"
    />
  </KbPage>
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
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.publish-copy {
  font-size: 12px;
  color: #9694a8;
  line-height: 1.9;
}
.publish-field > text {
  display: block;
  font-size: 13px;
  color: #77718b;
  margin-bottom: 12px;
}
.publish-field + .publish-field {
  margin-top: 24px;
}
.publish-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  font-size: 12px;
  color: #85889f;
  border-bottom: 1px solid #f4f4f9;
}
.publish-row:last-child {
  border: 0;
}
.publish-row text:last-child {
  font-size: 11px;
  color: #9c92ad;
  text-align: right;
}
.publish-actions {
  margin-top: 24px;
}
.publish-back {
  margin-top: 12px;
}
.saved-note {
  display: block;
  font-size: 12px;
  color: #71a18c;
  text-align: center;
  margin: 16px 0;
  line-height: 1.8;
}
.flow-error {
  display: block;
  color: #bc7777;
  font-size: 12px;
  line-height: 1.8;
  margin-top: 16px;
}
</style>
