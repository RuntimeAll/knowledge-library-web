<script setup lang="ts">
import { useClientTasksStore } from "../../../stores/client-tasks";
const client = useClientTasksStore();
defineProps<{ disabled?: boolean }>();
</script>
<template>
  <view class="variant-box"
    ><text class="client-label">每道母题的题目组合</text
    ><view class="client-row"
      ><text>原题</text
      ><up-number-box
        v-model="client.draft.variant.originalCount"
        :min="0"
        :max="20"
        :disabled="disabled" /></view
    ><view class="client-row"
      ><text>同类变式</text
      ><up-number-box
        v-model="client.draft.variant.variantCount"
        :min="0"
        :max="20"
        :disabled="disabled" /></view
    ><view class="client-row"
      ><text>提升拓展</text
      ><up-number-box
        v-model="client.draft.variant.extensionCount"
        :min="0"
        :max="20"
        :disabled="disabled" /></view
    ><text class="client-hint"
      >按资料中母题的顺序，逐组制作后合并。母题题数由制作端核对，上传文件数不代表母题数。</text
    ></view
  >
</template>
<style scoped>
.variant-box {
  padding: 0 0 20px;
  color: #777087;
  font-size: 13px;
}
</style>
