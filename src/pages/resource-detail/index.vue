<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbState from "../../components/ui/KbState.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbBottomAction from "../../components/ui/KbBottomAction.vue";
import ResultFiles from "../../components/business/ResultFiles.vue";
import { sampleResources } from "../../fixtures/skeleton";
import { useDraftStore } from "../../stores/draft";
import { go, notify } from "../../adapters/platform/navigation";
const id = ref("");
onLoad((q) => {
  id.value = q?.id || "";
});
const item = computed(() => sampleResources.find((x) => x.id === id.value));
const draft = useDraftStore();
function useReference() {
  if (item.value && !draft.spec.referenceIds.includes(item.value.id))
    if (!draft.toggleReference(item.value.id, item.value.subject)) {
      notify("同一份资料请选择同学科母题");
      return;
    }
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="资料详情" backable
    ><template v-if="item"
      ><view class="kb-card"
        ><text class="detail-meta">{{ item.subject }} · {{ item.meta }}</text
        ><text class="detail-title">{{ item.title }}</text
        ><text class="detail-body">{{ item.description }}</text
        ><text class="kb-preview-note">页面示例 · 尚未读取正式内容</text></view
      ><KbSection v-if="item.category === 'questions'" title="题目内容"
        ><KbState
          state="empty"
          title="题干、图片与作答区域"
          description="接入后将呈现核对后的完整题目，当前不生成示例题目"
        /><view class="placeholder-row"
          >答案与解析<text>正式内容待接入</text></view
        ><view class="placeholder-row"
          >来源与关联考点<text>正式关系待接入</text></view
        ></KbSection
      ><KbSection v-else-if="item.category === 'products'" title="成品文件"
        ><ResultFiles /></KbSection
      ><KbSection v-else title="关联内容"
        ><KbState
          state="empty"
          title="关联内容将在这里呈现"
          description="教材、考点与题目保留独立关系" /><view
          class="detail-actions"
          ><KbButton
            label="返回题库浏览"
            secondary
            @click="go('/pages/library/index')" /></view></KbSection
      ><KbBottomAction v-if="item.usable"
        ><KbButton
          label="作为参考，去配置"
          @click="useReference" /></KbBottomAction></template
    ><KbState v-else state="empty" title="没有找到这份资料"
  /></KbPage>
</template>
<style scoped>
.detail-meta {
  font-size: 11px;
  color: #a09ab8;
}
.detail-title {
  display: block;
  font-size: 20px;
  color: #555873;
  line-height: 1.6;
  margin: 16px 0;
}
.detail-body {
  display: block;
  font-size: 13px;
  line-height: 2;
  color: #9094a7;
}
.placeholder-row {
  padding: 22px 4px;
  font-size: 13px;
  color: #85899f;
  border-bottom: 1px solid #ececf3;
}
.placeholder-row text {
  display: block;
  font-size: 11px;
  color: #b5b7c6;
  margin-top: 9px;
}
.detail-actions {
  margin-top: 20px;
}
</style>
