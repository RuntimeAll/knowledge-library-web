<script setup lang="ts">
import KbButton from "../../components/ui/KbButton.vue";
import { navigation } from "../../adapters/web/runtime";
</script>
<template>
  <view class="about"
    ><text class="title">基础预览说明</text
    ><text class="copy"
      >当前页面用于核验输入、答案开关、弹层、文件选择和 PDF
      预览。文件仅在本机打开，配置没有提交到知识库。</text
    ><text class="copy"
      >返回后，标题和答案开关会保留。刷新页面后，本次配置清空。</text
    ><KbButton label="返回基础预览" @click="navigation.back"
  /></view>
</template>
<style scoped>
.about {
  max-width: 560px;
  padding: 40px 24px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.title {
  font-size: 24px;
  font-weight: 700;
}
.copy {
  font-size: 15px;
  color: var(--kb-muted);
  line-height: 1.9;
}
</style>
