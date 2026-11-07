<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbBottomAction from "../../components/ui/KbBottomAction.vue";
import KbChips from "../../components/ui/KbChips.vue";
import ClientPracticeOptions from "../../components/business/client/ClientPracticeOptions.vue";
import ClientVariantOptions from "../../components/business/client/ClientVariantOptions.vue";
import ClientCollectionOptions from "../../components/business/client/ClientCollectionOptions.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import { clientModeLabels } from "../../core/client-task";
import {
  chooseImages,
  choosePdf,
  fileCapabilities,
  openAttachment,
} from "../../adapters/platform/files";
import { go, notify } from "../../adapters/platform/navigation";
const client = useClientTasksStore(),
  busy = ref(false),
  error = ref(""),
  templateError = ref("");
const locked = computed(() => busy.value || !!client.pending);
const templateOptions = computed(() => [
  { label: "由制作端按要求选择", value: "" },
  ...client.templates.map((option) => ({
    label: `${option.name} · v${option.versionNo}`,
    value: option.id,
  })),
]);
const templateIndex = computed(() =>
  Math.max(
    0,
    templateOptions.value.findIndex(
      (option) => option.value === client.draft.layoutVersionId,
    ),
  ),
);
const hasOutput = computed(() => client.draft.mode !== "INTAKE");
async function loadTemplates() {
  try {
    templateError.value = "";
    await client.loadTemplates();
  } catch (e) {
    templateError.value = e instanceof Error ? e.message : "模板选项暂不可用";
  }
}
onShow(loadTemplates);
watch(() => client.draft.mode, loadTemplates);
watch(
  () => client.draft,
  () => {
    if (!client.pending && !busy.value) client.lastTaskId = "";
  },
  { deep: true },
);
async function pick(kind: "image" | "pdf") {
  if (locked.value) return;
  if (client.draft.attachments.length >= 20) {
    notify("最多添加 20 个附件");
    return;
  }
  try {
    const files = await (kind === "image" ? chooseImages() : choosePdf());
    if (files.some((file) => file.size > 20 * 1024 * 1024)) {
      notify("单个文件请控制在 20 MB 以内");
      return;
    }
    client.draft.attachments.push(
      ...files
        .slice(0, 20 - client.draft.attachments.length)
        .map((file) => ({ ...file, uploadKey: `client-upload-${file.id}` })),
    );
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : String((e as { errMsg?: string }).errMsg || "选择失败");
    if (!message.includes("cancel")) error.value = message;
  }
}
function preview(index: number) {
  const file = client.draft.attachments[index];
  if (file.path) openAttachment(file);
  else
    notify(
      file.assetId
        ? "资料已上传并将随任务传给制作端"
        : "请移除并重新选择失效的文件",
    );
}
function save() {
  client.saveDraft();
  notify("本机草稿已保存");
}
async function submit() {
  if (busy.value) return;
  if (client.lastTaskId && !client.pending) {
    go(`/pages/record-detail/index?id=${client.lastTaskId}`);
    return;
  }
  error.value = "";
  busy.value = true;
  try {
    const receipt = await client.submit();
    go(`/pages/record-detail/index?id=${receipt.workOrderId}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "提交未完成，请稍后核对";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <KbPage
    :title="clientModeLabels[client.draft.mode]"
    subtitle="整理要求，发布这次制作任务"
    backable
  >
    <view v-if="client.pending" class="pending-note"
      >这次提交的结果待核对，原始输入已保留。请点击下方“查回本次提交”，核对完成前保留当前要求。</view
    >
    <view class="client-card">
      <text class="client-label first"
        >资料名称 <text class="optional">选填</text></text
      ><input
        v-model="client.draft.title"
        class="client-input"
        maxlength="80"
        placeholder="给这份资料起个名字"
        :disabled="locked"
      />
      <ClientPracticeOptions
        v-if="client.draft.mode === 'PRACTICE'"
        :disabled="locked"
      />
      <ClientVariantOptions
        v-else-if="client.draft.mode === 'VARIANT'"
        :disabled="locked"
      />
      <ClientCollectionOptions
        v-else-if="client.draft.mode === 'ERROR_COLLECTION'"
        :disabled="locked"
      />
      <view v-else class="intake-note"
        ><text class="client-hint"
          >上传原始题目资料，制作端整理后保存到知识库。处理回执会出现在任务记录中。</text
        ></view
      >
      <text class="client-label">学科</text
      ><KbChips
        v-if="!locked"
        :model-value="client.draft.subject"
        :options="[
          { label: '数学', value: 'MATH' },
          { label: '科学', value: 'SCIENCE' },
        ]"
        @update:model-value="
          client.draft.subject = $event as 'MATH' | 'SCIENCE'
        "
      /><text v-else class="client-hint">{{
        client.draft.subject === "MATH" ? "数学" : "科学"
      }}</text>
      <view v-if="hasOutput"
        ><text class="client-label">排版模板</text
        ><picker
          :range="templateOptions"
          range-key="label"
          :value="templateIndex"
          :disabled="locked"
          @change="
            client.draft.layoutVersionId =
              templateOptions[Number($event.detail.value)].value
          "
          ><view class="client-input">{{
            templateOptions[templateIndex].label
          }}</view></picker
        ><text v-if="templateError" class="client-hint">{{
          templateError
        }}</text
        ><text v-else class="client-hint"
          >只显示当前任务类型适用的已发布模板；不指定时由制作端按要求处理。</text
        ><view class="client-row answer-row"
          ><view
            ><text class="client-label answer-label">附带教师版</text
            ><text class="client-hint">与学生版配套，答案默认红色</text></view
          ><up-switch
            v-model="client.draft.includeAnswer"
            active-color="#7d69c8"
            :disabled="locked" /></view
      ></view>
      <text class="client-label">制作要求</text
      ><textarea
        v-model="client.draft.requirements"
        class="client-textarea"
        maxlength="4000"
        placeholder="说明内容范围、难度、留白或其他要求"
        :disabled="locked"
      />
      <view v-if="client.draft.mode !== 'ERROR_COLLECTION'"
        ><text class="client-label"
          >处理范围 <text class="optional">选填</text></text
        ><input
          v-model="client.draft.selectionNote"
          class="client-input"
          maxlength="1000"
          placeholder="如：第 1—2 页、圈出的完整题目"
          :disabled="locked"
      /></view>
    </view>
    <view class="client-card"
      ><text class="client-title">参考资料</text
      ><text class="client-hint">附件按当前顺序处理，原件会随任务保存。</text
      ><view
        v-for="(file, index) in client.draft.attachments"
        :key="file.id"
        class="attachment-row"
        ><view class="attachment-copy" @click="preview(index)"
          ><text>{{ index + 1 }}. {{ file.name }}</text
          ><text class="client-hint">{{
            file.assetId
              ? "已上传"
              : file.path
                ? "提交时上传"
                : "临时文件失效，请重新选择"
          }}</text></view
        ><button
          class="client-action"
          :disabled="locked"
          @click="client.draft.attachments.splice(index, 1)"
        >
          移除
        </button></view
      ><view class="client-buttons"
        ><view
          ><KbButton
            label="添加图片"
            secondary
            :disabled="locked"
            @click="pick('image')" /></view
        ><view
          ><KbButton
            label="添加 PDF"
            secondary
            :disabled="locked || !fileCapabilities.pdf"
            @click="pick('pdf')" /></view></view
      ><text v-if="!fileCapabilities.pdf" class="client-hint"
        >当前 App 支持图片，PDF 文件选择待平台能力接入。</text
      ></view
    >
    <text v-if="error" class="client-error">{{ error }}</text
    ><text v-if="client.uploadingName" class="client-hint"
      >正在上传：{{ client.uploadingName }}</text
    >
    <text class="client-hint bottom-note"
      >任务受理后可离开页面；稍后到“记录”查看进度和完整成品。</text
    >
    <KbBottomAction
      ><view class="action-row"
        ><view class="save"
          ><KbButton
            label="存本机草稿"
            secondary
            :disabled="locked"
            @click="save" /></view
        ><view class="submit"
          ><KbButton
            :label="
              client.pending
                ? '查回本次提交'
                : client.lastTaskId
                  ? '查看已提交任务'
                  : '发布任务'
            "
            :loading="busy"
            @click="submit" /></view></view
    ></KbBottomAction>
  </KbPage>
</template>
<style scoped>
.first {
  margin-top: 0;
}
.optional {
  font-size: 11px;
  color: #b0a6bd;
  font-weight: 400;
  margin-left: 5px;
}
.answer-row {
  margin: 22px 0;
}
.answer-label {
  margin: 0;
}
.intake-note {
  margin: 16px 0;
}
.attachment-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0edf5;
}
.attachment-copy {
  min-width: 0;
  flex: 1;
  font-size: 12px;
  color: #746c89;
  overflow-wrap: anywhere;
}
.action-row {
  display: flex;
  gap: 10px;
}
.save {
  flex: 0 0 36%;
}
.submit {
  flex: 1;
  min-width: 0;
}
.bottom-note {
  margin-bottom: 20px;
}
.pending-note {
  font-size: 12px;
  line-height: 1.9;
  color: #91794e;
  background: #fff4df;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 18px;
}
</style>
