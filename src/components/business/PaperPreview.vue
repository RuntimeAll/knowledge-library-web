<script setup lang="ts">
withDefaults(
  defineProps<{ name?: string; compact?: boolean; showAnswers?: boolean }>(),
  {
    name: "清爽练习",
    compact: false,
    showAnswers: false,
  },
);
</script>
<template>
  <view class="paper" :class="{ compact }"
    ><text class="paper-title">{{ name }}</text
    ><view class="paper-info"><view /><view /><view /></view
    ><view v-for="n in compact ? 3 : 5" :key="n" class="paper-question"
      ><view class="paper-line"
        ><text>{{ n }}.</text><view /></view
      ><view class="writing-space" /><text
        v-if="showAnswers && !compact"
        class="answer-placeholder"
        data-testid="paper-answer"
        >答案与解析区域示意</text
      ></view
    ><text v-if="!compact" class="paper-footer"
      >版式示意 · 无真实题目与答案</text
    ></view
  >
</template>
<style scoped>
.paper {
  background: #fff;
  box-shadow: 0 8px 24px #3d315d0b;
  border: 1px solid #ececf3;
  padding: 32px 26px;
  min-height: 430px;
}
.paper-title {
  font-size: 20px;
  display: block;
  text-align: center;
  color: #373b50;
  font-weight: 600;
}
.paper-info {
  display: flex;
  justify-content: center;
  margin: 18px 0 30px;
}
.paper-info view {
  width: 45px;
  border-bottom: 1px solid #dfe1e9;
  margin: 0 7px;
}
.paper-question {
  margin-bottom: 24px;
}
.paper-line {
  display: flex;
  align-items: center;
}
.paper-line text {
  font-size: 11px;
  color: #a1a4b5;
  margin-right: 10px;
}
.paper-line view {
  height: 5px;
  border-radius: 3px;
  background: #e9eaf1;
  width: 70%;
}
.writing-space {
  height: 34px;
  margin: 12px 0 0 18px;
  border-bottom: 1px dashed #e9eaf2;
}
.paper-footer {
  display: block;
  text-align: center;
  font-size: 10px;
  color: #b8bbc6;
  margin-top: 30px;
}
.paper.compact {
  min-height: 0;
  padding: 22px 16px;
  height: 206px;
  overflow: hidden;
}
.compact .paper-title {
  font-size: 12px;
}
.compact .paper-info {
  margin: 12px 0 20px;
}
.compact .paper-question {
  margin-bottom: 15px;
}
.compact .writing-space {
  height: 10px;
}
.compact .paper-line view {
  height: 3px;
}
.answer-placeholder {
  display: block;
  color: #d32f2f;
  font-size: 12px;
  line-height: 1.8;
  padding: 10px 0 0 18px;
}
</style>
