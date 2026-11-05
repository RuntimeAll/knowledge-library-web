<script setup lang="ts">
import { ref } from "vue";
import { useDraftStore } from "../../stores/draft";
import {
  chooseImages,
  choosePdf,
  fileCapabilities,
  openAttachment,
} from "../../adapters/platform/files";
import { go, notify } from "../../adapters/platform/navigation";
import type { Attachment } from "../../core/skeleton";
import { sampleResources } from "../../fixtures/skeleton";
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
defineEmits<{ practice: [] }>();
const draft = useDraftStore();
const uploadOpen = ref(false);
function referenceTitle(id: string) {
  return sampleResources.find((item) => item.id === id)?.title || "所选参考题";
}
function moveReference(index: number, delta: number) {
  const list = draft.spec.referenceIds;
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}
function preview(file: Attachment) {
  if (!file.path) {
    notify("临时文件已失效，请移除后重新选择");
    return;
  }
  openAttachment(file);
}
function removeReference(id: string) {
  draft.toggleReference(id);
  if (draft.spec.attachments.length) draft.spec.sourceQuestionCount = null;
}
function removeFile(id: string) {
  draft.spec.attachments = draft.spec.attachments.filter(
    (file) => file.id !== id,
  );
  draft.spec.sourceQuestionCount = null;
}
async function pick(kind: "image" | "pdf") {
  uploadOpen.value = false;
  if (draft.spec.attachments.length >= 20) {
    notify("最多添加 20 份资料");
    return;
  }
  try {
    const files = await (kind === "image" ? chooseImages() : choosePdf());
    if (files.some((file) => file.size > 20 * 1024 * 1024)) {
      notify("请选择 20 MB 以内的文件");
      return;
    }
    draft.addFiles(files);
    draft.spec.sourceQuestionCount = null;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String((error as { errMsg?: string }).errMsg || "选择文件失败");
    if (!message.includes("cancel")) notify(message);
  }
}
</script>
<template>
  <view class="attachment-box" :class="{ compact }">
    <view
      v-if="
        !compact &&
        !draft.spec.attachments.length &&
        !draft.spec.referenceIds.length
      "
      class="attachment-empty"
    >
      <up-icon name="attach" color="#a69be9" size="23" />
      <text>还没有参考资料</text
      ><text class="upload-hint">可添加照片、PDF，或从题库选择母题</text>
    </view>
    <view v-if="draft.spec.attachments.length" class="attachment-list">
      <view
        v-for="(file, index) in draft.spec.attachments"
        :key="file.id"
        class="attachment-item"
      >
        <view class="attachment-file" @click="preview(file)"
          ><up-icon
            :name="file.kind === 'pdf' ? 'file-text' : 'photo'"
            size="21"
            color="#8f83d4"
          /><text
            >{{ index + 1 }}. {{ file.name
            }}{{ file.path ? "" : "（需重新选择）" }}</text
          ></view
        >
        <button class="remove-file" @click="removeFile(file.id)">移除</button>
      </view>
    </view>
    <view v-if="draft.spec.referenceIds.length" class="reference-list">
      <text class="reference-summary"
        >已选 {{ draft.spec.referenceIds.length }} 道母题 · 按以下顺序生成</text
      >
      <view
        v-for="(id, index) in draft.spec.referenceIds"
        :key="id"
        class="reference-item"
      >
        <view class="reference-copy"
          ><text class="reference-order">{{ index + 1 }}</text
          ><text>{{ referenceTitle(id) }}</text></view
        >
        <view class="reference-actions"
          ><button
            :disabled="index === 0"
            aria-label="母题上移"
            @click="moveReference(index, -1)"
          >
            ↑</button
          ><button
            :disabled="index === draft.spec.referenceIds.length - 1"
            aria-label="母题下移"
            @click="moveReference(index, 1)"
          >
            ↓</button
          ><button @click="removeReference(id)">移除</button></view
        >
      </view>
    </view>
    <view v-if="compact" class="composer-tools">
      <button @click="uploadOpen = true">
        <up-icon name="attach" size="18" color="#7c7595" /><text>上传资料</text>
      </button>
      <button @click="go('/pages/library/index')">
        <up-icon name="grid" size="18" color="#7c7595" /><text>从题库选</text>
      </button>
      <button class="practice-entry" @click="$emit('practice')">
        <text>专项练习</text
        ><up-icon name="arrow-right" size="10" color="#7461cb" />
      </button>
    </view>
    <view v-else class="attachment-actions">
      <button @click="pick('image')">
        <up-icon name="photo" size="17" color="#9495ac" /><text>图片</text>
      </button>
      <button :disabled="!fileCapabilities.pdf" @click="pick('pdf')">
        <up-icon name="file-text" size="17" color="#9495ac" /><text>PDF</text>
      </button>
      <button @click="go('/pages/library/index')">
        <up-icon name="grid" size="17" color="#9495ac" /><text>题库选题</text>
      </button>
    </view>
    <text v-if="!fileCapabilities.pdf && !compact" class="capability-hint"
      >当前 App 支持图片，PDF 文件选择待接入。</text
    >
  </view>
  <up-popup
    :show="uploadOpen"
    mode="bottom"
    :round="24"
    @close="uploadOpen = false"
  >
    <view class="upload-sheet"
      ><text class="upload-heading">添加参考资料</text
      ><text class="upload-note">资料按选择顺序保留，单个文件不超过 20 MB</text
      ><button class="upload-choice" @click="pick('image')">
        <up-icon name="photo" color="#8f83d4" size="24" /><text
          >选择图片</text
        ></button
      ><button
        class="upload-choice"
        :disabled="!fileCapabilities.pdf"
        @click="pick('pdf')"
      >
        <up-icon name="file-text" color="#8f83d4" size="24" /><text
          >选择 PDF</text
        ></button
      ><text v-if="!fileCapabilities.pdf" class="capability-hint"
        >当前 App 的 PDF 文件选择待接入。</text
      ></view
    >
  </up-popup>
