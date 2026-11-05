<script setup lang="ts">
import { notify } from "../../adapters/platform/navigation";
withDefaults(defineProps<{ includeAnswers?: boolean }>(), {
  includeAnswers: true,
});
</script>
<template>
  <view class="result-files"
    ><view
      v-for="name in includeAnswers ? ['学生版', '答案版'] : ['学生版']"
      :key="name"
      class="result-file"
      ><view class="pdf-icon"
        ><up-icon name="file-text" size="25" color="#9f97cc" /><text
          >PDF</text
        ></view
      ><view class="result-name"
        ><text>{{ name }}</text
        ><text class="file-hint">正式文件待生成</text></view
      ><button
        class="file-action"
        @click="notify('当前为页面示例，尚无正式文件')"
      >
        查看
      </button></view
    ></view
  >
</template>
<style scoped>
.result-file {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #eeeef6;
  border-radius: 15px;
  padding: 16px;
  margin-bottom: 10px;
}
.pdf-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 10px;
  background: #f4f2fc;
  border-radius: 10px;
}
.pdf-icon text {
  font-size: 8px;
  color: #aaa2c7;
  margin-top: 4px;
}
.result-name {
  flex: 1;
  margin-left: 14px;
  font-size: 14px;
  color: #4e526b;
}
.file-hint {
  display: block;
  font-size: 11px;
  color: #afb0bf;
  margin-top: 7px;
}
.file-action {
  font-size: 12px;
  color: #8c81c5;
  background: #f2efff;
  border-radius: 9px;
  line-height: 34px;
  padding: 0 12px;
  margin: 0;
}
.file-action::after {
  border: 0;
}
</style>
