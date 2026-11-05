<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbChips from "../../components/ui/KbChips.vue";
import { useDraftStore } from "../../stores/draft";
const draft = useDraftStore();
function changeSubject(value: string) {
  draft.spec.subject = value;
  draft.spec.textbook = "";
  draft.spec.point = "";
}
</script>
<template>
  <KbPage title="偏好设置" backable
    ><view class="kb-card"
      ><text class="setting-label">本次配置学科</text
      ><KbChips
        :model-value="draft.spec.subject"
        :options="[
          { label: '数学', value: '数学' },
          { label: '科学', value: '科学' },
        ]"
        @update:model-value="changeSubject" /><view class="setting-row"
        ><view
          ><text class="setting-label">附带独立答案</text
          ><text class="setting-hint">答案默认红色，学生版不含答案</text></view
        ><up-switch
          v-model="draft.spec.includeAnswers"
          active-color="#6c5ce7"
          size="22" /></view></view
    ><text class="kb-preview-note"
      >这些设置仅影响本次打开的配置，刷新后恢复默认。账号偏好保存将在后续接入。</text
    ></KbPage
  >
</template>
<style scoped>
.setting-label {
  display: block;
  font-size: 14px;
  color: #74788f;
  margin-bottom: 14px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #f1f1f7;
}
.setting-row .setting-label {
  margin-bottom: 8px;
}
.setting-hint {
  font-size: 10px;
  color: #b1b3c1;
}
</style>
