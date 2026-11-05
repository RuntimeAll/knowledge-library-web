<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbChips from "../../components/ui/KbChips.vue";
import KbSearch from "../../components/ui/KbSearch.vue";
import KbState from "../../components/ui/KbState.vue";
import WorkflowRecordCard from "../../components/business/WorkflowRecordCard.vue";
import { useWorkflowStore } from "../../stores/workflow";
import { go } from "../../adapters/platform/navigation";
import { workflowError } from "../../components/business/workflow-display";
const workflow = useWorkflowStore();
const filter = ref("all");
const query = ref("");
const page = ref(1);
const error = ref("");
const pageSize = 6;
watch([filter, query], () => {
  page.value = 1;
});
onShow(() => {
  try {
    workflow.refresh();
    error.value = "";
  } catch (e) {
    error.value = workflowError(e);
  }
});
const listing = computed(() => {
  // The adapter owns filtering and paging. Reading the view tracks store refreshes.
  void workflow.orders;
  if (!workflow.isAuthenticated)
    return { items: [], total: 0, page: 1, pageSize, error: "" };
  try {
    return {
      ...workflow.listOrders({
        page: page.value,
        pageSize,
        query: query.value,
        filter: filter.value as "all" | "pending" | "done",
      }),
      error: "",
    };
  } catch (e) {
    return { items: [], total: 0, page: 1, pageSize, error: workflowError(e) };
  }
});
const pageError = computed(() => error.value || listing.value.error);
const maxPage = computed(() =>
  Math.max(1, Math.ceil(listing.value.total / pageSize)),
);
</script>
<template>
  <KbPage title="制作记录" eyebrow="每一份进展，都在这里">
    <KbSearch v-model="query" placeholder="搜索制作记录" />
    <KbChips
      v-model="filter"
      :options="[
        { label: '全部', value: 'all' },
        { label: '待处理', value: 'pending' },
        { label: '已完成', value: 'done' },
      ]"
    />
    <text class="kb-preview-note"
      >admin 演示记录 · 共 {{ listing.total }} 条，未写入正式资料库</text
    >
    <KbState
      v-if="pageError"
      state="error"
      :description="pageError"
      @retry="
        workflow.refresh();
        error = '';
      "
    />
    <template v-else>
      <WorkflowRecordCard
        v-for="order in listing.items"
        :key="order.id"
        :order="order"
        @open="go(`/pages/record-detail/index?id=${$event}`)"
      />
      <KbState
        v-if="!listing.items.length"
        state="empty"
        :title="query || filter !== 'all' ? '暂无匹配记录' : '还没有制作记录'"
        :description="
          query || filter !== 'all'
            ? '试试其他关键词或状态'
            : '从工作台配置并提交第一份模拟资料'
        "
        action="去工作台"
        @retry="go('/pages/index/index')"
      />
      <view v-if="listing.total > pageSize" class="pagination"
        ><button :disabled="page <= 1" @click="page--">上一页</button
        ><text>{{ page }} / {{ maxPage }}</text
        ><button :disabled="page >= maxPage" @click="page++">
          下一页
        </button></view
      >
    </template>
  </KbPage>
</template>
<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 12px;
  color: #928aa8;
}
.pagination button {
  font-size: 12px;
  padding: 0 16px;
  line-height: 40px;
  border-radius: 10px;
  background: #eeeaf8;
  color: #8878ba;
  margin: 0;
}
.pagination button::after {
  border: 0;
}
.pagination button[disabled] {
  opacity: 0.4;
}
</style>
