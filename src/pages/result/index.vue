<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import { downloadClientFile } from "../../adapters/client/tasks";
import type { ClientResultFile } from "../../core/client-task";
const client = useClientTasksStore(),
  taskId = ref(""),
  resultId = ref(""),
  error = ref(""),
  busyFile = ref("");
const task = computed(() => client.details[taskId.value]);
const result = computed(
  () =>
    task.value?.results.find((item) => item.id === resultId.value) ||
    task.value?.results[0],
);
onLoad((query) => {
  taskId.value = String(query?.order || "");
  resultId.value = String(query?.result || "");
});
onShow(async () => {
  if (!taskId.value) return;
  try {
    await client.loadDetail(taskId.value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "结果暂时无法读取";
  }
});
function role(file: ClientResultFile) {
  return file.role === "STUDENT"
    ? "学生版"
    : file.role === "ANSWER" || file.role === "TEACHER"
      ? "教师版"
      : "成品文件";
}
async function download(file: ClientResultFile) {
  if (busyFile.value) return;
  error.value = "";
  busyFile.value = file.id;
  try {
    await downloadClientFile(taskId.value, file.id, file.fileName);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "文件暂时无法下载";
  } finally {
    busyFile.value = "";
  }
}
</script>
<template>
  <KbPage title="制作结果" :subtitle="task?.displayTitle" backable
    ><text v-if="error" class="client-error">{{ error }}</text
    ><view v-if="result"
      ><view class="client-card"
        ><view class="client-row"
          ><text class="client-title"
            >完整成品 · 第 {{ result.resultVersion }} 版</text
          ><text class="client-status">{{
            result.state === "READY" ? "已就绪" : result.state
          }}</text></view
        ><text class="client-hint">{{
          result.summary?.message || "本次处理结果已保存，可查看下方文件。"
        }}</text
        ><text v-if="task?.mode === 'PRACTICE'" class="client-hint"
          >{{
            task.configSnapshot.modeOptions.copyCount
          }}
          次练习编为同一份资料，学生版与教师版分别提供整册文件。</text
        ></view
      ><view v-for="file in result.files" :key="file.id" class="client-card"
        ><text class="client-title">{{ role(file) }}</text
        ><text class="client-hint">{{ file.fileName }}</text
        ><text class="client-hint"
          >{{ (file.size / 1024 / 1024).toFixed(2) }} MB{{
            file.pageCount ? ` · ${file.pageCount} 页` : ""
          }}</text
        ><text v-if="role(file) === '教师版'" class="client-hint"
          >与学生版配套，答案按制作要求标红。</text
        ><view class="file-action"
          ><KbButton
            :label="`下载整册${role(file)}`"
            :loading="busyFile === file.id"
            :disabled="!file.available || (!!busyFile && busyFile !== file.id)"
            @click="download(file)" /></view></view
      ><view v-if="!result.files.length" class="client-card"
        ><text class="client-title">处理回执</text
        ><text class="client-hint">{{
          result.summary?.message ||
          "本次任务返回处理摘要，没有需要下载的成品文件。"
        }}</text
        ><text
          v-if="result.summary?.questionCount !== undefined"
          class="client-hint"
          >已处理题目：{{ result.summary.questionCount }}</text
        ><text
          v-if="result.summary?.sourceCount !== undefined"
          class="client-hint"
          >已保存来源：{{ result.summary.sourceCount }}</text
        ></view
      ></view
    ><view v-else class="client-empty">尚未读取到可取用的结果。</view></KbPage
  >
</template>
<style scoped>
.file-action {
  margin-top: 20px;
}
</style>
