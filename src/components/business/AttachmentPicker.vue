<script setup lang="ts">
import { useDraftStore } from "../../stores/draft";
import {
  chooseImages,
  choosePdf,
  fileCapabilities,
  openAttachment,
} from "../../adapters/platform/files";
import { go, notify } from "../../adapters/platform/navigation";
const draft = useDraftStore();
async function pick(kind: "image" | "pdf") {
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
  <view class="attachment-box">
    <view
      v-if="!draft.spec.attachments.length"
      class="attachment-empty"
      @click="pick('image')"
      ><view class="upload-icon"
        ><up-icon name="plus" color="#a69be9" size="24" /></view
      ><text class="upload-title">添加这次的参考资料</text
      ><text class="upload-hint">照片、PDF，或从题库选几道题</text></view
    >
    <view v-else class="attachment-list"
      ><view
        v-for="file in draft.spec.attachments"
        :key="file.id"
        class="attachment-item"
        ><view class="attachment-file" @click="openAttachment(file)"
          ><up-icon
            :name="file.kind === 'pdf' ? 'file-text' : 'photo'"
            size="23"
            color="#8f83d4"
          /><text>{{ file.name }}</text></view
        ><button
          class="remove-file"
          @click="
            draft.spec.attachments = draft.spec.attachments.filter(
              (x) => x.id !== file.id,
            )
          "
        >
          移除
        </button></view
      ></view
    >
    <view v-if="draft.spec.referenceIds.length" class="reference-summary"
      >已选 {{ draft.spec.referenceIds.length }} 道参考题（示例）</view
    >
    <view class="attachment-actions"
      ><button @click="pick('image')">
        <up-icon name="photo" size="17" color="#9495ac" /><text
          >图片</text
        ></button
      ><button :disabled="!fileCapabilities.pdf" @click="pick('pdf')">
        <up-icon name="file-text" size="17" color="#9495ac" /><text
          >PDF</text
        ></button
      ><button @click="go('/pages/library/index')">
        <up-icon name="grid" size="17" color="#9495ac" /><text>题库选题</text>
      </button></view
    >
    <text v-if="!fileCapabilities.pdf" class="capability-hint"
      >当前 App 支持图片，PDF 文件选择待接入。</text
    >
  </view>
</template>
<style scoped>
.attachment-box {
  border: 1px dashed #dcd7f1;
  background: #fbfaff;
  border-radius: 16px;
  overflow: hidden;
}
.attachment-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 26px 12px 23px;
}
.upload-icon {
  width: 42px;
  height: 42px;
  background: #f0ecff;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.upload-title {
  font-size: 13px;
  color: #77758f;
  font-weight: 500;
}
.upload-hint {
  font-size: 10px;
  color: #b1adc4;
  margin-top: 7px;
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
.attachment-actions button::after {
  border: 0;
}
.attachment-actions text {
  margin-left: 6px;
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
  font-size: 11px;
  color: #aaa3b8;
  padding: 4px;
  margin: 0;
  background: none;
  line-height: 28px;
}
.remove-file::after {
  border: 0;
}
.reference-summary,
.capability-hint {
  display: block;
  font-size: 11px;
  color: #8d83b6;
  padding: 10px 12px;
}
</style>
