<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import { clientModeLabels, clientStatusLabels } from "../../core/client-task";
import { go } from "../../adapters/platform/navigation";
const client = useClientTasksStore(),
  error = ref("");
async function load(page = client.pageNum) {
  try {
    error.value = "";
    await client.loadPage(page);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "任务记录暂时不可读取";
  }
}
onShow(() => load());
function date(value: number) {
  return new Date(value).toLocaleString();
}
</script>
<template>
  <KbPage title="制作记录" :subtitle="`共 ${client.total} 个任务`"
    ><template #action
      ><button class="client-action" :disabled="client.loading" @click="load()">
        刷新
      </button></template
    ><text v-if="error" class="client-error">{{ error }}</text
    ><text v-if="client.loading" class="client-hint">正在读取任务……</text
    ><view
      v-for="task in client.rows"
      :key="task.id"
      class="client-card"
      @click="go(`/pages/record-detail/index?id=${task.id}`)"
      ><view class="client-row"
        ><text class="client-title">{{ task.displayTitle }}</text
        ><text class="client-status">{{
          clientStatusLabels[task.status] || task.status
        }}</text></view
      ><text class="client-hint"
        >{{ clientModeLabels[task.mode] }} · 第 {{ task.revision }} 版</text
      ><text class="client-hint">{{ date(task.updatedAt) }}</text></view
    ><view
      v-if="!client.loading && !client.rows.length && !error"
      class="client-empty"
      >还没有制作任务，回到工作台开始这一次制作</view
    ><view class="client-row pager"
      ><button
        class="client-action"
        :disabled="client.pageNum <= 1 || client.loading"
        @click="load(client.pageNum - 1)"
      >
        上一页</button
      ><text
        >{{ client.pageNum }} /
        {{ Math.max(1, Math.ceil(client.total / client.pageSize)) }}</text
      ><button
        class="client-action"
        :disabled="
          client.pageNum * client.pageSize >= client.total || client.loading
        "
        @click="load(client.pageNum + 1)"
      >
        下一页
      </button></view
    ><view class="new-task"
      ><KbButton
        label="发布新任务"
        secondary
        @click="go('/pages/index/index')" /></view
  ></KbPage>
</template>
<style scoped>
.pager {
  margin: 24px 0;
  font-size: 12px;
  color: #a59caf;
}
.new-task {
  margin: 26px 0;
}
</style>
