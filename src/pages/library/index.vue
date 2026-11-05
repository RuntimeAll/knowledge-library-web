<script setup lang="ts">
import { computed, ref } from "vue";
import KbPage from "../../components/ui/KbPage.vue";
import KbChips from "../../components/ui/KbChips.vue";
import KbSearch from "../../components/ui/KbSearch.vue";
import KbState from "../../components/ui/KbState.vue";
import { sampleResources } from "../../fixtures/skeleton";
import { matchResource, type ResourceSummary } from "../../core/skeleton";
import { useDraftStore } from "../../stores/draft";
import { go } from "../../adapters/platform/navigation";
const category = ref("questions");
const subject = ref("全部");
const query = ref("");
const draft = useDraftStore();
const categories = [
  { label: "大纲", value: "outlines" },
  { label: "考点", value: "points" },
  { label: "题目", value: "questions" },
  { label: "成品课件", value: "products" },
];
const items = computed(() =>
  sampleResources.filter((x) =>
    matchResource(
      x,
      category.value as ResourceSummary["category"],
      subject.value,
      query.value,
    ),
  ),
);
</script>
<template>
  <KbPage title="题库" eyebrow="好题积累，随时取用"
    ><view class="category-tabs"
      ><button
        v-for="c in categories"
        :key="c.value"
        :class="{ selected: category === c.value }"
        @click="
          category = c.value;
          query = '';
        "
      >
        {{ c.label }}
      </button></view
    ><KbSearch
      v-model="query"
      :placeholder="`搜索${categories.find((x) => x.value === category)?.label}`"
    /><KbChips
      v-model="subject"
      small
      :options="['全部', '数学', '科学'].map((x) => ({ label: x, value: x }))"
    /><text class="kb-preview-note">当前展示页面示例，正式内容待接入</text
    ><KbState
      v-if="!items.length"
      state="empty"
      title="暂无匹配内容"
      description="试试其他关键词或学科"
    /><view v-for="item in items" :key="item.id" class="resource-card kb-card"
      ><view class="kb-row"
        ><text class="resource-subject">{{ item.subject }}</text
        ><text class="resource-sample">示例</text></view
      ><view @click="go(`/pages/resource-detail/index?id=${item.id}`)"
        ><text class="resource-title">{{ item.title }}</text
        ><text class="resource-description">{{ item.description }}</text></view
      ><view class="resource-bottom"
        ><text>{{ item.meta }}</text
        ><button
          v-if="item.usable"
          :class="{ picked: draft.spec.referenceIds.includes(item.id) }"
          @click="draft.toggleReference(item.id)"
        >
          {{
            draft.spec.referenceIds.includes(item.id) ? "已选 ✓" : "选作参考"
          }}</button
        ><button
          v-else
          @click="go(`/pages/resource-detail/index?id=${item.id}`)"
        >
          查看 ›
        </button></view
      ></view
    ><view
      v-if="draft.spec.referenceIds.length"
      class="reference-bar"
      @click="go('/pages/configure/index')"
      ><text>已选 {{ draft.spec.referenceIds.length }} 道参考题</text
      ><text>去配置练习 →</text></view
    ></KbPage
  >
</template>
<style scoped>
.category-tabs {
  display: flex;
  border-bottom: 1px solid #ececf5;
}
.category-tabs button {
  flex: 1;
  margin: 0;
  background: none;
  padding: 0;
  font-size: 13px;
  line-height: 48px;
  color: #9a9daf;
  border-radius: 0;
}
.category-tabs button::after {
  border: 0;
}
.category-tabs button.selected {
  color: #7765d3;
  font-weight: 600;
  border-bottom: 3px solid #8170dc;
}
.resource-card {
  margin-bottom: 14px;
}
.resource-subject {
  font-size: 11px;
  color: #a3a7b6;
}
.resource-sample {
  font-size: 10px;
  color: #b3abc9;
  background: #f5f2fa;
  padding: 3px 7px;
  border-radius: 4px;
}
.resource-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #51556c;
  line-height: 1.6;
  margin-top: 14px;
}
.resource-description {
  display: block;
  color: #888da1;
  font-size: 12px;
  line-height: 1.9;
  margin-top: 12px;
}
.resource-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f1f2f7;
  margin-top: 18px;
  padding-top: 12px;
}
.resource-bottom > text {
  font-size: 10px;
  color: #b0b4c2;
  flex: 1;
  line-height: 1.7;
  margin-right: 8px;
}
.resource-bottom button {
  font-size: 11px;
  color: #a0a0b8;
  margin: 0;
  padding: 0 8px;
  background: none;
  line-height: 32px;
  flex-shrink: 0;
}
.resource-bottom button::after {
  border: 0;
}
.resource-bottom button.picked {
  background: #eeebfc;
  color: #8171cb;
  border-radius: 8px;
}
.reference-bar {
  margin-top: 16px;
  background: #e9e4ff;
  color: #8773cd;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
</style>
