<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import PaperPreview from "../../components/business/PaperPreview.vue";
import { experiences } from "../../fixtures/skeleton";
import { go } from "../../adapters/platform/navigation";
const selecting = ref(false);
onLoad((q) => {
  selecting.value = q?.select === "1";
});
</script>
<template>
  <KbPage title="排版经验" subtitle="让内容有呼吸，让书写有空间" backable
    ><text class="kb-preview-note"
      >示例 v1 · 正式经验模板及已发布版本将在接入后读取</text
    ><view
      v-for="item in experiences"
      :key="item.name"
      class="template-card"
      @click="
        go(
          `/pages/template-preview/index?name=${encodeURIComponent(item.name)}&select=${selecting ? '1' : '0'}`,
        )
      "
      ><view class="template-preview" :class="item.tone"
        ><PaperPreview :name="item.name" compact /></view
      ><view class="template-info"
        ><view
          ><text class="template-name"
            >{{ item.name }} <text class="template-version">示例 v1</text></text
          ><text class="template-desc">{{ item.description }}</text></view
        ><text class="template-tag">{{ item.tag }}</text></view
      ><view class="template-view"
        >查看版式
        <up-icon name="arrow-right" size="10" color="#a296c8" /></view></view
  ></KbPage>
</template>
<style scoped>
.template-card {
  background: white;
  border-radius: 22px;
  overflow: hidden;
  margin-top: 20px;
}
.template-preview {
  padding: 24px 52px 0;
  background: #eeebfb;
  height: 190px;
  overflow: hidden;
}
.template-preview.mint {
  background: #e8f3ef;
}
.template-preview.peach {
  background: #f8efe8;
}
.template-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 20px 12px;
}
.template-name {
  display: block;
  font-size: 16px;
  color: #68647f;
  font-weight: 600;
}
.template-desc {
  display: block;
  font-size: 11px;
  color: #a7a5b7;
  margin-top: 8px;
  line-height: 1.8;
}
.template-tag {
  font-size: 10px;
  background: #f4f2fa;
  color: #a49bb8;
  border-radius: 8px;
  padding: 6px 9px;
  flex-shrink: 0;
  margin-left: 8px;
}
.template-view {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 11px;
  color: #a296c8;
  padding: 0 20px 18px;
}
.template-version {
  font-size: 10px;
  font-weight: 400;
  color: #ac9dbb;
  margin-left: 4px;
}
</style>
