<script setup lang="ts">
import { ref } from "vue";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbBottomAction from "../../components/ui/KbBottomAction.vue";
import ModeSelector from "../../components/business/ModeSelector.vue";
import SpecForm from "../../components/business/SpecForm.vue";
import AttachmentPicker from "../../components/business/AttachmentPicker.vue";
import { useDraftStore } from "../../stores/draft";
import { draftError, modeLabels } from "../../core/skeleton";
import { notify } from "../../adapters/platform/navigation";
const draft = useDraftStore();
const error = ref("");
function save() {
  error.value = draftError(draft.spec);
  if (!error.value) {
    draft.save();
    notify("配置已暂存，可继续调整");
  }
}
</script>
<template>
  <KbPage
    :title="modeLabels[draft.spec.mode]"
    subtitle="把想法，整理成一份适合的练习"
    backable
    ><ModeSelector v-model="draft.spec.mode" /><view class="form-card kb-card"
      ><SpecForm /><text v-if="error" class="form-error">{{
        error
      }}</text></view
    ><KbSection
      title="参考资料"
      :action="draft.saved ? '复用上次配置' : ''"
      @action="draft.restore"
      ><AttachmentPicker /></KbSection
    ><text class="kb-preview-note"
      >配置保存在当前会话。制作服务接入后，即可提交任务。</text
    ><KbBottomAction><KbButton label="保存配置" @click="save" /></KbBottomAction
  ></KbPage>
</template>
<style scoped>
.form-card {
  margin-top: 18px;
  padding: 20px;
}
.form-error {
  display: block;
  color: #c37878;
  font-size: 12px;
  margin-top: 14px;
}
</style>
