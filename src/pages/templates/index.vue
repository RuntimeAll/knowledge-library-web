<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbChips from "../../components/ui/KbChips.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import { clientModeLabels, type ClientMode } from "../../core/client-task";
import { go } from "../../adapters/platform/navigation";
const client = useClientTasksStore(),
  error = ref("");
const modes = Object.entries(clientModeLabels).map(([value, label]) => ({
  value,
  label,
}));
async function load() {
  try {
    error.value = "";
    await client.loadTemplates();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "模板暂时无法读取";
  }
}
async function mode(value: string) {
  if (client.pending) {
    error.value = "请先到任务配置查回待确认的提交";
    return;
  }
  client.setMode(value as ClientMode);
  await load();
}
onShow(load);
function choose(id: string) {
  if (client.pending) {
    error.value = "请先到任务配置查回待确认的提交";
    return;
  }
  client.draft.layoutVersionId = id;
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="排版模板" subtitle="按制作类型匹配已发布的适用版本" backable
    ><KbChips
      :model-value="client.draft.mode"
      :options="modes"
      small
      @update:model-value="mode"
    /><text v-if="error" class="client-error">{{ error }}</text
    ><view
      v-for="template in client.templates"
      :key="template.id"
      class="client-card template-card"
      @click="choose(template.id)"
      ><text class="client-title">{{ template.name }}</text
      ><text class="client-hint"
        >第 {{ template.versionNo }} 版 ·
        {{ clientModeLabels[client.draft.mode] }}</text
      ><button class="client-action">使用这个版本</button></view
    ><view v-if="!client.templates.length && !error" class="client-empty">{{
      client.draft.mode === "INTAKE"
        ? "题目录入不强制选择排版模板。"
        : "当前类型尚无已分类的模板，可在任务中说明版式要求。"
    }}</view></KbPage
  >
</template>
<style scoped>
.template-card {
  margin-top: 18px;
}
.template-card .client-action {
  margin-top: 16px;
}
</style>
