<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow, onHide, onUnload } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import {
  clientModeLabels,
  clientStatusLabels,
  draftFromConfig,
} from "../../core/client-task";
import { go } from "../../adapters/platform/navigation";
const client = useClientTasksStore(),
  id = ref(""),
  error = ref(""),
  refreshing = ref(false);
const task = computed(() => client.details[id.value]);
let active = false,
  timer: ReturnType<typeof setTimeout> | undefined;
onLoad((query) => {
  id.value = String(query?.id || "");
});
async function refresh() {
  if (refreshing.value || !id.value) return;
  refreshing.value = true;
  try {
    await client.loadDetail(id.value);
    error.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "任务状态暂时无法读取";
  } finally {
    refreshing.value = false;
  }
}
async function poll() {
  await refresh();
  if (active) timer = setTimeout(poll, 4000);
}
onShow(() => {
  active = true;
  void poll();
});
function stop() {
  active = false;
  if (timer) clearTimeout(timer);
}
onHide(stop);
onUnload(stop);
function copy() {
  if (!task.value) return;
  client.draft = draftFromConfig(task.value.configSnapshot);
  client.lastTaskId = "";
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="任务详情" backable
    ><text v-if="error" class="client-error">{{ error }}</text
    ><view v-if="task"
      ><view class="client-card"
        ><view class="client-row"
          ><text class="client-title">{{ task.displayTitle }}</text
          ><text class="client-status">{{
            clientStatusLabels[task.status] || task.status
          }}</text></view
        ><text class="client-hint"
          >{{ clientModeLabels[task.mode] }} · 第 {{ task.revision }} 版</text
        ><text class="stage">{{
          task.stageMessage || "任务已受理，等待制作端更新进度。"
        }}</text
        ><text class="client-hint">任务编号：{{ task.id }}</text
        ><button
          class="client-action refresh"
          :disabled="refreshing"
          @click="refresh"
        >
          {{ refreshing ? "正在更新" : "刷新进度" }}
        </button></view
      ><view class="client-card"
        ><text class="client-title">本次制作要求</text
        ><text class="requirements">{{
          task.configSnapshot.requirements || "按上传资料和本次配置处理"
        }}</text
        ><text v-if="task.mode === 'PRACTICE'" class="client-hint"
          >每次 {{ task.configSnapshot.modeOptions.questionsPerCopy }} 题 · 共
          {{
            task.configSnapshot.modeOptions.copyCount
          }}
          次练习，合并为完整成品</text
        ><text v-else-if="task.mode === 'VARIANT'" class="client-hint"
          >每母题：{{ task.configSnapshot.modeOptions.originalCount }} 原题 ＋
          {{ task.configSnapshot.modeOptions.variantCount }} 同类变式 ＋
          {{ task.configSnapshot.modeOptions.extensionCount }} 提升</text
        ><text class="client-hint"
          >附件 {{ task.configSnapshot.attachments.length }} 个；{{
            task.configSnapshot.includeAnswer
              ? "需要配套教师版"
              : "不要求教师版"
          }}</text
        ></view
      ><view class="client-card"
        ><text class="client-title">制作结果</text
        ><text v-if="!task.results.length" class="client-hint">{{
          task.status === "FAILED"
            ? "本次处理未完成，请根据状态说明处理。"
            : "完成归档后，完整结果会出现在这里。"
        }}</text
        ><view
          v-for="result in task.results"
          :key="result.id"
          class="result-row"
          ><view
            ><text>第 {{ result.resultVersion }} 版结果</text
            ><text class="client-hint">{{
              result.summary?.message || "查看处理结果及成品文件"
            }}</text></view
          ><button
            class="client-action"
            @click="
              go(`/pages/result/index?order=${task.id}&result=${result.id}`)
            "
          >
            查看结果
          </button></view
        ></view
      ><KbButton label="复制要求，发布新任务" secondary @click="copy" /><text
        class="client-hint"
        >复制会保留已有任务和结果，创建新的制作任务。</text
      ></view
    ><view v-else class="client-empty">{{
      refreshing ? "正在读取任务……" : "暂未读取到任务，请刷新重试"
    }}</view></KbPage
  >
</template>
<style scoped>
.stage {
  display: block;
  font-size: 14px;
  line-height: 1.9;
  color: #84738e;
  margin-top: 22px;
}
.refresh {
  margin-top: 18px;
}
.requirements {
  display: block;
  font-size: 13px;
  color: #80798c;
  line-height: 1.9;
  margin-top: 15px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.result-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-top: 18px;
  font-size: 13px;
  color: #776b88;
}
.result-row > view {
  min-width: 0;
  flex: 1;
}
</style>
