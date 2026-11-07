<script setup lang="ts">
import { useClientTasksStore } from "../../../stores/client-tasks";
const client = useClientTasksStore();
defineProps<{ disabled?: boolean }>();
</script>
<template>
  <view class="quantity-box"
    ><view class="client-row"
      ><text class="client-label">每次练习题量</text
      ><up-number-box
        v-model="client.draft.practice.questionsPerCopy"
        :min="1"
        :max="100"
        :disabled="disabled" /></view
    ><view class="client-row"
      ><text class="client-label">练习次数</text
      ><up-number-box
        v-model="client.draft.practice.copyCount"
        :min="1"
        :max="100"
        :disabled="disabled" /></view
    ><text class="client-hint"
      >共 {{ client.draft.practice.copyCount }} 次不同练习，每次
      {{ client.draft.practice.questionsPerCopy }} 题，合计
      {{
        client.draft.practice.questionsPerCopy * client.draft.practice.copyCount
      }}
      题。</text
    ><text class="client-hint"
      >制作成一份完整资料，通常包含学生版与教师版两个整册文件。</text
    ></view
  >
</template>
<style scoped>
.quantity-box {
  padding: 12px 0 20px;
}
.client-label {
  margin: 0;
  font-size: 13px;
}
</style>
