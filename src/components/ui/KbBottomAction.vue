<template>
  <view class="bottom-spacer" /><view class="bottom-action"
    ><view class="bottom-inner"><slot /></view
  ></view>
</template>
<style scoped>
.bottom-spacer {
  height: 110px;
}
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  background: #ffffffed;
  border-top: 1px solid #efeff7;
  z-index: 20;
}
.bottom-inner {
  max-width: 720px;
  margin: auto;
}
</style>
