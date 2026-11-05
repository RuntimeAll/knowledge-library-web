<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbState from "../../components/ui/KbState.vue";
import ResultFiles from "../../components/business/ResultFiles.vue";
import PaperPreview from "../../components/business/PaperPreview.vue";
import { sampleTasks } from "../../fixtures/skeleton";
import { go } from "../../adapters/platform/navigation";
const id = ref("");
onLoad((q) => {
  id.value = q?.id || "";
});
const task = computed(() =>
  sampleTasks.find((x) => x.id === id.value && x.status === "completed"),
);
</script>
<template>
  <KbPage title="制作结果" backable
    ><template v-if="task"
      ><view class="result-heading"
        ><view class="result-symbol"
          ><up-icon name="checkmark" color="#78b8a7" size="28" /></view
        ><text>{{ task.title }}</text
        ><text class="kb-muted">结果页示例 · 正式文件尚未接入</text></view
      ><KbSection title="版式预览"><PaperPreview /></KbSection
      ><KbSection title="文件与版本"><ResultFiles /></KbSection
      ><view class="result-actions"
        ><KbButton
          label="发布准备"
          @click="go(`/pages/publication/index?id=${id}`)" /><view
          class="result-back"
          ><KbButton
            label="查看制作记录"
            secondary
            @click="
              go(`/pages/record-detail/index?id=${id}`)
            " /></view></view></template
    ><KbState
      v-else
      state="empty"
      title="暂无可查看的制作结果"
      description="请从已完成的记录进入"
  /></KbPage>
</template>
<style scoped>
.result-heading {
  text-align: center;
  padding: 12px 15px 4px;
}
.result-symbol {
  display: inline-flex;
  padding: 17px;
  background: #e6f5ef;
  border-radius: 50%;
  margin-bottom: 20px;
}
.result-heading > text {
  display: block;
  font-size: 18px;
  color: #686c84;
  line-height: 1.7;
}
.result-heading .kb-muted {
  font-size: 11px;
  margin-top: 10px;
}
.result-actions {
  margin-top: 24px;
}
.result-back {
  margin-top: 12px;
}
</style>
