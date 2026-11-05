<script setup lang="ts">
import { computed, ref } from "vue";
import KbPage from "../../components/ui/KbPage.vue";
import KbChips from "../../components/ui/KbChips.vue";
import KbSearch from "../../components/ui/KbSearch.vue";
import KbState from "../../components/ui/KbState.vue";
import TaskCard from "../../components/business/TaskCard.vue";
import { sampleTasks } from "../../fixtures/skeleton";
import { go } from "../../adapters/platform/navigation";
const filter = ref("all");
const query = ref("");
const list = computed(() =>
  sampleTasks.filter(
    (t) =>
      t.title.includes(query.value.trim()) &&
      (filter.value === "all" ||
        (filter.value === "done"
          ? t.status === "completed"
          : t.status !== "completed")),
  ),
);
</script>
<template>
  <KbPage title="制作记录" eyebrow="每一份进展，都在这里"
    ><KbSearch v-model="query" placeholder="搜索制作记录" /><KbChips
      v-model="filter"
      :options="[
        { label: '全部', value: 'all' },
        { label: '待处理', value: 'pending' },
        { label: '已完成', value: 'done' },
      ]" /><text class="kb-preview-note">以下为不同状态的示例记录</text
    ><TaskCard
      v-for="task in list"
      :key="task.id"
      :task="task"
      @open="go(`/pages/record-detail/index?id=${$event}`)" /><KbState
      v-if="!list.length"
      state="empty"
      title="还没有制作记录"
  /></KbPage>
</template>