</template>
<style scoped>
.attachment-box {
  border: 1px dashed #dcd7f1;
  background: #fbfaff;
  border-radius: 16px;
  overflow: hidden;
}
.attachment-box.compact {
  background: transparent;
  border: 0;
  border-radius: 0;
}
.attachment-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 22px 12px;
  color: #88829a;
  font-size: 13px;
  gap: 10px;
}
.upload-hint {
  font-size: 11px;
  color: #aaa4bb;
}
.attachment-list,
.reference-list {
  margin-bottom: 8px;
}
.compact .attachment-list,
.compact .reference-list {
  background: #f8f6ff;
  border-radius: 12px;
}
.attachment-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0edf8;
}
.attachment-file {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.attachment-file text {
  font-size: 12px;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.remove-file {
  font-size: 12px;
  color: #8d809e;
  padding: 4px 6px;
  margin: 0;
  background: none;
  line-height: 32px;
}
.remove-file::after,
.attachment-actions button::after,
.composer-tools button::after,
.reference-actions button::after,
.upload-choice::after {
  border: 0;
}
.reference-summary,
.capability-hint {
  display: block;
  font-size: 11px;
  color: #8d83b6;
  padding: 10px 12px;
  line-height: 1.8;
}
.reference-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  gap: 8px;
}
.reference-copy {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  font-size: 12px;
  color: #736b8e;
}
.reference-copy > text:last-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reference-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  color: #8a79bc;
  background: #eeebfa;
  flex-shrink: 0;
  margin-right: 7px;
  font-size: 10px;
}
.reference-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.reference-actions button {
  font-size: 11px;
  background: none;
  color: #8c7ca7;
  line-height: 32px;
  padding: 0 6px;
  margin: 0;
}
.reference-actions button[disabled] {
  color: #d0cbdc;
}
.attachment-actions {
  border-top: 1px dashed #e8e3f5;
  display: flex;
  padding: 6px 3px;
}
.attachment-actions button {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  color: #9793ac;
  font-size: 11px;
  line-height: 34px;
  margin: 0;
  padding: 0;
}
.attachment-actions text {
  margin-left: 6px;
}
.composer-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
}
.composer-tools button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1;
  margin: 0;
  padding: 0 3px;
  line-height: 42px;
  font-size: 12px;
  background: #f7f6fb;
  color: #7c7595;
  border-radius: 10px;
  white-space: nowrap;
}
.composer-tools .practice-entry {
  background: #f0ecff;
  color: #7461cb;
}
.upload-sheet {
  padding: 26px 24px 20px;
  max-width: 760px;
  margin: auto;
}
.upload-heading {
  display: block;
  font-size: 20px;
  font-weight: 650;
  color: #434059;
}
.upload-note {
  display: block;
  font-size: 11px;
  color: #a6a0b5;
  margin-top: 10px;
  margin-bottom: 18px;
}
.upload-choice {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  padding: 18px 16px;
  background: #f8f6fc;
  color: #716681;
  border-radius: 14px;
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
}
.upload-choice[disabled] {
  opacity: 0.5;
}
</style>
