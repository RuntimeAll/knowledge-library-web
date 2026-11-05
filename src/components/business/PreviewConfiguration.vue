<script setup lang="ts">
import { ref } from 'vue';
import KbButton from '../ui/KbButton.vue';
import { usePreviewStore } from '../../stores/preview';
import { describePreview, validatePreview } from '../../core/preview';
const draft = usePreviewStore();
const error = ref('');
const show = ref(false);
function preview() {
  error.value = validatePreview(draft) || '';
  if (error.value) return;
  draft.lastPreview = describePreview(draft);
  show.value = true;
}
</script>
<template>
  <view class="config">
    <text class="field-label">预览标题</text>
    <up-input v-model="draft.title" placeholder="输入一个标题，试试基础配置" maxlength="60" clearable border="surround" />
    <view class="answer-row">
      <view><text class="field-label">附带答案</text><text class="hint">答案内容默认用红色呈现</text></view>
      <up-switch v-model="draft.includeAnswers" active-color="#167b76" />
    </view>
    <text v-if="error" class="error" role="alert">{{ error }}</text>
    <KbButton label="查看配置预览" @click="preview" />
    <text v-if="draft.lastPreview" class="last-preview">上次预览：{{ draft.lastPreview }}</text>
    <up-popup :show="show" mode="center" :round="20" :close-on-click-overlay="true" @close="show = false">
      <view class="modal">
        <text class="modal-label">配置预览</text><text class="modal-title">{{ draft.title.trim() }}</text>
        <text v-if="draft.includeAnswers" class="answer">答案示例：已启用红色答案</text>
        <text v-else class="hint">学生版不显示答案内容</text>
        <text class="hint">这是本机配置预览，尚未提交制作任务。</text>
        <KbButton label="返回调整" @click="show = false" />
      </view>
    </up-popup>
  </view>
</template>
<style scoped>
.config { display: flex; flex-direction: column; gap: 18px; }
.field-label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 9px; }
.answer-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; }
.hint { display: block; color: var(--kb-muted); font-size: 12px; line-height: 1.8; }
.error { color: #b42318; font-size: 13px; }
.last-preview { font-size: 12px; color: var(--kb-muted); overflow-wrap: anywhere; }
.modal { width: min(340px, 86vw); padding: 28px; display: flex; flex-direction: column; gap: 18px; }
.modal-label { color: var(--kb-brand); font-size: 12px; }
.modal-title { font-size: 22px; font-weight: 700; overflow-wrap: anywhere; }
.answer { color: var(--kb-answer); font-size: 14px; }
</style>
