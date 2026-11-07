<script setup lang="ts">
import { computed, ref } from "vue";
import type { DraftSpec } from "../../core/skeleton";
import type { MockResult, ResultArtifact } from "../../core/workflow";
import { demoLines } from "../../core/demo-document";
import { downloadDemoFile } from "../../adapters/platform/demo-files";
import { notify } from "../../adapters/platform/navigation";
const props = withDefaults(
  defineProps<{ result?: MockResult; spec?: DraftSpec; copyIndex?: number }>(),
  { copyIndex: 1 },
);
const labels = { student: "学生版", answer: "教师版", receipt: "录题回执" };
const preview = ref<ResultArtifact | null>(null);
const lines = computed(() =>
  props.result && props.spec && preview.value && preview.value !== "receipt"
    ? demoLines(props.spec, props.result, preview.value)
    : [],
);
function download(kind: ResultArtifact) {
  if (!props.result || !props.spec) return;
  try {
    downloadDemoFile(props.spec, props.result, kind);
  } catch (e) {
    notify(e instanceof Error ? e.message : "暂时无法取用文件");
  }
}
</script>
<template>
  <view class="result-files"
    ><template v-if="result && spec"
      ><view v-for="kind in result.artifacts" :key="kind" class="result-file"
        ><view class="pdf-icon"
          ><up-icon name="file-text" size="25" color="#9f97cc" /><text>{{
            kind === "receipt" ? "JSON" : "PDF"
          }}</text></view
        ><view class="result-name"
          ><text>{{ labels[kind] }}</text
          ><text class="file-hint">{{
            result.mode === "practice"
              ? `整册 · 共 ${result.practiceCopies ?? 1} 次练习`
              : "本次配置的模拟文件"
          }}</text></view
        ><view class="file-actions"
          ><button
            v-if="kind !== 'receipt'"
            class="file-action secondary"
            @click="preview = kind"
          >
            预览{{ labels[kind] }}</button
          ><button class="file-action" @click="download(kind)">
            下载整册{{ labels[kind] }}
          </button></view
        ></view
      ><text class="file-note"
        >文件明确标注模拟，不含正式题面、正式答案或入库批准。</text
      ></template
    ><view v-else class="missing-file"
      ><up-icon name="file-text" size="26" color="#a69cca" /><text
        >正式文件尚未接入</text
      ></view
    ><up-popup
      :show="!!preview"
      mode="bottom"
      :round="22"
      @close="preview = null"
      ><view class="preview-head"
        ><text>{{ preview ? labels[preview] : "" }} · 模拟预览</text
        ><button @click="preview = null">关闭预览</button></view
      ><scroll-view scroll-y class="preview-content"
        ><view class="preview-paper"
          ><text
            v-for="(line, i) in lines"
            :key="i"
            class="preview-line"
            :class="{ 'answer-line': line.red, 'large-line': line.large }"
            >{{ line.text }}</text
          ></view
        ></scroll-view
      ></up-popup
    ></view
  >
</template>
<style scoped>
.result-file {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #eeeef6;
  border-radius: 15px;
  padding: 14px;
  margin-bottom: 10px;
}
.pdf-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f4f2fc;
  border-radius: 10px;
}
.pdf-icon text {
  font-size: 9px;
  color: #8b82a6;
  margin-top: 4px;
}
.result-name {
  flex: 1;
  margin-left: 12px;
  font-size: 14px;
  color: #4e526b;
  min-width: 0;
}
.file-hint {
  display: block;
  font-size: 10px;
  color: #9294aa;
  margin-top: 7px;
  line-height: 1.7;
}
.file-actions {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-left: 6px;
}
.file-action {
  font-size: 11px;
  color: #7c6bb4;
  background: #eee9fc;
  border-radius: 9px;
  line-height: 32px;
  padding: 0 9px;
  margin: 0;
}
.file-action::after {
  border: 0;
}
.file-action.secondary {
  background: #f7f5fc;
}
.file-note {
  display: block;
  font-size: 10px;
  line-height: 1.9;
  color: #9393aa;
  margin: 12px 2px;
}
.missing-file {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 25px;
  color: #9c95b3;
  font-size: 12px;
  gap: 12px;
}
.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  font-size: 16px;
  color: #5b5573;
}
.preview-head button {
  margin: 0;
  line-height: 34px;
  background: #f2eefb;
  color: #8b79bd;
  font-size: 11px;
  border-radius: 10px;
}
.preview-head button::after {
  border: 0;
}
.preview-content {
  height: 65vh;
  background: #f3f4f9;
}
.preview-paper {
  background: white;
  margin: 16px;
  padding: 24px 18px;
}
.preview-line {
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 12px;
  color: #4d4f65;
  line-height: 2;
  margin-bottom: 8px;
}
.answer-line {
  color: #d32f2f;
}
.large-line {
  font-size: 16px;
  font-weight: 600;
}
</style>
