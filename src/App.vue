<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ensureSession } from "./adapters/platform/auth";
onShow(ensureSession);
</script>
<style lang="scss">
@import "uview-plus/index.scss";
@import "./styles/tokens.scss";
@import "./styles/client-task.scss";
@import "./generated/icons.scss";
page {
  background: #f7f8fc;
  color: #30344c;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}
view,
text {
  box-sizing: border-box;
}
button {
  font: inherit;
}
.kb-card {
  background: white;
  border: 1px solid #eeeff6;
  border-radius: 20px;
  padding: 20px;
}
.kb-muted {
  color: #9b9eb1;
  font-size: 12px;
  line-height: 1.8;
}
.kb-preview-note {
  display: block;
  font-size: 10px;
  color: #b1b3c1;
  margin: 14px 0;
  line-height: 1.7;
}
.kb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kb-link {
  font-size: 12px;
  color: #8b7dd1;
}
/* #ifdef H5 */
/* uni H5's header shadow preload otherwise fetches a CDN bitmap. */
body::after {
  animation: none !important;
}
.uni-page-head-shadow-grey::after,
.uni-page-head-shadow-black::after,
.uni-page-head-shadow-white::after {
  background-image: none !important;
  box-shadow: 0 3px 12px #30344c0a;
}
/* #endif */
</style>
