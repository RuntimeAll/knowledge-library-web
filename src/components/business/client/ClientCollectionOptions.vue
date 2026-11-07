<script setup lang="ts">
import { useClientTasksStore } from "../../../stores/client-tasks";
const client = useClientTasksStore();
defineProps<{ disabled?: boolean }>();
</script>
<template>
  <view class="collection-box"
    ><text class="client-label">错题收集范围</text
    ><input
      v-model="client.draft.selectionNote"
      class="client-input"
      maxlength="1000"
      placeholder="如：红叉标记的完整题目；第 2—4 页"
      :disabled="disabled"
    /><text class="client-hint"
      >添加批改后的 PDF
      或图片。制作端核对错题标记、完整题面与配图，去除手写内容后整理；模糊或缺失内容会返回待补提示。</text
    ></view
  >
</template>
<style scoped>
.collection-box {
  padding: 0 0 18px;
}
</style>
