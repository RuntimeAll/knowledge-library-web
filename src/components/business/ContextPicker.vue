<script setup lang="ts">
import { computed, ref } from "vue";
import { useDraftStore } from "../../stores/draft";
import { contextBooks } from "../../fixtures/context";
import KbChips from "../ui/KbChips.vue";
import KbButton from "../ui/KbButton.vue";
const draft = useDraftStore();
const show = ref(false);
const books = computed(() =>
  contextBooks.filter((book) => book.subject === draft.spec.subject),
);
const selectedBook = computed(() =>
  books.value.find((book) => book.value === draft.spec.textbook),
);
const chapters = computed(() => selectedBook.value?.chapters || []);
const points = computed(
  () =>
    chapters.value.find((chapter) => chapter.value === draft.spec.chapter)
      ?.points || [],
);
const subjects = [
  { label: "数学", value: "数学" },
  { label: "科学", value: "科学" },
];
function clearPoints() {
  draft.spec.points = [];
  draft.spec.point = "";
}
function subject(value: string) {
  if (draft.spec.referenceIds.length && value !== draft.spec.subject) {
    uni.showToast({ title: "请先移除已选母题，再切换学科", icon: "none" });
    return;
  }
  if (draft.spec.subject === value) return;
  draft.spec.subject = value;
  draft.spec.textbook = "";
  draft.spec.chapter = "";
  clearPoints();
}
function textbook(value: string) {
  if (draft.spec.textbook === value) return;
  draft.spec.textbook = value;
  draft.spec.chapter = "";
  clearPoints();
}
function chapter(value: string) {
  if (draft.spec.chapter === value) return;
  draft.spec.chapter = value;
  clearPoints();
}
function point(value: string) {
  const list = draft.spec.points;
  const index = list.indexOf(value);
  if (index < 0) list.push(value);
  else list.splice(index, 1);
  draft.spec.point = list.join("、");
}
const summary = computed(() =>
  [
    draft.spec.subject,
    draft.spec.textbook,
    draft.spec.chapter,
    draft.spec.points.join("、"),
  ]
    .filter(Boolean)
    .join(" · "),
);
</script>
<template>
  <view class="context-entry" @click="show = true"
    ><view class="context-copy"
      ><text class="context-title">教材与考点</text
      ><text class="context-value">{{
        summary || "请选择教材与考点"
      }}</text></view
    ><up-icon name="arrow-right" size="13" color="#b2afc5"
  /></view>
  <up-popup :show="show" mode="bottom" :round="24" @close="show = false">
    <view class="picker-sheet"
      ><text class="picker-title">教材与考点</text
      ><text class="kb-preview-note">选择器示例 · 正式教材与考点待接入</text>
      <scroll-view scroll-y class="picker-scroll">
        <text class="picker-label first-label">学科</text
        ><KbChips
          :model-value="draft.spec.subject"
          :options="subjects"
          @update:model-value="subject"
        />
        <text class="picker-label">教材 · 年级 · 学期</text
        ><KbChips
          :model-value="draft.spec.textbook"
          :options="
            books.map((book) => ({ label: book.label, value: book.value }))
          "
          small
          @update:model-value="textbook"
        />
        <text class="picker-label">章节</text
        ><KbChips
          v-if="chapters.length"
          :model-value="draft.spec.chapter"
          :options="
            chapters.map((item) => ({ label: item.label, value: item.value }))
          "
          small
          @update:model-value="chapter"
        /><text v-else class="picker-placeholder">先选择教材，再选择章节</text>
        <text class="picker-label">考点 <text>可多选</text></text
        ><view v-if="points.length" class="point-options"
          ><button
            v-for="item in points"
            :key="item"
            :class="{ selected: draft.spec.points.includes(item) }"
            @click="point(item)"
          >
            <text>{{ item }}</text
            ><up-icon
              v-if="draft.spec.points.includes(item)"
              name="checkmark"
              size="12"
              color="#8570c5"
            /></button></view
        ><text v-else class="picker-placeholder">选择章节后，显示对应考点</text>
      </scroll-view>
      <view class="picker-done"
        ><KbButton label="确认选择" @click="show = false"
      /></view>
    </view>
  </up-popup>
</template>
<style scoped>
.context-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  border-top: 1px solid #f0f0f7;
  border-bottom: 1px solid #f0f0f7;
  gap: 12px;
}
.context-copy {
  min-width: 0;
  flex: 1;
}
.context-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555972;
}
.context-value {
  display: block;
  font-size: 11px;
  color: #9690aa;
  line-height: 1.8;
  margin-top: 8px;
  overflow-wrap: anywhere;
}
.picker-sheet {
  padding: 26px 24px 20px;
  max-width: 760px;
  margin: auto;
}
.picker-title {
  font-size: 20px;
  font-weight: 700;
  color: #4e465f;
}
.picker-scroll {
  max-height: 52vh;
}
.picker-label {
  display: block;
  font-size: 13px;
  color: #7e829a;
  margin: 24px 0 12px;
}
.picker-label text {
  font-size: 10px;
  margin-left: 5px;
  color: #b1a6c3;
}
.first-label {
  margin-top: 2px;
}
.picker-placeholder {
  display: block;
  color: #b1aabb;
  font-size: 11px;
  padding: 10px 0;
}
.point-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.point-options button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f4f8;
  color: #9c94a9;
  padding: 0 13px;
  margin: 0;
  line-height: 36px;
  font-size: 12px;
  border-radius: 10px;
}
.point-options button::after {
  border: 0;
}
.point-options button.selected {
  color: #8570c5;
  background: #f0ebfc;
}
.picker-done {
  margin-top: 24px;
}
</style>
