<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbBottomAction from "../../components/ui/KbBottomAction.vue";
import PaperPreview from "../../components/business/PaperPreview.vue";
import { experiences } from "../../fixtures/skeleton";
import { useDraftStore } from "../../stores/draft";
import { notify } from "../../adapters/platform/navigation";
const name = ref(experiences[0].name);
const selecting = ref(false);
const draft = useDraftStore();
onLoad((q) => {
  name.value =
    experiences.find((x) => x.name === q?.name)?.name || experiences[0].name;
  selecting.value = q?.select === "1";
});
function select() {
  draft.spec.template = name.value;
  notify("已选用此版式");
  const pages = getCurrentPages();
  if (
    pages.length >= 3 &&
    pages[pages.length - 3].route === "pages/configure/index"
  )
    uni.navigateBack({ delta: 2 });
  else uni.redirectTo({ url: "/pages/configure/index" });
}
</script>
<template>
  <KbPage :title="name" subtitle="版式结构预览" backable
    ><PaperPreview :name="name" /><view class="preview-description"
      ><text>标题、题号与作答留白</text
      ><text>学生版与答案版分别呈现，答案默认使用红色。</text
      ><text
        >当前展示统一骨架，正式模板的样式和可用版本将在接入后读取。</text
      ></view
    ><KbBottomAction v-if="selecting"
      ><KbButton label="使用这个版式" @click="select" /></KbBottomAction
  ></KbPage>
</template>
<style scoped>
.preview-description {
  padding: 24px 4px;
  font-size: 12px;
  color: #a4a7b9;
  line-height: 2;
}
.preview-description text {
  display: block;
  margin-bottom: 8px;
}
.preview-description text:first-child {
  color: #7a7e97;
  font-size: 14px;
  font-weight: 500;
}
</style>
